import { useState } from "react";
import { useNavigate } from "react-router";
import { CreditCard, ChevronDown, ChevronUp, Plus, X, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listInvoices, addPayment, updatePayment, deletePayment, createInvoice, deleteInvoice } from "../api/invoices";
import { listPatients } from "../api/patients";
import { toast } from "sonner";
import type { Invoice } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../lib/format";

const inputCls = "w-full px-3.5 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function Billing() {
  const navigate = useNavigate();
  const { canCreate } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const qc = useQueryClient();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [editPayment, setEditPayment] = useState<{ id: string; amount: number; payment_method: "cash" | "card" | "transfer"; payment_date: string; note?: string | null } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => listInvoices({ limit: 200 }),
  });
  const invoices = (data?.data ?? []) as Invoice[];
  const filtered = invoices.filter((i) => !filterStatus || i.status === filterStatus);

  const totals = {
    total: invoices.reduce((s, i) => s + Number(i.total_amount), 0),
    paid: invoices.reduce((s, i) => s + Number(i.paid_amount), 0),
    pending: invoices.reduce((s, i) => s + (Number(i.total_amount) - Number(i.paid_amount)), 0),
  };

  const paymentMutation = useMutation({
    mutationFn: ({ invoiceId, amount, method, note }: { invoiceId: string; amount: number; method: "cash" | "card" | "transfer"; note?: string }) =>
      addPayment(invoiceId, { amount, payment_method: method, payment_date: new Date().toISOString(), note }),
    onSuccess: () => {
      toast.success(t("billing.paymentHistory"));
      setShowPaymentModal(null);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["patient-balances"] });
      qc.invalidateQueries({ queryKey: ["dashboard-invoices"] });
    },
    onError: () => toast.error(t("billing.noPayments")),
  });

  const createMutation = useMutation({
    mutationFn: ({ patient_id, total_amount, note }: { patient_id: string; total_amount: number; note?: string }) =>
      createInvoice({ patient_id, total_amount, note }),
    onSuccess: () => {
      setShowCreateModal(false);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["patient-balances"] });
      qc.invalidateQueries({ queryKey: ["dashboard-invoices"] });
    },
    onError: () => toast.error(t("billing.noInvoices")),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ amount: number; payment_method: "cash" | "card" | "transfer"; payment_date: string }> }) =>
      updatePayment(id, input),
    onSuccess: () => {
      toast.success(t("common.save"));
      setEditPayment(null);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["patient-balances"] });
    },
    onError: () => toast.error("Failed to update payment"),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      toast.success("Payment deleted");
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["patient-balances"] });
      qc.invalidateQueries({ queryKey: ["dashboard-invoices"] });
    },
    onError: () => toast.error("Failed to delete payment"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["patient-balances"] });
      qc.invalidateQueries({ queryKey: ["dashboard-invoices"] });
    },
    onError: () => toast.error(t("billing.noInvoices")),
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-foreground">{t("billing.title")}</h1>
        {canCreate() && (
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> {t("billing.newInvoice")}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("billing.totalBilled"),     value: totals.total,   color: "text-foreground" },
          { label: t("billing.totalCollected"),   value: totals.paid,    color: "text-emerald-600" },
          { label: t("billing.outstanding"),      value: totals.pending, color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <select className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">{t("billing.allInvoices")}</option>
          <option value="paid">{t("common.invoiceStatus.paid")}</option>
          <option value="partially_paid">{t("billing.filter.partiallyPaid")}</option>
          <option value="unpaid">{t("billing.filter.unpaid")}</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((inv) => {
          const remaining = Number(inv.total_amount) - Number(inv.paid_amount);
          const isOpen = expanded === inv.id;
          return (
            <div key={inv.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpanded(isOpen ? null : inv.id)}>
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("billing.columns.invoice")}</p>
                    <p className="text-sm font-semibold text-foreground truncate">{inv.id.slice(0, 8).toUpperCase()}</p>
                    {inv.note && <p className="text-xs text-muted-foreground truncate max-w-[120px]">{inv.note}</p>}
                  </div>
                  <div className="cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/patients/${inv.patient_id}`); }}>
                    <p className="text-xs text-muted-foreground">{t("billing.columns.patient")}</p>
                    <p className="text-sm font-semibold text-primary">{inv.patient_name ?? "—"}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">{t("billing.columns.total")}</p>
                    <p className="text-sm font-semibold">{formatCurrency(Number(inv.total_amount))}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">{t("billing.columns.paid")}</p>
                    <p className="text-sm font-semibold text-emerald-600">{formatCurrency(Number(inv.paid_amount))}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">{t("billing.columns.remaining")}</p>
                    <p className={`text-sm font-semibold ${remaining > 0 ? "text-amber-600" : "text-muted-foreground"}`}>{formatCurrency(remaining)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={inv.status} />
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border px-5 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-foreground">{t("billing.paymentHistory")}</h4>
                    <div className="flex items-center gap-3">
                      {canCreate() && remaining > 0 && (
                        <button className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors" onClick={() => setShowPaymentModal(inv.id)}>
                          <Plus className="w-4 h-4" /> {t("billing.addPayment")}
                        </button>
                      )}
                      {canCreate() && (
                        <button className="text-xs text-destructive hover:text-destructive/80 font-medium transition-colors" onClick={() => deleteMutation.mutate(inv.id)}>
                          {t("billing.deleteInvoice")}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4 sm:hidden">
                    <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">{t("billing.columns.total")}</p><p className="text-sm font-semibold">{formatCurrency(Number(inv.total_amount))}</p></div>
                    <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">{t("billing.columns.paid")}</p><p className="text-sm font-semibold text-emerald-600">{formatCurrency(Number(inv.paid_amount))}</p></div>
                    <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground">{t("billing.columns.due")}</p><p className="text-sm font-semibold text-amber-600">{formatCurrency(remaining)}</p></div>
                  </div>
                  {!inv.payments || inv.payments.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><AlertCircle className="w-4 h-4" />{t("billing.noPayments")}</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border">
                          {[t("billing.columns.amount"), t("billing.columns.method"), t("billing.columns.date"), t("billing.columns.note"), ""].map((h, i) => (
                            <th key={i} className="text-start pb-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody className="divide-y divide-border">
                          {inv.payments.map((p) => (
                            <tr key={p.id}>
                              <td className="py-2.5 font-semibold text-emerald-600">{formatCurrency(Number(p.amount))}</td>
                              <td className="py-2.5 text-muted-foreground">{t(`common.paymentMethod.${p.payment_method}`)}</td>
                              <td className="py-2.5 text-muted-foreground">{formatDate(p.payment_date, isAr)}</td>
                              <td className="py-2.5 text-muted-foreground text-xs">{p.note || "—"}</td>
                              {canCreate() && (
                                <td className="py-2.5">
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      className="text-muted-foreground hover:text-primary transition-colors"
                                      onClick={() => setEditPayment({ id: p.id, amount: Number(p.amount), payment_method: p.payment_method, payment_date: p.payment_date, note: p.note })}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      className="text-muted-foreground hover:text-destructive transition-colors"
                                      onClick={() => deletePaymentMutation.mutate(p.id)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground text-sm">{t("billing.noInvoices")}</div>
        )}
      </div>

      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(null)}
          onSave={(amount, method, note) => paymentMutation.mutate({ invoiceId: showPaymentModal, amount, method, note })}
          loading={paymentMutation.isPending}
        />
      )}
      {editPayment && (
        <EditPaymentModal
          payment={editPayment}
          onClose={() => setEditPayment(null)}
          onSave={(input) => updatePaymentMutation.mutate({ id: editPayment.id, input })}
          loading={updatePaymentMutation.isPending}
        />
      )}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(patient_id, total_amount, note) => createMutation.mutate({ patient_id, total_amount, note })}
          loading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function PaymentModal({ onClose, onSave, loading }: { onClose: () => void; onSave: (amount: number, method: "cash" | "card" | "transfer", note?: string) => void; loading: boolean }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{t("billing.modal.recordPayment")}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(parseFloat(amount), method, note || undefined); }} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("billing.modal.amountLabel")} <span className="text-destructive">*</span></label>
            <input required type="number" min="0.01" step="0.01" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("billing.modal.paymentMethod")}</label>
            <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="cash">{t("common.paymentMethod.cash")}</option>
              <option value="card">{t("common.paymentMethod.card")}</option>
              <option value="transfer">{t("common.paymentMethod.transfer")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("billing.columns.note")}</label>
            <input type="text" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("billing.modal.notePlaceholder")} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">{t("common.cancel")}</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors">{t("billing.modal.recordPayment")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateInvoiceModal({ onClose, onCreate, loading }: { onClose: () => void; onCreate: (patient_id: string, total_amount: number, note?: string) => void; loading: boolean }) {
  const { t } = useTranslation();
  const [patientId, setPatientId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const { data } = useQuery({ queryKey: ["patients-all"], queryFn: () => listPatients({ limit: 500 }), staleTime: 60_000 });
  const patients = data?.data ?? [];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{t("billing.modal.newInvoice")}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onCreate(patientId, parseFloat(amount), note || undefined); }} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("appointments.form.patient")} <span className="text-destructive">*</span></label>
            <select required className={inputCls} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">—</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("billing.modal.totalAmount")} <span className="text-destructive">*</span></label>
            <input required type="number" min="0.01" step="0.01" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("billing.columns.note")}</label>
            <input type="text" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("billing.modal.notePlaceholder")} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">{t("common.cancel")}</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors">{t("billing.modal.createInvoice")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPaymentModal({ payment, onClose, onSave, loading }: {
  payment: { id: string; amount: number; payment_method: "cash" | "card" | "transfer"; payment_date: string; note?: string | null };
  onClose: () => void;
  onSave: (input: { amount: number; payment_method: "cash" | "card" | "transfer"; payment_date: string; note?: string }) => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(String(payment.amount));
  const [method, setMethod] = useState(payment.payment_method);
  const [date, setDate] = useState(payment.payment_date?.slice(0, 10) ?? "");
  const [note, setNote] = useState(payment.note ?? "");

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{t("common.edit")} {t("billing.columns.amount")}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ amount: parseFloat(amount), payment_method: method, payment_date: new Date(date).toISOString(), note: note || undefined }); }} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("billing.columns.amount")} <span className="text-destructive">*</span></label>
            <input required type="number" min="0.01" step="0.01" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("billing.modal.paymentMethod")}</label>
            <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="cash">{t("common.paymentMethod.cash")}</option>
              <option value="card">{t("common.paymentMethod.card")}</option>
              <option value="transfer">{t("common.paymentMethod.transfer")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("billing.columns.date")}</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("billing.columns.note")}</label>
            <input type="text" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("billing.modal.notePlaceholder")} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">{t("common.cancel")}</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors">{t("common.save")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const { t } = useTranslation();
  if (status === "paid") return <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">{t("common.invoiceStatus.paid")}</span>;
  if (status === "partially_paid") return <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold">{t("common.invoiceStatus.partial")}</span>;
  return <span className="text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full font-semibold">{t("common.invoiceStatus.unpaid")}</span>;
}

function formatDate(d: string, isAr: boolean) {
  return new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "numeric" });
}
