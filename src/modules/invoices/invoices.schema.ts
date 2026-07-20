import { z } from "zod";

export const createInvoiceSchema = z.object({
  patient_id: z.string().uuid(),
  total_amount: z.number().positive(),
  note: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
  total_amount: z.number().positive().optional(),
  note: z.string().optional(),
});

export const addPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_method: z.enum(["cash", "card", "transfer"]),
  payment_date: z.string().datetime().optional(),
  note: z.string().optional(),
});

export const listInvoicesQuerySchema = z.object({
  patient_id: z.string().uuid().optional(),
  status: z.enum(["unpaid", "partially_paid", "paid"]).optional(),
  limit: z.coerce.number().int().positive().max(500).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  payment_method: z.enum(["cash", "card", "transfer"]).optional(),
  payment_date: z.string().datetime().optional(),
  note: z.string().optional(),
});

export const paymentIdParamSchema = z.string().uuid();
export const invoiceIdParamSchema = z.string().uuid();

export const patientBalancesQuerySchema = z.object({
  patient_ids: z.string().transform((val) => val.split(",").filter(Boolean)),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
