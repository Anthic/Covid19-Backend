//helper function

import { toString } from "validator";
import {
  generateTokenPair,
  type ITokenPayload,
} from "../../../utils/jwt.utils";
import AppError from "../../errorHelper/AppError";
import User from "../User/user.model";
import {
  AuthProvider,
  type ISafeUser,
  type IUserDocument,
} from "../User/user.types";
import type { ILoginInput, IRegisterInput } from "./auth.types";

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

//generate payload toke from user
const createTokenPayload = (user: IUserDocument): ITokenPayload => ({
  userId: user._id.toString(),
  email: user.email,
  role: user.role,
});

// register new user
export const register = async (
  input: IRegisterInput
): Promise<{
  user: ISafeUser;
  accessToken: string;
  refreshToken: string;
}> => {
  const { email, password, name } = input;
  //check if user exists
  const exiitingUser = await User.findById({ email: email.toLowerCase() });
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
  input: ILoginInput
): Promise<{
  user: ISafeUser;
  accessToken: string;
  refreshToken: string;
}> => {
  const { email, password } = input;
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password +refreshTokens"
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
      `Account is locked. Try again in ${toString(lockTime)} minutes`,
      423,
      {
        errorCode: "ACCOUNT_LOCKED",
        lockUntil: user.lockUntil,
        remainingMinutes: lockTime,
      }
    );
  }

  //check if  has password (might be google only account)
  if (!user.password) {
    throw new AppError(
      "This account uses Google sign-in. Please login with Google.",
      400,
      { errorCode: "NO_PASSWORD", provider: user.provider }
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
