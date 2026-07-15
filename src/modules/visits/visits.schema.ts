import { z } from "zod";

export const createVisitSchema = z.object({
  patient_id: z.string().uuid(),
  appointment_id: z.string().uuid().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

export const updateVisitSchema = createVisitSchema.omit({ patient_id: true }).partial();

export const listVisitsQuerySchema = z.object({
  patient_id: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const visitIdParamSchema = z.string().uuid();

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type ListVisitsQuery = z.infer<typeof listVisitsQuerySchema>;
