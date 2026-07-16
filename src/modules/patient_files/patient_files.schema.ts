import { z } from "zod";

export const uploadPatientFileSchema = z.object({
  patient_id: z.string().uuid(),
  file_type: z.enum(["xray", "image", "pdf"]),
  description: z.string().optional(),
});

export const listPatientFilesQuerySchema = z.object({
  patient_id: z.string().uuid(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const patientFileIdParamSchema = z.string().uuid();

export type UploadPatientFileInput = z.infer<typeof uploadPatientFileSchema>;
export type ListPatientFilesQuery = z.infer<typeof listPatientFilesQuerySchema>;









