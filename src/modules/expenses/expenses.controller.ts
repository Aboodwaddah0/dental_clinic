import type { Request, Response } from "express";
import * as expensesService from "./expenses.service.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
  expenseIdParamSchema,
} from "./expenses.schema.js";

export async function listExpensesHandler(req: Request, res: Response) {
  const query = listExpensesQuerySchema.parse(req.query);
  const { data, count } = await expensesService.listExpenses(query);
  res.status(200).json({ data, count });
}

export async function getExpenseHandler(req: Request, res: Response) {
  const id = expenseIdParamSchema.parse(req.params.id);
  const expense = await expensesService.getExpenseById(id);
  res.status(200).json({ data: expense });
}

export async function createExpenseHandler(req: Request, res: Response) {
  const input = createExpenseSchema.parse(req.body);
  const expense = await expensesService.createExpense(input, req.user!.id);
  res.status(201).json({ data: expense });
}

export async function updateExpenseHandler(req: Request, res: Response) {
  const id = expenseIdParamSchema.parse(req.params.id);
  const input = updateExpenseSchema.parse(req.body);
  const expense = await expensesService.updateExpense(id, input);
  res.status(200).json({ data: expense });
}

export async function deleteExpenseHandler(req: Request, res: Response) {
  const id = expenseIdParamSchema.parse(req.params.id);
  await expensesService.deleteExpense(id);
  res.status(204).send();
}
