/* eslint-disable @typescript-eslint/use-unknown-in-catch-callback-variable */
import type { NextFunction, Request, Response } from "express";

type AsyncFunction<T extends Request = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const catchAsync =
  <T extends Request = Request>(fn: AsyncFunction<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch((error) => {
      next(error);
    });
  };
