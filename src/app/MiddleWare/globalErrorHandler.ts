

import type { NextFunction, Response } from "express";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Error as MongooseError } from "mongoose";
import AppError from "../errorHelper/AppError";
import { ConfigEnvVariable } from "../../config/env";
import type {
  IErrorLogContext,
  IErrorResponse,
  IProcessedError,
  IRequestWithId,
} from "../errorHelper/globalErrorHandler.types";
import {
  handleAxiosError,
  handleJSONParseError,
  handleJWTError,
  handleJWTExpiredError,
  handleMongooseCastError,
  handleMongooseDuplicateKeyError,
  handleMongooseStrictModeError,
  handleMongooseValidationError,
  handleRateLimitError,
  handleZodError,
} from "../errorHelper/errorTransformers";
import logger, { errorLogger } from "../../utils/logger";

const isDevelopment = (): boolean => {
  return ConfigEnvVariable.NODE_ENV === "development";
};

const isProduction = (): boolean => {
  return ConfigEnvVariable.NODE_ENV === "production";
};

const getRequestId = (req: IRequestWithId): string => {
  return req.id ?? `req_${Date.now().toString(36)}`;
};

const getUserAgent = (req: IRequestWithId): string | undefined => {
  return req.get("user-agent");
};

//Error Identification
const ErrorIdentifiers = {
  isMongooseValidationError: (error: unknown): boolean => {
    return (
      error instanceof Error &&
      error.name === "ValidationError" &&
      "errors" in error
    );
  },
  isMongooseCastError: (error: unknown): boolean => {
    return error instanceof Error && error.name === "CastError";
  },

  isDuplicateKeyError: (error: unknown): boolean => {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    );
  },
  isStrictModeError: (error: unknown): boolean => {
    return error instanceof Error && error.name === "StrictModeError";
  },
  isMongoConnectionError: (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    return [
      "MongoNetworkError",
      "MongooseServerSelectionError",
      "MongoTimeoutError",
    ].includes(error.name);
  },
  isJWTError: (error: unknown): boolean => {
    return error instanceof Error && error.name === "JsonWebTokenError";
  },

  isJWTExpiredError: (error: unknown): boolean => {
    return error instanceof Error && error.name === "TokenExpiredError";
  },
  isZodError: (error: unknown): boolean => {
    return error instanceof Error && error.name === "ZodError";
  },
  isRateLimitError: (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    return (
      error.message.includes("Too many requests") ||
      ("statusCode" in error &&
        (error as { statusCode: number }).statusCode === 429)
    );
  },
  isJSONParseError: (error: unknown): boolean => {
    return error instanceof SyntaxError && "body" in error;
  },
  isAxiosError: (error: unknown): boolean => {
    return (
      typeof error === "object" &&
      error !== null &&
      "isAxiosError" in error &&
      (error as { isAxiosError: boolean }).isAxiosError
    );
  },
};

// error process
const processError = (error: unknown): IProcessedError => {
  let processed: IProcessedError = {
    statusCode: 500,
    message: "Something went wrong!",
    errorCode: "INTERNAL_ERROR",
    additionalData: undefined,
    isOperational: false,
    originalError: error,
  };

  if (error instanceof AppError) {
    processed = {
      statusCode: error.statusCode,
      message: error.message,
      errorCode: error.errorCode ?? "APP_ERROR",
      additionalData: error.additionalData
        ? { ...error.additionalData }
        : undefined,
      isOperational: error.isOperational,
      originalError: error,
    };
  } else if (ErrorIdentifiers.isMongooseValidationError(error)) {
    const transformed = handleMongooseValidationError(
      error as import("mongoose").Error.ValidationError
    );
    processed = {
      statusCode: transformed.statusCode,
      message: transformed.message,
      errorCode: transformed.errorCode ?? "VALIDATION_ERROR",
      additionalData: transformed.additionalData
        ? { ...transformed.additionalData }
        : undefined,
      isOperational: true,
      originalError: error,
    };
  } else if (ErrorIdentifiers.isMongooseCastError(error)) {
    const transformed = handleMongooseCastError(
      error as import("mongoose").Error.CastError
    );
    processed = {
      statusCode: transformed.statusCode,
      message: transformed.message,
      errorCode: transformed.errorCode ?? "CAST_ERROR",
      additionalData: transformed.additionalData
        ? { ...transformed.additionalData }
        : undefined,
      isOperational: true,
      originalError: error,
    };
  } else if (ErrorIdentifiers.isDuplicateKeyError(error)) {
    const transformed = handleMongooseDuplicateKeyError(
      error as {
        code: number;
        keyPattern?: Record<string, number>;
        keyValue?: Record<string, unknown>;
      }
    );
    processed = {
      statusCode: transformed.statusCode,
      message: transformed.message,
      errorCode: transformed.errorCode ?? "DUPLICATE_KEY",
      additionalData: transformed.additionalData
        ? { ...transformed.additionalData }
        : undefined,
      isOperational: true,
      originalError: error,
    };
  } else if (ErrorIdentifiers.isStrictModeError(error)) {
    const transformed = handleMongooseStrictModeError(error as Error);
    processed = {
      statusCode: transformed.statusCode,
      message: transformed.message,
      errorCode: transformed.errorCode ?? "STRICT_MODE_ERROR",
      additionalData: transformed.additionalData
        ? { ...transformed.additionalData }
        : undefined,
      isOperational: true,
      originalError: error,
    };
  } else if (ErrorIdentifiers.isJWTError(error)) {
    const transformed = handleJWTError();
    processed = {
      statusCode: transformed.statusCode,
      message: transformed.message,
      errorCode: transformed.errorCode ?? "JWT_ERROR",
      additionalData: undefined,
      isOperational: true,
      originalError: error,
    };
  } else if (ErrorIdentifiers.isJWTExpiredError(error)) {
    const transformed = handleJWTExpiredError();
    processed = {
      statusCode: transformed.statusCode,
      message: transformed.message,
      errorCode: transformed.errorCode ?? "JWT_EXPIRED",
      additionalData: undefined,
      isOperational: true,
      originalError: error,
    };
  } else if (ErrorIdentifiers.isZodError(error)) {
    const zodError = error as {
      issues?: { path: (string | number)[]; message: string; code: string }[];
    };
    const transformed = handleZodError(zodError);
    processed = {
      statusCode: transformed.statusCode,
      message: transformed.message,
      errorCode: transformed.errorCode ?? "ZOD_ERROR",
      additionalData: transformed.additionalData
        ? { ...transformed.additionalData }
        : undefined,
      isOperational: true,
      originalError: error,
    };
  } else if (ErrorIdentifiers.isRateLimitError(error)) {
    const transformed = handleRateLimitError();
    processed = {
      statusCode: transformed.statusCode,
      message: transformed.message,
      errorCode: transformed.errorCode ?? "RATE_LIMIT",
      additionalData: undefined,
      isOperational: true,
      originalError: error,
    };
  } else if (ErrorIdentifiers.isJSONParseError(error)) {
    const transformed = handleJSONParseError();
    processed = {
      statusCode: transformed.statusCode,
      message: transformed.message,
      errorCode: transformed.errorCode ?? "JSON_PARSE_ERROR",
      additionalData: undefined,
      isOperational: true,
      originalError: error,
    };
  } else if (ErrorIdentifiers.isAxiosError(error)) {
    const axiosError = error as {
      response?: { data?: { message?: string }; status?: number };
      request?: unknown;
      config?: { url?: string };
    };
    const transformed = handleAxiosError(axiosError);
    processed = {
      statusCode: transformed.statusCode,
      message: transformed.message,
      errorCode: transformed.errorCode ?? "AXIOS_ERROR",
      additionalData: transformed.additionalData
        ? { ...transformed.additionalData }
        : undefined,
      isOperational: true,
      originalError: error,
    };
  } else if (error instanceof Error) {
    processed = {
      statusCode: 500,
      message: error.message || "Something went wrong!",
      errorCode: "INTERNAL_ERROR",
      additionalData: undefined,
      isOperational: false,
      originalError: error,
    };
  }
  return processed;
};

//error logging
const logError = (
  processedError: IProcessedError,
  context: IErrorLogContext
): void => {
  const logData = {
    ...context,
    message: processedError.message,
    additionalData: processedError.additionalData,
  };
  if (isDevelopment()) {
    const originalError = processedError.originalError;
    const stack =
      originalError instanceof Error ? originalError.stack : undefined;

    if (processedError.isOperational) {
      // Operational errors (expected) - log as warning
      logger.warn(" Operational Error", { ...logData, stack });
    } else {
      // Programming errors (unexpected) - log as error
      logger.error(" Programming Error", { ...logData, stack });
    }
  }
  if (isProduction()) {
    const originalError = processedError.originalError;

    if (processedError.isOperational) {
      // Operational errors - log as info
      logger.info("Handled Error", {
        requestId: context.requestId,
        path: context.path,
        method: context.method,
        statusCode: context.statusCode,
        errorCode: context.errorCode,
      });
    } else {
      // Programming errors - log full details with errorLogger
      errorLogger.logError(
        originalError instanceof Error
          ? originalError
          : new Error(String(originalError)),
        undefined
      );
    }
  }
};

//response builder
const buildErrorResponse = (
  processedError: IProcessedError,
  req: IRequestWithId
): IErrorResponse => {
  const requestId = getRequestId(req);
  const timestamp = new Date().toISOString();

  const response: IErrorResponse = {
    success: false,
    message: processedError.message,
    statusCode: processedError.statusCode,
    errorCode: processedError.errorCode,
    path: req.originalUrl,
    method: req.method,
    timestamp,
    requestId,
  };
  if (
    processedError.additionalData &&
    Object.keys(processedError.additionalData).length > 0
  ) {
    response.additionalData = processedError.additionalData;
  }

  // Development: Add stack trace
  if (isDevelopment()) {
    const originalError = processedError.originalError;
    if (originalError instanceof Error && originalError.stack) {
      response.stack = originalError.stack;
    }
  }
  if (isProduction() && !processedError.isOperational) {
    response.message = "Something went wrong!";
    response.errorCode = "INTERNAL_ERROR";
    delete response.additionalData;
    delete response.stack;
  }

  return response;
};

//main error handler

export const globalErrorHandler = (
  error: unknown,
  req: IRequestWithId,
  res: Response,
  _next: NextFunction
): void => {
  const processedError = processError(error);
  const context: IErrorLogContext = {
    requestId: getRequestId(req),
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: getUserAgent(req),
    statusCode: processedError.statusCode,
    errorCode: processedError.errorCode,
    isOperational: processedError.isOperational,
    timestamp: new Date().toISOString(),
  };
  logError(processedError, context);
  const errorResponse = buildErrorResponse(processedError, req);

  res.status(processedError.statusCode).json(errorResponse);
};
export default globalErrorHandler;
