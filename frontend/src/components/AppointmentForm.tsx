import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { createAppointment } from "../api/appointments";
import { listPatients } from "../api/patients";
import { ApiError } from "../api/types";
import type { Patient } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../app/components/ui/dialog";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import { Textarea } from "../app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../app/components/ui/select";

const today = new Date().toISOString().split("T")[0];

const appointmentSchema = z
  .object({
    patient_id: z.string().min(1, "Please select a patient."),
    appointment_date: z.string().min(1, "Date is required."),
    start_time: z.string().min(1, "Start time is required."),
    end_time: z.string().min(1, "End time is required."),
    notes: z.string().optional(),
  })
  .refine((d) => d.end_time > d.start_time, {
    message: "End time must be after start time.",
    path: ["end_time"],
  });

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AppointmentForm({ open, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [conflictError, setConflictError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: "",
      appointment_date: today,
      start_time: "09:00",
      end_time: "09:30",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    listPatients({ limit: 100 })
      .then((res) => setPatients(res.data))
      .catch(() => toast.error("Failed to load patients"));
  }, [open]);

  const onSubmit = async (values: AppointmentFormValues) => {
    if (!user) return;
    setConflictError("");
    try {
      await createAppointment({ ...values, doctor_id: user.id });
      toast.success("Appointment booked");
      reset();
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setConflictError(err.message);
      } else if (err instanceof ApiError && typeof err.body !== "string" && err.fieldError("patient_id")) {
        setConflictError("");
        toast.error(err.fieldError("patient_id")!);
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to book appointment");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <Select value={watch("patient_id") || undefined} onValueChange={(v) => setValue("patient_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.patient_id && <p className="text-xs text-destructive">{errors.patient_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appointment_date">Date</Label>
            <Input id="appointment_date" type="date" {...register("appointment_date")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_time">Start Time</Label>
              <Input id="start_time" type="time" {...register("start_time")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time">End Time</Label>
              <Input id="end_time" type="time" {...register("end_time")} />
              {errors.end_time && <p className="text-xs text-destructive">{errors.end_time.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} {...register("notes")} placeholder="Reason for visit…" />
          </div>

          {conflictError && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 font-medium">{conflictError}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Book Appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
