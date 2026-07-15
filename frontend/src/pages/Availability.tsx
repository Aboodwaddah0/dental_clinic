import { useState } from "react";
import { Clock, Check } from "lucide-react";
import { mockAvailability } from "../data/mockData";
import type { AvailabilitySlot } from "../types";

export default function Availability() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(mockAvailability);
  const [saved, setSaved] = useState(false);

  const update = (day: string, field: keyof AvailabilitySlot, value: string | boolean) => {
    setSlots((prev) =>
      prev.map((s) => (s.day === day ? { ...s, [field]: value } : s))
    );
    setSaved(false);
  };

  const handleSave = () => {
    // In production: PUT /api/availability
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputCls =
    "px-3 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Availability</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Set your weekly working hours</p>
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
              <Check className="w-4 h-4" /> Saved!
            </>
          ) : (
            "Save Schedule"
          )}
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/40">
          <div className="grid grid-cols-[120px_1fr_1fr_80px] gap-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Day</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Time</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Time</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active</p>
          </div>
        </div>

        <div className="divide-y divide-border">
          {slots.map((slot) => (
            <div
              key={slot.day}
              className={`px-5 py-4 transition-colors ${
                slot.enabled ? "" : "opacity-50"
              }`}
            >
              <div className="grid grid-cols-[120px_1fr_1fr_80px] gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-semibold text-foreground">{slot.day}</span>
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
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        slot.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {slot.enabled && (
                <p className="text-xs text-muted-foreground mt-1.5 pl-6">
                  {calcHours(slot.start_time, slot.end_time)} working hours
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-border bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Total:{" "}
            <span className="font-semibold text-foreground">
              {slots
                .filter((s) => s.enabled)
                .reduce((sum, s) => sum + calcHoursNum(s.start_time, s.end_time), 0)
                .toFixed(1)}{" "}
              hours / week
            </span>{" "}
            across{" "}
            <span className="font-semibold text-foreground">
              {slots.filter((s) => s.enabled).length} working days
            </span>
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
