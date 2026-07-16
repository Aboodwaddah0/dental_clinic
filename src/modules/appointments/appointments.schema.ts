import { z } from "zod";


const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "must be HH:MM");

 const appointmentStatusEnum = z.enum(["scheduled", "completed", "cancelled"]);

 const createAppointmentBase = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  appointment_date: z.string().date(),
  start_time: timeSchema,
  end_time: timeSchema,
  notes: z.string().optional(),
});

export const createAppointmentSchema = createAppointmentBase.refine((d) => d.end_time > d.start_time, {
  message: "end_time must be after start_time",
  path: ["end_time"],
});



export const updateAppointmentSchema = z.object({
  appointment_date: z.string().date().optional(),
  start_time: timeSchema.optional(),
  end_time: timeSchema.optional(),
  status: appointmentStatusEnum.optional(),
  notes: z.string().optional(),
});

export const listAppointmentsQuerySchema = z.object({
  doctor_id: z.string().uuid().optional(),
  patient_id: z.string().uuid().optional(),
  status: appointmentStatusEnum.optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const appointmentIdParamSchema = z.string().uuid();

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
