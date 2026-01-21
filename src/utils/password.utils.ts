import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import type { IGoogleUserInfo } from "../app/Modules/Auth/auth.types";
import { ConfigEnvVariable } from "../config/env";


const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

// hash password
export const hasPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

//compare password with hash
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

//password validation
// password strength requirements
export interface IPasswordStrength {
  isValid: boolean;
  errors: string[];
  score: number;
}

//validation password strength
export const validatePasswordStrength = (
  password: string
): IPasswordStrength => {
  const errors: string[] = [];
  let score = 0;
  //minimum length
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least 8 characters`);
  } else {
    score += 1;
  }
  // Contains lowercase
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else {
    score += 1;
  }

  // Contains uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else {
    score += 1;
  }

  // Contains number
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  } else {
    score += 1;
  }

  // Contains special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  } else {
    score += 1;
  }
  return {
    isValid: errors.length === 0,
    errors,
    score,
  };
};

//Generate Random password
interface PasswordOptions  {
  length?: number;
  includeLowercase?: boolean;
  includeUppercase?: boolean;
  includeNumbers?: boolean;
  includeSpecial?: boolean;
};

const CHAR_SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  special: "!@#$%^&*()",
};

export const generateRandomPassword = ({
  length = 16,
  includeLowercase = true,
  includeUppercase = true,
  includeNumbers = true,
  includeSpecial = true,
}: PasswordOptions = {}): string => {
  const enabledSets: string[] = [];

  if (includeLowercase) enabledSets.push(CHAR_SETS.lowercase);
  if (includeUppercase) enabledSets.push(CHAR_SETS.uppercase);
  if (includeNumbers) enabledSets.push(CHAR_SETS.numbers);
  if (includeSpecial) enabledSets.push(CHAR_SETS.special);

  // At least one character set must be enabled
  if (enabledSets.length === 0) {
    throw new Error("At least one character set must be enabled");
  }

  // Password length must accommodate all enabled sets
  if (length < enabledSets.length) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Password length must be at least ${enabledSets.length}`);
  }

  const passwordChars: string[] = [];

  // Ensure at least one character from each enabled set
  for (const set of enabledSets) {
    passwordChars.push(set.charAt(randomInt(set.length)));
  }

  const allChars = enabledSets.join("");

  // Fill remaining characters
  while (passwordChars.length < length) {
    passwordChars.push(allChars.charAt(randomInt(allChars.length)));
  }

  // Fisher–Yates shuffle for randomness
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const temp = passwordChars[i]; 
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    passwordChars[i] = passwordChars[j]!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    passwordChars[j] = temp!;
  }

  return passwordChars.join("");
};
//initialize passport with Google OAuth strategy
export const initializePassport = (): void => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: ConfigEnvVariable.GOOGLE_CLIENT_ID,
        clientSecret: ConfigEnvVariable.GOOGLE_CLIENT_SECRET,
        callbackURL: ConfigEnvVariable.GOOGLE_CALLBACK_URL,
        scope: ["profile", "email"],
      },
      (_accessToken, _refreshToken, profile, done) => {
        try {
          //transform google profile to our formate
          const googleUser: IGoogleUserInfo = {
            sub: profile.id,
            email: profile.emails?.[0]?.value ?? "",
            name: profile.displayName || "",
            picture: profile.photos?.[0]?.value,
            email_verified: profile.emails?.[0]?.verified ?? false,
          };
          done(null, googleUser);
        } catch (error) {
          done(error, undefined);
        }
      },
    ),
  );

  //serialize user for the session
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  // Deserialize user from the session
  passport.deserializeUser((user: Express.User, done) => {
    done(null, user);
  });
};
export default passport



