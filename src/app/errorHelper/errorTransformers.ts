

import { Error as MongooseError } from "mongoose";
import AppError from "./AppError";


interface IValidationErrorField {
  path: string;
  message: string;
  kind?: string;
  value?: unknown;
}


interface IDuplicateKeyError {
  code: number;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
}


// interface IMulterError {
//   code: string;
//   field?: string;
//   message?: string;
// }


interface IZodIssue {
  path: (string | number)[];
  message: string;
  code: string;
}


export const handleMongooseValidationError = (
  error: MongooseError.ValidationError
): AppError => {
  const errors = Object.values(error.errors).map(
    (err: MongooseError.ValidatorError | MongooseError.CastError) => ({
      field: err.path,
      message: err.message,
      kind: (err as IValidationErrorField).kind,
      value: (err as IValidationErrorField).value,
    })
  );

  return new AppError("Validation failed", 400, {
    errorCode: "VALIDATION_ERROR",
    errors,
  });
};


export const handleMongooseCastError = (
  error: MongooseError.CastError
): AppError => {
  const value =
    typeof error.value === "object"
      ? JSON.stringify(error.value)
      : String(error.value);

  return new AppError(`Invalid ${error.path}: ${value}`, 400, {
    errorCode: "INVALID_ID",
    field: error.path,
    value: value,
  });
};


export const handleMongooseDuplicateKeyError = (
  error: IDuplicateKeyError
): AppError => {
  const field = Object.keys(error.keyPattern ?? {})[0] ?? "field";
  const value = error.keyValue ? String(error.keyValue[field]) : "unknown";

  return new AppError(
    `${field} '${value}' already exists. Please use another value.`,
    409,
    {
      errorCode: "DUPLICATE_FIELD",
      field,
      value,
    }
  );
};

export const handleMongooseStrictModeError = (error: Error): AppError => {
  const regex = /`([^`]+)`/;
  const fieldMatch = regex.exec(error.message);
  const field = fieldMatch?.[1] ?? "unknown";
  
  return new AppError(
    `Field '${field}' is not allowed in the schema`, 
    400, 
    {
      errorCode: "STRICT_MODE_ERROR",
      field,
    }
  );
};


export const handleMongooseConnectionError = (): AppError => {
  return new AppError(
    "Database connection failed. Please try again later.",
    503,
    { errorCode: "DB_CONNECTION_ERROR" }
  );
};


export const handleJWTError = (): AppError => {
  return new AppError("Invalid token. Please log in again.", 401, {
    errorCode: "INVALID_TOKEN",
  });
};

export const handleJWTExpiredError = (): AppError => {
  return new AppError("Your token has expired. Please log in again.", 401, {
    errorCode: "TOKEN_EXPIRED",
  });
};


// export const handleMulterError = (error: IMulterError): AppError => {
//   const errorMessages: Record<string, { message: string; code: string }> = {
//     LIMIT_FILE_SIZE: {
//       message: "File size is too large",
//       code: "FILE_TOO_LARGE",
//     },
//     LIMIT_FILE_COUNT: {
//       message: "Too many files uploaded",
//       code: "TOO_MANY_FILES",
//     },
//     LIMIT_UNEXPECTED_FILE: {
//       message: `Unexpected field: ${error.field ?? "unknown"}`,
//       code: "UNEXPECTED_FIELD",
//     },
//     LIMIT_PART_COUNT: {
//       message: "Too many parts in multipart data",
//       code: "TOO_MANY_PARTS",
//     },
//     LIMIT_FIELD_KEY: {
//       message: "Field name is too long",
//       code: "FIELD_NAME_TOO_LONG",
//     },
//     LIMIT_FIELD_VALUE: {
//       message: "Field value is too long",
//       code: "FIELD_VALUE_TOO_LONG",
//     },
//     LIMIT_FIELD_COUNT: {
//       message: "Too many fields",
//       code: "TOO_MANY_FIELDS",
//     },
//   };

//   const errorInfo = errorMessages[error.code] ?? {
//     message: error.message ?? "File upload failed",
//     code: "FILE_UPLOAD_ERROR",
//   };

//   return new AppError(errorInfo.message, 400, {
//     errorCode: errorInfo.code,
//     ...(error.field && { field: error.field }),
//   });
// };


export const handleInvalidFileTypeError = (
  allowedTypes?: string[],
  receivedType?: string
): AppError => {
  const types = allowedTypes?.join(", ") ?? "specific types";

  return new AppError(`Invalid file type. Only ${types} are allowed`, 400, {
    errorCode: "INVALID_FILE_TYPE",
    allowedTypes,
    receivedType,
  });
};


export const handleZodError = (error: { issues?: IZodIssue[] }): AppError => {
  const errors =
    error.issues?.map((issue) => ({
      field: issue.path.join(".") || "unknown",
      message: issue.message,
      code: issue.code,
    })) ?? [];

  return new AppError("Validation failed", 400, {
    errorCode: "ZOD_VALIDATION_ERROR",
    errors,
  });
};


export const handleRateLimitError = (retryAfter?: number): AppError => {
  return new AppError(
    "Too many requests from this IP, please try again later.",
    429,
    {
      errorCode: "RATE_LIMIT_EXCEEDED",
      ...(retryAfter && { retryAfter }),
    }
  );
};


export const handleJSONParseError = (): AppError => {
  return new AppError("Invalid JSON format in request body", 400, {
    errorCode: "INVALID_JSON",
  });
};


export const handleAxiosError = (error: {
  response?: { data?: { message?: string }; status?: number };
  request?: unknown;
  config?: { url?: string };
}): AppError => {
  if (error.response) {
    return new AppError(
      error.response.data?.message ?? "External API request failed",
      error.response.status ?? 500,
      {
        errorCode: "EXTERNAL_API_ERROR",
        apiUrl: error.config?.url,
        statusCode: error.response.status,
      }
    );
  }

  if (error.request) {
    return new AppError("No response from external service", 503, {
      errorCode: "SERVICE_UNAVAILABLE",
      apiUrl: error.config?.url,
    });
  }

  return new AppError("Request setup failed", 500, {
    errorCode: "REQUEST_SETUP_ERROR",
  });
};