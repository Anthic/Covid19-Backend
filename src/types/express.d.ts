import type { IUserDocument } from "../app/Modules/User/user.types";

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      userId?: string;
      cookies: Record<string, string>;
    }
  }
}
