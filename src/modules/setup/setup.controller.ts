import type { Request, Response, NextFunction } from "express";
import { getSetupStatus, runSetup } from "./setup.service.js";
import { setupBodySchema } from "./setup.schema.js";

export async function statusHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getSetupStatus();
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function setupHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = setupBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const result = await runSetup(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
