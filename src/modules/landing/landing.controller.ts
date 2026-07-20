import type { Request, Response } from "express";
import multer from "multer";
import { serviceSchema, portfolioSchema, idParamSchema } from "./landing.schema.js";
import * as service from "./landing.service.js";
import { supabase } from "../../lib/supabase.js";

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const BUCKET = "portfolio-images";

async function ensureBucket() {
  const { data: existing } = await supabase.storage.getBucket(BUCKET);
  if (!existing) {
    await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 5242880 });
  }
}

ensureBucket().catch(() => {});

export async function uploadImageHandler(req: Request, res: Response) {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) { res.status(400).json({ error: "No file provided" }); return; }

  await ensureBucket();

  const ext = file.originalname.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) { res.status(500).json({ error: error.message }); return; }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  res.json({ url: data.publicUrl });
}

export async function getLandingHandler(req: Request, res: Response) {
  const data = await service.getLandingData();
  res.json({ data });
}

export async function createServiceHandler(req: Request, res: Response) {
  const input = serviceSchema.parse(req.body);
  const data  = await service.createService(input);
  res.status(201).json({ data });
}

export async function updateServiceHandler(req: Request, res: Response) {
  const id    = idParamSchema.parse(req.params.id);
  const input = serviceSchema.parse(req.body);
  const data  = await service.updateService(id, input);
  res.json({ data });
}

export async function deleteServiceHandler(req: Request, res: Response) {
  const id = idParamSchema.parse(req.params.id);
  await service.deleteService(id);
  res.status(204).send();
}

export async function createPortfolioHandler(req: Request, res: Response) {
  const input = portfolioSchema.parse(req.body);
  const data  = await service.createPortfolioItem(input);
  res.status(201).json({ data });
}

export async function updatePortfolioHandler(req: Request, res: Response) {
  const id    = idParamSchema.parse(req.params.id);
  const input = portfolioSchema.parse(req.body);
  const data  = await service.updatePortfolioItem(id, input);
  res.json({ data });
}

export async function deletePortfolioHandler(req: Request, res: Response) {
  const id = idParamSchema.parse(req.params.id);
  await service.deletePortfolioItem(id);
  res.status(204).send();
}
