import type { CookieOptions, Response } from "express";
import { ConfigEnvVariable } from "../config/env";

export const COOKIE_NAMES = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

//cookies option
//get base cookie options
const getBaseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: ConfigEnvVariable.COOKIE_SECURE,
  sameSite: ConfigEnvVariable.COOKIE_SAME_SITE,
  path: "/",
});

export const getAccessTokenCookieOptions = (): CookieOptions => ({
  ...getBaseCookieOptions(),
  maxAge: 15 * 60 * 1000,
});

//get refresh token cookie options
export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  ...getBaseCookieOptions(),
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

//cookie setters
//set access token
export const setAccessTokenCookie = (res: Response, token: string): void => {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, token, getAccessTokenCookieOptions());
};

//set refresh token
export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, getRefreshTokenCookieOptions());
};

//set both token cookies
export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
};

//clear all authentication cookies
export const clearAuthCookies = (res: Response): void => {
  // clearCookie requires the same options (path, domain, etc.) that were used when setting the cookie
  const baseOptions = getBaseCookieOptions();
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, baseOptions);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, baseOptions);
};
 