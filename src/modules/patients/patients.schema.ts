import { z } from "zod";

export const createPatientSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().min(1),
  date_of_birth: z.string().date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().optional(),
  blood_type: z.string().optional(),
  allergies: z.string().optional(),
  medical_notes: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const listPatientsQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const patientIdParamSchema = z.string().uuid();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;
