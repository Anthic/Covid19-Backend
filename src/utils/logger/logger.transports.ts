import winston from "winston";
import { loggerConfig } from "./logger.config";
import { consoleFormate } from "./logger.formats";

// console transport for serverless/development
export const consoleTransport = new winston.transports.Console({
  level: loggerConfig.level || "info",
  format: consoleFormate,
  handleExceptions: true,
  handleRejections: true,
});

// transport array based on enviroment
export const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

 
  if (loggerConfig.enableConsole) {
    transports.push(consoleTransport);
  }

  return transports;
};
