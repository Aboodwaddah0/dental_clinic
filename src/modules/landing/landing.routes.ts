import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  getLandingHandler,
  createServiceHandler, updateServiceHandler, deleteServiceHandler,
  createPortfolioHandler, updatePortfolioHandler, deletePortfolioHandler,
  uploadImageHandler, upload,
} from "./landing.controller.js";

export const landingRouter = Router();

// Public
landingRouter.get("/", getLandingHandler);

// Image upload (doctor only)
landingRouter.post("/upload", requireAuth, requireRole("doctor"), upload.single("file"), uploadImageHandler);

// Doctor-only management
landingRouter.post(  "/services",        requireAuth, requireRole("doctor"), createServiceHandler);
landingRouter.put(   "/services/:id",    requireAuth, requireRole("doctor"), updateServiceHandler);
landingRouter.delete("/services/:id",    requireAuth, requireRole("doctor"), deleteServiceHandler);
landingRouter.post(  "/portfolio",       requireAuth, requireRole("doctor"), createPortfolioHandler);
landingRouter.put(   "/portfolio/:id",   requireAuth, requireRole("doctor"), updatePortfolioHandler);
landingRouter.delete("/portfolio/:id",   requireAuth, requireRole("doctor"), deletePortfolioHandler);
