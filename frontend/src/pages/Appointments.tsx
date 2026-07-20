import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Plus, X, CheckCircle2, XCircle, Circle, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Appointment } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { listAppointments, updateAppointment } from "../api/appointments";
import { listPatients } from "../api/patients";
import AppointmentForm from "../components/AppointmentForm";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Skeleton } from "../app/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../app/components/ui/select";

const today = new Date().toISOString().split("T")[0];

export default function Appointments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canCreate } = useAuth();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const qc = useQueryClient();

  const [filter, setFilter] = useState({ status: "", from: "", to: "" });
  const [showForm, setShowForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() };
  });

  useEffect(() => {
    if (searchParams.get("new") === "true") { setShowForm(true); setSearchParams({}); }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", filter],
    queryFn: () => listAppointments({
      status: (filter.status || undefined) as Appointment["status"] | undefined,
      from: filter.from || undefined,
      to: filter.to || undefined,
      limit: 100,
    }),
  });

  const calFrom = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-01`;
  const calTo   = new Date(calMonth.year, calMonth.month + 1, 0).toISOString().split("T")[0];
  const { data: calData } = useQuery({
    queryKey: ["appointments-cal", calMonth.year, calMonth.month],
    queryFn: () => listAppointments({ from: calFrom, to: calTo, limit: 500 }),
    staleTime: 30_000,
  });

  const calDotMap = useMemo(() => {
    const map: Record<string, { scheduled: number; completed: number; cancelled: number }> = {};
    for (const a of calData?.data ?? []) {
      if (!map[a.appointment_date]) map[a.appointment_date] = { scheduled: 0, completed: 0, cancelled: 0 };
      map[a.appointment_date][a.status as "scheduled" | "completed" | "cancelled"]++;
    }
    return map;
  }, [calData]);

  const { data: patientsData } = useQuery({
    queryKey: ["patients-all"],
    queryFn: () => listPatients({ limit: 500 }),
    staleTime: 60_000,
  });
  const patientsById = Object.fromEntries((patientsData?.data ?? []).map((p) => [p.id, p]));

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "completed" | "cancelled" }) =>
      updateAppointment(id, { status }),
    onSuccess: (_, { status }) => {
      toast.success(status === "cancelled" ? "Appointment cancelled" : "Appointment marked completed");
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["dashboard-today-appts"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update appointment"),
  });

  const appointments = data?.data ?? [];
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.appointment_date + "T" + a.start_time).getTime() - new Date(b.appointment_date + "T" + b.start_time).getTime()
  );
  const grouped: Record<string, Appointment[]> = {};
  sorted.forEach((a) => { if (!grouped[a.appointment_date]) grouped[a.appointment_date] = []; grouped[a.appointment_date].push(a); });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("appointments.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("appointments.count", { count: appointments.length })}</p>
        </div>
        {canCreate() && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> {t("appointments.newAppointment")}
          </Button>
        )}
      </div>

      {/* Calendar */}
      <div className="mb-4">
        <button
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-2 transition-colors"
          onClick={() => setShowCalendar((v) => !v)}
        >
          <CalendarDays className="w-4 h-4" />
          {showCalendar ? t("appointments.hideCalendar") : t("appointments.showCalendar")}
        </button>
        <AnimatePresence initial={false}>
          {showCalendar && (
            <motion.div
              key="cal"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CalendarView
                year={calMonth.year}
                month={calMonth.month}
                dotMap={calDotMap}
                selectedDate={filter.from === filter.to ? filter.from : ""}
                today={today}
                isAr={isAr}
                onPrev={() => setCalMonth((m) => {
                  const d = new Date(m.year, m.month - 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })}
                onNext={() => setCalMonth((m) => {
                  const d = new Date(m.year, m.month + 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })}
                onDayClick={(date) => {
                  setFilter((f) => f.from === date && f.to === date
                    ? { ...f, from: "", to: "" }
                    : { ...f, from: date, to: date }
                  );
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={filter.status || "all"} onValueChange={(v) => setFilter((f) => ({ ...f, status: v === "all" ? "" : v }))}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t("appointments.allStatuses")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("appointments.allStatuses")}</SelectItem>
            <SelectItem value="scheduled">{t("common.status.scheduled")}</SelectItem>
            <SelectItem value="completed">{t("common.status.completed")}</SelectItem>
            <SelectItem value="cancelled">{t("common.status.cancelled")}</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-auto" value={filter.from} onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))} aria-label={t("appointments.fromDate")} />
        <Input type="date" className="w-auto" value={filter.to} onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))} aria-label={t("appointments.toDate")} />
        {(filter.status || filter.from || filter.to) && (
          <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1" onClick={() => setFilter({ status: "", from: "", to: "" })}>
            <X className="w-3.5 h-3.5" /> {t("common.clear")}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground text-sm">{t("appointments.noAppointments")}</div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, appts]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-sm font-semibold text-foreground">{formatDateLabel(date, isAr)}</p>
                {date === today && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">{t("common.today")}</span>}
                <div className="flex-1 border-t border-border" />
              </div>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <AnimatePresence initial={false}>
                  {appts.map((a, i) => (
                    <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
                      className={`flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
                      <div className="w-16 flex-shrink-0 text-center">
                        <p className="text-sm font-semibold text-foreground">{a.start_time.slice(0, 5)}</p>
                        <p className="text-xs text-muted-foreground">{a.end_time.slice(0, 5)}</p>
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/patients/${a.patient_id}`)}>
                        <p className="text-sm font-semibold text-foreground truncate">{a.patient_name ?? patientsById[a.patient_id]?.full_name ?? t("appointments.unknownPatient")}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.notes || "—"}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <ApptStatusBadge status={a.status} />
                        {a.status === "scheduled" && (
                          <div className="flex items-center gap-2">
                            <button className="text-xs text-muted-foreground hover:text-emerald-600 transition-colors" onClick={() => statusMutation.mutate({ id: a.id, status: "completed" })}>{t("appointments.complete")}</button>
                            <button className="text-xs text-muted-foreground hover:text-destructive transition-colors" onClick={() => statusMutation.mutate({ id: a.id, status: "cancelled" })}>{t("appointments.cancel")}</button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AppointmentForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ["appointments"] });
            qc.invalidateQueries({ queryKey: ["dashboard-today-appts"] });
          }}
        />
      )}
    </div>
  );
}

function ApptStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === "completed") return <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium"><CheckCircle2 className="w-3 h-3" /> {t("common.status.completed")}</span>;
  if (status === "cancelled") return <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium"><XCircle className="w-3 h-3" /> {t("common.status.cancelled")}</span>;
  return <span className="flex items-center gap-1 text-xs text-primary bg-secondary px-2 py-0.5 rounded-full font-medium"><Circle className="w-3 h-3" /> {t("common.status.scheduled")}</span>;
}

function formatDateLabel(d: string, isAr: boolean) {
  return new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", month: "long", day: "numeric" });
}

type DotMap = Record<string, { scheduled: number; completed: number; cancelled: number }>;

function CalendarView({
  year, month, dotMap, selectedDate, today, isAr,
  onPrev, onNext, onDayClick,
}: {
  year: number; month: number;
  dotMap: DotMap; selectedDate: string; today: string; isAr: boolean;
  onPrev: () => void; onNext: () => void; onDayClick: (date: string) => void;
}) {
  const { t } = useTranslation();
  const monthName = new Date(year, month, 1).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "long", year: "numeric" });

  // Day-of-week headers starting Sunday
  const dayHeaders = isAr
    ? ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"]
    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-card border border-border rounded-xl p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold">{monthName}</span>
        <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayHeaders.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dots = dotMap[dateStr];
          const isToday    = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const hasAppts   = !!dots;
          const total      = dots ? dots.scheduled + dots.completed + dots.cancelled : 0;

          return (
            <button
              key={i}
              onClick={() => onDayClick(dateStr)}
              className={`
                relative flex flex-col items-center py-1.5 rounded-lg text-xs font-medium transition-colors
                ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground"}
              `}
            >
              <span>{day}</span>
              {hasAppts && (
                <div className="flex gap-0.5 mt-0.5">
                  {dots.scheduled > 0 && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-sky-500"}`} />}
                  {dots.completed > 0 && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-emerald-500"}`} />}
                  {dots.cancelled > 0 && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-rose-400"}`} />}
                </div>
              )}
              {hasAppts && (
                <span className={`text-[10px] leading-none mt-0.5 ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{total}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border justify-center">
        {[
          { color: "bg-sky-500",   label: t("common.status.scheduled") },
          { color: "bg-emerald-500", label: t("common.status.completed") },
          { color: "bg-rose-400",  label: t("common.status.cancelled") },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${color}`} /> {label}
          </div>
        ))}
      </div>
    </div>
  );
}
