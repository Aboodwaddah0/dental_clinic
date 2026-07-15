import type { Request, Response } from "express";
import { createVisitSchema, listVisitsQuerySchema, updateVisitSchema, visitIdParamSchema } from "./visits.schema.js";
import * as visitsService from "./visits.service.js";

export async function listVisitsHandler(req: Request, res: Response) {
  const query = listVisitsQuerySchema.parse(req.query);
  const { data, count } = await visitsService.listVisits(query);
  res.status(200).json({ data, count });
}

export async function getVisitHandler(req: Request, res: Response) {
  const id = visitIdParamSchema.parse(req.params.id);
  const visit = await visitsService.getVisitById(id);
  res.status(200).json({ data: visit });
}

export async function createVisitHandler(req: Request, res: Response) {
  const input = createVisitSchema.parse(req.body);
  const visit = await visitsService.createVisit(input, req.user!.id);
  res.status(201).json({ data: visit });
}

export async function updateVisitHandler(req: Request, res: Response) {
  const id = visitIdParamSchema.parse(req.params.id);
  const input = updateVisitSchema.parse(req.body);
  const visit = await visitsService.updateVisit(id, input);
  res.status(200).json({ data: visit });
}

export async function deleteVisitHandler(req: Request, res: Response) {
  const id = visitIdParamSchema.parse(req.params.id);
  await visitsService.deleteVisit(id);
  res.status(204).send();
}


