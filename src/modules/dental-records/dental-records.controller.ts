import type { Request, Response } from "express";
import {
  createDentalRecordSchema,
  updateDentalRecordSchema,
  listDentalRecordsQuerySchema,
  dentalRecordIdParamSchema,
} from "./dental-records.schema.js";
import * as service from "./dental-records.service.js";

export async function listDentalRecordsHandler(req: Request, res: Response) {
  const query = listDentalRecordsQuerySchema.parse(req.query);
  const { data, count } = await service.listDentalRecords(query);
  res.status(200).json({ data, count });
}

export async function getDentalRecordHandler(req: Request, res: Response) {
  const id = dentalRecordIdParamSchema.parse(req.params.id);
  const record = await service.getDentalRecordById(id);
  res.status(200).json({ data: record });
}

export async function createDentalRecordHandler(req: Request, res: Response) {
  const input = createDentalRecordSchema.parse(req.body);
  const record = await service.createDentalRecord(input, req.user!.id);
  res.status(201).json({ data: record });
}

export async function updateDentalRecordHandler(req: Request, res: Response) {
  const id = dentalRecordIdParamSchema.parse(req.params.id);
  const input = updateDentalRecordSchema.parse(req.body);
  const record = await service.updateDentalRecord(id, input);
  res.status(200).json({ data: record });
}

export async function deleteDentalRecordHandler(req: Request, res: Response) {
  const id = dentalRecordIdParamSchema.parse(req.params.id);
  await service.deleteDentalRecord(id);
  res.status(204).send();
}
