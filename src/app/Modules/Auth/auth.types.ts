

import type { Request } from "express";
import type {
  IUserDocument,
  ISafeUser,
  UserRole,
} from "../User/user.types";

// ============================================
// REQUEST TYPES
// ============================================
export interface TypedRequestBody<T = any > extends Request {
  body: T;
  cookies: Record<string, string>; 
}
/**
 * Authenticated request with user data
 */
export interface IAuthRequest extends Request {
  user?: IUserDocument;
  userId?: string;
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Register input
 */
export interface IRegisterInput {
  email: string;
  password: string;
  name: string;
}

/**
 * Login input
 */
export interface ILoginInput {
  email: string;
  password: string;
}

/**
 * Change password input
 */
export interface IChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Reset password input
 */
export interface IResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Authentication response
 */
export interface IAuthResponse {
  success: boolean;
  message: string;
  data: {
    user: ISafeUser;
    accessToken: string;
    refreshToken?: string;
  };
}

/**
 * Token refresh response
 */
export interface IRefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * Logout response
 */
export interface ILogoutResponse {
  success: boolean;
  message: string;
}

// ============================================
// GOOGLE OAUTH TYPES
// ============================================

/**
 * Google OAuth profile
 */
export interface IGoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email?: boolean;
}

/**
 * Google OAuth user info from token
 */
export interface IGoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

// ============================================
// TOKEN TYPES
// ============================================

/**
 * Token payload for JWT
 */
export interface ITokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// ============================================
// SESSION TYPES (for tracking active sessions)
// ============================================

/**
 * Active session info
 */
export interface IActiveSession {
  tokenId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  expiresAt: Date;
}