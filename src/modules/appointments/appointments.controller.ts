import type { Request, Response } from "express";
import {
  appointmentIdParamSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentSchema,
} from "./appointments.schema.js";
import * as appointmentsService from "./appointments.service.js";

export async function listAppointmentsHandler(req: Request, res: Response) {
  const query = listAppointmentsQuerySchema.parse(req.query);
  const { data, count } = await appointmentsService.listAppointments(query);
  res.status(200).json({ data, count });
}

export async function getAppointmentHandler(req: Request, res: Response) {
  const id = appointmentIdParamSchema.parse(req.params.id);
  const appointment = await appointmentsService.getAppointmentById(id);
  res.status(200).json({ data: appointment });
}

export async function createAppointmentHandler(req: Request, res: Response) {
  const input = createAppointmentSchema.parse(req.body);
  const appointment = await appointmentsService.createAppointment(input);
  res.status(201).json({ data: appointment });
}

export async function updateAppointmentHandler(req: Request, res: Response) {
  const id = appointmentIdParamSchema.parse(req.params.id);
  const input = updateAppointmentSchema.parse(req.body);
  const appointment = await appointmentsService.updateAppointment(id, input);
  res.status(200).json({ data: appointment });
}
