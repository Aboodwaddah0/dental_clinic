import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getAvailabilityHandler, upsertAvailabilityHandler } from "./availability.controller.js";

export const availabilityRouter = Router();

availabilityRouter.use(requireAuth);
availabilityRouter.get("/", getAvailabilityHandler);
availabilityRouter.put("/", upsertAvailabilityHandler);
