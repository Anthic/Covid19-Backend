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

  // Vercel বা Serverless-এ ফাইল রাইট করা যায় না, তাই সব লগের জন্য শুধুমাত্র Console ব্যবহার করা হচ্ছে।
  if (loggerConfig.enableConsole) {
    transports.push(consoleTransport);
  }

  return transports;
};
