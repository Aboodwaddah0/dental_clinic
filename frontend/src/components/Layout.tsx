import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Smile,
  FolderOpen,
  CreditCard,
  Clock,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  Languages,
  Stethoscope,
  BarChart3,
  Receipt,
  BellRing,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAr = i18n.language === "ar";

  useEffect(() => {
    document.documentElement.dir = isAr ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isAr]);

  const toggleLanguage = () => {
    const next = isAr ? "en" : "ar";
    i18n.changeLanguage(next);
    localStorage.setItem("dc_lang", next);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/patients", label: t("nav.patients"), icon: Users },
    { to: "/appointments", label: t("nav.appointments"), icon: CalendarDays },
    { to: "/dental-chart", label: t("nav.dentalChart"), icon: Smile },
    { to: "/files", label: t("nav.files"), icon: FolderOpen },
    { to: "/billing", label: t("nav.billing"), icon: CreditCard },
    { to: "/availability", label: t("nav.availability"), icon: Clock },
    { to: "/reports", label: t("nav.reports"), icon: BarChart3 },
    { to: "/expenses", label: t("nav.expenses"), icon: Receipt },
    { to: "/reminders", label: t("nav.reminders"), icon: BellRing },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const sidebarSide = isAr
    ? "fixed lg:static inset-y-0 right-0 z-30"
    : "fixed lg:static inset-y-0 left-0 z-30";

  const sidebarTranslate = isAr
    ? sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
    : sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarSide} flex flex-col w-64 bg-card border-border transition-transform duration-200 ${sidebarTranslate} ${isAr ? "border-l" : "border-r"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none">DentaFlow</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("nav.clinicManagement")}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            {t("nav.mainMenu")}
          </p>
          <ul className="space-y-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-secondary text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Doctor info at bottom */}
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
              {user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3.5 bg-card border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-foreground">
                {t("layout.good")} {t(`layout.greeting.${getGreetingKey()}`)}{isAr ? "" : ","} {user?.full_name?.split(" ")[0]}
              </h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
              title="Switch language"
            >
              <Languages className="w-4 h-4" />
              <span>{isAr ? "EN" : "ع"}</span>
            </button>

            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary"></span>
            </button>

            <div className="relative">
              <button
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setProfileOpen((v) => !v)}
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <span className="hidden sm:block text-sm font-medium">{user?.full_name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {profileOpen && (
                <div className={`absolute ${isAr ? "left-0" : "right-0"} mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 py-1`}>
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-semibold">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                  <button
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                    onClick={() => { setProfileOpen(false); handleLogout(); }}
                  >
                    <LogOut className="w-4 h-4" />
                    {t("layout.signOut")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function getGreetingKey(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
