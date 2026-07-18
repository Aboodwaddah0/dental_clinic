import { z } from "zod";

export const setupBodySchema = z.object({
  owner: z.object({
    full_name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8),
  }),
  clinic: z.object({
    name: z.string().min(1).max(200),
    address: z.string().max(500).optional(),
    phone: z.string().max(50).optional(),
    currency: z.string().max(10).default("₪"),
    locale: z.enum(["en", "ar"]).default("en"),
  }),
  reminders: z.object({
    enabled: z.boolean().default(false),
    account_sid: z.string().optional(),
    auth_token: z.string().optional(),
    whatsapp_from: z.string().optional(),
    template_sid: z.string().optional(),
    lead_hours: z.coerce.number().int().positive().max(168).default(24),
  }).optional(),
});

export type SetupBody = z.infer<typeof setupBodySchema>;
