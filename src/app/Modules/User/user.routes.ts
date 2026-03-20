import { Router } from "express";
import { UserController } from "./user.controller";
import {
  authenticate,
  isAdmin,
  isSuperAdmin,
} from "../../MiddleWare/auth.middleware";
import { validate } from "../../MiddleWare/validate.middleware";
import {
  getUsersSchema,
  getUserByIdSchema,
  updateUserSchema,
  adminUpdateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  deleteUserSchema,
} from "./user.validation";

const userRouter = Router();

// ========================================
// AUTHENTICATED USER ROUTES (Self)
// ========================================

// Get current user profile
userRouter.get("/me", authenticate, UserController.getMyProfile);

// Update current user profile
userRouter.patch(
  "/me",
  authenticate,
  validate(updateUserSchema),
  UserController.updateMyProfile,
);

// ========================================
// ADMIN ROUTES - STATIC ROUTES FIRST
// ========================================

// Get all users with pagination & filters
userRouter.get(
  "/",
  authenticate,
  isAdmin,
  validate(getUsersSchema),
  UserController.getAllUsers,
);

// Get user statistics (must be before /:id)
userRouter.get("/stats", authenticate, isAdmin, UserController.getUserStats);

// ========================================
// ADMIN ROUTES - DYNAMIC ROUTES (with :id)
// ========================================

// Get user by ID
userRouter.get(
  "/:userId",
  authenticate,
  isAdmin,
  validate(getUserByIdSchema),
  UserController.getUserById,
);

// Update user (partial update)
userRouter.patch(
  "/:userId",
  authenticate,
  isAdmin,
  validate(adminUpdateUserSchema),
  UserController.updateUser,
);

// Update user status (sub-resource route)
userRouter.patch(
  "/:userId/status",
  authenticate,
  isAdmin,
  validate(updateUserStatusSchema),
  UserController.changeUserStatus,
);

// ========================================
// SUPER ADMIN ROUTES
// ========================================

// Update user role (Super Admin only)
userRouter.patch(
  "/:userId/role",
  authenticate,
  isSuperAdmin,
  validate(updateUserRoleSchema),
  UserController.changeUserRole,
);

// Delete user (Super Admin only)
userRouter.delete(
  "/:userId",
  authenticate,
  isSuperAdmin,
  validate(deleteUserSchema),
  UserController.deleteUser,
);
export default userRouter;
