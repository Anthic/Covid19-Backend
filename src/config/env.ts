/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
import dotenv from "dotenv";
import type { StringValue } from "ms";
dotenv.config();

interface IConfigEnv {
  PORT: string;
  MONGO_URL: string;
  NODE_ENV: "development" | "production";
  // JWT
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: StringValue;
  JWT_REFRESH_EXPIRES_IN: StringValue;

  // Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;

  // Client
  CLIENT_URL: string;

  // Cookies
  COOKIE_SECURE: boolean;
  COOKIE_SAME_SITE: "strict" | "lax" | "none";
}
const loadEnvVariables = (): IConfigEnv => {
  const requireEnvVariables: string[] = [
    "PORT",
    "MONGO_URL",
    "NODE_ENV",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_ACCESS_EXPIRES_IN",
    "JWT_REFRESH_EXPIRES_IN",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ];
  requireEnvVariables.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Enviroment variabale ${envVar} is not define`);
    }
  });
  const isProduction = process.env.NODE_ENV === "production";
  return {
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    MONGO_URL: process.env.MONGO_URL as string,

    // JWT Configuration
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN as StringValue,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN as StringValue,

    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL as string,

    // Client
    CLIENT_URL: process.env.CLIENT_URL as string,

    // Cookie settings
    COOKIE_SECURE: isProduction,
    COOKIE_SAME_SITE: isProduction ? "strict" : "lax",
  };
};
export const ConfigEnvVariable: IConfigEnv = loadEnvVariables();

export type { IConfigEnv };
