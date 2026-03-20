import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
// import { router } from "./app/Router";
import helmet from "helmet";
import compression from "compression";

import AppError from "./app/errorHelper/AppError";
import globalErrorHandler from "./app/MiddleWare/globalErrorHandler";
import crypto from "crypto";
import { router } from "./app/Router";
import cookieParser from "cookie-parser";
import mlClient from "./utils/mlClient";
const app = express();

//security middleware

app.use(
  cors({
    origin: [
      "https://covid19-frontend-ruby.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(helmet());
app.use(compression());

//body parser

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

//request id middleware (important error tracking)
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as Request & { id: string }).id = crypto.randomUUID();
  next();
});
//Routes
app.use("/api/v1", router);
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to the covid-19 server",
  });
});

app.get("/health", async (_req: Request, res: Response) => {
  let mlStatus = "unreachable";
  try {
    await mlClient.get("/health");
    mlStatus = "healthy";
  } catch {
    mlStatus = "unreachable";
  }

  res.status(200).json({
    success: true,
    message: "Server is healthy",
    mlApi: mlStatus,
    timestamp: new Date().toISOString(),
  });
});

// // Ignore browser automated requests to keep logs clean
// app.get("/favicon.ico", (_req: Request, res: Response) => {
//   res.status(204).end();
// });
// app.get("/.well-known/*", (_req: Request, res: Response) => {
//   res.status(204).end();
// });

//404 handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(
    new AppError(`Route ${req.originalUrl} not found`, 404, {
      errorCode: "ROUTE_NOT_FOUND",
    }),
  );
});

//global error handler
app.use(globalErrorHandler);
export default app;
