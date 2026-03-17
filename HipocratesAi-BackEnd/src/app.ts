import express from 'express';
const cors = require("cors");

import { appointmentsRoutes } from "./modules/appointments/appointments.routes";
import { errorMiddleware } from "./shared/http/errorMiddleware";
import { patientsRoutes } from './modules/patients/routes/patients.routes';

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use('/patients', patientsRoutes);

app.use("/appointments", appointmentsRoutes);

app.use(errorMiddleware);