import type { Request, Response } from "express";
import { z } from "zod";
import { login } from "./auth.service.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const { accessToken, user } = await login(parsed.data.email, parsed.data.password);
    res.status(200).json({ access_token: accessToken, user });
  } catch (err) {
    res.status(401).json({ error: err instanceof Error ? err.message : "Login failed" });
  }
}

export function meHandler(req: Request, res: Response) {
  res.status(200).json({ user: req.user });
}
