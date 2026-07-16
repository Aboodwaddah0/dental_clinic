import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  listInvoicesHandler,
  getInvoiceHandler,
  createInvoiceHandler,
  updateInvoiceHandler,
  deleteInvoiceHandler,
  addPaymentHandler,
} from "./invoices.controller.js";

export const invoicesRouter = Router();

invoicesRouter.use(requireAuth);

invoicesRouter.get("/", listInvoicesHandler);
invoicesRouter.get("/:id", getInvoiceHandler);
invoicesRouter.post("/", requireRole("doctor"), createInvoiceHandler);
invoicesRouter.put("/:id", requireRole("doctor"), updateInvoiceHandler);
invoicesRouter.delete("/:id", requireRole("doctor"), deleteInvoiceHandler);
invoicesRouter.post("/:id/payments", requireRole("doctor"), addPaymentHandler);
