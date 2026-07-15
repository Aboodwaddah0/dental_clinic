import { useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    email: "doctor@dentaflow.com",
    clinic_name: "Mitchell Family Dentistry",
    clinic_address: "500 Medical Plaza, Boston, MA 02115",
    clinic_phone: "+1 (555) 100-2000",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-foreground mb-6">Settings</h1>

      <form onSubmit={handleSave} className="space-y-5">
        <section className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input className={inputCls} value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
        </section>

        <section className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Clinic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Clinic Name</label>
              <input className={inputCls} value={form.clinic_name} onChange={(e) => setForm((f) => ({ ...f, clinic_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Address</label>
              <input className={inputCls} value={form.clinic_address} onChange={(e) => setForm((f) => ({ ...f, clinic_address: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input className={inputCls} value={form.clinic_phone} onChange={(e) => setForm((f) => ({ ...f, clinic_phone: e.target.value }))} />
            </div>
          </div>
        </section>

        <button
          type="submit"
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${saved ? "bg-emerald-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
