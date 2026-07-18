import type { Request, Response, NextFunction } from "express";
import { getClinicSettings, updateClinicSettings } from "./clinic-settings.service.js";
import { updateClinicSettingsSchema } from "./clinic-settings.schema.js";

export async function getHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getClinicSettings();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function putHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = updateClinicSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const data = await updateClinicSettings(parsed.data);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}
