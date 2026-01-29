import mongoose, { Model, Schema } from "mongoose";
import {
  AuthProvider,
  UserRole,
  UserStatus,
  type IUserDocument,
  type IUserModel,
} from "./user.types";
import bcrypt from "bcrypt";

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    provider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
    },
    providerId: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        return ret;
      },
    },
  },
);

//indexs
userSchema.index({ email: 1 });
userSchema.index({ provider: 1, providerId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// pre save   middleware
userSchema.pre("save", async function () {
  // Only hash password if it's modified
  if (!this.isModified("password") || !this.password) {
    return;
  }

  const saltRound = 12;
  this.password = await bcrypt.hash(this.password, saltRound);

  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
});

//Instance methods

//compare password with hashed password
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password as string);
};
//check if account is locked
userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

//increment login attempts
userSchema.methods.incrementLoginAttempts = async function (
  this: IUserDocument,
): Promise<void> {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME = 15 * 60 * 1000;
  const now = new Date();

  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }
  if (this.lockUntil && this.lockUntil > now) {
    return;
  }
  //build update object
  const currentAttempts = this.loginAttempts || 0;
  const newAttempts = currentAttempts + 1;
  const update: Record<string, unknown> = {
    $inc: {
      loginAttempts: 1,
    },
  };
  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    update.$set = { lockUntil: new Date(Date.now() + LOCK_TIME) };
  }
  await this.updateOne(update);
};

//reset login attempts
userSchema.methods.resetLoginAttempts = async function (
  this: IUserDocument,
): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

userSchema.statics.findByEmail = async function (
  email: string,
): Promise<IUserDocument | null> {
  return await this.findOne({ email: email.toLowerCase() });
};

userSchema.methods.clearPasswordResetToken = async function (
  this: IUserDocument,
): Promise<void> {
  await this.updateOne({
    $unset: {
      passwordResetToken: 1,
      passwordResetExpires: 1,
    },
  });
};

// Create and export the model
const User = mongoose.model<IUserDocument, Model<IUserDocument> & IUserModel>(
  "User",
  userSchema,
);

export default User;
