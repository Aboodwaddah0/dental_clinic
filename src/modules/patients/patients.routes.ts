import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  createPatientHandler,
  deletePatientHandler,
  getPatientHandler,
  listPatientsHandler,
  updatePatientHandler,
} from "./patients.controller.js";

export const patientsRouter = Router();

patientsRouter.use(requireAuth);

patientsRouter.get("/", listPatientsHandler);
patientsRouter.get("/:id", getPatientHandler);
patientsRouter.post("/", requireRole("doctor"), createPatientHandler);
patientsRouter.patch("/:id", requireRole("doctor"), updatePatientHandler);
patientsRouter.delete("/:id", requireRole("doctor"), deletePatientHandler);
