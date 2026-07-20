import { useState, useEffect } from "react";
import { Clock, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { request } from "../api/client";
import type { AvailabilitySlot } from "../types";

export default function Availability() {
  const { t } = useTranslation();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    request<{ data: AvailabilitySlot[] }>("/api/availability")
      .then(({ data }) => setSlots(data))
      .catch(() => toast.error(t("availability.subtitle")));
  }, []);

  const update = (day: string, field: keyof AvailabilitySlot, value: string | boolean) => {
    setSlots((prev) =>
      prev.map((s) => (s.day === day ? { ...s, [field]: value } : s))
    );
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await request("/api/availability", { method: "PUT", body: slots });
      setSaved(true);
      toast.success(t("availability.saveSuccess"));
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error(t("availability.saveError"));
    }
  };

  const inputCls =
    "px-3 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

  const totalHours = slots
    .filter((s) => s.enabled)
    .reduce((sum, s) => sum + calcHoursNum(s.start_time, s.end_time), 0)
    .toFixed(1);

  const workingDays = slots.filter((s) => s.enabled).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("availability.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("availability.subtitle")}</p>
        </div>
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            saved
              ? "bg-emerald-600 text-white"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
          onClick={handleSave}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" /> {t("availability.saved")}
            </>
          ) : (
            t("availability.saveSchedule")
          )}
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/40">
          <div className="grid grid-cols-[120px_1fr_1fr_80px] gap-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("availability.columns.day")}</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("availability.columns.startTime")}</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("availability.columns.endTime")}</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("availability.columns.active")}</p>
          </div>
        </div>

        <div className="divide-y divide-border">
          {slots.map((slot) => (
            <div
              key={slot.day}
              className={`px-5 py-4 transition-colors ${slot.enabled ? "" : "opacity-50"}`}
            >
              <div className="grid grid-cols-[120px_1fr_1fr_80px] gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-semibold text-foreground">{t(`availability.days.${slot.day}`, slot.day)}</span>
                </div>

                <input
                  type="time"
                  className={inputCls}
                  value={slot.start_time}
                  disabled={!slot.enabled}
                  onChange={(e) => update(slot.day, "start_time", e.target.value)}
                />

                <input
                  type="time"
                  className={inputCls}
                  value={slot.end_time}
                  disabled={!slot.enabled}
                  onChange={(e) => update(slot.day, "end_time", e.target.value)}
                />

                <div className="flex items-center">
                  <button
                    onClick={() => update(slot.day, "enabled", !slot.enabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                      slot.enabled ? "bg-primary" : "bg-switch-background"
                    }`}
                    role="switch"
                    aria-checked={slot.enabled}
                  >
                    <span
                      className={`absolute top-0.5 start-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        slot.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {slot.enabled && (
                <p className="text-xs text-muted-foreground mt-1.5 ps-6">
                  {t("availability.workingHours", { hours: calcHours(slot.start_time, slot.end_time) })}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-border bg-muted/20">
          <p className="text-sm text-muted-foreground">
            {t("availability.total")}{" "}
            <span className="font-semibold text-foreground">
              {t("availability.hoursPerWeek", { hours: totalHours })}
            </span>{" "}
            {t("availability.workingDays", { count: workingDays })}
          </p>
        </div>
      </div>
    </div>
  );
}

function calcHoursNum(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

function calcHours(start: string, end: string) {
  return calcHoursNum(start, end).toFixed(1);
}
