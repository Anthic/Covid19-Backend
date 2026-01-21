import type { Response } from "express";
import { catchAsync } from "../../../utils/catchAsync";
import type { IAuthRequest } from "../Auth/auth.types";
import type { IUpdateUserInput, UserRole, UserStatus } from "./user.types";
import { UserService } from "./user.service";

//get all the users (admin only)
const getAllUsers = catchAsync(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const { role, status, page, limit } = req.query;

    const filters = {
      role: role as UserRole | undefined,
      status: status as UserStatus | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };
    const result = await UserService.getAllUsers(filters);
    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result,
    });
  },
);

//get user by id (admin only)
const getUserById = catchAsync(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }
    const user = await UserService.getUserById(id);

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: { user },
    });
  },
);
//update user (admin only)
const updateUser = catchAsync(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const { userId } = req.params; 
        if (!userId) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }
    const user = await UserService.updateUser(userId, req.body);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: { user },
    });
  },
);

//Delete user (Admin only)

const deleteUser = catchAsync(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }
    await UserService.deleteUser(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  },
);

// Change user status (Admin only)

const changeUserStatus = catchAsync(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || !status) {
      res.status(400).json({
        success: false,
        message: !id ? "User ID is required" : "Status is required",
      });
      return;
    }

    const user = await UserService.changeUserStatus(id, status as UserStatus);

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: { user },
    });
  },
);

//Change user role (Super Admin only)

const changeUserRole = catchAsync(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { role } = req.body;

    if (!id || !role) {
      res.status(400).json({
        success: false,
        message: !id ? "User ID is required" : "Role is required",
      });
      return;
    }

    const user = await UserService.changeUserRole(id, role as UserRole);

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: { user },
    });
  },
);

//Get user statistics (Admin only)

const getUserStats = catchAsync(
  async (_req: IAuthRequest, res: Response): Promise<void> => {
    const stats = await UserService.getUserStats();

    res.status(200).json({
      success: true,
      message: "User statistics retrieved successfully",
      data: stats,
    });
  },
);

//   Get current user profile

const getMyProfile = catchAsync(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await UserService.getUserById(req.userId);

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: { user },
    });
  },
);

//Update current user profile

const updateMyProfile = catchAsync(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { name, avatar } = req.body;

    const updates: Partial<IUpdateUserInput> = {};

    if (typeof name === "string" && name.trim() !== "") {
      updates.name = name.trim();
    }

    if (typeof avatar === "string" && avatar.trim() !== "") {
      updates.avatar = avatar.trim();
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
      return;
    }

    const user = await UserService.updateUser(req.userId, updates);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  },
);

export const UserController = {
  updateMyProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserStatus,
  changeUserRole,
  getUserStats,
  getMyProfile,
};
