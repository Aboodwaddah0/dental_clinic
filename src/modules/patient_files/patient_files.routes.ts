import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { listPatientFilesHandler, uploadPatientFileHandler } from "./patient_files.controller.js";

const upload = multer({ storage: multer.memoryStorage() });

export const patientFilesRouter = Router();

patientFilesRouter.use(requireAuth);

patientFilesRouter.post("/upload", requireRole("doctor"), upload.single("file"), uploadPatientFileHandler);
