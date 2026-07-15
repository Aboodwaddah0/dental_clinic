import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { listVisitsHandler, getVisitHandler, createVisitHandler, updateVisitHandler, deleteVisitHandler } from "./visits.controller.js";

export const visitsRouter = Router();

visitsRouter.use(requireAuth);

visitsRouter.get("/", listVisitsHandler);
visitsRouter.get("/:id", getVisitHandler);
visitsRouter.post("/", requireRole("doctor"), createVisitHandler);
visitsRouter.put("/:id", requireRole("doctor"), updateVisitHandler);
visitsRouter.delete("/:id", requireRole("doctor"), deleteVisitHandler);
