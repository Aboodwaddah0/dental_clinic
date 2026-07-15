import { supabase } from "../../lib/supabase.js";
import { NotFoundError } from "../../lib/errors.js";
import { NOT_FOUND_CODE } from "../../lib/pg-error-codes.js";
import type { CreatePatientInput, ListPatientsQuery, UpdatePatientInput } from "./patients.schema.js";

export async function getPatientById(id: string) {
  const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();

  if (error) {
    if (error.code === NOT_FOUND_CODE) {
      throw new NotFoundError("Patient not found");
    }
    throw new Error(error.message);
  }

  return data;
}

export async function listPatients({ search, limit, offset }: ListPatientsQuery) {
  let query = supabase.from("patients").select("*", { count: "exact" });

  if (search) {
    const safeSearch = search.replace(/[,()]/g, "");
    query = query.or(`full_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  return { data, count: count ?? 0 };
}

export async function createPatient(patientData: CreatePatientInput, registeredBy: string) {
  const { data, error } = await supabase
    .from("patients")
    .insert({ ...patientData, registered_by: registeredBy })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updatePatient(id: string, patientData: UpdatePatientInput) {
  const { data, error } = await supabase
    .from("patients")
    .update(patientData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === NOT_FOUND_CODE) {
      throw new NotFoundError("Patient not found");
    }
    throw new Error(error.message);
  }

  return data;
}

export async function deletePatient(id: string) {
  const { data, error } = await supabase.from("patients").delete().eq("id", id).select();

  if (error) {
    throw new Error(error.message);
  }

  if (data.length === 0) {
    throw new NotFoundError("Patient not found");
  }

  return data[0];
}
