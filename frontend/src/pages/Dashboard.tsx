import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useQueries } from "@tanstack/react-query";
import {
  Users, CalendarDays, Clock, CreditCard, ArrowRight,
  CheckCircle2, XCircle, Circle, UserPlus, CalendarPlus, TrendingUp,
} from "lucide-react";
import { listPatients } from "../api/patients";
import { listAppointments } from "../api/appointments";
import { listInvoices } from "../api/invoices";
import { formatCurrency } from "../lib/format";
import type { Invoice } from "../types";

const today = new Date().toISOString().split("T")[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [patientsQ, todayApptQ, upcomingQ, invoicesQ] = useQueries({
    queries: [
      { queryKey: ["dashboard-patients"], queryFn: () => listPatients({ limit: 5 }) },
      { queryKey: ["dashboard-today-appts", today], queryFn: () => listAppointments({ from: today, to: today, limit: 100 }) },
      { queryKey: ["dashboard-upcoming", tomorrow], queryFn: () => listAppointments({ from: tomorrow, status: "scheduled", limit: 1 }) },
      { queryKey: ["dashboard-invoices"], queryFn: () => listInvoices({ limit: 200 }) },
    ],
  });

  const patients = patientsQ.data?.data ?? [];
  const todayAppointments = todayApptQ.data?.data ?? [];
  const upcomingCount = upcomingQ.data?.count ?? 0;
  const pendingInvoices = ((invoicesQ.data?.data ?? []) as Invoice[]).filter((i) => i.status !== "paid");
  const pendingTotal = pendingInvoices.reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);

  const stats = [
    {
      label: t("dashboard.totalPatients"),
      value: (patientsQ.data?.count ?? patients.length).toString(),
      change: t("dashboard.thisMonth", { count: 3 }),
      icon: Users, color: "text-blue-600", bg: "bg-blue-50",
    },
    {
      label: t("dashboard.todayAppointments"),
      value: todayAppointments.length.toString(),
      change: t("dashboard.completedCount", { count: todayAppointments.filter((a) => a.status === "completed").length }),
      icon: CalendarDays, color: "text-primary", bg: "bg-secondary",
    },
    {
      label: t("dashboard.upcoming"),
      value: upcomingCount.toString(),
      change: t("dashboard.nextDays"),
      icon: Clock, color: "text-violet-600", bg: "bg-violet-50",
    },
    {
      label: t("dashboard.pendingPayments"),
      value: formatCurrency(pendingTotal),
      change: t("dashboard.invoices", { count: pendingInvoices.length }),
      icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, change, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-medium">{label}</p>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">{t("dashboard.todaysAppointments")}</h2>
            <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1" onClick={() => navigate("/appointments")}>
              {t("common.viewAll")} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {todayAppointments.length === 0 ? (
            <div className="px-5 py-10 text-center text-muted-foreground text-sm">{t("dashboard.noAppointmentsToday")}</div>
          ) : (
            <ul className="divide-y divide-border">
              {todayAppointments.map((appt) => (
                <li key={appt.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/patients/${appt.patient_id}`)}>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                    {(appt.patient_name ?? "").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{appt.patient_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{appt.notes}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-end">
                      <p className="text-xs font-semibold text-foreground">{appt.start_time}</p>
                      <p className="text-xs text-muted-foreground">{appt.end_time}</p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card rounded-xl border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">{t("dashboard.recentPatients")}</h2>
              <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1" onClick={() => navigate("/patients")}>
                {t("common.viewAll")} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <ul className="divide-y divide-border">
              {patients.map((patient) => (
                <li key={patient.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/patients/${patient.id}`)}>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                    {patient.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{patient.full_name}</p>
                    <p className="text-xs text-muted-foreground">{patient.phone}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-3">{t("dashboard.quickActions")}</h2>
            <div className="space-y-2">
              <QuickAction icon={UserPlus} label={t("dashboard.addNewPatient")} onClick={() => navigate("/patients?new=true")} />
              <QuickAction icon={CalendarPlus} label={t("dashboard.bookAppointment")} onClick={() => navigate("/appointments?new=true")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === "completed") return <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium"><CheckCircle2 className="w-3 h-3" /> {t("common.status.completed")}</span>;
  if (status === "cancelled") return <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium"><XCircle className="w-3 h-3" /> {t("common.status.cancelled")}</span>;
  return <span className="flex items-center gap-1 text-xs text-primary bg-secondary px-2 py-0.5 rounded-full font-medium"><Circle className="w-3 h-3" /> {t("common.status.scheduled")}</span>;
}

function QuickAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-secondary/50 transition-colors text-start group">
      <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
    </button>
  );
}
