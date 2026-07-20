import { useEffect, useRef, useState } from "react";
import { MapPin, Phone, Clock, ChevronRight, Building2, Shield, Microscope, Smile, Users, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLanding, type LandingData, type PortfolioItem } from "../api/landing";

const DAYS_ORDER = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [data, setData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLanding()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const clinic      = data?.clinic;
  const services    = data?.services ?? [];
  const portfolio   = data?.portfolio ?? [];
  const hours       = (data?.businessHours ?? []).sort(
    (a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day)
  );
  const clinicName  = clinic?.clinic_name ?? t("landing.defaultName");
  const address     = clinic?.address;
  const phone       = clinic?.phone;

  const mapUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  return (
    <div className={`min-h-screen bg-background text-foreground font-sans ${isAr ? "rtl" : "ltr"}`}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {clinic?.logo_url
              ? <img src={clinic.logo_url} alt={clinicName} className="h-8 w-8 rounded-full object-cover" />
              : <Building2 className="w-6 h-6 text-primary" />}
            <span className="font-bold text-lg">{clinicName}</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#services"  className="hover:text-foreground transition-colors">{t("landing.nav.services")}</a>
            <a href="#portfolio" className="hover:text-foreground transition-colors">{t("landing.nav.portfolio")}</a>
            <a href="#hours"     className="hover:text-foreground transition-colors">{t("landing.nav.hours")}</a>
            <a href="#location"  className="hover:text-foreground transition-colors">{t("landing.nav.location")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar")}
              className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              {i18n.language === "ar" ? "EN" : "ع"}
            </button>
            {phone && (
              <a href={`tel:${phone}`} className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Phone className="w-4 h-4" /> {phone}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative h-[calc(100vh-4rem)] overflow-hidden">

        {/* Background image */}
        <img
          src={clinic?.hero_bg_url ?? "/background-hero-section.png"}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* gradient overlay — opaque white on left for text, transparent on right to show image */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/10" />

        {/* decorative hexagons (faint, like reference) */}
        <svg className="absolute top-8 right-1/3 w-64 h-64 opacity-10 text-primary" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1">
          <polygon points="100,10 170,50 170,150 100,190 30,150 30,50" />
          <polygon points="100,30 155,62 155,138 100,170 45,138 45,62" />
          <polygon points="100,50 140,74 140,126 100,150 60,126 60,74" />
        </svg>
        <div className="absolute top-16 left-1/4 w-2 h-2 rounded-full bg-primary/40" />
        <div className="absolute top-32 left-1/3 w-1.5 h-1.5 rounded-full bg-primary/30" />

        <div className="relative max-w-6xl mx-auto px-6 h-full flex items-center gap-8">

          {/* ── Left content ── */}
          <div className={`flex-1 space-y-6 z-10 ${isAr ? "text-right" : "text-left"}`}>

            {/* badge */}
            <div className={`inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm`}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {t("landing.hero.badge")}
            </div>

            {/* headline */}
            <h1 className="text-6xl sm:text-7xl font-extrabold leading-[1.1] tracking-tight text-slate-800">
              {t("landing.hero.headlineLine1")}<br />
              <span className="text-primary">{t("landing.hero.headlineLine2")}</span>
            </h1>

            {/* subheadline */}
            <p className="text-xl text-slate-500 max-w-md leading-relaxed">
              {t("landing.hero.subheadline")}
            </p>

            {/* CTA */}
            {phone && (
              <a href={`tel:${phone}`}
                className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-2xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
                <Phone className="w-4 h-4" />
                {t("landing.hero.callUs")}
              </a>
            )}

            {/* trust bar */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                {[0,1,2,3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white shadow flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500">
                <span className="font-bold text-primary text-base">500+</span> {t("landing.hero.happyPatients")}
              </p>
            </div>
          </div>

          {/* ── Right: doctor in circle ── */}
          <div className="hidden md:flex flex-1 items-center justify-center relative h-full">

            {/* spinning outer ring */}
            <div className="absolute w-[540px] h-[540px] rounded-full border border-dashed border-primary/25"
              style={{ animation: "spin 18s linear infinite" }} />

            {/* counter-spinning middle ring */}
            <div className="absolute w-[480px] h-[480px] rounded-full border-2 border-primary/15"
              style={{ animation: "spin 12s linear infinite reverse" }} />

            {/* pulsing glow ring */}
            <div className="absolute w-[440px] h-[440px] rounded-full border border-primary/30"
              style={{ animation: "pulse 3s ease-in-out infinite" }} />

            {/* orbiting dots */}
            <div className="absolute w-[540px] h-[540px] rounded-full"
              style={{ animation: "spin 8s linear infinite" }}>
              <div className="absolute w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/50"
                style={{ top: "-8px", left: "50%", transform: "translateX(-50%)" }} />
            </div>
            <div className="absolute w-[480px] h-[480px] rounded-full"
              style={{ animation: "spin 14s linear infinite reverse" }}>
              <div className="absolute w-3 h-3 rounded-full bg-primary/60 shadow"
                style={{ bottom: "-6px", left: "50%", transform: "translateX(-50%)" }} />
            </div>

            {/* main circle image */}
            <div className="w-[420px] h-[420px] rounded-full overflow-hidden border-4 border-white shadow-2xl relative z-10 bg-primary/5"
              style={{ animation: "float 5s ease-in-out infinite" }}>
              {clinic?.hero_image_url ? (
                <img src={clinic.hero_image_url} alt="Doctor" className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <User className="w-32 h-32 text-primary/40" />
                </div>
              )}
            </div>

            {/* dot grid */}
            <div className="absolute bottom-8 right-0 grid grid-cols-6 gap-1.5 opacity-25">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
              ))}
            </div>

            <style>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50%       { transform: translateY(-12px); }
              }
            `}</style>
          </div>
        </div>

        {/* wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full fill-background" preserveAspectRatio="none">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ── Feature strip ───────────────────────────────────────────── */}
      <section className="py-10 px-6 bg-background">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { Icon: Shield,      key: "trusted"  },
            { Icon: Microscope,  key: "advanced" },
            { Icon: Smile,       key: "comfort"  },
            { Icon: Users,       key: "family"   },
          ].map(({ Icon, key }) => (
            <div key={key} className="flex items-start gap-3 bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{t(`landing.features.${key}.title`)}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{t(`landing.features.${key}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>



      {/* ── Services ────────────────────────────────────────────────── */}
      {services.length > 0 && (
        <section id="services" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <SectionHeader title={t("landing.services.title")} sub={t("landing.services.subtitle")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
              {services.map((svc) => (
                <div key={svc.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/40 transition-all group">
                  <div className="text-4xl mb-4">{svc.icon || <Shield className="w-8 h-8 text-primary" />}</div>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{svc.title}</h3>
                  {svc.description && <p className="text-base text-muted-foreground leading-relaxed">{svc.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Portfolio ───────────────────────────────────────────────── */}
      {portfolio.length > 0 && (
        <section id="portfolio" className="py-20 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <SectionHeader title={t("landing.portfolio.title")} sub={t("landing.portfolio.subtitle")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
              {portfolio.map((item) => <PortfolioCard key={item.id} item={item} t={t} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Business Hours ──────────────────────────────────────────── */}
      <section id="hours" className="py-20 px-6">
        <div className="max-w-lg mx-auto">
          <SectionHeader title={t("landing.hours.title")} sub={t("landing.hours.subtitle")} />
          <div className="mt-10 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-border bg-muted/40 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">{t("landing.hours.tableHeader")}</span>
            </div>
            <div className="divide-y divide-border">
              {hours.map((h) => (
                <div key={h.day} className={`flex items-center justify-between px-5 py-3.5 ${!h.enabled ? "opacity-40" : ""}`}>
                  <span className="text-sm font-medium">{t(`availability.days.${h.day}`, h.day)}</span>
                  {h.enabled
                    ? <span className="text-sm text-emerald-600 font-semibold">{h.start_time} – {h.end_time}</span>
                    : <span className="text-sm text-muted-foreground">{t("landing.hours.closed")}</span>
                  }
                </div>
              ))}
              {hours.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t("landing.hours.notSet")}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Location ────────────────────────────────────────────────── */}
      {(address || phone) && (
        <section id="location" className="py-20 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <SectionHeader title={t("landing.location.title")} sub={t("landing.location.subtitle")} />
            <div className="mt-10 grid sm:grid-cols-2 gap-6">
              {address && (
                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("landing.location.address")}</p>
                    <p className="text-sm font-medium leading-relaxed">{address}</p>
                  </div>
                  {mapUrl && (
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-auto text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                      {t("landing.location.openMap")} <ChevronRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
              {phone && (
                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t("landing.location.phone")}</p>
                    <p className="text-sm font-medium">{phone}</p>
                  </div>
                  <a href={`tel:${phone}`}
                    className="mt-auto text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                    {t("landing.location.callNow")} <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} {clinicName}. {t("landing.footer.rights")}</span>
          <a href="/login" className="hover:text-foreground transition-colors">{t("landing.footer.staffLogin")}</a>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-extrabold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-3 text-lg max-w-xl mx-auto leading-relaxed">{sub}</p>
    </div>
  );
}

// ── Portfolio card — renders one of three templates ───────────────────────────
function PortfolioCard({ item, t }: { item: PortfolioItem; t: (k: string) => string }) {
  const template = item.template ?? "single";

  if (template === "before-after" && item.before_image_url && item.after_image_url) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative">
          <span className="absolute top-2 start-2 z-10 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {t("landing.portfolio.before")}
          </span>
          <span className="absolute top-2 end-2 z-10 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {t("landing.portfolio.after")}
          </span>
          <BeforeAfterSlider before={item.before_image_url} after={item.after_image_url} />
        </div>
        <div className="p-5">
          <h3 className="font-bold text-base">{item.title}</h3>
          {item.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>}
        </div>
      </div>
    );
  }

  if (template === "gallery") {
    const imgs = [item.image_url, item.before_image_url, item.after_image_url].filter(Boolean) as string[];
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
        <div className="grid grid-cols-2 gap-0.5 h-52">
          {imgs[0] && <img src={imgs[0]} alt="" className={`object-cover w-full h-full ${imgs.length === 1 ? "col-span-2" : ""}`} />}
          {imgs.length > 1 && (
            <div className="flex flex-col gap-0.5">
              {imgs.slice(1).map((src, i) => (
                <img key={i} src={src} alt="" className="object-cover w-full flex-1" />
              ))}
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="font-bold text-base">{item.title}</h3>
          {item.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>}
        </div>
      </div>
    );
  }

  // single (default)
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
      {item.image_url ? (
        <img src={item.image_url} alt={item.title}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-52 bg-muted flex items-center justify-center">
          <Smile className="w-12 h-12 text-muted-foreground/40" />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-bold text-base">{item.title}</h3>
        {item.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>}
      </div>
    </div>
  );
}

// ── Before / After drag slider ────────────────────────────────────────────────
function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50); // percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function updatePos(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(p);
  }

  return (
    <div
      ref={containerRef}
      className="relative h-52 select-none overflow-hidden cursor-col-resize"
      onMouseDown={(e) => { dragging.current = true; updatePos(e.clientX); }}
      onMouseMove={(e) => { if (dragging.current) updatePos(e.clientX); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchStart={(e) => { dragging.current = true; updatePos(e.touches[0].clientX); }}
      onTouchMove={(e) => { if (dragging.current) updatePos(e.touches[0].clientX); }}
      onTouchEnd={() => { dragging.current = false; }}
    >
      {/* After (full width, base layer) */}
      <img src={after} alt="after" className="absolute inset-0 w-full h-full object-cover" />

      {/* Before (clipped to left of slider) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="before" className="absolute inset-0 w-full h-full object-cover"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : "100%" }} />
      </div>

      {/* Divider line + handle */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
