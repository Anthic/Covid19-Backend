import type { Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import * as AuthService from "./auth.service";
import {
  clearAuthCookies,
  COOKIE_NAMES,
  setAuthCookies,
} from "../../../utils/cookie.utils";
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from "./auth.validation";
import type { IAuthRequest, TypedRequestBody } from "./auth.types";

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
): string | null {
  const bodyToken = req.body.refreshToken;
  const cookieToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

  //runtime check
  if (typeof bodyToken === "string" && bodyToken.length > 0) {
    return bodyToken;
  }
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }
  return null;
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

//logout from current device
// Helper function - safely get refresh token from logout request
function getRefreshTokenForLogout(
  req: IAuthRequest & { body?: Record<string, unknown> }
): string | undefined {
  // Try to get from body
  const bodyToken = req.body.refreshToken;
  if (typeof bodyToken === "string" && bodyToken.length > 0) {
    return bodyToken;
  }

  // Try to get from cookies
  const cookieToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  return undefined;
}

// Logout from current device
export const logout = catchAsync(
  async (
    req: IAuthRequest & { body?: Record<string, unknown> },
    res: Response
  ): Promise<void> => {
    // Get user ID (guaranteed by authenticate middleware)
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        errorCode: "NO_USER",
      });
      return;
    }

    // Get refresh token safely
    const refreshToken = getRefreshTokenForLogout(req);

    // Call logout service
    await AuthService.logout(userId, refreshToken);

    // Clear cookies
    clearAuthCookies(res);

    // Send response
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }
);

// logout from all device
export const logoutAll = catchAsync(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        errorCode: "NO_USER",
      });
      return;
    }

    //logout from all devices and clean tokens
    await AuthService.logoutAllDevices(userId);
    clearAuthCookies(res);
    res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully",
    });
  }
);

//change password
export const changePassword = catchAsync(
  async (
    req: IAuthRequest & { body: ChangePasswordInput },
    res: Response
  ): Promise<void> => {
    // req.userId guaranteed by authenticate middleware
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        errorCode: "NO_USER",
      });
      return;
    }

    // req.body validated by validate middleware
    const { currentPassword, newPassword } = req.body;

    // Call service to change password
    await AuthService.changePassword(userId, {
      currentPassword,
      newPassword,
      confirmPassword: newPassword, 
    });

    // Clear all auth cookies for security
    clearAuthCookies(res);

    // Send success response
    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  }
);
//get current user
export const getCurrentUser = catchAsync(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        errorCode: "NO_USER",
      });
      return;
    }

    const user = await AuthService.getCurrentUser(req.userId);

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: {
        user,
      },
    });
  }
);