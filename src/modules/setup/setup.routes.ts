import { Router } from "express";
import { statusHandler, setupHandler } from "./setup.controller.js";

export const setupRouter = Router();

setupRouter.get("/status", statusHandler);
setupRouter.post("/", setupHandler);
