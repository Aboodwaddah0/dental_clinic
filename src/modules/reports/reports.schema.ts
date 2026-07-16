import { z } from "zod";

export const dateRangeSchema = z.object({
  from:   z.string().date().optional(),
  to:     z.string().date().optional(),
  method: z.enum(["cash", "card", "transfer"]).optional(),
});

export const patientIdParamSchema = z.string().uuid();

export type DateRangeQuery = z.infer<typeof dateRangeSchema>;
