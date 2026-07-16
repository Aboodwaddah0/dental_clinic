import { z } from "zod";

const statusEnum = z.enum([
  "healthy",
  "caries",
  "treated",
  "missing",
  "extracted",
  "needs_treatment",
]);

export const createDentalRecordSchema = z.object({
  patient_id:   z.string().uuid(),
  tooth_number: z.number().int().min(1).max(70),
  condition:    z.string().min(1).max(100),
  description:  z.string().optional(),
  treatment:    z.string().optional(),
  status:       statusEnum.default("caries"),
});

export const updateDentalRecordSchema = z.object({
  condition:   z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  treatment:   z.string().optional(),
  status:      statusEnum.optional(),
});

export const listDentalRecordsQuerySchema = z.object({
  patient_id: z.string().uuid(),
  limit:  z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const dentalRecordIdParamSchema = z.string().uuid();

export type CreateDentalRecordInput = z.infer<typeof createDentalRecordSchema>;
export type UpdateDentalRecordInput = z.infer<typeof updateDentalRecordSchema>;
export type ListDentalRecordsQuery  = z.infer<typeof listDentalRecordsQuerySchema>;
