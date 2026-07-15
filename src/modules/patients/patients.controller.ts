import type { Request, Response } from "express";
import {
  createPatientSchema,
  listPatientsQuerySchema,
  patientIdParamSchema,
  updatePatientSchema,
} from "./patients.schema.js";
import * as patientsService from "./patients.service.js";

export async function listPatientsHandler(req: Request, res: Response) {
  const query = listPatientsQuerySchema.parse(req.query);
  const { data, count } = await patientsService.listPatients(query);
  res.status(200).json({ data, count });
}

export async function getPatientHandler(req: Request, res: Response) {
  const id = patientIdParamSchema.parse(req.params.id);
  const patient = await patientsService.getPatientById(id);
  res.status(200).json({ data: patient });
}

export async function createPatientHandler(req: Request, res: Response) {
  const input = createPatientSchema.parse(req.body);
  // requireAuth (run before this handler) guarantees req.user is set.
  const patient = await patientsService.createPatient(input, req.user!.id);
  res.status(201).json({ data: patient });
}

export async function updatePatientHandler(req: Request, res: Response) {
  const id = patientIdParamSchema.parse(req.params.id);
  const input = updatePatientSchema.parse(req.body);
  const patient = await patientsService.updatePatient(id, input);
  res.status(200).json({ data: patient });
}

export async function deletePatientHandler(req: Request, res: Response) {
  const id = patientIdParamSchema.parse(req.params.id);
  await patientsService.deletePatient(id);
  res.status(204).send();
}
