import type { Request, Response } from "express";
import * as invoicesService from "./invoices.service.js";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  addPaymentSchema,
  listInvoicesQuerySchema,
  invoiceIdParamSchema,
  patientBalancesQuerySchema,
} from "./invoices.schema.js";

export async function getPatientBalancesHandler(req: Request, res: Response) {
  const { patient_ids } = patientBalancesQuerySchema.parse(req.query);
  const data = await invoicesService.getPatientBalances(patient_ids);
  res.status(200).json({ data });
}

export async function listInvoicesHandler(req: Request, res: Response) {
  const query = listInvoicesQuerySchema.parse(req.query);
  const { data, count } = await invoicesService.listInvoices(query);
  res.status(200).json({ data, count });
}

export async function getInvoiceHandler(req: Request, res: Response) {
  const id = invoiceIdParamSchema.parse(req.params.id);
  const invoice = await invoicesService.getInvoiceById(id);
  res.status(200).json({ data: invoice });
}

export async function createInvoiceHandler(req: Request, res: Response) {
  const input = createInvoiceSchema.parse(req.body);
  const invoice = await invoicesService.createInvoice(input);
  res.status(201).json({ data: invoice });
}

export async function updateInvoiceHandler(req: Request, res: Response) {
  const id = invoiceIdParamSchema.parse(req.params.id);
  const input = updateInvoiceSchema.parse(req.body);
  const invoice = await invoicesService.updateInvoice(id, input);
  res.status(200).json({ data: invoice });
}

export async function deleteInvoiceHandler(req: Request, res: Response) {
  const id = invoiceIdParamSchema.parse(req.params.id);
  await invoicesService.deleteInvoice(id);
  res.status(204).send();
}

export async function addPaymentHandler(req: Request, res: Response) {
  const id = invoiceIdParamSchema.parse(req.params.id);
  const input = addPaymentSchema.parse(req.body);
  const invoice = await invoicesService.addPayment(id, input, req.user!.id);
  res.status(201).json({ data: invoice });
}
