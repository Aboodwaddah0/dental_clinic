import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, Loader2, MapPin, Plus, Pencil, Trash2, X, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { getClinicSettings, updateClinicSettings } from "../api/clinicSettings";
import { setCurrency } from "../lib/format";
import i18n from "../i18n";
import {
  getLanding,
  createService, updateService, deleteService,
  createPortfolio, updatePortfolio, deletePortfolio,
  uploadPortfolioImage,
  type ClinicService, type PortfolioItem, type PortfolioTemplate,
} from "../api/landing";

// ── tabs ──────────────────────────────────────────────────────────────────────
type Tab = "general" | "landing";

// ── detect location ───────────────────────────────────────────────────────────
async function detectAddress(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Geolocation not supported")); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const json = await res.json();
          resolve(json.display_name ?? "");
        } catch { reject(new Error("Reverse geocoding failed")); }
      },
      (err) => reject(err)
    );
  });
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<Tab>("general");
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [form, setForm] = useState({
    clinic_name: "",
    address: "",
    phone: "",
    hero_image_url: "",
    hero_bg_url: "",
    currency: "₪",
    locale: "en",
    reminders_enabled: false,
    reminder_lead_hours: 24,
  });
  const [heroUploading, setHeroUploading] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);

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
        hero_image_url:      settings.hero_image_url ?? "",
        hero_bg_url:         settings.hero_bg_url    ?? "",
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
        hero_image_url:      form.hero_image_url || undefined,
        hero_bg_url:         form.hero_bg_url    || undefined,
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

  async function handleDetectLocation() {
    setDetectingLocation(true);
    try {
      const address = await detectAddress();
      setForm((f) => ({ ...f, address }));
    } catch {
      toast.error(t("settings.locationError"));
    } finally {
      setDetectingLocation(false);
    }
  }

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
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-foreground mb-6">{t("settings.title")}</h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-6">
        {(["general", "landing"] as Tab[]).map((id) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors -mb-px border-b-2 ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {id === "general" ? t("settings.tabGeneral") : t("settings.tabLanding")}
          </button>
        ))}
      </div>

      {/* ── General tab ──────────────────────────────────────────────── */}
      {tab === "general" && (
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
                <div className="flex gap-2">
                  <input className={`${inputCls} flex-1`} value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    title={t("settings.detectLocation")}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 border border-border rounded-lg text-sm font-medium bg-muted hover:bg-muted/70 transition-colors disabled:opacity-60 whitespace-nowrap"
                  >
                    {detectingLocation
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <MapPin className="w-4 h-4" />}
                    {t("settings.detectLocation")}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("settings.phone")}</label>
                <input className={inputCls} value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("settings.heroImage")}</label>
                <label className={`relative flex items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-colors overflow-hidden ${
                  heroUploading ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
                } ${form.hero_image_url ? "h-40" : "h-24"}`}>
                  {heroUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                  {form.hero_image_url ? (
                    <img src={form.hero_image_url} alt="hero" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <span className="text-2xl">🩺</span>
                      <span className="text-xs">{t("settings.heroImageHint")}</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setHeroUploading(true);
                    try {
                      const url = await uploadPortfolioImage(file);
                      setForm((f) => ({ ...f, hero_image_url: url }));
                      // save immediately — don't require clicking Save Changes
                      await updateClinicSettings({ clinic_name: form.clinic_name || "Clinic", hero_image_url: url });
                      queryClient.invalidateQueries({ queryKey: ["clinic-settings"] });
                      toast.success(t("settings.saved"));
                    } catch { toast.error(t("settings.landing.uploadError")); }
                    finally { setHeroUploading(false); }
                  }} />
                </label>
                {form.hero_image_url && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, hero_image_url: "" }))}
                    className="mt-1 text-xs text-destructive hover:underline">
                    {t("settings.landing.removeImage")}
                  </button>
                )}
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
      )}

      {/* ── Landing Page tab ─────────────────────────────────────────── */}
      {tab === "landing" && <LandingManager t={t} />}
    </div>
  );
}

// ── Landing Manager component ─────────────────────────────────────────────────
function LandingManager({ t }: { t: ReturnType<typeof useTranslation>["t"] }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["landing-data"],
    queryFn: () => getLanding().then((r) => r.data),
  });

  const services  = data?.services  ?? [];
  const portfolio = data?.portfolio ?? [];

  // ── service mutations ──
  const createSvcMutation = useMutation({
    mutationFn: createService,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["landing-data"] }); toast.success(t("settings.landing.saved")); },
    onError: () => toast.error(t("settings.landing.error")),
  });
  const updateSvcMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Omit<ClinicService, "id"> }) => updateService(id, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["landing-data"] }); toast.success(t("settings.landing.saved")); },
    onError: () => toast.error(t("settings.landing.error")),
  });
  const deleteSvcMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["landing-data"] }); },
    onError: () => toast.error(t("settings.landing.error")),
  });

  // ── portfolio mutations ──
  const createPortMutation = useMutation({
    mutationFn: createPortfolio,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["landing-data"] }); toast.success(t("settings.landing.saved")); },
    onError: () => toast.error(t("settings.landing.error")),
  });
  const updatePortMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Omit<PortfolioItem, "id"> }) => updatePortfolio(id, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["landing-data"] }); toast.success(t("settings.landing.saved")); },
    onError: () => toast.error(t("settings.landing.error")),
  });
  const deletePortMutation = useMutation({
    mutationFn: deletePortfolio,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["landing-data"] }); },
    onError: () => toast.error(t("settings.landing.error")),
  });

  const [svcModal, setSvcModal]   = useState<{ open: boolean; item?: ClinicService }>({ open: false });
  const [portModal, setPortModal] = useState<{ open: boolean; item?: PortfolioItem }>({ open: false });

  if (isLoading) return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
      <Loader2 className="w-4 h-4 animate-spin" /> {t("common.loading")}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Preview link */}
      <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
        <Globe className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm text-muted-foreground flex-1">{t("settings.landing.previewNote")}</span>
        <a href="/landing" target="_blank" rel="noopener noreferrer"
          className="text-sm font-semibold text-primary hover:underline whitespace-nowrap">
          {t("settings.landing.preview")} →
        </a>
      </div>

      {/* Services */}
      <section className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t("settings.landing.services")}</h2>
          <button onClick={() => setSvcModal({ open: true })}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> {t("common.add")}
          </button>
        </div>
        {services.length === 0
          ? <p className="text-sm text-muted-foreground">{t("settings.landing.noServices")}</p>
          : (
            <div className="space-y-2">
              {services.map((svc) => (
                <div key={svc.id} className="flex items-center gap-3 px-3 py-2.5 bg-muted/40 rounded-lg">
                  <span className="text-xl">{svc.icon ?? "🦷"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{svc.title}</p>
                    {svc.description && <p className="text-xs text-muted-foreground truncate">{svc.description}</p>}
                  </div>
                  <button onClick={() => setSvcModal({ open: true, item: svc })}
                    className="p-1.5 rounded hover:bg-border transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteSvcMutation.mutate(svc.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
      </section>

      {/* Portfolio */}
      <section className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t("settings.landing.portfolio")}</h2>
          <button onClick={() => setPortModal({ open: true })}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> {t("common.add")}
          </button>
        </div>
        {portfolio.length === 0
          ? <p className="text-sm text-muted-foreground">{t("settings.landing.noPortfolio")}</p>
          : (
            <div className="space-y-2">
              {portfolio.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 bg-muted/40 rounded-lg">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.title} className="w-10 h-10 rounded object-cover shrink-0" />
                    : <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-lg shrink-0">🦷</div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                  </div>
                  <button onClick={() => setPortModal({ open: true, item })}
                    className="p-1.5 rounded hover:bg-border transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deletePortMutation.mutate(item.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
      </section>

      {/* Service modal */}
      {svcModal.open && (
        <ServiceModal
          item={svcModal.item}
          t={t}
          onClose={() => setSvcModal({ open: false })}
          onSave={(body) => {
            if (svcModal.item) updateSvcMutation.mutate({ id: svcModal.item.id, body });
            else createSvcMutation.mutate(body);
            setSvcModal({ open: false });
          }}
        />
      )}

      {/* Portfolio modal */}
      {portModal.open && (
        <PortfolioModal
          item={portModal.item}
          t={t}
          onClose={() => setPortModal({ open: false })}
          onSave={(body) => {
            if (portModal.item) updatePortMutation.mutate({ id: portModal.item.id, body });
            else createPortMutation.mutate(body);
            setPortModal({ open: false });
          }}
        />
      )}
    </div>
  );
}

// ── Service Modal ─────────────────────────────────────────────────────────────
function ServiceModal({
  item, t, onClose, onSave,
}: {
  item?: ClinicService;
  t: ReturnType<typeof useTranslation>["t"];
  onClose: () => void;
  onSave: (body: Omit<ClinicService, "id">) => void;
}) {
  const [form, setForm] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    icon: item?.icon ?? "",
    sort_order: item?.sort_order ?? 0,
  });

  return (
    <Modal title={item ? t("settings.landing.editService") : t("settings.landing.addService")} onClose={onClose}>
      <div className="space-y-3">
        <Field label={t("settings.landing.fieldTitle")}>
          <input autoFocus className={ICLS} value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </Field>
        <Field label={t("settings.landing.fieldDesc")}>
          <textarea rows={2} className={`${ICLS} resize-none`} value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
        <Field label={t("settings.landing.fieldIcon")}>
          <input className={ICLS} placeholder="🦷" value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
        </Field>
        <Field label={t("settings.landing.fieldOrder")}>
          <input type="number" className={ICLS} value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
          {t("common.cancel")}
        </button>
        <button disabled={!form.title.trim()}
          onClick={() => onSave({ title: form.title, description: form.description || undefined, icon: form.icon || undefined, sort_order: form.sort_order })}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {t("common.save")}
        </button>
      </div>
    </Modal>
  );
}

// ── Portfolio Modal ───────────────────────────────────────────────────────────
const TEMPLATES: { value: PortfolioTemplate; label: string; desc: string }[] = [
  { value: "single",      label: "Single Image",    desc: "One photo with title and description" },
  { value: "before-after",label: "Before & After",  desc: "Side-by-side comparison with a drag slider" },
  { value: "gallery",     label: "Gallery",         desc: "Three images in a collage grid" },
];

function PortfolioModal({
  item, t, onClose, onSave,
}: {
  item?: PortfolioItem;
  t: ReturnType<typeof useTranslation>["t"];
  onClose: () => void;
  onSave: (body: Omit<PortfolioItem, "id">) => void;
}) {
  const [form, setForm] = useState<Omit<PortfolioItem, "id">>({
    title:            item?.title            ?? "",
    description:      item?.description      ?? "",
    template:         item?.template         ?? "single",
    image_url:        item?.image_url        ?? "",
    before_image_url: item?.before_image_url ?? "",
    after_image_url:  item?.after_image_url  ?? "",
    sort_order:       item?.sort_order       ?? 0,
  });

  function setField<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <Modal title={item ? t("settings.landing.editPortfolio") : t("settings.landing.addPortfolio")} onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <Field label={t("settings.landing.fieldTitle")}>
          <input autoFocus className={ICLS} value={form.title}
            onChange={(e) => setField("title", e.target.value)} />
        </Field>

        <Field label={t("settings.landing.fieldDesc")}>
          <textarea rows={2} className={`${ICLS} resize-none`} value={form.description ?? ""}
            onChange={(e) => setField("description", e.target.value)} />
        </Field>

        {/* Template picker */}
        <Field label={t("settings.landing.fieldTemplate")}>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.value}
                type="button"
                onClick={() => setField("template", tpl.value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all ${
                  form.template === tpl.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <span className="text-xl">
                  {tpl.value === "single" ? "🖼️" : tpl.value === "before-after" ? "↔️" : "🗂️"}
                </span>
                <span className="text-xs font-semibold leading-tight">{tpl.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {TEMPLATES.find((t) => t.value === form.template)?.desc}
          </p>
        </Field>

        {/* Image fields based on template */}
        {form.template === "single" && (
          <ImageUploadField
            label={t("settings.landing.fieldImage")}
            value={form.image_url ?? ""}
            onChange={(url) => setField("image_url", url)}
            t={t}
          />
        )}

        {form.template === "before-after" && (
          <>
            <ImageUploadField
              label={t("settings.landing.fieldBefore")}
              value={form.before_image_url ?? ""}
              onChange={(url) => setField("before_image_url", url)}
              t={t}
            />
            <ImageUploadField
              label={t("settings.landing.fieldAfter")}
              value={form.after_image_url ?? ""}
              onChange={(url) => setField("after_image_url", url)}
              t={t}
            />
          </>
        )}

        {form.template === "gallery" && (
          <>
            <ImageUploadField
              label={t("settings.landing.fieldImage") + " 1"}
              value={form.image_url ?? ""}
              onChange={(url) => setField("image_url", url)}
              t={t}
            />
            <ImageUploadField
              label={t("settings.landing.fieldImage") + " 2"}
              value={form.before_image_url ?? ""}
              onChange={(url) => setField("before_image_url", url)}
              t={t}
            />
            <ImageUploadField
              label={t("settings.landing.fieldImage") + " 3"}
              value={form.after_image_url ?? ""}
              onChange={(url) => setField("after_image_url", url)}
              t={t}
            />
          </>
        )}

        <Field label={t("settings.landing.fieldOrder")}>
          <input type="number" className={ICLS} value={form.sort_order}
            onChange={(e) => setField("sort_order", Number(e.target.value))} />
        </Field>
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
          {t("common.cancel")}
        </button>
        <button
          disabled={!form.title.trim()}
          onClick={() => onSave({
            title:            form.title,
            description:      form.description || undefined,
            template:         form.template,
            image_url:        form.image_url || undefined,
            before_image_url: form.before_image_url || undefined,
            after_image_url:  form.after_image_url  || undefined,
            sort_order:       form.sort_order,
          })}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {t("common.save")}
        </button>
      </div>
    </Modal>
  );
}

// ── Image Upload Field ────────────────────────────────────────────────────────
function ImageUploadField({
  label, value, onChange, t,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadPortfolioImage(file);
      onChange(url);
    } catch {
      toast.error(t("settings.landing.uploadError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={label}>
      {/* Drag-and-drop / click zone */}
      <label className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        uploading ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
      } ${value ? "h-36" : "h-24 py-4"}`}>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-xl z-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {value ? (
          <img src={value} alt="preview" className="h-full w-full object-cover rounded-xl" />
        ) : (
          <>
            <span className="text-2xl">📁</span>
            <span className="text-xs text-muted-foreground text-center px-2">
              {t("settings.landing.uploadHint")}
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </label>
      {/* URL fallback */}
      <input
        className={`${ICLS} mt-2`}
        placeholder="https://… (or upload above)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mt-1 text-xs text-destructive hover:underline"
        >
          {t("settings.landing.removeImage")}
        </button>
      )}
    </Field>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
const ICLS = "w-full px-3.5 py-2 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
