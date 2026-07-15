import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Patient } from "../types";
import { createPatient, updatePatient } from "../api/patients";
import { ApiError } from "../api/types";
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

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const patientSchema = z.object({
  full_name: z.string().min(1, "Name is required."),
  phone: z.string().min(1, "Phone is required."),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().optional(),
  blood_type: z.string().optional(),
  allergies: z.string().optional(),
  medical_notes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface Props {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function PatientForm({ patient, open, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    values: {
      full_name: patient?.full_name ?? "",
      phone: patient?.phone ?? "",
      date_of_birth: patient?.date_of_birth ?? "",
      gender: patient?.gender ?? undefined,
      address: patient?.address ?? "",
      blood_type: patient?.blood_type ?? "",
      allergies: patient?.allergies ?? "",
      medical_notes: patient?.medical_notes ?? "",
    },
  });

  const onSubmit = async (values: PatientFormValues) => {
    const payload = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== "" && v !== undefined)
    ) as PatientFormValues;
    try {
      if (patient) {
        await updatePatient(patient.id, payload);
        toast.success("Patient updated");
      } else {
        await createPatient(payload);
        toast.success("Patient created");
      }
      reset();
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && typeof err.body !== "string") {
        let handled = false;
        for (const field of ["full_name", "phone"] as const) {
          const message = err.fieldError(field);
          if (message) {
            setError(field, { message });
            handled = true;
          }
        }
        if (!handled) toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {patient ? t("patients.form.editPatient") : t("patients.form.newPatient")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">
                {t("patients.form.fullName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                {...register("full_name")}
                placeholder={t("patients.form.fullNamePlaceholder")}
              />
              {errors.full_name && (
                <p className="text-xs text-destructive">{t("patients.form.nameRequired")}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">
                {t("patients.form.phone")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder={t("patients.form.phonePlaceholder")}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{t("patients.form.phoneRequired")}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date_of_birth">{t("patients.form.dateOfBirth")}</Label>
              <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
            </div>

            <div className="space-y-1.5">
              <Label>{t("patients.form.gender")}</Label>
              <Select
                value={watch("gender") ?? undefined}
                onValueChange={(v) => setValue("gender", v as PatientFormValues["gender"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("patients.form.selectGender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("patients.form.male")}</SelectItem>
                  <SelectItem value="female">{t("patients.form.female")}</SelectItem>
                  <SelectItem value="other">{t("patients.form.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("patients.form.bloodType")}</Label>
              <Select
                value={watch("blood_type") || undefined}
                onValueChange={(v) => setValue("blood_type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("patients.form.selectBloodType")} />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">{t("patients.form.address")}</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder={t("patients.form.addressPlaceholder")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="allergies">{t("patients.form.allergies")}</Label>
            <Input
              id="allergies"
              {...register("allergies")}
              placeholder={t("patients.form.allergiesPlaceholder")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="medical_notes">{t("patients.form.medicalNotes")}</Label>
            <Textarea
              id="medical_notes"
              rows={3}
              {...register("medical_notes")}
              placeholder={t("patients.form.medicalNotesPlaceholder")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {patient ? t("patients.form.saveChanges") : t("patients.form.createPatient")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
