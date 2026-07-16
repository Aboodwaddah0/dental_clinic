import { UploadPatientFileInput, ListPatientFilesQuery } from "./patient_files.schema.js";
import { supabase } from "../../lib/supabase.js";

export async function listPatientFiles({ patient_id, limit, offset }: ListPatientFilesQuery) {
  const { data, error, count } = await supabase
    .from("patient_files")
    .select("*", { count: "exact" })
    .eq("patient_id", patient_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return { data, count: count ?? 0 };
}

export async function uploadPatientFile(params: UploadPatientFileInput, fileUrl: string, doctorId: string) {
  const { data, error } = await supabase
    .from("patient_files")
    .insert({
      patient_id: params.patient_id,
      file_type: params.file_type,
      description: params.description,
      file_url: fileUrl,
      uploaded_by: doctorId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}


export async function deletePatientFile(file_id: string) {
  const { data, error } = await supabase
    .from("patient_files")
    .delete()
    .eq("id", file_id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}


