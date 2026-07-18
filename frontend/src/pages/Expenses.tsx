import { useState } from "react";
import { Receipt, Plus, X, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listExpenses, createExpense, updateExpense, deleteExpense } from "../api/expenses";
import type { Expense, ExpenseCategory, CreateExpenseInput } from "../api/expenses";
import { useAuth } from "../contexts/AuthContext";
import { formatCurrency } from "../lib/format";

const inputCls = "w-full px-3.5 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const CATEGORIES: ExpenseCategory[] = ["supplies", "salaries", "rent", "utilities", "equipment", "other"];

function formatDate(d: string, isAr: boolean) {
  return new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Expenses() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { canCreate } = useAuth();
  const qc = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + "01";

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo]     = useState(today);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "">("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Expense | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", from, to, filterCategory],
    queryFn: () => listExpenses({ from, to, category: filterCategory || undefined, limit: 200 }),
  });

  const expenses = (data?.data ?? []) as Expense[];
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const byCategory = CATEGORIES.map((cat) => ({
    cat,
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
  })).filter((c) => c.total > 0);

  const createMutation = useMutation({
    mutationFn: (input: CreateExpenseInput) => createExpense(input),
    onSuccess: () => {
      toast.success(t("expenses.created"));
      setShowModal(false);
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => toast.error(t("expenses.error")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateExpenseInput> }) => updateExpense(id, input),
    onSuccess: () => {
      toast.success(t("expenses.updated"));
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => toast.error(t("expenses.error")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      toast.success(t("expenses.deleted"));
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => toast.error(t("expenses.error")),
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-foreground">{t("expenses.title")}</h1>
        {canCreate() && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> {t("expenses.addExpense")}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("reports.filters.from")}</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("reports.filters.to")}</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("expenses.category")}</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | "")}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">{t("expenses.allCategories")}</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{t(`expenses.categories.${c}`)}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{t("expenses.totalExpenses")}</p>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(total)}</p>
          <p className="text-xs text-muted-foreground mt-1">{expenses.length} {t("expenses.records")}</p>
        </div>
        {byCategory.map(({ cat, total: catTotal }) => (
          <div key={cat} className="bg-card rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{t(`expenses.categories.${cat}`)}</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(catTotal)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">{t("expenses.noExpenses")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[t("expenses.columns.date"), t("expenses.columns.category"), t("expenses.columns.description"), t("expenses.columns.amount"), t("common.actions")].map((h) => (
                    <th key={h} className="text-start px-5 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{formatDate(e.expense_date, isAr)}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">
                        {t(`expenses.categories.${e.category}`)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-foreground max-w-xs truncate">{e.description}</td>
                    <td className="px-5 py-3 font-semibold text-destructive whitespace-nowrap">{formatCurrency(Number(e.amount))}</td>
                    <td className="px-5 py-3">
                      {canCreate() && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditing(e)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteMutation.mutate(e.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ExpenseModal
          onClose={() => setShowModal(false)}
          onSave={(input) => createMutation.mutate(input)}
          loading={createMutation.isPending}
        />
      )}
      {editing && (
        <ExpenseModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(input) => updateMutation.mutate({ id: editing.id, input })}
          loading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function ExpenseModal({ initial, onClose, onSave, loading }: {
  initial?: Expense;
  onClose: () => void;
  onSave: (input: CreateExpenseInput) => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);

  const [category, setCategory]       = useState<ExpenseCategory>(initial?.category ?? "other");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount]           = useState(initial ? String(initial.amount) : "");
  const [date, setDate]               = useState(initial?.expense_date ?? today);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ category, description, amount: parseFloat(amount), expense_date: date });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">
              {initial ? t("expenses.editExpense") : t("expenses.addExpense")}
            </h3>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("expenses.category")} <span className="text-destructive">*</span></label>
            <select required className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t(`expenses.categories.${c}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("expenses.description")} <span className="text-destructive">*</span></label>
            <input required type="text" className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("expenses.descriptionPlaceholder")} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("expenses.amount")} <span className="text-destructive">*</span></label>
            <input required type="number" min="0.01" step="0.01" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("expenses.date")}</label>
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">{t("common.cancel")}</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {loading ? t("common.loading") : initial ? t("common.save") : t("expenses.addExpense")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
