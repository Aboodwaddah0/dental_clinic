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
import type { Patient, Visit, DentalRecord, PatientFile, Invoice, Payment, Appointment } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { getPatient, deletePatient } from "../api/patients";
import { listAppointments } from "../api/appointments";
import { listVisits, createVisit } from "../api/visits";
import { listDentalRecords, createDentalRecord } from "../api/dentalRecords";
import { listPatientFiles, deletePatientFile } from "../api/patientFiles";
import { listInvoices, addPayment } from "../api/invoices";
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
        Patient not found.{" "}
        <button className="text-primary hover:underline" onClick={() => navigate("/patients")}>
          Back to patients
        </button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appointments", label: "Appointments", icon: CalendarDays },
    { id: "visits", label: "Visits", icon: Activity },
    { id: "dental", label: "Dental Chart", icon: Smile },
    { id: "files", label: "Files", icon: FolderOpen },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  return (
    <div className="p-6">
      <div className="mb-5">
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/patients" onClick={(e) => { e.preventDefault(); navigate("/patients"); }}>
                Patients
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
              {patient.phone} · Added {formatDate(patient.created_at)}
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
          onEdit={() => setShowEditForm(true)}
          canEdit={canEdit()}
          canDelete={canDelete()}
          onDelete={() => setShowDeleteConfirm(true)}
        />
      )}
      {activeTab === "appointments" && <AppointmentsTab appointments={appointments} />}
      {activeTab === "visits" && (
        <VisitsTab
          visits={visits}
          onAdd={handleAddVisit}
          canCreate={canCreate()}
          showForm={showVisitForm}
          setShowForm={setShowVisitForm}
        />
      )}
      {activeTab === "dental" && (
        <DentalChart
          records={dentalRecords}
          onAddRecord={handleAddDentalRecord}
          canCreate={canCreate()}
        />
      )}
      {activeTab === "files" && (
        <FilesTab
          files={files}
          canCreate={canCreate()}
          onDelete={handleDeleteFile}
          onPreview={setPreviewFile}
        />
      )}
      {activeTab === "billing" && (
        <BillingTab
          invoices={invoices}
          onAddPayment={(invId) => setShowPaymentModal(invId)}
          canCreate={canCreate()}
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
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{patient.full_name}</strong>? This action cannot be undone.
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
  patient, onEdit, canEdit, canDelete, onDelete,
}: {
  patient: Patient; onEdit: () => void; canEdit: boolean; canDelete: boolean; onDelete: () => void;
}) {
  const rows = [
    { label: "Full Name", value: patient.full_name },
    { label: "Phone", value: patient.phone },
    { label: "Date of Birth", value: patient.date_of_birth ? formatDate(patient.date_of_birth) : null },
    { label: "Gender", value: patient.gender, capitalize: true },
    { label: "Blood Type", value: patient.blood_type },
    { label: "Address", value: patient.address },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-foreground">Patient Information</h3>
          <div className="flex items-center gap-3">
            {canEdit && (
              <button className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors" onClick={onEdit}>
                <Pencil className="w-4 h-4" /> Edit
              </button>
            )}
            {canDelete && (
              <button className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 font-medium transition-colors" onClick={onDelete}>
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {rows.map(({ label, value, capitalize }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-sm font-medium text-foreground ${capitalize ? "capitalize" : ""}`}>{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Allergies</p>
          <p className="text-sm text-foreground">{patient.allergies || "None known"}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Medical Notes</p>
          <p className="text-sm text-foreground leading-relaxed">{patient.medical_notes || "No notes recorded."}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Appointments Tab ─────────────────────────────────────────────────────────
function AppointmentsTab({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
        No appointments recorded for this patient.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {["Date", "Time", "Status", "Notes"].map((h) => (
              <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {appointments.map((a) => (
            <tr key={a.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-5 py-3.5 font-medium">{formatDate(a.appointment_date)}</td>
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
            <Plus className="w-4 h-4" /> Add Visit
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Record New Visit</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Diagnosis <span className="text-destructive">*</span>
              </label>
              <input required className={inputCls} value={form.diagnosis}
                onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
                placeholder="Primary diagnosis…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Treatment</label>
              <input className={inputCls} value={form.treatment}
                onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))}
                placeholder="Treatment performed…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
              <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes…" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                Save Visit
              </button>
            </div>
          </form>
        </div>
      )}

      {visits.length === 0 && !showForm ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
          No visits recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <div key={v.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{v.diagnosis}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(v.date)} · {v.doctor}
                  </p>
                </div>
              </div>
              {v.treatment && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Treatment</p>
                  <p className="text-sm text-foreground">{v.treatment}</p>
                </div>
              )}
              {v.notes && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
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
  files, canCreate, onDelete, onPreview,
}: {
  files: PatientFile[];
  canCreate: boolean;
  onDelete: (id: string) => void;
  onPreview: (f: PatientFile) => void;
}) {
  const fileIcon = (type: PatientFile["file_type"]) => {
    if (type === "xray") return <Scan className="w-5 h-5 text-blue-500" />;
    if (type === "pdf") return <FileText className="w-5 h-5 text-red-500" />;
    return <ImageIcon className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors opacity-60 cursor-not-allowed">
            <Plus className="w-4 h-4" /> Upload File
          </button>
        </div>
      )}

      {files.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
          No files uploaded.
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
                      Preview
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
                      <p className="text-xs text-muted-foreground">{formatDate(f.created_at)}</p>
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
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {invoices.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center text-muted-foreground text-sm">
          No invoices found.
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
                    <p className="text-xs text-muted-foreground">Invoice</p>
                    <p className="text-sm font-semibold text-foreground">{inv.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-sm font-semibold">${inv.total_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-sm font-semibold text-emerald-600">${inv.paid_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className={`text-sm font-semibold ${remaining > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                      ${remaining.toLocaleString()}
                    </p>
                  </div>
                </div>
                <InvoiceStatusBadge status={inv.status} />
              </div>

              {isOpen && (
                <div className="border-t border-border px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">Payment History</h4>
                    {canCreate && remaining > 0 && (
                      <button
                        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                        onClick={(e) => { e.stopPropagation(); onAddPayment(inv.id); }}
                      >
                        <Plus className="w-4 h-4" /> Add Payment
                      </button>
                    )}
                  </div>
                  {inv.payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payments recorded.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {["Amount", "Method", "Date", "Received By"].map((h) => (
                            <th key={h} className="text-left pb-2 text-xs font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {inv.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2 font-semibold text-emerald-600">${p.amount.toLocaleString()}</td>
                            <td className="py-2 capitalize text-muted-foreground">{p.payment_method}</td>
                            <td className="py-2 text-muted-foreground">{formatDate(p.date)}</td>
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
          <h3 className="font-semibold text-foreground">Add Payment — {invoiceId.slice(0, 8).toUpperCase()}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Amount ($) <span className="text-destructive">*</span></label>
            <input required type="number" min="1" step="0.01" className={inputCls}
              value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Payment Method</label>
            <select className={inputCls} value={method}
              onChange={(e) => setMethod(e.target.value as Payment["payment_method"])}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              Record Payment
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
  if (status === "completed")
    return <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
  if (status === "cancelled")
    return <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium"><XCircle className="w-3 h-3" /> Cancelled</span>;
  return <span className="flex items-center gap-1 text-xs text-primary bg-secondary px-2 py-0.5 rounded-full font-medium"><Circle className="w-3 h-3" /> Scheduled</span>;
}

function InvoiceStatusBadge({ status }: { status: string }) {
  if (status === "paid") return <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">Paid</span>;
  if (status === "partial") return <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold">Partial</span>;
  return <span className="text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full font-semibold">Pending</span>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const inputCls = "w-full px-3.5 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow";
