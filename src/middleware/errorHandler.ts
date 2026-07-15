import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ConflictError, NotFoundError, ValidationError } from "../lib/errors.js";


export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.flatten() });
    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
