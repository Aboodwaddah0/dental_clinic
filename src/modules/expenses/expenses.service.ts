import { supabase } from "../../lib/supabase.js";
import { NotFoundError } from "../../lib/errors.js";
import type { CreateExpenseInput, UpdateExpenseInput, ListExpensesQuery } from "./expenses.schema.js";

const EXPENSE_SELECT = "*, recorder:profiles!recorded_by(full_name)";

function flattenExpense(row: any) {
  return {
    ...row,
    recorded_by_name: row.recorder?.full_name ?? null,
    recorder: undefined,
  };
}

export async function listExpenses({ from, to, category, limit, offset }: ListExpensesQuery) {
  let query = supabase.from("expenses").select(EXPENSE_SELECT, { count: "exact" });

  if (from)     query = query.gte("expense_date", from);
  if (to)       query = query.lte("expense_date", to);
  if (category) query = query.eq("category", category);

  const { data, error, count } = await query
    .order("expense_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return { data: (data ?? []).map(flattenExpense), count: count ?? 0 };
}

export async function getExpenseById(id: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select(EXPENSE_SELECT)
    .eq("id", id)
    .single();

  if (error) throw new NotFoundError("Expense not found");
  return flattenExpense(data);
}

export async function createExpense(input: CreateExpenseInput, recordedBy: string) {
  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...input, recorded_by: recordedBy })
    .select(EXPENSE_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return flattenExpense(data);
}

export async function updateExpense(id: string, input: UpdateExpenseInput) {
  const { data, error } = await supabase
    .from("expenses")
    .update(input)
    .eq("id", id)
    .select(EXPENSE_SELECT)
    .single();

  if (error) throw new NotFoundError("Expense not found");
  return flattenExpense(data);
}

export async function deleteExpense(id: string) {
  const { data, error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw new NotFoundError("Expense not found");
  return data;
}

export async function getExpenseSummary({ from, to }: { from?: string; to?: string }) {
  let query = supabase.from("expenses").select("amount, category");
  if (from) query = query.gte("expense_date", from);
  if (to)   query = query.lte("expense_date", to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const total = (data ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const byCategory: Record<string, number> = {};
  for (const e of data ?? []) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
  }
  const expensesByCategory = Object.entries(byCategory).map(([category, amount]) => ({ category, amount }));

  return { totalExpenses: total, expensesByCategory };
}
