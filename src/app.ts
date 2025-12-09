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
const app = express();

//security middleware
app.use(cors());
app.use(helmet());
app.use(compression());


//body parser

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//request id middleware (important error tracking)
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as Request & { id: string }).id = crypto.randomUUID();
  next();
});
//Routes
// app.use("/api/v1", router);
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to the covid-19 server",
  });
});
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});


//404 handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(
    new AppError(`Route ${req.originalUrl} not found`, 404, {
      errorCode: "ROUTE_NOT_FOUND",
    })
  );
});

//global error handler
app.use(globalErrorHandler);
export default app;
