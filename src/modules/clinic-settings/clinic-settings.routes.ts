import { Router } from "express";
import { getHandler, putHandler } from "./clinic-settings.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/auth.js";

export const clinicSettingsRouter = Router();

clinicSettingsRouter.get("/", requireAuth, getHandler);
clinicSettingsRouter.put("/", requireAuth, requireRole("doctor"), putHandler);
