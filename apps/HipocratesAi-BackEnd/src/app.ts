import express, { RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { authMiddleware } from './shared/http/auth-middleware';
import { errorMiddleware } from './shared/http/errorMiddleware';
import { requestIdMiddleware } from './shared/http/request-id.middleware';
import { httpLogger } from './shared/http/http-logger.middleware';
import { healthCheckController } from './modules/health/health.controller';
import {
  getMetricsController,
  requireMetricsToken,
} from './modules/health/metrics.controller';
import { setupSwagger } from './shared/docs/swagger';

// Routes
import { appointmentsRoutes } from './modules/appointments/appointments.routes';
import { patientsRoutes } from './modules/patients/routes/patients.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { doctorsRoutes } from './modules/doctors/doctors.routes';
import { searchRoutes } from './modules/search/search.routes';
import { storageRoutes } from './modules/storage/storage.routes';
import { consultationsRoutes } from './modules/consultations/consultations.routes';
import { patientConsultationsRoutes } from './modules/consultations/patient-consultations.routes';
import { env } from './config/env';

export const app = express();


import studentRouter from './modules/studentMode/student.routes';

// Se a flag estiver ativa, carregamos APENAS a sua parte ===========================
if (process.env.ONLY_STUDENT_MODE === 'true') {
  app.use("/student", studentRouter);
  console.log("--- TESTANDO APENAS MODO ESTUDANTE ---");
}

// Resto da aplicação ===============================================================
else {
  app.use("/student", studentRouter);

  app.use(helmet() as unknown as RequestHandler);
  app.use(requestIdMiddleware);
  app.use(httpLogger as unknown as RequestHandler);
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }) as unknown as RequestHandler);
  app.use(express.json({ limit: '10mb' }) as unknown as RequestHandler);

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per windowMs per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Muitas requisições. Tente novamente em 15 minutos.' },
  });

  app.use(limiter);

  // API docs
  setupSwagger(app);

  // Public
  app.get('/health', healthCheckController);

  // Ops: metrics snapshot. Protected by a shared-secret header when METRICS_TOKEN
  // is configured; otherwise open (dev). Should ALSO sit behind a reverse-proxy
  // ACL in production — not intended to be publicly exposed.
  app.get('/metrics', requireMetricsToken, getMetricsController);

  // Protected routes (JWT required)
  app.use('/patients', authMiddleware, patientsRoutes);
  app.use('/appointments', authMiddleware, appointmentsRoutes);
  app.use('/dashboard', authMiddleware, dashboardRoutes);
  app.use('/doctors', authMiddleware, doctorsRoutes);
  app.use('/search', authMiddleware, searchRoutes);
  app.use('/storage', authMiddleware, storageRoutes);

  if (env.ENABLE_CONSULTATIONS) {
    app.use('/consultations', authMiddleware, consultationsRoutes);
    app.use('/patients', authMiddleware, patientConsultationsRoutes);
  }

  // Error handler (must be last)
  app.use(errorMiddleware);
}
