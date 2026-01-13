import { Router } from "express";
import * as AuthController from "./auth.controller";
import { validate } from "../../MiddleWare/validate.middleware";
import {
  changePasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from "./auth.validation";
import { authenticate } from "../../MiddleWare/auth.middleware";
const authRouter = Router();
//public route
authRouter.post("/register", validate(registerSchema), AuthController.register);
authRouter.post("/login", validate(loginSchema), AuthController.login);
authRouter.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  AuthController.refreshToken
);

//private route
authRouter.get("/me", authenticate, AuthController.getCurrentUser);

authRouter.post(
  "/logout",
  authenticate,
  validate(logoutSchema),
  AuthController.logout
);
authRouter.post("/logout-all", authenticate, AuthController.logoutAll);
authRouter.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);
export default authRouter;
