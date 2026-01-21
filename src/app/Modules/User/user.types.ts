import type { Document, Types } from "mongoose";

//role enum
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

//user status enum
export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
  PENDING = "PENDING",
}
//authentication  provider enum
export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
}

//use interface

export interface IUser {
  email: string;
  password?: string;
  name: string;
  avatar?: string | null;
  role: UserRole;
  status: UserStatus;
  provider: AuthProvider;
  providerId?: string | null;
  isEmailVerified: boolean;
  refreshTokens: string[];
  lastLogin?: Date | null;
  loginAttempts: number;
  lockUntil?: Date | null;
  passwordChangedAt?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

//user documment interface (with mongoose document)
export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  clearPasswordResetToken(): Promise<void>;
}

//user model static methods
export interface IUserModel {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

//safe user data (without sensitive fields)
export interface ISafeUser {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  provider: AuthProvider;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

//create user input
export interface ICreateUserInput {
  email: string;
  password?: string;
  name: string;
  avatar?: string;
  role?: UserRole;
  provider?: AuthProvider;
  providerId?: string;
  isEmailVerified?: boolean;
}
//update user input
export interface IUpdateUserInput {
  name?: string;
  avatar?: string | null;
  status?: UserStatus;
  role?: UserRole;
}
