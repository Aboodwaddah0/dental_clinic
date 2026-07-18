import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BellRing, Check, Clock, X, Loader2 } from "lucide-react";
import { listReminders } from "../api/reminders";
import type { ReminderEntry } from "../api/reminders";

function StatusBadge({ status, error }: { status: ReminderEntry["reminder_status"]; error: string | null }) {
  const { t } = useTranslation();
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    pending: {
      label: t("reminders.status.pending"),
      cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: <Clock className="w-3 h-3" />,
    },
    sent: {
      label: t("reminders.status.sent"),
      cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      icon: <Check className="w-3 h-3" />,
    },
    failed: {
      label: t("reminders.status.failed"),
      cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: <X className="w-3 h-3" />,
    },
    skipped: {
      label: t("reminders.status.skipped"),
      cls: "bg-muted text-muted-foreground",
      icon: null,
    },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      title={status === "failed" && error ? error : undefined}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

export default function Reminders() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["reminders"],
    queryFn: listReminders,
    refetchInterval: 30_000,
  });

  const rows = data?.data ?? [];
  const pendingCount = rows.filter((r) => r.reminder_status === "pending").length;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BellRing className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">{t("reminders.title")}</h1>
        {pendingCount > 0 && (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-semibold rounded-full">
            {pendingCount} {t("reminders.pending")}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("reminders.totalUpcoming"), value: rows.length, color: "text-foreground" },
          { label: t("reminders.status.pending"), value: pendingCount, color: "text-yellow-600" },
          { label: t("reminders.status.sent"), value: rows.filter((r) => r.reminder_status === "sent").length, color: "text-emerald-600" },
          { label: t("reminders.status.failed"), value: rows.filter((r) => r.reminder_status === "failed").length, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("common.loading")}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <BellRing className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">{t("reminders.noUpcoming")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {[
                    t("reminders.columns.patient"),
                    t("reminders.columns.phone"),
                    t("reminders.columns.date"),
                    t("reminders.columns.time"),
                    t("reminders.columns.status"),
                  ].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{row.patient_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.patient_phone ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.appointment_date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.start_time.slice(0, 5)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.reminder_status} error={row.reminder_error} />
                      {row.reminded_at && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(row.reminded_at).toLocaleTimeString()}
                        </p>
                      )}
                      {row.reminder_status === "failed" && row.reminder_error && (
                        <p className="text-xs text-destructive mt-0.5 max-w-[200px] truncate" title={row.reminder_error}>
                          {row.reminder_error}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
