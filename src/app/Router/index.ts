import { Router } from "express";
import authRouter from "../Modules/Auth/auth.routes";
import userRouter from "../Modules/User/user.routes";

export const router = Router();

const moduleRouters = [
  {
    path: "/auth",
    route: authRouter,
  },
  {
    path: "/users",
    route: userRouter,
  },
];
moduleRouters.forEach((route) => {
  router.use(route.path, route.route);
});
