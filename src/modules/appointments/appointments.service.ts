import { supabase } from "../../lib/supabase.js";
import { ConflictError, NotFoundError, ValidationError } from "../../lib/errors.js";
import { isConstraintViolation, NOT_FOUND_CODE } from "../../lib/pg-error-codes.js";
import type { CreateAppointmentInput, ListAppointmentsQuery, UpdateAppointmentInput } from "./appointments.schema.js";

// Any existing, non-cancelled appointment for this doctor on the same date
// whose time range overlaps [start, end) counts as a conflict. excludeId
// lets an update skip comparing an appointment against itself.
async function hasConflict(
  doctorId: string,
  appointmentDate: string,
  start: string,
  end: string,
  excludeId?: string,
) {
  let query = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("doctor_id", doctorId)
    .eq("appointment_date", appointmentDate)
    .neq("status", "cancelled")
    .lt("start_time", end)
    .gt("end_time", start);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (count ?? 0) > 0;
}

export async function listAppointments({ doctor_id, patient_id, status, from, to, limit, offset }: ListAppointmentsQuery) {
  let query = supabase.from("appointments").select("*", { count: "exact" });

  if (doctor_id) query = query.eq("doctor_id", doctor_id);
  if (patient_id) query = query.eq("patient_id", patient_id);
  if (status) query = query.eq("status", status);
  if (from) query = query.gte("appointment_date", from);
  if (to) query = query.lte("appointment_date", to);

  const { data, error, count } = await query
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  return { data, count: count ?? 0 };
}

export async function getAppointmentById(id: string) {
  const { data, error } = await supabase.from("appointments").select("*").eq("id", id).single();

  if (error) {
    if (error.code === NOT_FOUND_CODE) {
      throw new NotFoundError("Appointment not found");
    }
    throw new Error(error.message);
  }

  return data;
}



function isPastDateTime(date: string, time: string): boolean {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute) < new Date();
}

export async function createAppointment(params: CreateAppointmentInput) {
  const { doctor_id, appointment_date, start_time, end_time } = params;

  if (start_time >= end_time) {
    throw new ValidationError("start_time must be before end_time");
  }

  if (isPastDateTime(appointment_date, start_time)) {
    throw new ValidationError("Cannot book an appointment in the past");
  }

  const conflict = await hasConflict(doctor_id, appointment_date, start_time, end_time);
  if (conflict) {
    throw new ConflictError("Doctor already has an appointment overlapping this time range");
  }

  const { data, error } = await supabase.from("appointments").insert(params).select().single();

  if (error) {
    if (isConstraintViolation(error.code)) {
      throw new ValidationError(error.message);
    }
    throw new Error(error.message);
  }

  return data;
}

export async function updateAppointment(id: string, input: UpdateAppointmentInput) {
  const existing = await getAppointmentById(id);

  const nextDate = input.appointment_date ?? existing.appointment_date;
  const nextStart = input.start_time ?? existing.start_time;
  const nextEnd = input.end_time ?? existing.end_time;

  if (nextEnd <= nextStart) {
    throw new ValidationError("end_time must be after start_time");
  }

  if (input.appointment_date || input.start_time || input.end_time) {
    const conflict = await hasConflict(existing.doctor_id, nextDate, nextStart, nextEnd, id);
    if (conflict) {
      throw new ConflictError("Doctor already has an appointment overlapping this time range");
    }
  }

  const { data, error } = await supabase.from("appointments").update(input).eq("id", id).select().single();

  if (error) {
    if (error.code === NOT_FOUND_CODE) {
      throw new NotFoundError("Appointment not found");
    }
    if (isConstraintViolation(error.code)) {
      throw new ValidationError(error.message);
    }
    throw new Error(error.message);
  }

  return data;
}


export async function cancelAppointment(id: string, notes?: string) {
  return updateAppointment(id, { status: "cancelled", notes });
}

export async function checkAppointmentStatus() {

   const now = new Date().toISOString();

   const { data: appointments, error } = await supabase
    .from("appointments")
    .select("id, end_time")
    .eq("status", "scheduled")
    .lt("end_time", now);

      if (error) {
    console.error("Error fetching appointments:", error);
    return;
  }

  if (!appointments || appointments.length === 0) {
    console.log("No expired appointments");
    return;
  }

 
  const ids = appointments.map(app => app.id);

  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      status: "completed"
    })
    .in("id", ids);


  if (updateError) {
    console.error("Error updating appointments:", updateError);
    return;
  }
  
  setInterval(() => {
  checkAppointmentStatus();
}, 3*60*60*1000);
}

