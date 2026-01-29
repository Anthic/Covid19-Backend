import type { NextFunction, Request, Response } from "express";
import {
  extractTokenFromHeader,
  verifyAccessToken,
} from "../../utils/jwt.utils";
import { COOKIE_NAMES } from "../../utils/cookie.utils";
import AppError from "../errorHelper/AppError";
import User from "../Modules/User/user.model";
import { UserRole, UserStatus } from "../Modules/User/user.types";


export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    //extract token from header or cookie
    let token = extractTokenFromHeader(req.headers.authorization);

    //fall back cookies if there no header token
    token ??= req.cookies[COOKIE_NAMES.ACCESS_TOKEN] ?? null;

    if (!token) {
      throw new AppError("Authentication required. Please login.", 401, {
        errorCode: "NO_TOKEN",
      });
    }

    //verify token
    const decoded = verifyAccessToken(token);
    //check user still exsits
    const user = await User.findById(decoded.userId).select("+refreshTokens");
    if (!user) {
      throw new AppError("User no longer exists", 401, {
        errorCode: "USER_NOT_FOUND",
      });
    }

    //check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError(
        `Your account is ${user.status.toLowerCase()}. Please contact support.`,
        403,
        { errorCode: "ACCOUNT_INACTIVE", status: user.status }
      );
    }
    //check if password was changed after token issue
    if (user.passwordChangedAt) {
      const passwordChangedTime = Math.floor(
        user.passwordChangedAt.getTime() / 1000
      );
      if (decoded.iat < passwordChangedTime) {
        throw new AppError(
          "Password was recently changed. Please login again.",
          401,
          { errorCode: "PASSWORD_CHANGED" }
        );
      }
    }

    // attach user request
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    next(error);
  }
};

//authorization user by role
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(
        new AppError("Authentication required", 401, {
          errorCode: "NOT_AUTHENTICATED",
        })
      );
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError("You do not have permission to perform this action", 403, {
          errorCode: "FORBIDDEN",
          requiredRoles: allowedRoles,
          
        })
      );
      return;
    }
    next();
  };
};
/**
 * Check if user is admin (ADMIN or SUPER_ADMIN)
 */
export const isAdmin = authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN);

/**
 * Check if user is super admin only
 */
export const isSuperAdmin = authorize(UserRole.SUPER_ADMIN);
