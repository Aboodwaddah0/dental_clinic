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


app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`API server listening on port ${env.port}`);
});
