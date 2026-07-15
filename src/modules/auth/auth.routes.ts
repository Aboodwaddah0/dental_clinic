import { Router } from "express";
import { loginHandler, meHandler } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", loginHandler);
authRouter.get("/me", requireAuth, meHandler);
