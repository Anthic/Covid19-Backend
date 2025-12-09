import winston from "winston";
import type { IAppLogger, IErrorLogDetails, ILogMeta } from "./logger.types";
import { isDevelopment, loggerConfig } from "./logger.config";
import { getTransports } from "./logger.transports";
import type { Request } from "express";

export const logger: IAppLogger = winston.createLogger({
  level: loggerConfig.level,
  levels: winston.config.npm.levels,
  transports: getTransports(),
  exitOnError: false,
});

export const errorLogger = {
  logError: (error: Error | string, req?: Request): void => {
    const errorDetails: IErrorLogDetails = {
      message: error instanceof Error ? error.message : error,
      name: error instanceof Error ? error.name : "Error",
      stack: error instanceof Error ? error.stack : undefined,
    };

    //add request context if available
    if (req) {
      errorDetails.url = req.originalUrl;
      errorDetails.method = req.method;
      errorDetails.ip = req.ip;
      errorDetails.userAgent = req.get("user-agent");
      errorDetails.requestId = (req as unknown as Record<string, string>).id;
      /**
       *
       */
      //add user ID if authenticated
      //   const user = (req as unknown as Record<string , string>).user;
      //   if (user?.id) {
      //     errorDetails.userId = user.id
      //   }
      if (isDevelopment()) {
        errorDetails.body = req.body as unknown;
      }
    }
    logger.error("Application Error", errorDetails);
  },
  //log operational error
  logOperationalError: (message: string, meta?: ILogMeta): void => {
    logger.warn(`Operational: ${message}`, meta);
  },
  //log programming error
  logProgrammingError: (
    message: string,
    error: Error,
    meta?: ILogMeta
  ): void => {
    logger.error(`Programming: ${message}`, {
      ...meta,
      stack: error.stack,
      name: error.name,
    });
  },
  //log unhandled expection

  logUnhandledExpection: (error: Error, req?: Request): void => {
    const meta: ILogMeta = {
      type: "UNHANDLED_EXCEPTION",
      stack: error.stack,
    };
    if (req) {
      meta.url = req.originalUrl;
      meta.method = req.method;
      meta.ip = req.ip;
      meta.requestId = (req as unknown as Record<string, string>).id;
    }
    logger.error(`UNHANDLED : ${error.message}`, meta);
  },

  //log databased error
  logDatabaseError: (
    operation: string,
    error: Error,
    collection?: string
  ): void => {
    logger.error("Database Error", {
      operation,
      collection,
      message: error.message,
      stack: error.stack,
    });
  },
};

// HTTP logger utility

export const httpLogger = {
  //loger incomming http request
  logRequest: (req: Request): void => {
    logger.http("Incoming Request ", {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: (req as unknown as Record<string, string>).id,
    });
  },
  // loger http response
  logResponse: (req: Request, statusCode: number, duration: number): void => {
    const level = statusCode >= 400 ? "warn" : "http";

    logger.log(level, "Response Sent", {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration: `${duration.toString()}ms`,
      requestId: (req as unknown as Record<string, string>).id,
    });
  },
};

// database logger utility

export const dbLogger = {
  //data based connection
  connected: (dbName: string): void => {
    logger.info("Databse connected ", { database: dbName });
  },
  //log database disconnection
  disconnected: (reason?: string): void => {
    logger.warn("Database disconnected", { reason });
  },

  //slow queries(for perfomance monitoring)
  slowQuery: (query: string, duration: number): void => {
    logger.warn("Slow Query Detected", {
      query: query.substring(0, 200),
      duration: `${duration.toString()}ms`,
    });
  },
};

//application life cycle logger
export const appLogger = {
  //log application startup

  started: (port: number, env: string): void => {
    logger.info(" Application Started", {
      port,
      environment: env,
      nodeVersion: process.version,
      pid: process.pid,
    });
  },

  //application shutdown

  shutdown: (reason: string): void => {
    logger.info(" Application Shutting Down", { reason });
  },

  // uncaught shutdown
  uncaughtException: (error: Error): void => {
    logger.error(" UNCAUGHT EXCEPTION", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  },
  //unhandled promise rejection
  unhandledRejection: (reason: unknown): void => {
    logger.error(" UNHANDLED REJECTION", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  },
};
export type { ILogMeta, IErrorLogDetails, IAppLogger } from "./logger.types";
export default logger;
