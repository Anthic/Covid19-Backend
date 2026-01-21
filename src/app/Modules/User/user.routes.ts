import { Router } from "express";
import { UserController } from "./use.controller";
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
  patchUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  deleteUserSchema,
} from "./user.validation";

const userRouter = Router();

// PUBLIC ROUTES (Authenticated Users)

// Get current user profile
userRouter.get("/me", authenticate, UserController.getMyProfile);

// Update current user profile
userRouter.patch(
  "/me",
  authenticate,
  validate(updateUserSchema),
  UserController.updateMyProfile,
);

// ADMIN ROUTES

// Get all users with filters
userRouter.get(
  "/",
  authenticate,
  isAdmin,
  validate(getUsersSchema),
  UserController.getAllUsers,
);

// Get user statistics
userRouter.get("/stats", authenticate, isAdmin, UserController.getUserStats);

// Get user by ID
userRouter.get(
  "/:userId",
  authenticate,
  isAdmin,
  validate(getUserByIdSchema),
  UserController.getUserById,
);

// Update user
userRouter.patch(
  "/:userId",
  authenticate,
  isAdmin,
  validate(patchUserSchema),
  UserController.updateUser,
);

// Update user status
userRouter.patch(
  "/:userId/status",
  authenticate,
  isAdmin,
  validate(updateUserStatusSchema),
  UserController.changeUserStatus,
);

// Delete user
userRouter.delete(
  "/:userId",
  authenticate,
  isAdmin,
  validate(deleteUserSchema),
  UserController.deleteUser,
);

// SUPER ADMIN ROUTES

// Update user role
userRouter.patch(
  "/:userId/role",
  authenticate,
  isSuperAdmin,
  validate(updateUserRoleSchema),
  UserController.changeUserRole,
);

export default userRouter;
