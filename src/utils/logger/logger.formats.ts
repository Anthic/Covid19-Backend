import winston from "winston";
import type { IPrintfInfo } from "./logger.types";

const colors = {
  error: "\x1b[31m", // Red color
  warn: "\x1b[33m", // Yellow ''
  info: "\x1b[36m", // Cyan    ''
  http: "\x1b[35m", // Magenta  ''
  debug: "\x1b[32m", // Green   ''
  reset: "\x1b[0m", // Reset  ''
};

const levelIcons: Record<string, string> = {
  error: "🔴",
  warn: "🟡",
  info: "🔵",
  http: "🟣",
  debug: "🟢",
};

const stripAnsiCodes = (str: string): string => {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[\d+m/g, "");
};

//console formate for development
export const consoleFormate = winston.format.combine(
  winston.format.colorize({ all: false }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),

  winston.format.printf((info): string => {
    const logInfo = info as unknown as IPrintfInfo;

    const timestamp: string = logInfo.timestamp ?? new Date().toISOString();
    const level: string = logInfo.level;
    const message = String(logInfo.message);

    const cleanLevel: string = stripAnsiCodes(level).toLowerCase();
    const icon: string = levelIcons[cleanLevel] ?? "⚪";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { timestamp: _ts, level: _lvl, message: _msg, ...metadata } = logInfo;
    let metaString = "";
    if (Object.keys(metadata).length > 0) {
      metaString = "\n" + JSON.stringify(metadata, null, 2);
    }
    return `${timestamp} [${icon} ${level.toUpperCase()}]: ${message}${metaString}`;
  })
);

//file format for production logs

export const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

//error specific  formate
export const errorFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info): string => {
    const logInfo = info as unknown as IPrintfInfo;
    const errorEntry = {
      timeStamp: logInfo.timestamp ?? new Date().toISOString(),
      level: "error",
      message: String(logInfo.message),
      stack: logInfo.stack,
    };
    return JSON.stringify(errorEntry);
  })
);

//HTTP request format
export const httpFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),

  winston.format.printf((info): string => {
    const logInfo = info as unknown as IPrintfInfo;

    const timestamp: string = logInfo.timestamp ?? new Date().toISOString();
    const method = String(logInfo.method);
    const url = String(logInfo.url);
    const statusCode = String(logInfo.statusCode);
    const duration = String(logInfo.duration);

    return `${timestamp} [HTTP] ${method} ${url} ${statusCode} ${duration}ms`;
  })
);
