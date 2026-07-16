import type { Request, Response } from "express";
import { dateRangeSchema, patientIdParamSchema } from "./reports.schema.js";
import * as service from "./reports.service.js";

export async function getFinancialReportHandler(req: Request, res: Response) {
  const query = dateRangeSchema.parse(req.query);
  const data = await service.getFinancialReport(query);
  res.json({ data });
}

export async function getPaymentsReportHandler(req: Request, res: Response) {
  const query = dateRangeSchema.parse(req.query);
  const result = await service.getPaymentsReport(query);
  res.json(result);
}

export async function getPatientPaymentsReportHandler(req: Request, res: Response) {
  const patientId = patientIdParamSchema.parse(req.params.patientId);
  const data = await service.getPatientPaymentsReport(patientId);
  res.json({ data });
}

export async function getPatientHistoryReportHandler(req: Request, res: Response) {
  const patientId = patientIdParamSchema.parse(req.params.patientId);
  const data = await service.getPatientHistoryReport(patientId);
  res.json({ data });
}
