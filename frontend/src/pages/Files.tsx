import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Download, Eye, Trash2, FileText, Image as ImageIcon, Scan, X } from "lucide-react";
import { mockFiles, mockPatients } from "../data/mockData";
import type { PatientFile } from "../types";

export default function Files() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<PatientFile[]>(mockFiles);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [preview, setPreview] = useState<PatientFile | null>(null);

  const filtered = files.filter((f) => {
    const patient = mockPatients.find((p) => p.id === f.patient_id);
    const matchSearch = !search || f.description.toLowerCase().includes(search.toLowerCase()) || patient?.full_name.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || f.file_type === filterType;
    return matchSearch && matchType;
  });

  const fileIcon = (type: PatientFile["file_type"]) => {
    if (type === "xray") return <Scan className="w-5 h-5 text-blue-500" />;
    if (type === "pdf") return <FileText className="w-5 h-5 text-red-500" />;
    return <ImageIcon className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold text-foreground">Files</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search files or patient name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All types</option>
          <option value="xray">X-Ray</option>
          <option value="image">Image</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground text-sm">
          No files found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((f) => {
            const patient = mockPatients.find((p) => p.id === f.patient_id);
            return (
              <div key={f.id} className="bg-card rounded-xl border border-border overflow-hidden group">
                {f.file_type !== "pdf" ? (
                  <div className="relative h-40 bg-muted overflow-hidden">
                    <img
                      src={f.file_url}
                      alt={f.description}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        className="bg-white text-foreground rounded-lg px-3 py-1.5 text-xs font-medium shadow"
                        onClick={() => setPreview(f)}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 bg-red-50 flex items-center justify-center">
                    <FileText className="w-14 h-14 text-red-200" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    {fileIcon(f.file_type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{f.description}</p>
                      <button
                        className="text-xs text-primary hover:underline"
                        onClick={() => navigate(`/patients/${f.patient_id}`)}
                      >
                        {patient?.full_name}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{formatDate(f.created_at)}</p>
                    <div className="flex gap-1">
                      <button
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        onClick={() => setPreview(f)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-destructive"
                        onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-card rounded-xl overflow-hidden max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <p className="font-medium text-sm text-foreground">{preview.description}</p>
              <button onClick={() => setPreview(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={preview.file_url} alt={preview.description} className="w-full object-contain max-h-[70vh]" />
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
