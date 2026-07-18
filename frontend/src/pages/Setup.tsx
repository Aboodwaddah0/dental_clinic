import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Building2, UserCircle, Bell, ChevronRight, ChevronLeft, Check, Loader2, Eye, EyeOff } from "lucide-react";
import { submitSetup, type SetupPayload } from "../api/setup";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  onComplete: (clinic: { clinic_name: string; currency: string; locale: string }) => void;
}

type Locale = "en" | "ar";

export default function Setup({ onComplete }: Props) {
  const { t, i18n } = useTranslation();
  const { loginWithToken } = useAuth();
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [owner, setOwner] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [clinic, setClinic] = useState({ name: "", address: "", phone: "", currency: "₪", locale: "en" as Locale });
  const [reminders, setReminders] = useState({
    enabled: false,
    account_sid: "",
    auth_token: "",
    whatsapp_from: "",
    template_sid: "",
    lead_hours: 24,
  });

  const mutation = useMutation({
    mutationFn: (payload: SetupPayload) => submitSetup(payload),
    onSuccess: ({ access_token, user, clinic: c }) => {
      loginWithToken(access_token, user);
      if (!localStorage.getItem("dc_lang")) {
        i18n.changeLanguage(c.locale);
        localStorage.setItem("dc_lang", c.locale);
      }
      onComplete(c);
    },
  });

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!owner.full_name.trim()) e.full_name = t("setup.owner.nameRequired");
    if (!owner.email.trim() || !/\S+@\S+\.\S+/.test(owner.email)) e.email = t("setup.owner.emailRequired");
    if (owner.password.length < 8) e.password = t("setup.owner.passwordTooShort");
    if (owner.password !== owner.confirm) e.confirm = t("setup.owner.passwordMismatch");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!clinic.name.trim()) e.name = t("setup.clinic.nameRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep((s) => s + 1);
  }

  function submit() {
    const payload: SetupPayload = {
      owner: { full_name: owner.full_name, email: owner.email, password: owner.password },
      clinic: {
        name: clinic.name,
        address: clinic.address || undefined,
        phone: clinic.phone || undefined,
        currency: clinic.currency || "₪",
        locale: clinic.locale,
      },
      reminders: {
        enabled: reminders.enabled,
        account_sid: reminders.account_sid || undefined,
        auth_token: reminders.auth_token || undefined,
        whatsapp_from: reminders.whatsapp_from || undefined,
        template_sid: reminders.template_sid || undefined,
        lead_hours: reminders.lead_hours,
      },
    };
    mutation.mutate(payload);
  }

  const steps = [
    { label: t("setup.steps.owner"), icon: UserCircle },
    { label: t("setup.steps.clinic"), icon: Building2 },
    { label: t("setup.steps.reminders"), icon: Bell },
  ];

  const inputCls =
    "w-full px-3.5 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t("setup.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("setup.subtitle")}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div key={n} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 ${
                    active ? "text-primary" : done ? "text-emerald-600" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : done
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-border"
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : n}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-px ${done ? "bg-emerald-600" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {/* Step 1: Owner */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-foreground mb-4">{t("setup.owner.title")}</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("setup.owner.fullName")}</label>
                <input
                  className={`${inputCls} ${errors.full_name ? "border-destructive" : ""}`}
                  value={owner.full_name}
                  onChange={(e) => setOwner((o) => ({ ...o, full_name: e.target.value }))}
                />
                {errors.full_name && <p className="text-destructive text-xs mt-1">{errors.full_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("setup.owner.email")}</label>
                <input
                  type="email"
                  className={`${inputCls} ${errors.email ? "border-destructive" : ""}`}
                  value={owner.email}
                  onChange={(e) => setOwner((o) => ({ ...o, email: e.target.value }))}
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("setup.owner.password")}</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className={`${inputCls} pr-10 ${errors.password ? "border-destructive" : ""}`}
                    value={owner.password}
                    onChange={(e) => setOwner((o) => ({ ...o, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPass((s) => !s)}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("setup.owner.confirmPassword")}</label>
                <input
                  type="password"
                  className={`${inputCls} ${errors.confirm ? "border-destructive" : ""}`}
                  value={owner.confirm}
                  onChange={(e) => setOwner((o) => ({ ...o, confirm: e.target.value }))}
                />
                {errors.confirm && <p className="text-destructive text-xs mt-1">{errors.confirm}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Clinic */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-foreground mb-4">{t("setup.clinic.title")}</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("setup.clinic.name")}</label>
                <input
                  className={`${inputCls} ${errors.name ? "border-destructive" : ""}`}
                  value={clinic.name}
                  onChange={(e) => setClinic((c) => ({ ...c, name: e.target.value }))}
                />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("setup.clinic.address")}</label>
                <input
                  className={inputCls}
                  value={clinic.address}
                  onChange={(e) => setClinic((c) => ({ ...c, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("setup.clinic.phone")}</label>
                <input
                  className={inputCls}
                  value={clinic.phone}
                  onChange={(e) => setClinic((c) => ({ ...c, phone: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("setup.clinic.currency")}</label>
                  <input
                    className={inputCls}
                    placeholder="₪ / $ / €"
                    value={clinic.currency}
                    onChange={(e) => setClinic((c) => ({ ...c, currency: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("setup.clinic.locale")}</label>
                  <select
                    className={inputCls}
                    value={clinic.locale}
                    onChange={(e) => setClinic((c) => ({ ...c, locale: e.target.value as Locale }))}
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Reminders */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="font-semibold text-foreground">{t("setup.reminders.title")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("setup.reminders.subtitle")}</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary"
                  checked={reminders.enabled}
                  onChange={(e) => setReminders((r) => ({ ...r, enabled: e.target.checked }))}
                />
                <span className="text-sm font-medium">{t("setup.reminders.enable")}</span>
              </label>
              {reminders.enabled && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("setup.reminders.accountSid")}</label>
                    <input
                      className={inputCls}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={reminders.account_sid}
                      onChange={(e) => setReminders((r) => ({ ...r, account_sid: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("setup.reminders.authToken")}</label>
                    <input
                      type="password"
                      className={inputCls}
                      value={reminders.auth_token}
                      onChange={(e) => setReminders((r) => ({ ...r, auth_token: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("setup.reminders.whatsappFrom")}</label>
                    <input
                      className={inputCls}
                      placeholder="whatsapp:+14155238886"
                      value={reminders.whatsapp_from}
                      onChange={(e) => setReminders((r) => ({ ...r, whatsapp_from: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("setup.reminders.templateSid")}</label>
                    <input
                      className={inputCls}
                      placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={reminders.template_sid}
                      onChange={(e) => setReminders((r) => ({ ...r, template_sid: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("setup.reminders.leadHours")}</label>
                    <input
                      type="number"
                      min={1}
                      max={168}
                      className={inputCls}
                      value={reminders.lead_hours}
                      onChange={(e) => setReminders((r) => ({ ...r, lead_hours: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              )}
              {mutation.error && (
                <p className="text-destructive text-sm mt-2">{t("setup.error")}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("setup.back")}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold transition-colors"
            >
              {t("setup.next")}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-70 transition-colors"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {mutation.isPending ? t("setup.submitting") : t("setup.submit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
