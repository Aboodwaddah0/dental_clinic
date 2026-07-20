import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, FileSpreadsheet, FileText, Download, TrendingUp, Users, Receipt, Clock, BookOpen, List } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Legend as PieLegend,
} from "recharts";
import { listPatients } from "../api/patients";
import {
  getFinancialReport, getPaymentsReport, getPatientPaymentsReport, getPatientHistoryReport, getAccountStatementReport, getAllPatientsStatement,
  type FinancialReportData, type PaymentRow, type PatientPaymentsReportData, type PatientHistoryReportData, type AccountStatementReportData, type AllPatientsStatementData,
} from "../api/reports";
import { exportToCSV, exportToExcel, exportToPDF } from "../lib/export";
import { formatCurrency } from "../lib/format";
import type { Patient } from "../types";

type ReportType = "financial" | "payments" | "patientPayments" | "patientHistory" | "accountStatement" | "allPatientsStatement";
type Status = "idle" | "loading" | "ready" | "error";

const PIE_COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Reports() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [selected, setSelected] = useState<ReportType>("financial");
  const [status, setStatus] = useState<Status>("idle");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [method, setMethod] = useState("");
  const [patientId, setPatientId] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);

  const [financialData, setFinancialData] = useState<FinancialReportData | null>(null);
  const [paymentsData, setPaymentsData] = useState<PaymentRow[] | null>(null);
  const [patientPaymentsData, setPatientPaymentsData] = useState<PatientPaymentsReportData | null>(null);
  const [patientHistoryData, setPatientHistoryData] = useState<PatientHistoryReportData | null>(null);
  const [accountStatementData, setAccountStatementData] = useState<AccountStatementReportData | null>(null);
  const [allPatientsData, setAllPatientsData] = useState<AllPatientsStatementData | null>(null);

  useEffect(() => {
    listPatients({ search: "" }).then((res) => setPatients(res.data ?? [])).catch(() => {});
  }, []);

  const needsPatient = selected === "patientPayments" || selected === "patientHistory" || selected === "accountStatement";
  const needsNoFilter = selected === "allPatientsStatement";

  async function generate() {
    if (needsPatient && !patientId) {
      toast.error(t("reports.filters.patient"));
      return;
    }
    setStatus("loading");
    try {
      if (selected === "financial") {
        const res = await getFinancialReport({ from: from || undefined, to: to || undefined });
        setFinancialData(res.data);
      } else if (selected === "payments") {
        const res = await getPaymentsReport({ from: from || undefined, to: to || undefined, method: method || undefined });
        setPaymentsData(res.data);
      } else if (selected === "patientPayments") {
        const res = await getPatientPaymentsReport(patientId);
        setPatientPaymentsData(res.data);
      } else if (selected === "patientHistory") {
        const res = await getPatientHistoryReport(patientId);
        setPatientHistoryData(res.data);
      } else if (selected === "accountStatement") {
        const res = await getAccountStatementReport(patientId);
        setAccountStatementData(res.data);
      } else {
        const res = await getAllPatientsStatement();
        setAllPatientsData(res.data);
      }
      setStatus("ready");
    } catch {
      setStatus("error");
      toast.error("Failed to generate report");
    }
  }

  function handleTypeSelect(type: ReportType) {
    setSelected(type);
    setStatus("idle");
  }

  // ── Export helpers ───────────────────────────────────────────────────────────
  function doExport(fmt: "excel" | "pdf" | "csv") {
    const fn = fmt === "excel" ? exportToExcel : fmt === "pdf" ? exportToPDF : exportToCSV;

    if (selected === "financial" && financialData) {
      const headers = [t("reports.financial.monthlyBreakdown"), t("reports.payments.colAmount"), t("reports.financial.totalCollected")];
      const rows = financialData.monthly.map((m) => [m.month, m.billed, m.collected]);
      if (fmt === "excel") exportToExcel("financial-report", "Monthly", headers, rows);
      else if (fmt === "pdf") exportToPDF("financial-report", t("reports.types.financial.title"), headers, rows, isAr);
      else exportToCSV("financial-report", headers, rows);
      return;
    }

    if (selected === "payments" && paymentsData) {
      const headers = [t("reports.payments.colPatient"), t("reports.payments.colAmount"), t("reports.payments.colMethod"), t("reports.payments.colDate")];
      const rows = paymentsData.map((r) => [r.patient_name, formatCurrency(r.amount), r.method, r.date]);
      if (fmt === "excel") exportToExcel("payments-report", "Payments", headers, rows);
      else if (fmt === "pdf") exportToPDF("payments-report", t("reports.types.payments.title"), headers, rows, isAr);
      else exportToCSV("payments-report", headers, rows);
      return;
    }

    if (selected === "patientPayments" && patientPaymentsData) {
      const headers = [t("reports.patientPayments.colInvoice"), t("reports.patientPayments.colTotal"), t("reports.patientPayments.colPaid"), t("reports.patientPayments.colRemaining"), t("reports.patientPayments.colStatus")];
      const rows = patientPaymentsData.invoices.map((inv, i) => [`#${i + 1}`, formatCurrency(inv.total), formatCurrency(inv.paid), formatCurrency(inv.remaining), inv.status]);
      const ppTitle = `${t("reports.types.patientPayments.title")} — ${patientPaymentsData.patient.full_name}`;
      if (fmt === "excel") exportToExcel("patient-payments", "Invoices", headers, rows);
      else if (fmt === "pdf") exportToPDF("patient-payments", ppTitle, headers, rows, isAr);
      else exportToCSV("patient-payments", headers, rows);
      return;
    }

    if (selected === "patientHistory" && patientHistoryData) {
      const headers = [t("reports.patientHistory.colDate"), t("reports.patientHistory.colDoctor"), t("reports.patientHistory.colDiagnosis"), t("reports.patientHistory.colTreatment"), t("reports.patientHistory.colNotes")];
      const rows = patientHistoryData.visits.map((v) => [v.date, v.doctor, v.diagnosis, v.treatment, v.notes]);
      const phTitle = `${t("reports.types.patientHistory.title")} — ${patientHistoryData.patient.full_name}`;
      if (fmt === "excel") exportToExcel("patient-history", "Visits", headers, rows);
      else if (fmt === "pdf") exportToPDF("patient-history", phTitle, headers, rows, isAr);
      else exportToCSV("patient-history", headers, rows);
    }

    if (selected === "allPatientsStatement" && allPatientsData) {
      const headers = [
        t("patients.form.fullName"), t("patients.form.phone"),
        t("reports.allPatients.colBilled"), t("reports.allPatients.colPaid"), t("reports.allPatients.colOutstanding"),
      ];
      const rows = allPatientsData.rows.map((r) => [r.full_name, r.phone, formatCurrency(r.billed), formatCurrency(r.paid), formatCurrency(r.outstanding)]);
      if (fmt === "excel") exportToExcel("all-patients-statement", "Balances", headers, rows);
      else if (fmt === "pdf") exportToPDF("all-patients-statement", t("reports.types.allPatientsStatement.title"), headers, rows, isAr);
      else exportToCSV("all-patients-statement", headers, rows);
      return;
    }

    if (selected === "accountStatement" && accountStatementData) {
      const headers = [t("reports.accountStatement.colDate"), t("reports.accountStatement.colDesc"), t("reports.accountStatement.colDebit"), t("reports.accountStatement.colCredit"), t("reports.accountStatement.colBalance")];
      const rows = accountStatementData.entries.map((e) => [e.date, e.description, e.debit ? formatCurrency(e.debit) : "—", e.credit ? formatCurrency(e.credit) : "—", formatCurrency(e.balance)]);
      const asTitle = `${t("reports.types.accountStatement.title")} — ${accountStatementData.patient.full_name}`;
      if (fmt === "excel") exportToExcel("account-statement", "Statement", headers, rows);
      else if (fmt === "pdf") exportToPDF("account-statement", asTitle, headers, rows, isAr);
      else exportToCSV("account-statement", headers, rows);
    }
  }

  const reportTypes: { key: ReportType; icon: React.ElementType; color: string }[] = [
    { key: "financial",        icon: TrendingUp, color: "text-emerald-500" },
    { key: "payments",         icon: Receipt,    color: "text-sky-500"     },
    { key: "patientPayments",  icon: Users,      color: "text-violet-500"  },
    { key: "patientHistory",   icon: Clock,      color: "text-amber-500"   },
    { key: "accountStatement",     icon: BookOpen, color: "text-rose-500"   },
    { key: "allPatientsStatement", icon: List,     color: "text-indigo-500" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> {t("reports.title")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t("reports.subtitle")}</p>
      </div>

      {/* Report type cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {reportTypes.map(({ key, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => handleTypeSelect(key)}
            className={`rounded-xl border p-4 text-start transition-all ${
              selected === key
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            <div className="font-medium text-sm leading-tight">{t(`reports.types.${key}.title`)}</div>
            <div className="text-xs text-muted-foreground mt-1 leading-snug">{t(`reports.types.${key}.desc`)}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h2 className="font-semibold text-sm">{t("reports.filters.from")} / {t("reports.filters.to")}</h2>
        <div className="flex flex-wrap gap-3">
          {!needsPatient && !needsNoFilter && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{t("reports.filters.from")}</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{t("reports.filters.to")}</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </>
          )}
          {needsNoFilter && (
            <p className="text-sm text-muted-foreground self-center">{t("reports.allPatients.noFiltersNote")}</p>
          )}

          {selected === "payments" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("reports.filters.method")}</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">{t("reports.filters.allMethods")}</option>
                <option value="cash">{t("common.paymentMethod.cash")}</option>
                <option value="card">{t("common.paymentMethod.card")}</option>
                <option value="transfer">{t("common.paymentMethod.transfer")}</option>
              </select>
            </div>
          )}

          {needsPatient && (
            <div className="flex flex-col gap-1 min-w-[220px]">
              <label className="text-xs text-muted-foreground">{t("reports.filters.patient")}</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">— {t("reports.filters.patient")} —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={generate}
              disabled={status === "loading"}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {status === "loading" ? t("reports.loading") : t("reports.generate")}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {status === "loading" && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {status === "error" && (
        <div className="text-center py-10 text-destructive">{t("common.noData")}</div>
      )}

      {status === "ready" && (
        <div className="space-y-4">
          {/* Download buttons */}
          <div className="flex gap-2 justify-end flex-wrap">
            <button onClick={() => doExport("excel")}
              className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> {t("reports.download.excel")}
            </button>
            <button onClick={() => doExport("pdf")}
              className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors">
              <FileText className="w-4 h-4 text-rose-500" /> {t("reports.download.pdf")}
            </button>
            <button onClick={() => doExport("csv")}
              className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors">
              <Download className="w-4 h-4 text-sky-500" /> {t("reports.download.csv")}
            </button>
          </div>

          {/* Financial report */}
          {selected === "financial" && financialData && (
            <div className="space-y-4">
              <ReportHeader from={from} to={to} isAr={isAr} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: t("reports.financial.totalBilled"),     value: formatCurrency(financialData.summary.totalBilled),    color: "" },
                  { label: t("reports.financial.totalCollected"),  value: formatCurrency(financialData.summary.totalCollected), color: "text-emerald-600" },
                  { label: t("reports.financial.outstanding"),     value: formatCurrency(financialData.summary.outstanding),    color: "text-amber-600" },
                  { label: t("reports.financial.invoiceCount"),    value: String(financialData.summary.invoiceCount),           color: "" },
                  { label: t("reports.financial.totalExpenses"),   value: formatCurrency(financialData.summary.totalExpenses),  color: "text-destructive" },
                  { label: t("reports.financial.netProfit"),       value: formatCurrency(financialData.summary.netProfit),      color: financialData.summary.netProfit >= 0 ? "text-emerald-600" : "text-destructive" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-4">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
                  </div>
                ))}
              </div>

              {financialData.monthly.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-4">{t("reports.financial.monthlyBreakdown")}</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={financialData.monthly}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="billed"    name={t("reports.financial.totalBilled")}    fill="#0ea5e9" radius={[3,3,0,0]} />
                      <Bar dataKey="collected" name={t("reports.financial.totalCollected")} fill="#22c55e" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {financialData.byMethod.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-4">{t("reports.financial.byMethod")}</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={financialData.byMethod} dataKey="amount" nameKey="method" cx="50%" cy="45%" outerRadius={90} innerRadius={45}>
                        {financialData.byMethod.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(label) => t(`common.paymentMethod.${label}`) || label} />
                      <PieLegend formatter={(value) => t(`common.paymentMethod.${value}`) || value} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {financialData.expensesByCategory?.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-4">{t("reports.financial.expensesByCategory")}</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={financialData.expensesByCategory} dataKey="amount" nameKey="category" cx="50%" cy="45%" outerRadius={90} innerRadius={45}>
                        {financialData.expensesByCategory.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(label) => t(`expenses.categories.${label}`) || label} />
                      <PieLegend formatter={(value) => t(`expenses.categories.${value}`) || value} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Payments report */}
          {selected === "payments" && paymentsData && (
            <div className="space-y-4">
            <ReportHeader from={from} to={to} method={method} isAr={isAr} />
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {paymentsData.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">{t("reports.noData")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/40">
                      <tr>
                        {["colPatient","colAmount","colMethod","colDate"].map((k) => (
                          <th key={k} className="px-4 py-3 text-start font-medium">{t(`reports.payments.${k}`)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsData.map((row) => (
                        <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3">{row.patient_name}</td>
                          <td className="px-4 py-3 font-medium">{formatCurrency(row.amount)}</td>
                          <td className="px-4 py-3">{t(`common.paymentMethod.${row.method}`) || row.method}</td>
                          <td className="px-4 py-3">{row.date ? new Date(row.date).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </div>
          )}

          {/* Patient payments report */}
          {selected === "patientPayments" && patientPaymentsData && (
            <div className="space-y-4">
              {/* Patient info header */}
              <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-6">
                <div>
                  <div className="text-xs text-muted-foreground">{t("patients.form.fullName")}</div>
                  <div className="font-semibold mt-0.5">{patientPaymentsData.patient.full_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("patients.form.phone")}</div>
                  <div className="font-semibold mt-0.5">{patientPaymentsData.patient.phone || "—"}</div>
                </div>
                <div className="ms-auto text-xs text-muted-foreground self-end">
                  {new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t("billing.totalBilled"),     value: formatCurrency(patientPaymentsData.summary.totalBilled) },
                  { label: t("billing.totalCollected"),  value: formatCurrency(patientPaymentsData.summary.totalPaid) },
                  { label: t("billing.outstanding"),     value: formatCurrency(patientPaymentsData.summary.outstanding) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-4">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="text-xl font-bold mt-1">{value}</div>
                  </div>
                ))}
              </div>
              {patientPaymentsData.invoices.map((inv, i) => (
                <div key={inv.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center gap-3">
                    <span className="font-semibold text-sm">{t("patientDetail.billing.invoice")} #{i + 1}</span>
                    <span className="text-xs text-muted-foreground">{t("billing.columns.total")}: {formatCurrency(inv.total)}</span>
                    <span className="text-xs text-muted-foreground">{t("billing.columns.paid")}: {formatCurrency(inv.paid)}</span>
                    <span className={`ms-auto text-xs font-medium px-2 py-0.5 rounded-full ${inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : inv.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{t(`common.invoiceStatus.${inv.status}`)}</span>
                  </div>
                  {inv.payments.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">{t("patientDetail.billing.noPayments")}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        {["colAmount","colMethod","colDate"].map((k) => (
                          <th key={k} className="px-4 py-2 text-start font-medium text-xs text-muted-foreground">{t(`reports.patientPayments.${k}`)}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {inv.payments.map((p) => (
                          <tr key={p.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-2">{formatCurrency(p.amount)}</td>
                            <td className="px-4 py-2">{t(`common.paymentMethod.${p.method}`) || p.method}</td>
                            <td className="px-4 py-2">{p.date ? new Date(p.date).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* All patients statement */}
          {selected === "allPatientsStatement" && allPatientsData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t("reports.allPatients.totalBilled"),      value: formatCurrency(allPatientsData.summary.totalBilled) },
                  { label: t("reports.allPatients.totalPaid"),        value: formatCurrency(allPatientsData.summary.totalPaid),        color: "text-emerald-600" },
                  { label: t("reports.allPatients.totalOutstanding"), value: formatCurrency(allPatientsData.summary.totalOutstanding), color: "text-amber-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-4">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className={`text-xl font-bold mt-1 ${color ?? ""}`}>{value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {allPatientsData.rows.length === 0 ? (
                  <p className="text-center py-10 text-muted-foreground">{t("reports.noData")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border bg-muted/40">
                        <tr>
                          <th className="px-4 py-3 text-start font-medium">{t("patients.form.fullName")}</th>
                          <th className="px-4 py-3 text-start font-medium">{t("patients.form.phone")}</th>
                          <th className="px-4 py-3 text-start font-medium">{t("reports.allPatients.colBilled")}</th>
                          <th className="px-4 py-3 text-start font-medium">{t("reports.allPatients.colPaid")}</th>
                          <th className="px-4 py-3 text-start font-medium">{t("reports.allPatients.colOutstanding")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allPatientsData.rows.map((row) => (
                          <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{row.full_name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{row.phone}</td>
                            <td className="px-4 py-3">{formatCurrency(row.billed)}</td>
                            <td className="px-4 py-3 text-emerald-600 font-medium">{formatCurrency(row.paid)}</td>
                            <td className={`px-4 py-3 font-semibold ${row.outstanding > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                              {formatCurrency(row.outstanding)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account statement report */}
          {selected === "accountStatement" && accountStatementData && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-6">
                <div>
                  <div className="text-xs text-muted-foreground">{t("patients.form.fullName")}</div>
                  <div className="font-semibold mt-0.5">{accountStatementData.patient.full_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("patients.form.phone")}</div>
                  <div className="font-semibold mt-0.5">{accountStatementData.patient.phone || "—"}</div>
                </div>
                <div className="ms-auto text-xs text-muted-foreground self-end">
                  {new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t("reports.accountStatement.totalDebit"),  value: formatCurrency(accountStatementData.summary.totalDebit) },
                  { label: t("reports.accountStatement.totalCredit"), value: formatCurrency(accountStatementData.summary.totalCredit) },
                  { label: t("reports.accountStatement.balance"),     value: formatCurrency(accountStatementData.summary.balance), color: accountStatementData.summary.balance > 0 ? "text-amber-600" : "text-emerald-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-4">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className={`text-xl font-bold mt-1 ${color ?? ""}`}>{value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {accountStatementData.entries.length === 0 ? (
                  <p className="text-center py-10 text-muted-foreground">{t("reports.noData")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border bg-muted/40">
                        <tr>
                          {["colDate","colDesc","colDebit","colCredit","colBalance"].map((k) => (
                            <th key={k} className="px-4 py-3 text-start font-medium">{t(`reports.accountStatement.${k}`)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {accountStatementData.entries.map((entry, i) => (
                          <tr key={i} className={`border-b border-border last:border-0 ${entry.type === "invoice" ? "bg-sky-50/40 dark:bg-sky-950/20" : ""}`}>
                            <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{entry.date ? new Date(entry.date).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "—"}</td>
                            <td className="px-4 py-2.5">{entry.description}</td>
                            <td className="px-4 py-2.5 font-medium text-rose-600">{entry.debit ? formatCurrency(entry.debit) : "—"}</td>
                            <td className="px-4 py-2.5 font-medium text-emerald-600">{entry.credit ? formatCurrency(entry.credit) : "—"}</td>
                            <td className={`px-4 py-2.5 font-semibold ${entry.balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>{formatCurrency(entry.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patient history report */}
          {selected === "patientHistory" && patientHistoryData && (
            <div className="space-y-4">
              {/* Patient info header */}
              <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-6">
                <div>
                  <div className="text-xs text-muted-foreground">{t("patients.form.fullName")}</div>
                  <div className="font-semibold mt-0.5">{patientHistoryData.patient.full_name}</div>
                </div>
                {patientHistoryData.patient.phone && (
                  <div>
                    <div className="text-xs text-muted-foreground">{t("patients.form.phone")}</div>
                    <div className="font-semibold mt-0.5">{patientHistoryData.patient.phone}</div>
                  </div>
                )}
                {patientHistoryData.patient.date_of_birth && (
                  <div>
                    <div className="text-xs text-muted-foreground">{t("patients.form.dateOfBirth")}</div>
                    <div className="font-semibold mt-0.5">{new Date(patientHistoryData.patient.date_of_birth).toLocaleDateString(isAr ? "ar-SA" : "en-US")}</div>
                  </div>
                )}
                {patientHistoryData.patient.gender && (
                  <div>
                    <div className="text-xs text-muted-foreground">{t("patients.form.gender")}</div>
                    <div className="font-semibold mt-0.5">{t(`patients.form.${patientHistoryData.patient.gender}`) || patientHistoryData.patient.gender}</div>
                  </div>
                )}
                {patientHistoryData.patient.blood_type && (
                  <div>
                    <div className="text-xs text-muted-foreground">{t("patients.form.bloodType")}</div>
                    <div className="font-semibold mt-0.5">{patientHistoryData.patient.blood_type}</div>
                  </div>
                )}
                <div className="ms-auto text-xs text-muted-foreground self-end">
                  {new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
              {/* Appointments */}
              <Section title={t("reports.patientHistory.appointments")} count={patientHistoryData.appointments.length}>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {["colDate","colTime","colStatus","colDoctor","colNotes"].map((k) => (
                      <th key={k} className="px-4 py-2 text-start font-medium text-xs text-muted-foreground">{t(`reports.patientHistory.${k}`)}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {patientHistoryData.appointments.map((a, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-2">{a.date ? new Date(a.date).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "—"}</td>
                        <td className="px-4 py-2">{a.time}</td>
                        <td className="px-4 py-2">{t(`common.status.${a.status}`) || a.status}</td>
                        <td className="px-4 py-2">{a.doctor}</td>
                        <td className="px-4 py-2 text-muted-foreground">{a.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              {/* Visits */}
              <Section title={t("reports.patientHistory.visits")} count={patientHistoryData.visits.length}>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {["colDate","colDiagnosis","colTreatment","colDoctor","colNotes"].map((k) => (
                      <th key={k} className="px-4 py-2 text-start font-medium text-xs text-muted-foreground">{t(`reports.patientHistory.${k}`)}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {patientHistoryData.visits.map((v, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-2">{v.date ? new Date(v.date).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "—"}</td>
                        <td className="px-4 py-2">{v.diagnosis}</td>
                        <td className="px-4 py-2">{v.treatment}</td>
                        <td className="px-4 py-2">{v.doctor}</td>
                        <td className="px-4 py-2 text-muted-foreground">{v.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>

              {/* Dental records */}
              <Section title={t("reports.patientHistory.dentalRecords")} count={patientHistoryData.dentalRecords.length}>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {["colDate","colTooth","colCondition","colTreatment","colDoctor"].map((k) => (
                      <th key={k} className="px-4 py-2 text-start font-medium text-xs text-muted-foreground">{t(`reports.patientHistory.${k}`)}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {patientHistoryData.dentalRecords.map((r, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-2">{r.date ? new Date(r.date).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "—"}</td>
                        <td className="px-4 py-2">{r.tooth}</td>
                        <td className="px-4 py-2">{r.condition}</td>
                        <td className="px-4 py-2">{r.treatment || "—"}</td>
                        <td className="px-4 py-2">{r.doctor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReportHeader({ from, to, method, isAr }: { from?: string; to?: string; method?: string; isAr: boolean }) {
  const { t } = useTranslation();
  const fmt = (d: string) => new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-6 items-center">
      {(from || to) && (
        <div>
          <div className="text-xs text-muted-foreground">{t("reports.filters.from")} / {t("reports.filters.to")}</div>
          <div className="font-semibold mt-0.5">
            {from ? fmt(from) : "—"} → {to ? fmt(to) : "—"}
          </div>
        </div>
      )}
      {method && (
        <div>
          <div className="text-xs text-muted-foreground">{t("reports.filters.method")}</div>
          <div className="font-semibold mt-0.5">{t(`common.paymentMethod.${method}`)}</div>
        </div>
      )}
      <div className="ms-auto text-xs text-muted-foreground">
        {new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      {count === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">—</p>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </div>
  );
}
