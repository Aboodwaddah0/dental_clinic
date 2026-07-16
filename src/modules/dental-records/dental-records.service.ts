import { supabase } from "../../lib/supabase.js";
import { NotFoundError } from "../../lib/errors.js";
import type { CreateDentalRecordInput, UpdateDentalRecordInput, ListDentalRecordsQuery } from "./dental-records.schema.js";

const DR_SELECT = "id, patient_id, tooth_number, condition, description, treatment, status, created_at, doctor:profiles!doctor_id(full_name)";

function flattenRecord(row: any) {
  return {
    id:           row.id,
    patient_id:   row.patient_id,
    tooth_number: row.tooth_number,
    condition:    row.condition ?? "",
    description:  row.description ?? "",
    treatment:    row.treatment ?? "",
    status:       row.status,
    date:         row.created_at,
    doctor:       row.doctor?.full_name ?? "",
  };
}

export async function listDentalRecords({ patient_id, limit, offset }: ListDentalRecordsQuery) {
  const { data, error, count } = await supabase
    .from("dental_records")
    .select(DR_SELECT, { count: "exact" })
    .eq("patient_id", patient_id)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return { data: (data ?? []).map(flattenRecord), count: count ?? 0 };
}

export async function getDentalRecordById(id: string) {
  const { data, error } = await supabase
    .from("dental_records")
    .select(DR_SELECT)
    .eq("id", id)
    .single();

  if (error) throw new NotFoundError("Dental record not found");
  return flattenRecord(data);
}

export async function createDentalRecord(input: CreateDentalRecordInput, doctorId: string) {
  const { patient_id, tooth_number, condition, description, treatment, status } = input;

  const { data, error } = await supabase
    .from("dental_records")
    .insert({ patient_id, tooth_number, condition, description, treatment, status, doctor_id: doctorId })
    .select(DR_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return flattenRecord(data);
}

export async function updateDentalRecord(id: string, input: UpdateDentalRecordInput) {
  const { data, error } = await supabase
    .from("dental_records")
    .update(input)
    .eq("id", id)
    .select(DR_SELECT)
    .single();

  if (error) throw new NotFoundError("Dental record not found");
  return flattenRecord(data);
}

export async function deleteDentalRecord(id: string) {
  const { data, error } = await supabase
    .from("dental_records")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data.length) throw new NotFoundError("Dental record not found");
}
