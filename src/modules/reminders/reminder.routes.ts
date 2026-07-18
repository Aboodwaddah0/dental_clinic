import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { listRemindersHandler } from "./reminder.controller.js";

export const remindersRouter = Router();

remindersRouter.use(requireAuth);
remindersRouter.get("/", listRemindersHandler);
