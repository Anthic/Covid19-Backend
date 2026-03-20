import winston from "winston";
import { loggerConfig } from "./logger.config";
import { consoleFormate, errorFormat, fileFormat } from "./logger.formats";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
//console trnasport for development
export const consoleTransport = new winston.transports.Console({
  level: loggerConfig.level,
  format: consoleFormate,
  handleExceptions: true,
  handleRejections: true,
});
//combined log file transport
export const combinedFileTransport = new DailyRotateFile({
  filename: path.join(loggerConfig.logDirectory, "combined-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxFiles: loggerConfig.maxFiles,
  maxSize: loggerConfig.maxSize,
  level: "info",
  format: fileFormat,
  handleExceptions: true,
  handleRejections: true,
  zippedArchive: true,
});

//combined log file transport
export const errorFileTransport = new DailyRotateFile({
  filename: path.join(loggerConfig.logDirectory, "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxFiles: "30d",
  maxSize: loggerConfig.maxSize,
  level: "error",
  format: errorFormat,
  handleExceptions: true,
  handleRejections: true,
  zippedArchive: true,
});

//HTTP access log transport
export const accessLogTransport = new DailyRotateFile({
  filename: path.join(loggerConfig.logDirectory, "access-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxFiles: "7d",
  maxSize: loggerConfig.maxSize,
  level: "http",
  format: fileFormat,
});

//debug log transport
export const debugFileTransport = new DailyRotateFile({
  filename: path.join(loggerConfig.logDirectory, "debug-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxFiles: "3d",
  maxSize: "10m",
  level: "debug",
  format: fileFormat,
});

//transport array based on enviroment


export const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

  // Vercel-এ ফাইল ট্রান্সপোর্ট disable করা হলো
  const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  if (loggerConfig.enableFile && !isVercel) {
    transports.push(combinedFileTransport);
    transports.push(errorFileTransport);
    transports.push(accessLogTransport);
  }

  
  if (loggerConfig.enableConsole) {
    transports.push(consoleTransport);
    
    if (!isVercel) transports.push(debugFileTransport);
  }

  return transports;
};
