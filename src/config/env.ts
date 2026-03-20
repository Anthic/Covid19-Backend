/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */

import dotenv from "dotenv";
import type { StringValue } from "ms";

// Load .env only in development (Vercel-safe)
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// Allowed NODE_ENV values
type NodeEnv = "development" | "production";

interface IConfigEnv {
  PORT: number;
  MONGO_URL: string;
  NODE_ENV: NodeEnv;

  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: StringValue;
  JWT_REFRESH_EXPIRES_IN: StringValue;

  // Client
  CLIENT_URL: string;

  // ML API
  ML_API_URL: string;

  // Cookies
  COOKIE_SECURE: boolean;
  COOKIE_SAME_SITE: "strict" | "lax" | "none";
}

// Validate required env variables
const validateEnv = (variables: string[]) => {
  variables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`❌ Missing environment variable: ${key}`);
    }
  });
};

const loadEnvVariables = (): IConfigEnv => {
  // Required variables
  validateEnv([
    "PORT",
    "MONGO_URL",
    "NODE_ENV",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_ACCESS_EXPIRES_IN",
    "JWT_REFRESH_EXPIRES_IN",
    "CLIENT_URL",
  ]);

  // Validate NODE_ENV strictly
  const nodeEnv = process.env.NODE_ENV as string;
  if (nodeEnv !== "development" && nodeEnv !== "production") {
    throw new Error("❌ NODE_ENV must be 'development' or 'production'");
  }

  const isProduction = nodeEnv === "production";

  return {
    PORT: Number(process.env.PORT),
    NODE_ENV: nodeEnv,

    MONGO_URL: process.env.MONGO_URL as string,

    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN as StringValue,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN as StringValue,

    // Client
    CLIENT_URL: process.env.CLIENT_URL as string,

    // ML API (optional safe fallback)
    ML_API_URL: process.env.ML_API_URL || "",

    // Cookies (flexible + safe)
    COOKIE_SECURE: process.env.COOKIE_SECURE === "true" || isProduction,

    COOKIE_SAME_SITE:
      (process.env.COOKIE_SAME_SITE as "strict" | "lax" | "none") ||
      (isProduction ? "strict" : "lax"),
  };
};

// Export config
export const ConfigEnvVariable: IConfigEnv = loadEnvVariables();
export type { IConfigEnv };
