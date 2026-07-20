import type { Request, Response } from "express";
import { upsertAvailabilitySchema } from "./availability.schema.js";
import * as service from "./availability.service.js";

export async function getAvailabilityHandler(req: Request, res: Response) {
  const data = await service.getAvailability(req.user!.id);
  res.json({ data });
}

export async function upsertAvailabilityHandler(req: Request, res: Response) {
  const slots = upsertAvailabilitySchema.parse(req.body);
  const data  = await service.upsertAvailability(req.user!.id, slots);
  res.json({ data });
}
