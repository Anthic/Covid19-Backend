import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { UserRole } from "../app/Modules/User/user.types";
import { ConfigEnvVariable } from "../config/env";
import AppError from "../app/errorHelper/AppError";
import { fi } from "zod/v4/locales";

export interface ITokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion?: number;
}

export interface IDecodedToken extends ITokenPayload, JwtPayload {
  iat: number;
  exp: number;
}
export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

//token generator

export const generateAccessToken = (payload: ITokenPayload): string => {
  const options: SignOptions = {
    expiresIn: ConfigEnvVariable.JWT_ACCESS_EXPIRES_IN,
    algorithm: "HS256",
  };
  return jwt.sign(payload, ConfigEnvVariable.JWT_ACCESS_SECRET, options);
};

//generate refresh token

export const generateRefreshToken = (payload: ITokenPayload): string => {
  const options: SignOptions = {
    expiresIn: ConfigEnvVariable.JWT_REFRESH_EXPIRES_IN,
    algorithm: "HS256",
  };
  return jwt.sign(payload, ConfigEnvVariable.JWT_REFRESH_SECRET, options);
};

//generate access and refresh token both
export const generateTokenPair = (payload: ITokenPayload): ITokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

//token verification
export const verifyAccessToken = (token: string): IDecodedToken => {
  try {
    const decoded = jwt.verify(
      token,
      ConfigEnvVariable.JWT_ACCESS_SECRET
    ) as IDecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError("Access token has expired", 401, {
        errorCode: "TOKEN_EXPIRED",
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError("Invalid access token", 401, {
        errorCode: "INVALID_TOKEN",
      });
    }
    throw new AppError("Token verification failed", 401, {
      errorCode: "TOKEN_VERIFICATION_FAILED",
    });
  }
};

//verify refresh token
export const verifyRefreshToken = (token: string): IDecodedToken => {
  try {
    const decoded = jwt.verify(
      token,
      ConfigEnvVariable.JWT_REFRESH_SECRET
    ) as IDecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError("Refresh token has expired. Please login again", 401, {
        errorCode: "REFRESH_TOKEN_EXPIRED",
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError("Invalid refresh token", 401, {
        errorCode: "INVALID_REFRESH_TOKEN",
      });
    }
    throw new AppError("Refresh token verification failed", 401, {
      errorCode: "REFRESH_TOKEN_VERIFICATION_FAILED",
    });
  }
};
//utility function
//extract token from authorization header
export const extractTokenFromHeader = (
  authHeader: string | undefined
): string | null => {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return token || null;
};

//check if token is about to expire wihtin 5 min
export const isTokenExpiringSoon = (
  decoded: IDecodedToken,
  thresholdMinutes = 5
): boolean => {
  const thresholdSeconds = thresholdMinutes * 60;
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp - currentTime < thresholdSeconds;
};

//get token expire date
export const getTokenExpirationDate = (token: string): Date | null => {
  if (!token || typeof token !== "string") {
    return null;
  }
  const decoded = jwt.decode(token) as IDecodedToken | null;
  if (!decoded || typeof decoded !== "object" || !decoded.exp) {
    return null;
  }
  if (typeof decoded.exp !== "number" || decoded.exp <= 0) {
    return null;
  }
  return new Date(decoded.exp * 1000);
};
