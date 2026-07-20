import { z } from "zod";

export const updateClinicSettingsSchema = z.object({
  clinic_name:       z.string().min(1).max(200),
  address:           z.string().max(500).optional(),
  phone:             z.string().max(50).optional(),
  logo_url:          z.string().optional().nullable(),
  hero_image_url:    z.string().optional().nullable(),
  hero_bg_url:       z.string().optional().nullable(),
  currency:          z.string().max(10).default("₪"),
  locale:            z.enum(["en", "ar"]).default("en"),
  reminders_enabled: z.boolean().default(false),
  reminder_lead_hours: z.coerce.number().int().positive().max(168).default(24),
});

export type UpdateClinicSettingsInput = z.infer<typeof updateClinicSettingsSchema>;
