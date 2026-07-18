import { request } from "./client";

export type ExpenseCategory = "supplies" | "salaries" | "rent" | "utilities" | "equipment" | "other";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  recorded_by: string | null;
  recorded_by_name: string | null;
  created_at: string;
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date?: string;
}

export interface ListExpensesParams {
  from?: string;
  to?: string;
  category?: ExpenseCategory;
  limit?: number;
  offset?: number;
}

export const listExpenses = (params?: ListExpensesParams) =>
  request<{ data: Expense[]; count: number }>("/api/expenses", { query: params });

export const getExpense = (id: string) =>
  request<{ data: Expense }>(`/api/expenses/${id}`);

export const createExpense = (body: CreateExpenseInput) =>
  request<{ data: Expense }>("/api/expenses", { method: "POST", body });

export const updateExpense = (id: string, body: Partial<CreateExpenseInput>) =>
  request<{ data: Expense }>(`/api/expenses/${id}`, { method: "PUT", body });

export const deleteExpense = (id: string) =>
  request<void>(`/api/expenses/${id}`, { method: "DELETE" });
