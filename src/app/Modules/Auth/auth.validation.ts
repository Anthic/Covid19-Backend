/**
 * @file auth.validation.ts
 * @description Zod schemas for authentication validation
 */

import { z } from "zod";

// ============================================
// COMMON SCHEMAS
// ============================================

/**
 * Email schema
 */
const emailSchema = z
  .string()
  .min(1, "Email is required")

  .trim()
  .toLowerCase();
/**
 * Password schema with strength requirements
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password cannot exceed 100 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character"
  );

/**
 * Name schema
 */
const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name cannot exceed 100 characters")
  .trim();

// ============================================
// REGISTER VALIDATION
// ============================================

export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];

// ============================================
// LOGIN VALIDATION
// ============================================

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];

// ============================================
// REFRESH TOKEN VALIDATION
// ============================================

export const refreshTokenSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().optional(),
    })
    .optional()
    .default({}),
  cookies: z
    .object({
      refresh_token: z.string().optional(),
    })
    .optional(),
});

// ============================================
// CHANGE PASSWORD VALIDATION
// ============================================

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: "New password must be different from current password",
      path: ["newPassword"],
    }),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];

// ============================================
// FORGOT PASSWORD VALIDATION
// ============================================

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];

// ============================================
// RESET PASSWORD VALIDATION
// ============================================

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().min(1, "Reset token is required"),
      newPassword: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];

// ============================================
// GOOGLE AUTH VALIDATION
// ============================================

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, "Google ID token is required"),
  }),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>["body"];
