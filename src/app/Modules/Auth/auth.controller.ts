import type {  Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import * as AuthService from "./auth.service";
import { COOKIE_NAMES, setAuthCookies } from "../../../utils/cookie.utils";
import type { LoginInput, RegisterInput } from "./auth.validation";
import type { TypedRequestBody } from "./auth.types";

export const register = catchAsync(
  async (
    req: TypedRequestBody<RegisterInput>,
    res: Response
  ): Promise<void> => {
    const { user, accessToken, refreshToken } = await AuthService.register(
      req.body
    );
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user,
        accessToken,
      },
    });
  }
);

export const login = catchAsync(
  async (req: TypedRequestBody<LoginInput>, res: Response): Promise<void> => {
    const { user, accessToken, refreshToken } = await AuthService.login(
      req.body
    );
    //set cookies
    setAuthCookies(res, accessToken, refreshToken);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        accessToken,
      },
    });
  }
);
// refresh token helper function that help to control the error
function getTokenFromRequest(
  req: TypedRequestBody<{ refreshToken?: string }>
): string | undefined {
  const bodyToken = req.body.refreshToken;
  const cookieToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

  //runtime check
  if (typeof bodyToken === "string") {
    return bodyToken;
  }
  if (typeof cookieToken === "string") {
    return cookieToken;
  }
  return undefined;
}

export const refreshToken = catchAsync(
  async (
    req: TypedRequestBody<{ refreshToken?: string }>,
    res: Response
  ): Promise<void> => {
    const token = getTokenFromRequest(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Refresh token is required",
        errorCode: "NO_REFRESH_TOKEN",
      });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await AuthService.refreshtoken(token);
    setAuthCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
      },
    });
  }
);
