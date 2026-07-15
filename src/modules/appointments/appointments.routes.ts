import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  createAppointmentHandler,
  getAppointmentHandler,
  listAppointmentsHandler,
  updateAppointmentHandler,
} from "./appointments.controller.js";

export const appointmentsRouter = Router();

appointmentsRouter.use(requireAuth);

appointmentsRouter.get("/", listAppointmentsHandler);
appointmentsRouter.get("/:id", getAppointmentHandler);
appointmentsRouter.post("/", requireRole("doctor"), createAppointmentHandler);
appointmentsRouter.patch("/:id", requireRole("doctor"), updateAppointmentHandler);
