/* eslint-disable @typescript-eslint/no-unused-vars */
interface IAdditinalErrorInfo {
  errorCode?: string;
  email?: string;
  userId?: string;
  field?: string;
  value?: string | number;
  remainingAttempts?: number;
  lockedUntill?: Date;
  requiresCaptcha?: boolean;
  [key: string]: unknown;
}

class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;
  public readonly additionalData?: Readonly<Record<string, unknown>>;

  constructor(
    message: string,
    statusCode: number,
    additionalInfo?: IAdditinalErrorInfo
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = additionalInfo?.errorCode;
    if (additionalInfo) {
      const { errorCode, ...rest } = additionalInfo;
      this.additionalData =
        Object.keys(rest).length > 0 ? Object.freeze(rest) : undefined;
    }
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
  toJSON(): Record<string, unknown> {
    return {
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      additionalData: this.additionalData,
      isOperational: this.isOperational,
    };
  }
}

// Validation error
export class ValidationError extends AppError {
  constructor(
    message: "Validation failed",
    additionalInfo?: IAdditinalErrorInfo
  ) {
    super(message, 400, {
      errorCode: "VALIDATION_ERROR",
      ...additionalInfo,
    });
  }
}

//Not found error
export class NotFoundError extends AppError {
  constructor(
    message: "Resource not found",
    additionalInfo?: IAdditinalErrorInfo
  ) {
    super(message, 404, {
      errorCode: "NOT_FOUND",
      ...additionalInfo,
    });
  }
}
// Unauthorized Error (Authentication)
export class UnauthorizedError extends AppError {
  constructor(
    message: "Unauthorized access",
    additionalInfo?: IAdditinalErrorInfo
  ) {
    super(message, 401, {
      errorCode: "UNAUTHORIZED",
      ...additionalInfo,
    });
  }
}

// Forbidden Error (Authorization)
export class ForbiddenError extends AppError {
  constructor(message: 'Access forbidden', additionalInfo?: IAdditinalErrorInfo) {
    super(message, 403, {
      errorCode: 'FORBIDDEN',
      ...additionalInfo,
    });
  }
}

// Conflict Error (Duplicate data)
export class ConflictError extends AppError {
  constructor(message:  'Resource already exists', additionalInfo?: IAdditinalErrorInfo ) {
    super(message, 409, {
      errorCode: 'CONFLICT',
      ...additionalInfo,
    });
  }
}

// Bad Request Error
export class BadRequestError extends AppError {
  constructor(message: 'Bad request', additionalInfo?: IAdditinalErrorInfo) {
    super(message, 400, {
      errorCode: 'BAD_REQUEST',
      ...additionalInfo,
    });
  }
}

// Too Many Requests (Rate Limiting)
export class TooManyRequestsError extends AppError {
  constructor(message: 'Too many requests', additionalInfo?: IAdditinalErrorInfo) {
    super(message, 429, {
      errorCode: 'TOO_MANY_REQUESTS',
      ...additionalInfo,
    });
  }
}

// Internal Server Error
export class InternalServerError extends AppError {
  constructor(message: 'Internal server error', additionalInfo?: IAdditinalErrorInfo) {
    super(message, 500, {
      errorCode: 'INTERNAL_ERROR',
      ...additionalInfo,
    });
  }
}

export default AppError;
export type { IAdditinalErrorInfo };