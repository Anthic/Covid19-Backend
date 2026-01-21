import AppError from "../../errorHelper/AppError";
import User from "./user.model";
import {
  UserRole,
  type ISafeUser,
  type IUpdateUserInput,
  type IUserDocument,
  UserStatus,
} from "./user.types";

const toSafeUser = (user: IUserDocument): ISafeUser => ({
  _id: user._id.toString(),
  email: user.email,
  name: user.name,
  avatar: user.avatar ?? undefined,
  role: user.role,
  status: user.status,
  provider: user.provider,
  isEmailVerified: user.isEmailVerified,
  lastLogin: user.lastLogin ?? undefined,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

//get all users (Admin only)
const getAllUsers = async (filters?: {
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}): Promise<{
  users: ISafeUser[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  //config constant
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 10;
  const MAX_LIMIT = 100;
  const {
    role,
    status,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  } = filters ?? {};

  //sanitize the page
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);

  //build  query
  const query: Record<string, unknown> = {};
  if (role) query.role = role;
  if (status) query.status = status;
  //calculate pagination
  const skip = (safePage - 1) * safeLimit;
  try {
    //exact query
    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(limit).lean().sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);
    //calculate page safty
    const totalPages = safeLimit > 0 ? Math.ceil(total / safeLimit) : 0;

    return {
      users: users.map(toSafeUser),
      total,
      page: safePage,
      totalPages,
    };
  } catch (error) {
    throw new AppError("Failed to retrieve users from database", 404, {
      errorCode: "USERS_RETRIEVE_FAILED",
      error,
    });
  }
};

//get user by ID (Admin only)
const getUserById = async (userId: string): Promise<ISafeUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404, {
      errorCode: "USER_NOT_FOUND",
    });
  }

  return toSafeUser(user);
};

//update user (Admin only)
const updateUser = async (
  userId: string,
  updates: IUpdateUserInput,
): Promise<ISafeUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404, {
      errorCode: "USER_NOT_FOUND",
    });
  }
  //update allowed fields
  if (updates.name !== undefined) user.name = updates.name;
  if (updates.avatar !== undefined) user.avatar = updates.avatar;
  if (updates.status !== undefined) user.status = updates.status;
  if (updates.role !== undefined) user.role = updates.role;
  await user.save();
  return toSafeUser(user);
};

//delete user (admin only)
const deleteUser = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404, {
      errorCode: "USER_NOT_FOUND",
    });
  }
  //prevent deleting super admin
  if (user.role === UserRole.SUPER_ADMIN) {
    throw new AppError("Cannot delete super admin account", 403, {
      errorCode: "CANNOT_DELETE_SUPER_ADMIN",
    });
  }
  await User.findByIdAndDelete(userId);
};
//change user status(admin only)
const changeUserStatus = async (
  userId: string,
  status: UserStatus,
): Promise<ISafeUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404, {
      errorCode: "USER_NOT_FOUND",
    });
  }

  // Prevent blocking super admin
  if (user.role === UserRole.SUPER_ADMIN && status === UserStatus.BLOCKED) {
    throw new AppError("Cannot block super admin account", 403, {
      errorCode: "CANNOT_BLOCK_SUPER_ADMIN",
    });
  }

  user.status = status;
  await user.save();

  return toSafeUser(user);
};
//Change user role (Super Admin only)

const changeUserRole = async (
  userId: string,
  role: UserRole,
): Promise<ISafeUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404, {
      errorCode: "USER_NOT_FOUND",
    });
  }

  user.role = role;
  await user.save();

  return toSafeUser(user);
};
//Get user statistics (Admin only)

const getUserStats = async (): Promise<{
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  usersByRole: Record<string, number>;
  usersByProvider: Record<string, number>;
}> => {
  const [totalUsers, activeUsers, blockedUsers, usersByRole, usersByProvider] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: UserStatus.ACTIVE }),
      User.countDocuments({ status: UserStatus.BLOCKED }),
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        {
          $group: {
            _id: "$provider",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);
  // Transform aggregation results
  const roleStats: Record<string, number> = {};
  usersByRole.forEach((item: { _id: string; count: number }) => {
    roleStats[item._id] = item.count;
  });

  const providerStats: Record<string, number> = {};
  usersByProvider.forEach((item: { _id: string; count: number }) => {
    providerStats[item._id] = item.count;
  });

  return {
    totalUsers,
    activeUsers,
    blockedUsers,
    usersByRole: roleStats,
    usersByProvider: providerStats,
  };
};

export const UserService = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserStatus,
  getUserStats,
  changeUserRole,
};
