import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Suspense, lazy, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import { getSetupStatus } from "../api/setup";
import { setCurrency } from "../lib/format";
import i18n from "../i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Patients = lazy(() => import("../pages/Patients"));
const PatientDetail = lazy(() => import("../pages/PatientDetail"));
const Appointments = lazy(() => import("../pages/Appointments"));
const DentalChartPage = lazy(() => import("../pages/DentalChartPage"));
const Files = lazy(() => import("../pages/Files"));
const Billing = lazy(() => import("../pages/Billing"));
const Availability = lazy(() => import("../pages/Availability"));
const Settings = lazy(() => import("../pages/Settings"));
const Reports = lazy(() => import("../pages/Reports"));
const Expenses = lazy(() => import("../pages/Expenses"));
const Reminders = lazy(() => import("../pages/Reminders"));
const Setup = lazy(() => import("../pages/Setup"));
const LandingPage = lazy(() => import("../pages/LandingPage"));

function PageFallback() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function FullPageSpinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/dental-chart" element={<DentalChartPage />} />
          <Route path="/files" element={<Files />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </Suspense>
  );
}

function SetupGate({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["setup-status"],
    queryFn: getSetupStatus,
    staleTime: Infinity,
    retry: 1,
  });

  if (isLoading) return <FullPageSpinner />;

  // On error or setup already done, proceed with normal app
  if (isError || !data?.needsSetup) {
    if (data?.clinic?.currency) setCurrency(data.clinic.currency);
    if (data?.clinic?.locale && !localStorage.getItem("dc_lang")) {
      i18n.changeLanguage(data.clinic.locale);
    }
    return <>{children}</>;
  }

  // First-run wizard
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Setup
        onComplete={(clinic) => {
          setCurrency(clinic.currency);
          queryClient.setQueryData(["setup-status"], { needsSetup: false, clinic });
        }}
      />
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <SetupGate>
            <AppRoutes />
          </SetupGate>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
