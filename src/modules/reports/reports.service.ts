import { supabase } from "../../lib/supabase.js";
import type { DateRangeQuery } from "./reports.schema.js";
import { getExpenseSummary } from "../expenses/expenses.service.js";

// ─── Financial Report ────────────────────────────────────────────────────────

export async function getFinancialReport({ from, to }: DateRangeQuery) {
  let invoiceQuery = supabase
    .from("invoices")
    .select("id, total_amount, paid_amount, created_at");
  if (from) invoiceQuery = invoiceQuery.gte("created_at", from);
  if (to)   invoiceQuery = invoiceQuery.lte("created_at", to + "T23:59:59");

  const { data: invoices, error: invErr } = await invoiceQuery;
  if (invErr) throw new Error(invErr.message);

  let paymentQuery = supabase
    .from("payments")
    .select("amount, payment_method, payment_date");
  if (from) paymentQuery = paymentQuery.gte("payment_date", from);
  if (to)   paymentQuery = paymentQuery.lte("payment_date", to);

  const { data: payments, error: payErr } = await paymentQuery;
  if (payErr) throw new Error(payErr.message);

  const totalBilled    = (invoices ?? []).reduce((s, i) => s + Number(i.total_amount), 0);
  const totalCollected = (invoices ?? []).reduce((s, i) => s + Number(i.paid_amount), 0);
  const outstanding    = totalBilled - totalCollected;
  const invoiceCount   = (invoices ?? []).length;

  const { totalExpenses, expensesByCategory } = await getExpenseSummary({ from, to });
  const netProfit = totalCollected - totalExpenses;

  // Monthly breakdown from payments
  const monthMap: Record<string, number> = {};
  for (const p of payments ?? []) {
    const month = (p.payment_date as string).slice(0, 7); // YYYY-MM
    monthMap[month] = (monthMap[month] ?? 0) + Number(p.amount);
  }
  const monthly = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, collected]) => ({ month, collected }));

  // Monthly billed from invoices
  const billedMonthMap: Record<string, number> = {};
  for (const inv of invoices ?? []) {
    const month = (inv.created_at as string).slice(0, 7);
    billedMonthMap[month] = (billedMonthMap[month] ?? 0) + Number(inv.total_amount);
  }
  const monthlyFull = Array.from(
    new Set([...Object.keys(monthMap), ...Object.keys(billedMonthMap)])
  ).sort().map((month) => ({
    month,
    billed:    billedMonthMap[month] ?? 0,
    collected: monthMap[month] ?? 0,
  }));

  // By payment method
  const methodMap: Record<string, number> = {};
  for (const p of payments ?? []) {
    const m = p.payment_method as string;
    methodMap[m] = (methodMap[m] ?? 0) + Number(p.amount);
  }
  const byMethod = Object.entries(methodMap).map(([method, amount]) => ({ method, amount }));

  return {
    summary: { totalBilled, totalCollected, outstanding, invoiceCount, totalExpenses, netProfit },
    monthly: monthlyFull,
    byMethod,
    expensesByCategory,
  };
}

// ─── Payments Report ─────────────────────────────────────────────────────────

export async function getPaymentsReport({ from, to, method }: DateRangeQuery) {
  let q = supabase
    .from("payments")
    .select("id, amount, payment_method, payment_date, received_by, invoice:invoices!invoice_id(patient_id, patient:patients!patient_id(full_name))")
    .order("payment_date", { ascending: false });

  if (from)   q = q.gte("payment_date", from);
  if (to)     q = q.lte("payment_date", to);
  if (method) q = q.eq("payment_method", method);

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((p: any) => ({
    id:           p.id,
    patient_name: p.invoice?.patient?.full_name ?? "—",
    amount:       Number(p.amount),
    method:       p.payment_method,
    date:         p.payment_date,
    received_by:  p.received_by ?? "—",
  }));

  return { data: rows, count: count ?? rows.length };
}

// ─── Patient Payments Report ─────────────────────────────────────────────────

export async function getPatientPaymentsReport(patientId: string) {
  const [{ data: patient, error: pErr }, { data: invoices, error: iErr }] = await Promise.all([
    supabase.from("patients").select("full_name, phone").eq("id", patientId).single(),
    supabase
      .from("invoices")
      .select("id, total_amount, paid_amount, status, created_at, payments(id, amount, payment_method, payment_date, received_by)")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
  ]);

  if (pErr)  throw new Error(pErr.message);
  if (iErr)  throw new Error(iErr.message);

  const rows = (invoices ?? []).map((inv: any) => ({
    id:        inv.id,
    total:     Number(inv.total_amount),
    paid:      Number(inv.paid_amount),
    remaining: Number(inv.total_amount) - Number(inv.paid_amount),
    status:    inv.status,
    date:      inv.created_at,
    payments:  (inv.payments ?? []).map((p: any) => ({
      id:          p.id,
      amount:      Number(p.amount),
      method:      p.payment_method,
      date:        p.payment_date,
      received_by: p.received_by ?? "—",
    })),
  }));

  const totalBilled    = rows.reduce((s, r) => s + r.total, 0);
  const totalPaid      = rows.reduce((s, r) => s + r.paid, 0);
  const outstanding    = totalBilled - totalPaid;

  return {
    patient:  patient ?? { full_name: "—", phone: "—" },
    invoices: rows,
    summary:  { totalBilled, totalPaid, outstanding },
  };
}

// ─── All Patients Statement ──────────────────────────────────────────────────

export async function getAllPatientsStatement() {
  const [{ data: patients, error: pErr }, { data: invoices, error: iErr }] = await Promise.all([
    supabase.from("patients").select("id, full_name, phone").order("full_name", { ascending: true }),
    supabase.from("invoices").select("patient_id, total_amount, paid_amount"),
  ]);

  if (pErr) throw new Error(pErr.message);
  if (iErr) throw new Error(iErr.message);

  const totals: Record<string, { billed: number; paid: number }> = {};
  for (const inv of invoices ?? []) {
    if (!totals[inv.patient_id]) totals[inv.patient_id] = { billed: 0, paid: 0 };
    totals[inv.patient_id].billed += Number(inv.total_amount);
    totals[inv.patient_id].paid   += Number(inv.paid_amount);
  }

  const rows = (patients ?? []).map((p: any) => {
    const t = totals[p.id] ?? { billed: 0, paid: 0 };
    return {
      id:          p.id,
      full_name:   p.full_name,
      phone:       p.phone ?? "—",
      billed:      t.billed,
      paid:        t.paid,
      outstanding: t.billed - t.paid,
    };
  });

  const summary = {
    totalBilled:      rows.reduce((s, r) => s + r.billed, 0),
    totalPaid:        rows.reduce((s, r) => s + r.paid, 0),
    totalOutstanding: rows.reduce((s, r) => s + r.outstanding, 0),
  };

  return { rows, summary };
}

// ─── Account Statement Report ────────────────────────────────────────────────

export async function getAccountStatementReport(patientId: string) {
  const [{ data: patient, error: pErr }, { data: invoices, error: iErr }] = await Promise.all([
    supabase.from("patients").select("full_name, phone, date_of_birth").eq("id", patientId).single(),
    supabase
      .from("invoices")
      .select("id, total_amount, created_at, note, payments(id, amount, payment_method, payment_date, note)")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true }),
  ]);

  if (pErr) throw new Error(pErr.message);
  if (iErr) throw new Error(iErr.message);

  type Entry = {
    date: string; type: "invoice" | "payment";
    description: string; debit: number; credit: number; balance: number;
  };

  const entries: Entry[] = [];
  let balance = 0;

  for (const inv of invoices ?? []) {
    const debit = Number(inv.total_amount);
    balance += debit;
    entries.push({
      date: (inv.created_at as string).slice(0, 10),
      type: "invoice",
      description: `Invoice #${(inv.id as string).slice(0, 8).toUpperCase()}${inv.note ? ` — ${inv.note}` : ""}`,
      debit, credit: 0, balance,
    });

    const sortedPayments = [...(inv.payments ?? [])].sort((a: any, b: any) =>
      new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
    );

    for (const p of sortedPayments as any[]) {
      const credit = Number(p.amount);
      balance -= credit;
      entries.push({
        date: (p.payment_date as string).slice(0, 10),
        type: "payment",
        description: `${p.payment_method}${p.note ? ` — ${p.note}` : ""}`,
        debit: 0, credit, balance,
      });
    }
  }

  const totalDebit  = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  return { patient: patient ?? { full_name: "—", phone: "—" }, entries, summary: { totalDebit, totalCredit, balance } };
}

// ─── Patient History Report ──────────────────────────────────────────────────

export async function getPatientHistoryReport(patientId: string) {
  const [
    { data: patient,       error: pErr },
    { data: appointments,  error: aErr },
    { data: visits,        error: vErr },
    { data: dentalRecords, error: dErr },
  ] = await Promise.all([
    supabase.from("patients").select("full_name, phone, date_of_birth, gender, blood_type, address").eq("id", patientId).single(),
    supabase.from("appointments").select("id, appointment_date, start_time, end_time, status, notes, doctor:profiles!doctor_id(full_name)").eq("patient_id", patientId).order("appointment_date", { ascending: false }),
    supabase.from("visits").select("id, diagnosis, treatment, notes, created_at, doctor:profiles!doctor_id(full_name)").eq("patient_id", patientId).order("created_at", { ascending: false }),
    supabase.from("dental_records").select("id, tooth_number, condition, treatment, status, created_at, doctor:profiles!doctor_id(full_name)").eq("patient_id", patientId).order("created_at", { ascending: false }),
  ]);

  if (pErr) throw new Error(pErr.message);
  if (aErr) throw new Error(aErr.message);
  if (vErr) throw new Error(vErr.message);
  if (dErr) throw new Error(dErr.message);

  return {
    patient: patient ?? { full_name: "—", phone: "—" },
    appointments: (appointments ?? []).map((a: any) => ({
      date:   a.appointment_date,
      time:   `${a.start_time}–${a.end_time}`,
      status: a.status,
      doctor: a.doctor?.full_name ?? "—",
      notes:  a.notes ?? "—",
    })),
    visits: (visits ?? []).map((v: any) => ({
      date:      v.created_at?.slice(0, 10),
      diagnosis: v.diagnosis ?? "—",
      treatment: v.treatment ?? "—",
      notes:     v.notes ?? "—",
      doctor:    v.doctor?.full_name ?? "—",
    })),
    dentalRecords: (dentalRecords ?? []).map((d: any) => ({
      date:      d.created_at?.slice(0, 10),
      tooth:     d.tooth_number,
      condition: d.condition ?? "—",
      treatment: d.treatment ?? "—",
      status:    d.status,
      doctor:    d.doctor?.full_name ?? "—",
    })),
  };
}
