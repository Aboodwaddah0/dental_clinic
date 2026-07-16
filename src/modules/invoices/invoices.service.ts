import { supabase } from "../../lib/supabase.js";
import { NotFoundError } from "../../lib/errors.js";
import type { CreateInvoiceInput, UpdateInvoiceInput, AddPaymentInput, ListInvoicesQuery } from "./invoices.schema.js";

const INVOICE_SELECT = "*, patient:patients!patient_id(full_name), payments(*)";

function flattenInvoice(row: any) {
  return {
    ...row,
    patient_name: row.patient?.full_name ?? null,
    patient: undefined,
  };
}

export async function getPatientBalances(patientIds: string[]) {
  const { data, error } = await supabase
    .from("invoices")
    .select("patient_id, total_amount, paid_amount")
    .in("patient_id", patientIds);

  if (error) throw new Error(error.message);

  const map: Record<string, number> = {};
  for (const inv of data ?? []) {
    const remaining = Number(inv.total_amount) - Number(inv.paid_amount);
    map[inv.patient_id] = (map[inv.patient_id] ?? 0) + remaining;
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

export async function addPayment(invoiceId: string, input: AddPaymentInput, receivedBy: string) {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      invoice_id: invoiceId,
      amount: input.amount,
      payment_method: input.payment_method,
      payment_date: input.payment_date ?? new Date().toISOString(),
      received_by: receivedBy,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Return the updated invoice with recalculated paid_amount/status (handled by DB trigger)
  return getInvoiceById(invoiceId);
}
