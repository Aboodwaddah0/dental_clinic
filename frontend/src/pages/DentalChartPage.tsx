import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { listPatients } from "../api/patients";
import { listDentalRecords, createDentalRecord } from "../api/dentalRecords";
import type { Patient, DentalRecord } from "../types";
import DentalChart from "../components/DentalChart";

export default function DentalChartPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [records, setRecords] = useState<DentalRecord[]>([]);

  useEffect(() => {
    listPatients({ limit: 100 })
      .then(({ data }) => {
        setPatients(data);
        if (data.length > 0) setSelectedPatientId(data[0].id);
      })
      .catch(() => toast.error("Failed to load patients"));
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    listDentalRecords({ patient_id: selectedPatientId, limit: 200 })
      .then(({ data }) => setRecords(data))
      .catch(() => toast.error("Failed to load dental records"));
  }, [selectedPatientId]);

  const patient = patients.find((p) => p.id === selectedPatientId);

  const handleAddRecord = async (r: Omit<DentalRecord, "id" | "patient_id">) => {
    try {
      const { data } = await createDentalRecord({ ...r, patient_id: selectedPatientId });
      setRecords((prev) => [data, ...prev]);
    } catch {
      toast.error("Failed to save dental record");
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dental Chart</h1>
          <p className="text-sm text-muted-foreground mt-0.5">FDI notation — click a tooth to view or add records</p>
        </div>
      </div>

      {/* Patient selector */}
      <div className="bg-card rounded-xl border border-border p-4">
        <label className="block text-sm font-medium text-muted-foreground mb-2">Select Patient</label>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <select
            className="w-full pl-9 pr-4 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>

        {patient && (
          <div className="mt-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {patient.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{patient.full_name}</p>
              <p className="text-xs text-muted-foreground">{patient.phone}</p>
            </div>
            <button
              className="ml-auto text-xs text-primary font-medium hover:underline"
              onClick={() => navigate(`/patients/${patient.id}?tab=dental`)}
            >
              View full profile →
            </button>
          </div>
        )}
      </div>

      <DentalChart records={records} onAddRecord={handleAddRecord} canCreate={true} />
    </div>
  );
}
