import type { Logger } from "winston";
export type LogLevel = "error" | "warn" | "info" | "http" | "debug";

export interface ILogMeta {
  requestId?: string;
  userId?: string;
  method?: string;
  url?: string;
  ip?: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  stack?: string;
  [key: string]: unknown;
}

export interface IPrintfInfo {
  timestamp?: string;
  level: string;
  message: unknown;
  stack?: string;
  [key: string]: unknown;
}

export interface ILoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logDirectory: string;
  maxFiles: string;
  maxSize: string;
}

export type IAppLogger = Logger;

export interface IErrorLogDetails {
  message: string;
  name: string;
  stack?: string;
  statusCode?: number;
  errorCode?: string;
  url?: string;
  method?: string;
  ip?: string;
  userId?: string;
  userAgent?: string;
  requestId?: string;
  body?: unknown;
}
