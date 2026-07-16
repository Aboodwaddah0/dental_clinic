import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CreditCard, ChevronDown, ChevronUp, Plus, X, AlertCircle } from "lucide-react";
import { listInvoices, addPayment } from "../api/invoices";
import { toast } from "sonner";
import type { Invoice, Payment } from "../types";
import { useAuth } from "../contexts/AuthContext";

export default function Billing() {
  const navigate = useNavigate();
  const { canCreate } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    listInvoices({ limit: 100 }).then(({ data }) => setInvoices(data as Invoice[])).catch(() => toast.error("Failed to load invoices"));
  }, []);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);

  const filtered = invoices.filter((i) => !filterStatus || i.status === filterStatus);

  const totals = {
    total: invoices.reduce((s, i) => s + i.total_amount, 0),
    paid: invoices.reduce((s, i) => s + i.paid_amount, 0),
    pending: invoices.reduce((s, i) => s + (i.total_amount - i.paid_amount), 0),
  };

  const handleAddPayment = async (invoiceId: string, payment: Omit<Payment, "id" | "invoice_id">) => {
    try {
      const { data: updated } = await addPayment(invoiceId, {
        amount: payment.amount,
        payment_method: payment.payment_method,
        date: payment.date,
      });
      setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? updated : inv)));
      toast.success("Payment recorded");
    } catch {
      toast.error("Failed to record payment");
    }
    setShowPaymentModal(null);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-foreground">Billing</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Billed", value: totals.total, color: "text-foreground" },
          { label: "Total Collected", value: totals.paid, color: "text-emerald-600" },
          { label: "Outstanding", value: totals.pending, color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>${value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All invoices</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Invoice list */}
      <div className="space-y-3">
        {filtered.map((inv) => {
          const remaining = inv.total_amount - inv.paid_amount;
          const isOpen = expanded === inv.id;

          return (
            <div key={inv.id} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Invoice row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(isOpen ? null : inv.id)}
              >
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>

                <div
                  className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-3 items-center"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice</p>
                    <p className="text-sm font-semibold text-foreground">{inv.id.toUpperCase()}</p>
                  </div>
                  <div
                    className="cursor-pointer hover:underline"
                    onClick={(e) => { e.stopPropagation(); navigate(`/patients/${inv.patient_id}`); }}
                  >
                    <p className="text-xs text-muted-foreground">Patient</p>
                    <p className="text-sm font-semibold text-primary">{inv.patient_name}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-sm font-semibold">${inv.total_amount.toLocaleString()}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-sm font-semibold text-emerald-600">${inv.paid_amount.toLocaleString()}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className={`text-sm font-semibold ${remaining > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                      ${remaining.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={inv.status} />
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded payment history */}
              {isOpen && (
                <div className="border-t border-border px-5 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-foreground">Payment History</h4>
                    {canCreate() && remaining > 0 && (
                      <button
                        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        onClick={() => setShowPaymentModal(inv.id)}
                      >
                        <Plus className="w-4 h-4" /> Add Payment
                      </button>
                    )}
                  </div>

                  {/* Invoice summary on mobile */}
                  <div className="grid grid-cols-3 gap-3 mb-4 sm:hidden">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-sm font-semibold">${inv.total_amount.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="text-sm font-semibold text-emerald-600">${inv.paid_amount.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Due</p>
                      <p className="text-sm font-semibold text-amber-600">${remaining.toLocaleString()}</p>
                    </div>
                  </div>

                  {inv.payments.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <AlertCircle className="w-4 h-4" />
                      No payments recorded for this invoice.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            {["Amount", "Method", "Date", "Received By"].map((h) => (
                              <th key={h} className="text-left pb-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {inv.payments.map((p) => (
                            <tr key={p.id}>
                              <td className="py-2.5 font-semibold text-emerald-600">${p.amount.toLocaleString()}</td>
                              <td className="py-2.5 capitalize text-muted-foreground">{p.payment_method}</td>
                              <td className="py-2.5 text-muted-foreground">{formatDate(p.date)}</td>
                              <td className="py-2.5 text-muted-foreground">{p.received_by}</td>
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
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground text-sm">
            No invoices found.
          </div>
        )}
      </div>

      {showPaymentModal && (
        <PaymentModal
          invoiceId={showPaymentModal}
          onClose={() => setShowPaymentModal(null)}
          onSave={(p) => handleAddPayment(showPaymentModal, p)}
        />
      )}
    </div>
  );
}

function PaymentModal({
  invoiceId,
  onClose,
  onSave,
}: {
  invoiceId: string;
  onClose: () => void;
  onSave: (p: Omit<Payment, "id" | "invoice_id">) => void;
}) {
  const [form, setForm] = useState({
    amount: "",
    payment_method: "cash" as Payment["payment_method"],
    date: new Date().toISOString().split("T")[0],
    received_by: "Dr. Sarah Mitchell",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, amount: parseFloat(form.amount) });
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Record Payment — {invoiceId.toUpperCase()}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Amount ($) <span className="text-destructive">*</span></label>
            <input
              required
              type="number"
              min="1"
              step="0.01"
              className={inputCls}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Payment Method</label>
            <select
              className={inputCls}
              value={form.payment_method}
              onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value as Payment["payment_method"] }))}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Date</label>
            <input
              type="date"
              className={inputCls}
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  if (status === "paid") return <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">Paid</span>;
  if (status === "partial") return <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold">Partial</span>;
  return <span className="text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full font-semibold">Pending</span>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
