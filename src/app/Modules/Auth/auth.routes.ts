import { Router } from "express";
import * as AuthController from "./auth.controller";
import { validate } from "../../MiddleWare/validate.middleware";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from "./auth.validation";
const authRouter = Router();
//public route
authRouter.post("/register", validate(registerSchema), AuthController.register);
authRouter.post("/login", validate(loginSchema), AuthController.login);
authRouter.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  AuthController.refreshToken
);
export default authRouter;
