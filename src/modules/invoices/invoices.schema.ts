import { z } from "zod";

export const createInvoiceSchema = z.object({
  patient_id: z.string().uuid(),
  total_amount: z.number().positive(),
});

export const updateInvoiceSchema = z.object({
  total_amount: z.number().positive().optional(),
});

export const addPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_method: z.enum(["cash", "card", "transfer"]),
  payment_date: z.string().datetime().optional(),
});

export const listInvoicesQuerySchema = z.object({
  patient_id: z.string().uuid().optional(),
  status: z.enum(["unpaid", "partially_paid", "paid"]).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const invoiceIdParamSchema = z.string().uuid();

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
