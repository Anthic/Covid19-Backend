import rateLimit from "express-rate-limit";
import AppError from "../errorHelper/AppError";

//general api limiter
export const apiLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

//strict limiter for login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        "Too many login attempts. Please try again after 15 minutes.",
        429,
        {
          errorCode: "TOO_MANY_ATTEMPTS",
        },
      ),
    );
  },
});
// Limiter for registration
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        "Too many accounts created. Please try again after an hour.",
        429,
        {
          errorCode: "TOO_MANY_REGISTRATIONS",
        },
      ),
    );
  },
});

// Limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  handler: (_req, _res, next) => {
    next(
      new AppError(
        "Too many password reset attempts. Please try again later.",
        429,
        {
          errorCode: "TOO_MANY_RESET_ATTEMPTS",
        },
      ),
    );
  },
});

// Limiter for refresh token
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
});
