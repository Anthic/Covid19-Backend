/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import AppError from "../errorHelper/AppError";

type RequestSchema = z.ZodType<{
  body?: unknown;
  query?: unknown;
  params?: unknown;
  cookies?: unknown;
}>;

//zod schema validation
export const validate =
  (Schema: RequestSchema) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = await Schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });
      req.body = validatedData.body;
      req.query = validatedData.query as typeof req.query;
      req.params = validatedData.params as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        }));
        next(
          new AppError("Validation failed", 400, {
            errorCode: "VALIDATION_ERROR",
            errors,
          })
        );
        return;
      }
      next(error);
    }
  };

//validation body
export const validateBody =
  (schema: z.ZodType) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        next(
          new AppError("Validation failed", 400, {
            errorCode: "VALIDATION_ERROR",
            errors,
          })
        );
        return;
      }
      next(error);
    }
  };
