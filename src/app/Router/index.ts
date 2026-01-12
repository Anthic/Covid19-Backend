import { Router } from "express";
import authRouter from "../Modules/Auth/auth.routes";

export const router= Router()

const moduleRouters = [
    {
        path:"/auth",
        route: authRouter,
    }
]
moduleRouters.forEach((route) => {
    router.use(route.path, route.route)
})