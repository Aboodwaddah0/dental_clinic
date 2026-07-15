import type { NextFunction, Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    res.status(403).json({ error: "No staff profile for this account" });
    return;
  }

  req.user = { id: profile.id, role: profile.role, full_name: profile.full_name };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
