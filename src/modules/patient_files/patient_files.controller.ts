import type { Request, Response } from "express";
import { uploadFile } from "../sw3/upload.service.js";
import * as patientFilesService from "./patient_files.service.js";
import { uploadPatientFileSchema, listPatientFilesQuerySchema, patientFileIdParamSchema } from "./patient_files.schema.js";

export async function listPatientFilesHandler(req: Request, res: Response) {
  const query = listPatientFilesQuerySchema.parse(req.query);
  const { data, count } = await patientFilesService.listPatientFiles(query);
  res.status(200).json({ data, count });
}


export async function deletePatientFileHandler(req: Request, res: Response) {
  const id = patientFileIdParamSchema.parse(req.params.id);
  await patientFilesService.deletePatientFile(id);
  res.status(204).send();
}

export async function uploadPatientFileHandler(req: Request, res: Response) {
  const input = uploadPatientFileSchema.parse(req.body);

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const fileUrl = await uploadFile(req.file, input.patient_id);

  const file = await patientFilesService.uploadPatientFile(input, fileUrl, req.user!.id);

  res.status(201).json({ data: file });
}