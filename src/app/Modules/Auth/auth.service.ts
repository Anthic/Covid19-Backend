//helper function
import crypto from "crypto";
import {
  generateTokenPair,
  verifyRefreshToken,
  type ITokenPayload,
} from "../../../utils/jwt.utils";
import AppError from "../../errorHelper/AppError";
import User from "../User/user.model";
import {
  AuthProvider,
  UserStatus,
  type ISafeUser,
  type IUserDocument,
} from "../User/user.types";
import type {
  IChangePasswordInput,
  IGoogleUserInfo,
  ILoginInput,
  IRegisterInput,
} from "./auth.types";

//tranform user document to safe user object
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

//password Reset interface
interface IPasswordResetToken {
  token: string;
  expires: Date;
}
//generate payload toke from user
const createTokenPayload = (user: IUserDocument): ITokenPayload => ({
  userId: user._id.toString(),
  email: user.email,
  role: user.role,
});

// register new user
export const register = async (
  input: IRegisterInput,
): Promise<{
  user: ISafeUser;
  accessToken: string;
  refreshToken: string;
}> => {
  const { email, password, name } = input;
  //check if user exists
  const exiitingUser = await User.findOne({ email: email.toLowerCase() });
  if (exiitingUser) {
    throw new AppError("Email already registered", 409, {
      errorCode: "EMAIL_EXISTS",
      email,
    });
  }
  //create user
  const user = await User.create({
    email,
    password,
    name,
    provider: AuthProvider.LOCAL,
  });

  //Generate token
  const payload = createTokenPayload(user);
  const { accessToken, refreshToken } = generateTokenPair(payload);

  //store refresh token
  user.refreshTokens = [refreshToken];
  await user.save();
  return {
    user: toSafeUser(user),
    accessToken,
    refreshToken,
  };
};

//login user with email and password
export const login = async (
  input: ILoginInput,
): Promise<{
  user: ISafeUser;
  accessToken: string;
  refreshToken: string;
}> => {
  const { email, password } = input;
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password +refreshTokens",
  );
  if (!user) {
    throw new AppError("Invalid email or password", 401, {
      errorCode: "INVALID_CREDENTIALS",
    });
  }
  //check if account is lock
  if (user.isLocked()) {
    const lockTime = user.lockUntil
      ? Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000)
      : 15;
    throw new AppError(
      `Account is locked. Try again in ${lockTime.toString()} minutes`,
      423,
      {
        errorCode: "ACCOUNT_LOCKED",
        lockUntil: user.lockUntil,
        remainingMinutes: lockTime,
      },
    );
  }

  //check if  has password (might be google only account)
  if (!user.password) {
    throw new AppError(
      "This account uses Google sign-in. Please login with Google.",
      400,
      { errorCode: "NO_PASSWORD", provider: user.provider },
    );
  }

  //verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    throw new AppError("Invalid email or password", 401, {
      errorCode: "INVALID_CREDENTIALS",
    });
  }

  //reset login attempts on successful login
  await user.resetLoginAttempts();

  //generate token
  const payload = createTokenPayload(user);
  const { accessToken, refreshToken } = generateTokenPair(payload);

  // store refresh token (limit to 5 active session)
  const MAX_SESSIONS = 5;
  const refreshTokens = user.refreshTokens;
  if (refreshTokens.length >= MAX_SESSIONS) {
    refreshTokens.shift(); //remove oldest token
  }
  refreshTokens.push(refreshToken);
  user.refreshTokens = refreshTokens;
  await user.save();

  return {
    user: toSafeUser(user),
    accessToken,
    refreshToken,
  };
};

//refresh token

export const refreshtoken = async (
  token: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  //verify refresh token
  const decoded = verifyRefreshToken(token);
  //find user and check token exists
  const user = await User.findById(decoded.userId).select("+refreshTokens");
  if (!user) {
    throw new AppError("User not found", 401, {
      errorCode: "USER_NOT_FOUND",
    });
  }
  //if refresh token exsits in usres token
  const tokenIndex = user.refreshTokens.indexOf(token);
  if (tokenIndex === -1) {
    user.refreshTokens = [];
    await user.save();
    throw new AppError("Invalid refresh token. Please login again.", 401, {
      errorCode: "INVALID_REFRESH_TOKEN",
    });
  }
  //gnenerate mew token pair
  const payload = createTokenPayload(user);
  const { accessToken, refreshToken: newRefreshToken } =
    generateTokenPair(payload);
  //replace old refresh token with new refresh token
  user.refreshTokens[tokenIndex] = newRefreshToken;
  await user.save();
  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

//logot
export const logout = async (
  userId: string,
  refreshtoken?: string,
): Promise<void> => {
  const user = await User.findById(userId).select("+refreshTokens");
  if (!user) {
    throw new AppError("User not found", 404, {
      errorCode: "USER_NOT_FOUND",
    });
  }

  if (refreshtoken) {
    //remove specific refresh token
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== refreshtoken,
    );
  } else {
    //logout from all device
    user.refreshTokens = [];
  }
  await user.save();
};
//lop out all device
export const logoutAllDevices = async (userId: string): Promise<void> => {
  const user = await User.findById(userId).select("+refreshTokens");
  if (!user) {
    throw new AppError("User not found", 404, {
      errorCode: "USER_NOT_FOUND",
    });
  }
  user.refreshTokens = [];
  await user.save();
};

export const changePassword = async (
  userId: string,
  input: IChangePasswordInput,
): Promise<void> => {
  const { currentPassword, newPassword } = input;
  const user = await User.findById(userId).select("+password +refreshTokens");
  if (!user) {
    throw new AppError("User not found", 404, {
      errorCode: "USER_NOT_FOUND",
    });
  }

  //check if user has password (google users might not)
  if (!user.password) {
    throw new AppError(
      "Cannot change password for accounts using social login",
      400,
      { errorCode: "NO_PASSWORD", provider: user.provider },
    );
  }
  //verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 401, {
      errorCode: "INVALID_PASSWORD",
    });
  }
  //update password
  user.password = newPassword;
  //invalidate all refresh tokens for security
  user.refreshTokens = [];
  await user.save();
};
//get current user
export const getCurrentUser = async (userId: string): Promise<ISafeUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404, {
      errorCode: "USER_NOT_FOUND",
    });
  }

  return toSafeUser(user);
};

//google login
export const googleAuth = async (
  googleUserInfo: IGoogleUserInfo,
): Promise<{
  user: ISafeUser;
  accessToken: string;
  refreshToken: string;
}> => {
  const { sub: providerId, email, name, picture } = googleUserInfo;
  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({
    $or: [{ email: normalizedEmail }, { providerId }],
  }).select("+refreshTokens");
  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      name,
      avatar: picture ?? undefined,
      provider: AuthProvider.GOOGLE,
      providerId,
      isEmailVerified: true,
    });
  } else if (user.provider !== AuthProvider.GOOGLE) {
    // Deny login - require user to link accounts explicitly
    throw new AppError(
      "An account with this email already exists. Please login with your password and link your Google account in settings.",
      409,
      { errorCode: "ACCOUNT_EXISTS", provider: user.provider },
    );
  }
  const payload = createTokenPayload(user);
  const { accessToken, refreshToken } = generateTokenPair(payload);

  const MAX_SESSIONS = 5;
  const refreshTokens = user.refreshTokens;

  if (refreshTokens.length >= MAX_SESSIONS) {
    refreshTokens.shift();
  }

  refreshTokens.push(refreshToken);
  user.refreshTokens = refreshTokens;
  user.lastLogin = new Date();
  await user.save();

  return {
    user: toSafeUser(user),
    accessToken,
    refreshToken,
  };
};

//generate password reset token
const generateResetToken = (): {
  plainToken: string;
  hashedToken: string;
  expiresAt: Date;
} => {
  const plainToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(plainToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  return { plainToken, hashedToken, expiresAt };
};
//hashes a plain reset token for verification
const hashResetToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
//forget password - generator reset token
export const forgotPassword = async (
  email: string,
): Promise<{ resetToken: string; expiresAt: Date }> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError(
      "If that email is registered, you will receive a password reset link",
      200,
      { errorCode: "EMAIL_SENT" },
    );
  }
  // Check if user uses password-based auth
  if (!user.password && user.provider !== AuthProvider.LOCAL) {
    throw new AppError(
      `This account uses ${user.provider} sign-in. Please login with ${user.provider}.`,
      400,
      { errorCode: "OAUTH_ACCOUNT", provider: user.provider },
    );
  }

  //check account status
  if (
    user.status === UserStatus.BLOCKED ||
    user.status === UserStatus.INACTIVE
  ) {
    throw new AppError(
      "This account is not active. Please contact support.",
      403,
      { errorCode: "ACCOUNT_NOT_ACTIVE", status: user.status },
    );
  }
  //generate secure token
  const { plainToken, hashedToken, expiresAt } = generateResetToken();
  //store hashed token in database
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = expiresAt;
  await user.save({ validateBeforeSave: false });
  return {
    resetToken: plainToken,
    expiresAt,
  };
};

//reset password
export const resetPasswoed = async (
  token: string,
  newPassword: string,
): Promise<void> => {
  //hash the incoming token to compare with stored hash
  const hashedToken = hashResetToken(token);
  //find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select(
    "+passwordResetToken +passwordResetExpires +password +refreshTokens",
  );
  if (!user) {
    throw new AppError("Password reset token is invalid or has expired", 400, {
      errorCode: "INVALID_OR_EXPIRED_TOKEN",
    });
  }

  //update password (will be hashed by pre-save hook)
  user.password = newPassword;
  //clear reset token fields
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  //invalid all session for security
  user.refreshTokens = [];
  //update password changed timestamp
  user.passwordChangedAt = new Date();
  await user.save();
};
//Verifies if a reset token is valid without resetting password
export const verifyResetToken = async (
  token: string,
): Promise<{ valid: boolean; email?: string }> => {
  const hashedToken = hashResetToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    return { valid: false };
  }

  return {
    valid: true,
    email: user.email,
  };
};
