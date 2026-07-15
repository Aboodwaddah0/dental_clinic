import { supabase } from "../../lib/supabase.js";
import { NotFoundError } from "../../lib/errors.js";
import type { CreateVisitInput, UpdateVisitInput, ListVisitsQuery } from "./visits.schema.js";

const VISIT_SELECT = "id, patient_id, appointment_id, diagnosis, treatment, notes, created_at, doctor:profiles!doctor_id(full_name)";

function flattenVisit(row: any) {
  return {
    ...row,
    doctor: row.doctor?.full_name ?? null,
    date: row.created_at,
  };
}

export async function listVisits({ patient_id, limit, offset }: ListVisitsQuery) {
  const { data, error, count } = await supabase
    .from("visits")
    .select(VISIT_SELECT, { count: "exact" })
    .eq("patient_id", patient_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return { data: (data ?? []).map(flattenVisit), count: count ?? 0 };
}

export async function getVisitById(id: string) {
  const { data, error } = await supabase
    .from("visits")
    .select(VISIT_SELECT)
    .eq("id", id)
    .single();

  if (error) throw new NotFoundError("Visit not found");
  return flattenVisit(data);
}

export async function createVisit(input: CreateVisitInput, doctorId: string) {
  const { data, error } = await supabase
    .from("visits")
    .insert({ ...input, doctor_id: doctorId })
    .select(VISIT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return flattenVisit(data);
}

export async function updateVisit(id: string, input: UpdateVisitInput) {
  const { data, error } = await supabase
    .from("visits")
    .update(input)
    .eq("id", id)
    .select(VISIT_SELECT)
    .single();

  if (error) throw new NotFoundError("Visit not found");
  return flattenVisit(data);
}

export async function deleteVisit(id: string) {
  const { data, error } = await supabase
    .from("visits")
    .delete()
    .eq("id", id)
    .select();

  if (error) throw new Error(error.message);
  if (!data.length) throw new NotFoundError("Visit not found");
  return data[0];
}
