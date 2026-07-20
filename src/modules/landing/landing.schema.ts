import { z } from "zod";

export const serviceSchema = z.object({
  title:       z.string().min(1),
  description: z.string().optional(),
  icon:        z.string().optional(),
  sort_order:  z.number().int().default(0),
});

export const PORTFOLIO_TEMPLATES = ["single", "before-after", "gallery"] as const;
export type PortfolioTemplate = typeof PORTFOLIO_TEMPLATES[number];

const optionalUrl = z.string().optional().nullable().transform((v) => v || null);

export const portfolioSchema = z.object({
  title:            z.string().min(1),
  description:      z.string().optional().nullable(),
  image_url:        optionalUrl,
  before_image_url: optionalUrl,
  after_image_url:  optionalUrl,
  template:         z.enum(PORTFOLIO_TEMPLATES).default("single"),
  sort_order:       z.number().int().default(0),
});

export const idParamSchema = z.string().uuid();

export type ServiceInput    = z.infer<typeof serviceSchema>;
export type PortfolioInput  = z.infer<typeof portfolioSchema>;
