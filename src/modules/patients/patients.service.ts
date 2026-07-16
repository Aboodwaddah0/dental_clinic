import NodeCache from "node-cache";
import { supabase } from "../../lib/supabase.js";
import { NotFoundError } from "../../lib/errors.js";
import { NOT_FOUND_CODE } from "../../lib/pg-error-codes.js";
import type { CreatePatientInput, ListPatientsQuery, UpdatePatientInput } from "./patients.schema.js";

const cache = new NodeCache({ stdTTL: 300 });

function listKey(q: ListPatientsQuery) {
  return `list:${q.search ?? ""}:${q.limit}:${q.offset}`;
}

function patientKey(id: string) {
  return `patient:${id}`;
}

function invalidateAll() {
  cache.flushAll();
}

export async function getPatientById(id: string) {
  const cached = cache.get(patientKey(id));
  if (cached) return cached;

  const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();

  if (error) {
    if (error.code === NOT_FOUND_CODE) {
      throw new NotFoundError("Patient not found");
    }
    throw new Error(error.message);
  }

  cache.set(patientKey(id), data);
  return data;
}

export async function listPatients(q: ListPatientsQuery) {
  const key = listKey(q);

  const cached = cache.get<{
    data: unknown[];
    count: number;
  }>(key);


  if (cached) {
    console.log("LIST CACHE HIT:", key);
    return cached;
  }


  console.log("LIST CACHE MISS:", key);

  console.log("QUERYING SUPABASE PATIENT LIST");


  let query = supabase
    .from("patients")
    .select("*", { count: "exact" });


  if (q.search) {
    const safeSearch = q.search.replace(/[,()]/g, "");

    query = query.or(
      `full_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`
    );
  }


  const {
    data,
    error,
    count,
  } = await query
    .order("created_at", {
      ascending: false,
    })
    .range(
      q.offset,
      q.offset + q.limit - 1
    );


  if (error) {
    throw new Error(error.message);
  }


  const result = {
    data,
    count: count ?? 0,
  };


  cache.set(key, result);


  console.log("LIST CACHE SET:", key);

  console.log(cache.getStats());


  return result;
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

  invalidateAll();
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

  invalidateAll();
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

  invalidateAll();
  return data[0];
}
