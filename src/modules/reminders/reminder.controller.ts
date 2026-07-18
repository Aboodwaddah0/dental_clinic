import type { Request, Response, NextFunction } from "express";
import { listUpcomingReminders } from "./reminder.service.js";

export async function listRemindersHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listUpcomingReminders(7);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}
