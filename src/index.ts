import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { patientsRouter } from "./modules/patients/patients.routes.js";
import { appointmentsRouter } from "./modules/appointments/appointments.routes.js";
import { visitsRouter } from "./modules/visits/visits.routes.js";
import { patientFilesRouter } from "./modules/patient_files/patient_files.routes.js";
import { invoicesRouter } from "./modules/invoices/invoices.routes.js";
import { dentalRecordsRouter } from "./modules/dental-records/dental-records.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { expensesRouter } from "./modules/expenses/expenses.routes.js";
import { setupRouter } from "./modules/setup/setup.routes.js";
import { clinicSettingsRouter } from "./modules/clinic-settings/clinic-settings.routes.js";
import { remindersRouter } from "./modules/reminders/reminder.routes.js";
import { availabilityRouter } from "./modules/availability/availability.routes.js";
import { landingRouter } from "./modules/landing/landing.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      "http://localhost:5173",
      env.frontendUrl,
    ];
    if (!origin || allowed.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/visits", visitsRouter);
app.use("/api/patient-files", patientFilesRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/dental-records", dentalRecordsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/setup", setupRouter);
app.use("/api/clinic-settings", clinicSettingsRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/landing",      landingRouter);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`API server listening on port ${env.port}`);
});
