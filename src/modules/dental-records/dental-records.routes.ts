import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  listDentalRecordsHandler,
  getDentalRecordHandler,
  createDentalRecordHandler,
  updateDentalRecordHandler,
  deleteDentalRecordHandler,
} from "./dental-records.controller.js";

export const dentalRecordsRouter = Router();

dentalRecordsRouter.use(requireAuth);

dentalRecordsRouter.get("/",     listDentalRecordsHandler);
dentalRecordsRouter.get("/:id",  getDentalRecordHandler);
dentalRecordsRouter.post("/",    requireRole("doctor"), createDentalRecordHandler);
dentalRecordsRouter.put("/:id",  requireRole("doctor"), updateDentalRecordHandler);
dentalRecordsRouter.delete("/:id", requireRole("doctor"), deleteDentalRecordHandler);
