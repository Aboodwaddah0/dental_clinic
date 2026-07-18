import { z } from "zod";

export const expenseCategorySchema = z.enum(["supplies", "salaries", "rent", "utilities", "equipment", "other"]);

export const createExpenseSchema = z.object({
  category:     expenseCategorySchema.default("other"),
  description:  z.string().min(1).max(500),
  amount:       z.number().positive(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const updateExpenseSchema = z.object({
  category:     expenseCategorySchema.optional(),
  description:  z.string().min(1).max(500).optional(),
  amount:       z.number().positive().optional(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const listExpensesQuerySchema = z.object({
  from:     z.string().optional(),
  to:       z.string().optional(),
  category: expenseCategorySchema.optional(),
  limit:    z.coerce.number().int().positive().max(500).default(50),
  offset:   z.coerce.number().int().min(0).default(0),
});

export const expenseIdParamSchema = z.string().uuid();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery  = z.infer<typeof listExpensesQuerySchema>;
