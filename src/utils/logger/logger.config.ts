import path from "path";
import type { ILoggerConfig, LogLevel } from "./logger.types";

const getEnv = (key: string, defaultValue: string): string => {
  return process.env[key] ?? defaultValue;
};

const getLogLevel = (): LogLevel => {
  const env = getEnv("NODE_ENV", "development");
  switch (env) {
    case "production":
      return "info";
    case "test":
      return "error";

    case "development":
    default:
      return "debug";
  }
};

export const loggerConfig: ILoggerConfig = {
  level: getLogLevel(),
  enableConsole: getEnv("NODE_ENV", "development") !== "production",
  enableFile: true,
  logDirectory: path.join(process.cwd(), "logs"),
  maxFiles: "14d",
  maxSize: "20m",
};

export const isDevelopment = (): boolean =>{
    return getEnv("NODE_ENV", "development") === "development"
}

export const isProduction = () : boolean =>{
    return getEnv("NODE_ENV", "development") === "production"
}