import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  listExpensesHandler,
  getExpenseHandler,
  createExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
} from "./expenses.controller.js";

export const expensesRouter = Router();

expensesRouter.use(requireAuth);

expensesRouter.get("/",     listExpensesHandler);
expensesRouter.get("/:id",  getExpenseHandler);
expensesRouter.post("/",    requireRole("doctor"), createExpenseHandler);
expensesRouter.put("/:id",  requireRole("doctor"), updateExpenseHandler);
expensesRouter.delete("/:id", requireRole("doctor"), deleteExpenseHandler);
