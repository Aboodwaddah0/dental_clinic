import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getClinicSettings, updateClinicSettings } from "../api/clinicSettings";
import { setCurrency } from "../lib/format";
import i18n from "../i18n";

export default function Settings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    clinic_name: "",
    address: "",
    phone: "",
    currency: "₪",
    locale: "en",
    reminders_enabled: false,
    reminder_lead_hours: 24,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["clinic-settings"],
    queryFn: getClinicSettings,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        clinic_name:         settings.clinic_name ?? "",
        address:             settings.address ?? "",
        phone:               settings.phone ?? "",
        currency:            settings.currency ?? "₪",
        locale:              settings.locale ?? "en",
        reminders_enabled:   settings.reminders_enabled ?? false,
        reminder_lead_hours: settings.reminder_lead_hours ?? 24,
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () =>
      updateClinicSettings({
        clinic_name:         form.clinic_name,
        address:             form.address || undefined,
        phone:               form.phone || undefined,
        currency:            form.currency,
        locale:              form.locale as "en" | "ar",
        reminders_enabled:   form.reminders_enabled,
        reminder_lead_hours: form.reminder_lead_hours,
      }),
    onSuccess: (updated) => {
      setCurrency(updated.currency);
      if (updated.locale !== i18n.language) {
        i18n.changeLanguage(updated.locale);
        localStorage.setItem("dc_lang", updated.locale);
      }
      queryClient.setQueryData(["clinic-settings"], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const inputCls =
    "w-full px-3.5 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-foreground mb-6">{t("settings.title")}</h1>

      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
        {/* Profile */}
        <section className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">{t("settings.profile")}</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("settings.fullName")}</label>
            <input className={inputCls} value={user?.full_name ?? ""} readOnly />
          </div>
        </section>

        {/* Clinic Information */}
        <section className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">{t("settings.clinicInfo")}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("settings.clinicName")}</label>
              <input required className={inputCls} value={form.clinic_name}
                onChange={(e) => setForm((f) => ({ ...f, clinic_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("settings.address")}</label>
              <input className={inputCls} value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("settings.phone")}</label>
              <input className={inputCls} value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
        </section>

        {/* Currency & Language */}
        <section className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">{t("settings.localeSection")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("settings.currency")}</label>
              <input className={inputCls} placeholder="₪ / $ / €" value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("settings.locale")}</label>
              <select className={inputCls} value={form.locale}
                onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value }))}>
                <option value="en">{t("settings.english")}</option>
                <option value="ar">{t("settings.arabic")}</option>
              </select>
            </div>
          </div>
        </section>

        {/* Reminders */}
        <section className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">{t("settings.reminders")}</h2>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input type="checkbox" className="w-4 h-4 accent-primary"
              checked={form.reminders_enabled}
              onChange={(e) => setForm((f) => ({ ...f, reminders_enabled: e.target.checked }))} />
            <span className="text-sm font-medium">{t("settings.remindersEnable")}</span>
          </label>
          {form.reminders_enabled && (
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("settings.leadHours")}</label>
              <input type="number" min={1} max={168} className={inputCls}
                value={form.reminder_lead_hours}
                onChange={(e) => setForm((f) => ({ ...f, reminder_lead_hours: Number(e.target.value) }))} />
            </div>
          )}
        </section>

        {mutation.error && (
          <p className="text-destructive text-sm">{String(mutation.error)}</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            saved
              ? "bg-emerald-600 text-white"
              : "bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-70"
          }`}
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {mutation.isPending ? t("settings.saving") : saved ? t("settings.saved") : t("settings.saveChanges")}
        </button>
      </form>
    </div>
  );
}
