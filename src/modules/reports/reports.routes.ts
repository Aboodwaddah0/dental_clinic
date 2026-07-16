import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  getFinancialReportHandler,
  getPaymentsReportHandler,
  getPatientPaymentsReportHandler,
  getPatientHistoryReportHandler,
} from "./reports.controller.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);
reportsRouter.use(requireRole("doctor"));

reportsRouter.get("/financial",                   getFinancialReportHandler);
reportsRouter.get("/payments",                    getPaymentsReportHandler);
reportsRouter.get("/patient-payments/:patientId", getPatientPaymentsReportHandler);
reportsRouter.get("/patient-history/:patientId",  getPatientHistoryReportHandler);
