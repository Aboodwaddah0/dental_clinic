import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { listPatientFilesHandler, uploadPatientFileHandler, deletePatientFileHandler } from "./patient_files.controller.js";

const upload = multer({ storage: multer.memoryStorage() });

export const patientFilesRouter = Router();

patientFilesRouter.use(requireAuth);

patientFilesRouter.get("/", listPatientFilesHandler);
patientFilesRouter.post("/upload", requireRole("doctor"), upload.single("file"), uploadPatientFileHandler);
patientFilesRouter.delete("/:id", requireRole("doctor"), deletePatientFileHandler);
