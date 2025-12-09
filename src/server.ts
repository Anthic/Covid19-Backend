/* eslint-disable no-console */
import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { ConfigEnvVariable } from "./config/env";
import { appLogger, dbLogger } from "./utils/logger";

let server: Server | null = null;

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(ConfigEnvVariable.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    dbLogger.connected("MongoDB");
  } catch (error) {
    console.error(" MongoDB connection failed:", error);
    throw error;
  }
};

const startServer = async (): Promise<void> => {
  try {
    // await connectRedis();
    await connectDB();
    // await seedSuperAdmin();

    server = app.listen(ConfigEnvVariable.PORT, () => {
      appLogger.started(
        Number(ConfigEnvVariable.PORT),
        ConfigEnvVariable.NODE_ENV
      );
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${ConfigEnvVariable.PORT} is already in use`);
      } else {
        console.error(" Server error:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  appLogger.shutdown(`${signal} received`);

  const forceShutdownTimer = setTimeout(() => {
    console.error(" Forced shutdown after 30s timeout");
    process.exit(1);
  }, 30000);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      console.log(" HTTP server closed");
    }

    await mongoose.connection.close();
    dbLogger.disconnected("Graceful shutdown");

    clearTimeout(forceShutdownTimer);
    console.log(" Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error(" Error during shutdown:", error);
    clearTimeout(forceShutdownTimer);
    process.exit(1);
  }
};

// Error handlers - MUST be registered BEFORE starting server
process.on("uncaughtException", (error: Error) => {
  appLogger.uncaughtException(error);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  appLogger.unhandledRejection(reason);
});

// Signal handlers
process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

// Start the application
void startServer();
