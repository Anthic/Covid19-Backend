/* eslint-disable no-console */
import { IncomingMessage, Server, ServerResponse } from "http";
import mongoose from "mongoose";
import app from "./app";
import { ConfigEnvVariable } from "./config/env";
import { appLogger, dbLogger } from "./utils/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Augment NodeJS global so the cache survives hot-reloads in development
declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

// ─── Cached connection (critical for Vercel serverless) ───────────────────────

/**
 * Vercel spins up a new function instance per request but reuses the Node.js
 * module cache between warm invocations.  Storing the connection on `global`
 * prevents "buffering timed out" errors caused by re-connecting on every call.
 */
const getCache = (): MongooseCache => {
  if (!global.__mongooseCache) {
    global.__mongooseCache = { conn: null, promise: null };
  }
  return global.__mongooseCache;
};

// ─── DB connection ─────────────────────────────────────────────────────────────

const connectDB = async (): Promise<typeof mongoose> => {
  const cache = getCache();

  // Already connected — reuse
  if (cache.conn) {
    return cache.conn;
  }

  // Connection in-flight — await it instead of opening a second one
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(ConfigEnvVariable.MONGO_URL, {
        bufferCommands: false, // fail fast instead of buffering queries
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        maxPoolSize: 10, // sensible pool for serverless
        minPoolSize: 1,
      })
      .then((conn) => {
        dbLogger.connected("MongoDB");
        return conn;
      })
      .catch((error: unknown) => {
        // Reset so the next request can retry
        cache.promise = null;
        console.error("MongoDB connection failed:", error);
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};

// ─── Traditional server (non-Vercel) ──────────────────────────────────────────

let server: Server | null = null;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    server = app.listen(ConfigEnvVariable.PORT, () => {
      appLogger.started(
        Number(ConfigEnvVariable.PORT),
        ConfigEnvVariable.NODE_ENV,
      );
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${ConfigEnvVariable.PORT} is already in use`);
      } else {
        console.error("Server error:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// ─── Graceful shutdown ─────────────────────────────────────────────────────────

const gracefulShutdown = async (signal: string): Promise<void> => {
  appLogger.shutdown(`${signal} received`);

  // Hard-kill guard — if shutdown takes longer than 30 s, force-exit
  const forceShutdownTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, 30_000);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((err) => (err ? reject(err) : resolve()));
      });
    }

    await mongoose.connection.close();
    dbLogger.disconnected("Graceful shutdown");

    clearTimeout(forceShutdownTimer);
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    clearTimeout(forceShutdownTimer);
    process.exit(1);
  }
};

// ─── Process-level error handlers (register BEFORE starting) ──────────────────

process.on("uncaughtException", (error: Error) => {
  appLogger.uncaughtException(error);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  appLogger.unhandledRejection(reason);
});

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

// ─── Entry point ──────────────────────────────────────────────────────────────

if (!process.env.VERCEL) {
  void startServer();
}

// ─── Vercel serverless handler ────────────────────────────────────────────────

/**
 * Vercel invokes this export for every HTTP request.
 * `connectDB()` uses the global cache, so it only opens a real connection
 * when the current instance has none — subsequent warm calls are instant.
 */
const vercelHandler = async (
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> => {
  await connectDB();
  app(req, res);
};

export default vercelHandler;
