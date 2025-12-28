
import { z } from "zod";
import { UserRole, UserStatus } from "./user.types";


// BASE VALIDATION SCHEMAS
/**
 * Email validation
 */
const emailSchema = z.email("Invalid email format").toLowerCase().trim();


const passwordSchema = z
  .string({ message: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password cannot exceed 100 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/]/,
    "Password must contain at least one special character (@$!%*?&#^()_+-=[]{})"
  );

/**
 * Name validation
 */
const nameSchema = z
  .string({ message: "Name is required" })
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name cannot exceed 100 characters")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Name can only contain letters, spaces, hyphens and apostrophes"
  )
  .trim();

/**
 * Avatar URL validation
 */
const avatarSchema = z
  .url({ message: "Invalid avatar URL" })
  .refine((url) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url), {
    message:
      "Avatar must be a valid image URL (jpg, jpeg, png, gif, webp, svg)",
  })
  .optional();

/**
 * MongoDB ObjectId validation
 */
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");


// AUTHENTICATION SCHEMAS
/**
 * User registration validation
 */
export const registerUserSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      password: passwordSchema,
      confirmPassword: z.string({ message: "Confirm password is required" }),
      name: nameSchema,
      avatar: avatarSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});

/**
 * User login validation
 */
export const loginUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z
      .string({ message: "Password is required" })
      .min(1, "Password is required"),
  }),
});

/**
 * Change password validation
 */
export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string({ message: "Current password is required" })
        .min(1, "Current password is required"),
      newPassword: passwordSchema,
      confirmPassword: z.string({ message: "Confirm password is required" }),
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

/**
 * Forgot password validation
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

/**
 * Reset password validation
 */
export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z
        .string({ message: "Reset token is required" })
        .min(1, "Reset token is required"),
      password: passwordSchema,
      confirmPassword: z.string({ message: "Confirm password is required" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});


// USER CRUD SCHEMAS

/**
 * Create user validation (Admin only)
 */
export const createUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
    avatar: avatarSchema,
    role: z
      .enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN] as const, {
        message: "Invalid user role. Must be USER, ADMIN, or SUPER_ADMIN",
      })
      .default(UserRole.USER),
  }),
});

/**
 * Update user profile validation (Self)
 */
export const updateUserSchema = z.object({
  body: z
    .object({
      name: nameSchema.optional(),
      avatar: avatarSchema,
    })
    .refine(
      (data) =>
        Object.keys(data).some(
          (key) => data[key as keyof typeof data] !== undefined
        ),
      {
        message: "At least one field must be provided for update",
      }
    ),
});

/**
 * Partial update user validation (Admin)
 */
export const patchUserSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
  body: z
    .object({
      email: emailSchema.optional(),
      name: nameSchema.optional(),
      avatar: avatarSchema,
    })
    .refine(
      (data) =>
        Object.keys(data).some(
          (key) => data[key as keyof typeof data] !== undefined
        ),
      {
        message: "At least one field must be provided for update",
      }
    ),
});

/**
 * Update user role validation (Admin only)
 */
export const updateUserRoleSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
  body: z.object({
    role: z.enum(
      [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN] as const,
      {
        message: "Invalid user role. Must be USER, ADMIN, or SUPER_ADMIN",
      }
    ),
  }),
});

/**
 * Update user status validation (Admin only)
 */
export const updateUserStatusSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(
      [
        UserStatus.ACTIVE,
        UserStatus.INACTIVE,
        UserStatus.BLOCKED,
        UserStatus.PENDING,
      ] as const,
      {
        message:
          "Invalid user status. Must be ACTIVE, INACTIVE, BLOCKED, or PENDING",
      }
    ),
  }),
});

/**
 * Get user by ID validation
 */
export const getUserByIdSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
});

/**
 * Delete user validation
 */
export const deleteUserSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
});


// QUERY & PAGINATION SCHEMAS

/**
 * Get users list validation (Admin - with pagination & filtering)
 */
export const getUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    role: z
      .enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN] as const)
      .optional(),
    status: z
      .enum([
        UserStatus.ACTIVE,
        UserStatus.INACTIVE,
        UserStatus.BLOCKED,
        UserStatus.PENDING,
      ] as const)
      .optional(),
    sortBy: z
      .enum(["createdAt", "name", "email", "updatedAt"])
      .default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// ============================================
// BULK OPERATION SCHEMAS
// ============================================

/**
 * Bulk delete users validation (Admin only)
 */
export const bulkDeleteUsersSchema = z.object({
  body: z.object({
    userIds: z
      .array(objectIdSchema)
      .min(1, "At least one user ID is required")
      .max(50, "Cannot delete more than 50 users at once"),
  }),
});

/**
 * Bulk update user status validation (Admin only)
 */
export const bulkUpdateStatusSchema = z.object({
  body: z.object({
    userIds: z
      .array(objectIdSchema)
      .min(1, "At least one user ID is required")
      .max(50, "Cannot update more than 50 users at once"),
    status: z.enum(
      [
        UserStatus.ACTIVE,
        UserStatus.INACTIVE,
        UserStatus.BLOCKED,
        UserStatus.PENDING,
      ] as const,
      {
        message:
          "Invalid user status. Must be ACTIVE, INACTIVE, BLOCKED, or PENDING",
      }
    ),
  }),
});


// TYPE EXPORTS


export type RegisterUserInput = z.infer<typeof registerUserSchema>["body"];
export type LoginUserInput = z.infer<typeof loginUserSchema>["body"];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];

export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
export type UpdateUserInput = z.infer<typeof updateUserSchema>["body"];
export type PatchUserInput = z.infer<typeof patchUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export type GetUsersQuery = z.infer<typeof getUsersSchema>["query"];
export type BulkDeleteUsersInput = z.infer<
  typeof bulkDeleteUsersSchema
>["body"];
export type BulkUpdateStatusInput = z.infer<
  typeof bulkUpdateStatusSchema
>["body"];

// ============================================
// UTILITY INTERFACE FOR VALIDATED REQUESTS
// ============================================

export interface ValidatedRequest<T extends z.ZodType> {
  body: T extends z.ZodObject<{ body: infer B extends z.ZodType }>
    ? z.infer<B>
    : never;
  params: T extends z.ZodObject<{ params: infer P extends z.ZodType }>
    ? z.infer<P>
    : never;
  query: T extends z.ZodObject<{ query: infer Q extends z.ZodType }>
    ? z.infer<Q>
    : never;
}
