import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  User,
  CalendarDays,
  Activity,
  Smile,
  FolderOpen,
  CreditCard,
  Pencil,
  Trash2,
  Plus,
  X,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Circle,
  FileText,
  Image as ImageIcon,
  Scan,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Patient, Visit, DentalRecord, PatientFile, Invoice, Payment, Appointment } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { getPatient, deletePatient } from "../api/patients";
import { listAppointments } from "../api/appointments";
import { listVisits, createVisit } from "../api/visits";
import { listDentalRecords, createDentalRecord } from "../api/dentalRecords";
import { listPatientFiles, deletePatientFile, uploadPatientFile } from "../api/patientFiles";
import { listInvoices, addPayment } from "../api/invoices";
import { formatCurrency } from "../lib/format";
import PatientForm from "../components/PatientForm";
import DentalChart from "../components/DentalChart";
import { Skeleton } from "../app/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../app/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "../app/components/ui/alert-dialog";

type Tab = "profile" | "appointments" | "visits" | "dental" | "files" | "billing";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { canCreate, canEdit, canDelete, isLoading: authLoading } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Per-tab data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [dentalRecords, setDentalRecords] = useState<DentalRecord[]>([]);
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<PatientFile | null>(null);

  const fetchPatient = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getPatient(id)
      .then(({ data }) => { setPatient(data); setNotFound(false); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { if (!authLoading) fetchPatient(); }, [fetchPatient, authLoading]);

  // Lazy-load tab data the first time each tab is opened
  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set());

  useEffect(() => {
    if (!id || authLoading || loadedTabs.has(activeTab)) return;
    setLoadedTabs((prev) => new Set(prev).add(activeTab));

    switch (activeTab) {
      case "profile":
        listInvoices({ patient_id: id, limit: 200 })
          .then(({ data }) => setInvoices(data))
          .catch(() => {});
        break;
      case "appointments":
        listAppointments({ patient_id: id, limit: 100 })
          .then(({ data }) => setAppointments(data))
          .catch(() => toast.error("Failed to load appointments"));
        break;
      case "visits":
        listVisits({ patient_id: id, limit: 100 })
          .then(({ data }) => setVisits(data))
          .catch(() => toast.error("Failed to load visits"));
        break;
      case "dental":
        listDentalRecords({ patient_id: id, limit: 200 })
          .then(({ data }) => setDentalRecords(data))
          .catch(() => toast.error("Failed to load dental records"));
        break;
      case "files":
        listPatientFiles({ patient_id: id, limit: 100 })
          .then(({ data }) => setFiles(data))
          .catch(() => toast.error("Failed to load files"));
        break;
      case "billing":
        listInvoices({ patient_id: id, limit: 100 })
          .then(({ data }) => setInvoices(data))
          .catch(() => toast.error("Failed to load invoices"));
        break;
    }
  }, [activeTab, id, authLoading, loadedTabs]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deletePatient(id);
      toast.success("Patient deleted");
      navigate("/patients");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete patient");
    }
  };

  const handleAddVisit = async (v: Omit<Visit, "id" | "patient_id">) => {
    if (!id) return;
    try {
      const { data: created } = await createVisit({ patient_id: id, diagnosis: v.diagnosis, treatment: v.treatment, notes: v.notes });
      setVisits((prev) => [created, ...prev]);
      setShowVisitForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save visit");
    }
  };

  const handleAddDentalRecord = async (r: Omit<DentalRecord, "id" | "patient_id">) => {
    if (!id) return;
    try {
      const { data: created } = await createDentalRecord({
        patient_id: id,
        tooth_number: r.tooth_number,
        condition: r.condition,
        description: r.description,
        treatment: r.treatment,
        status: r.status,
      });
      setDentalRecords((prev) => [created, ...prev]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save dental record");
    }
  };

  const handleUploadFile = async (file: File, file_type: "xray" | "image" | "pdf", description: string) => {
    if (!id) return;
    try {
      const { data: newFile } = await uploadPatientFile(file, id, file_type, description);
      setFiles((prev) => [newFile, ...prev]);
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deletePatientFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  const handleAddPayment = async (invoiceId: string, amount: number, method: "cash" | "card" | "transfer") => {
    try {
      const { data: updated } = await addPayment(invoiceId, { amount, payment_method: method });
      setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? updated : inv)));
      setShowPaymentModal(null);
      toast.success("Payment recorded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (notFound || !patient) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {t("patientDetail.notFound")}{" "}
        <button className="text-primary hover:underline" onClick={() => navigate("/patients")}>
          {t("patientDetail.backToPatients")}
        </button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: t("patientDetail.tabs.profile"), icon: User },
    { id: "appointments", label: t("patientDetail.tabs.appointments"), icon: CalendarDays },
    { id: "visits", label: t("patientDetail.tabs.visits"), icon: Activity },
    { id: "dental", label: t("patientDetail.tabs.dental"), icon: Smile },
    { id: "files", label: t("patientDetail.tabs.files"), icon: FolderOpen },
    { id: "billing", label: t("patientDetail.tabs.billing"), icon: CreditCard },
  ];

  return (
    <div className="p-6">
      <div className="mb-5">
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/patients" onClick={(e) => { e.preventDefault(); navigate("/patients"); }}>
                {t("patientDetail.breadcrumb")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{patient.full_name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-base font-bold">
            {patient.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{patient.full_name}</h1>
            <p className="text-sm text-muted-foreground">
              {patient.phone} · {t("patientDetail.added", { date: formatDate(patient.created_at, isAr) })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-0.5 mb-6 overflow-x-auto border-b border-border pb-0">
        {tabs.map(({ id: tid, label, icon: Icon }) => (
          <button
            key={tid}
            onClick={() => setActiveTab(tid)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tid
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <ProfileTab
          patient={patient}
          invoices={invoices}
          onEdit={() => setShowEditForm(true)}
          canEdit={authLoading || canEdit()}
          canDelete={authLoading || canDelete()}
          onDelete={() => setShowDeleteConfirm(true)}
        />
      )}
      {activeTab === "appointments" && <AppointmentsTab appointments={appointments} />}
      {activeTab === "visits" && (
        <VisitsTab
          visits={visits}
          onAdd={handleAddVisit}
          canCreate={authLoading || canCreate()}
          showForm={showVisitForm}
          setShowForm={setShowVisitForm}
        />
      )}
      {activeTab === "dental" && (
        <DentalChart
          records={dentalRecords}
          onAddRecord={handleAddDentalRecord}
          canCreate={authLoading || canCreate()}
        />
      )}
      {activeTab === "files" && (
        <FilesTab
          files={files}
          canCreate={authLoading || canCreate()}
          onUpload={handleUploadFile}
          onDelete={handleDeleteFile}
          onPreview={setPreviewFile}
        />
      )}
      {activeTab === "billing" && (
        <BillingTab
          invoices={invoices}
          onAddPayment={(invId) => setShowPaymentModal(invId)}
          canCreate={authLoading || canCreate()}
        />
      )}

      <PatientForm
        patient={patient}
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSaved={() => { setShowEditForm(false); fetchPatient(); }}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("patients.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("patients.delete.description", { name: patient.full_name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showPaymentModal && (
        <PaymentModal
          invoiceId={showPaymentModal}
          onClose={() => setShowPaymentModal(null)}
          onSave={(amount, method) => handleAddPayment(showPaymentModal, amount, method)}
        />
      )}

      {previewFile && <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  );
}

// ─── Profile Tab ────────────────────────────────────────────────────────────
function ProfileTab({
  patient, invoices, onEdit, canEdit, canDelete, onDelete,
}: {
  patient: Patient; invoices: Invoice[]; onEdit: () => void; canEdit: boolean; canDelete: boolean; onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const totalBilled = invoices.reduce((s, i) => s + Number(i.total_amount), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.paid_amount), 0);
  const remaining = totalBilled - totalPaid;

  const rows = [
    { label: t("patientDetail.profile.fullName"), value: patient.full_name },
    { label: t("patientDetail.profile.phone"), value: patient.phone },
    { label: t("patientDetail.profile.dateOfBirth"), value: patient.date_of_birth ? formatDate(patient.date_of_birth, isAr) : null },
    { label: t("patientDetail.profile.gender"), value: patient.gender ? t(`patients.form.${patient.gender}`) : null },
    { label: t("patientDetail.profile.bloodType"), value: patient.blood_type },
    { label: t("patientDetail.profile.address"), value: patient.address },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-foreground">{t("patientDetail.profile.title")}</h3>
          <div className="flex items-center gap-3">
            {canEdit && (
              <button className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors" onClick={onEdit}>
                <Pencil className="w-4 h-4" /> {t("common.edit")}
              </button>
            )}
            {canDelete && (
              <button className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 font-medium transition-colors" onClick={onDelete}>
                <Trash2 className="w-4 h-4" /> {t("common.delete")}
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {rows.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm font-medium text-foreground">{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Balance summary */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{t("patientDetail.profile.totalBilled")}</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totalBilled)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{t("patientDetail.profile.totalPaid")}</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className={`rounded-xl border p-5 ${remaining > 0 ? "bg-amber-50 border-amber-200" : "bg-card border-border"}`}>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{t("patientDetail.profile.remaining")}</p>
            <p className={`text-lg font-bold ${remaining > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">{t("patientDetail.profile.allergies")}</p>
          <p className="text-sm text-foreground">{patient.allergies || t("patientDetail.profile.noAllergies")}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">{t("patientDetail.profile.medicalNotes")}</p>
          <p className="text-sm text-foreground leading-relaxed">{patient.medical_notes || t("patientDetail.profile.noNotes")}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Appointments Tab ─────────────────────────────────────────────────────────
function AppointmentsTab({ appointments }: { appointments: Appointment[] }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  if (appointments.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
        {t("patientDetail.appointments.noAppointments")}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {[t("patientDetail.appointments.date"), t("patientDetail.appointments.time"), t("patientDetail.appointments.status"), t("patientDetail.appointments.notes")].map((h) => (
              <th key={h} className="text-start px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {appointments.map((a) => (
            <tr key={a.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-5 py-3.5 font-medium">{formatDate(a.appointment_date, isAr)}</td>
              <td className="px-5 py-3.5 text-muted-foreground">{a.start_time} – {a.end_time}</td>
              <td className="px-5 py-3.5"><ApptStatusBadge status={a.status} /></td>
              <td className="px-5 py-3.5 text-muted-foreground">{a.notes || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Visits Tab ──────────────────────────────────────────────────────────────
function VisitsTab({
  visits, onAdd, canCreate, showForm, setShowForm,
}: {
  visits: Visit[];
  onAdd: (v: Omit<Visit, "id" | "patient_id">) => void;
  canCreate: boolean;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [form, setForm] = useState({ diagnosis: "", treatment: "", notes: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, date: new Date().toISOString().split("T")[0], doctor: "" });
    setForm({ diagnosis: "", treatment: "", notes: "" });
  };

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-4 h-4" /> {t("patientDetail.visits.addVisit")}
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">{t("patientDetail.visits.recordTitle")}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t("patientDetail.visits.diagnosis")} <span className="text-destructive">*</span>
              </label>
              <input required className={inputCls} value={form.diagnosis}
                onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
                placeholder={t("patientDetail.visits.diagnosisPlaceholder")} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t("patientDetail.visits.treatment")}</label>
              <input className={inputCls} value={form.treatment}
                onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))}
                placeholder={t("patientDetail.visits.treatmentPlaceholder")} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t("patientDetail.visits.notes")}</label>
              <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder={t("patientDetail.visits.notesPlaceholder")} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                onClick={() => setShowForm(false)}>
                {t("common.cancel")}
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                {t("patientDetail.visits.saveVisit")}
              </button>
            </div>
          </form>
        </div>
      )}

      {visits.length === 0 && !showForm ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
          {t("patientDetail.visits.noVisits")}
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <div key={v.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{v.diagnosis}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(v.date, isAr)} · {v.doctor}
                  </p>
                </div>
              </div>
              {v.treatment && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t("patientDetail.visits.treatment")}</p>
                  <p className="text-sm text-foreground">{v.treatment}</p>
                </div>
              )}
              {v.notes && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{t("patientDetail.visits.notes")}</p>
                  <p className="text-sm text-muted-foreground">{v.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Files Tab ───────────────────────────────────────────────────────────────
function FilesTab({
  files, canCreate, onUpload, onDelete, onPreview,
}: {
  files: PatientFile[];
  canCreate: boolean;
  onUpload: (file: File, file_type: "xray" | "image" | "pdf", description: string) => Promise<void>;
  onDelete: (id: string) => void;
  onPreview: (f: PatientFile) => void;
}) {
  const { t, i18n } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ file_type: "image" as "xray" | "image" | "pdf", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    await onUpload(selectedFile, form.file_type, form.description);
    setUploading(false);
    setShowForm(false);
    setSelectedFile(null);
    setForm({ file_type: "image", description: "" });
  };

  const fileIcon = (type: PatientFile["file_type"]) => {
    if (type === "xray") return <Scan className="w-5 h-5 text-blue-500" />;
    if (type === "pdf") return <FileText className="w-5 h-5 text-red-500" />;
    return <ImageIcon className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-4 h-4" /> {t("patientDetail.files.uploadFile")}
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">{t("patientDetail.files.uploadFile")}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t("patientDetail.files.file")}</label>
              <input
                type="file"
                required
                accept=".jpg,.jpeg,.png,.pdf"
                className={inputCls}
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t("patientDetail.files.type")}</label>
              <select className={inputCls} value={form.file_type} onChange={(e) => setForm((f) => ({ ...f, file_type: e.target.value as "xray" | "image" | "pdf" }))}>
                <option value="image">{t("patientDetail.files.typeImage")}</option>
                <option value="xray">{t("patientDetail.files.typeXray")}</option>
                <option value="pdf">{t("patientDetail.files.typePdf")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t("patientDetail.files.description")}</label>
              <input className={inputCls} value={form.description} placeholder={t("patientDetail.files.descriptionPlaceholder")}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={uploading || !selectedFile}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                {uploading ? t("patientDetail.files.uploading") : t("patientDetail.files.upload")}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors">
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {files.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
          {t("patientDetail.files.noFiles")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {files.map((f) => (
            <div key={f.id} className="bg-card rounded-xl border border-border overflow-hidden group">
              {f.file_type !== "pdf" ? (
                <div className="relative h-36 bg-muted overflow-hidden">
                  <img src={f.file_url} alt={f.description}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button className="bg-white text-foreground rounded-lg px-3 py-1.5 text-xs font-medium shadow"
                      onClick={() => onPreview(f)}>
                      {t("patientDetail.files.preview")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-36 bg-red-50 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-red-300" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {fileIcon(f.file_type)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{f.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(f.created_at, i18n.language === "ar")}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                      onClick={() => onPreview(f)}>
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <a href={f.file_url} download target="_blank" rel="noreferrer"
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground inline-flex">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(f.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Billing Tab ─────────────────────────────────────────────────────────────
function BillingTab({
  invoices, onAddPayment, canCreate,
}: {
  invoices: Invoice[];
  onAddPayment: (id: string) => void;
  canCreate: boolean;
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {invoices.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
          {t("patientDetail.billing.noInvoices")}
        </div>
      ) : (
        invoices.map((inv) => {
          const remaining = inv.total_amount - inv.paid_amount;
          const isOpen = expanded === inv.id;
          return (
            <div key={inv.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(isOpen ? null : inv.id)}
              >
                <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("patientDetail.billing.invoice")}</p>
                    <p className="text-sm font-semibold text-foreground">{inv.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("patientDetail.billing.total")}</p>
                    <p className="text-sm font-semibold">{formatCurrency(inv.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("patientDetail.billing.paid")}</p>
                    <p className="text-sm font-semibold text-emerald-600">{formatCurrency(inv.paid_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("patientDetail.billing.remaining")}</p>
                    <p className={`text-sm font-semibold ${remaining > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {formatCurrency(remaining)}
                    </p>
                  </div>
                </div>
                <InvoiceStatusBadge status={inv.status} />
              </div>

              {isOpen && (
                <div className="border-t border-border px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">{t("patientDetail.billing.paymentHistory")}</h4>
                    {canCreate && remaining > 0 && (
                      <button
                        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        onClick={(e) => { e.stopPropagation(); onAddPayment(inv.id); }}
                      >
                        <Plus className="w-4 h-4" /> {t("patientDetail.billing.addPayment")}
                      </button>
                    )}
                  </div>
                  {inv.payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("patientDetail.billing.noPayments")}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {[t("patientDetail.billing.colAmount"), t("patientDetail.billing.colMethod"), t("patientDetail.billing.colDate"), t("patientDetail.billing.colReceivedBy")].map((h) => (
                            <th key={h} className="text-start pb-2 text-xs font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {inv.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2 font-semibold text-emerald-600">{formatCurrency(p.amount)}</td>
                            <td className="py-2 capitalize text-muted-foreground">{t(`common.paymentMethod.${p.payment_method}`)}</td>
                            <td className="py-2 text-muted-foreground">{formatDate(p.payment_date, isAr)}</td>
                            <td className="py-2 text-muted-foreground">{p.received_by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Payment Modal ───────────────────────────────────────────────────────────
function PaymentModal({
  invoiceId, onClose, onSave,
}: {
  invoiceId: string;
  onClose: () => void;
  onSave: (amount: number, method: "cash" | "card" | "transfer") => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Payment["payment_method"]>("cash");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(parseFloat(amount), method);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{t("patientDetail.billing.addPayment")} — {invoiceId.slice(0, 8).toUpperCase()}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("patientDetail.billing.amount")} <span className="text-destructive">*</span></label>
            <input required type="number" min="1" step="0.01" className={inputCls}
              value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("patientDetail.billing.paymentMethod")}</label>
            <select className={inputCls} value={method}
              onChange={(e) => setMethod(e.target.value as Payment["payment_method"])}>
              <option value="cash">{t("common.paymentMethod.cash")}</option>
              <option value="card">{t("common.paymentMethod.card")}</option>
              <option value="transfer">{t("common.paymentMethod.transfer")}</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              {t("common.cancel")}
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              {t("patientDetail.billing.recordPayment")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── File Preview Modal ──────────────────────────────────────────────────────
function FilePreviewModal({ file, onClose }: { file: PatientFile; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl overflow-hidden max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <p className="font-medium text-foreground text-sm">{file.description}</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <img src={file.file_url} alt={file.description} className="w-full object-contain max-h-[70vh]" />
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ApptStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === "completed")
    return <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium"><CheckCircle2 className="w-3 h-3" /> {t("common.status.completed")}</span>;
  if (status === "cancelled")
    return <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium"><XCircle className="w-3 h-3" /> {t("common.status.cancelled")}</span>;
  return <span className="flex items-center gap-1 text-xs text-primary bg-secondary px-2 py-0.5 rounded-full font-medium"><Circle className="w-3 h-3" /> {t("common.status.scheduled")}</span>;
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === "paid") return <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">{t("common.invoiceStatus.paid")}</span>;
  if (status === "partially_paid") return <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold">{t("common.invoiceStatus.partial")}</span>;
  return <span className="text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full font-semibold">{t("common.invoiceStatus.unpaid")}</span>;
}

function formatDate(d: string, isAr = false) {
  return new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

const inputCls = "w-full px-3.5 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow";
