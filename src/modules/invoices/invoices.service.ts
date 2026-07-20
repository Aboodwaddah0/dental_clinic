import { supabase } from "../../lib/supabase.js";
import { NotFoundError } from "../../lib/errors.js";
import type { CreateInvoiceInput, UpdateInvoiceInput, AddPaymentInput, UpdatePaymentInput, ListInvoicesQuery } from "./invoices.schema.js";

const INVOICE_SELECT = "*, patient:patients!patient_id(full_name), payments(*)";

function flattenInvoice(row: any) {
  return {
    ...row,
    patient_name: row.patient?.full_name ?? null,
    patient: undefined,
  };
}

export async function getPatientBalances(patientIds: string[]) {
  const { data, error } = await supabase.rpc("get_patient_balances", {
    patient_ids: patientIds,
  });

  if (error) throw new Error(error.message);

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    map[row.patient_id] = Number(row.remaining);
  }
  return map;
}

export async function listInvoices({ patient_id, status, limit, offset }: ListInvoicesQuery) {
  let query = supabase.from("invoices").select(INVOICE_SELECT, { count: "exact" });

  if (patient_id) query = query.eq("patient_id", patient_id);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return { data: (data ?? []).map(flattenInvoice), count: count ?? 0 };
}

export async function getInvoiceById(id: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select(INVOICE_SELECT)
    .eq("id", id)
    .single();

  if (error) throw new NotFoundError("Invoice not found");
  return flattenInvoice(data);
}

export async function createInvoice(input: CreateInvoiceInput) {
  const { data, error } = await supabase
    .from("invoices")
    .insert(input)
    .select(INVOICE_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return flattenInvoice(data);
}

export async function updateInvoice(id: string, input: UpdateInvoiceInput) {
  const { data, error } = await supabase
    .from("invoices")
    .update(input)
    .eq("id", id)
    .select(INVOICE_SELECT)
    .single();

  if (error) throw new NotFoundError("Invoice not found");
  return flattenInvoice(data);
}

export async function deleteInvoice(id: string) {
  const { data, error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw new NotFoundError("Invoice not found");
  return data;
}

export async function updatePayment(paymentId: string, input: UpdatePaymentInput) {
  const { data, error } = await supabase
    .from("payments")
    .update(input)
    .eq("id", paymentId)
    .select("invoice_id")
    .single();

  if (error) throw new NotFoundError("Payment not found");
  return getInvoiceById(data.invoice_id);
}

export async function deletePayment(paymentId: string) {
  const { data, error } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId)
    .select("invoice_id")
    .single();

  if (error) throw new NotFoundError("Payment not found");
  return getInvoiceById(data.invoice_id);
}

export async function addPayment(invoiceId: string, input: AddPaymentInput, receivedBy: string) {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      invoice_id: invoiceId,
      amount: input.amount,
      payment_method: input.payment_method,
      payment_date: input.payment_date ?? new Date().toISOString(),
      received_by: receivedBy,
      note: input.note ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Return the updated invoice with recalculated paid_amount/status (handled by DB trigger)
  return getInvoiceById(invoiceId);
}
