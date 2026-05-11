import { Router } from 'express';
import { asyncAuthHandler } from '../../shared/http/asyncHandler';
import { listPatientConsultationsController } from './controllers/list-patient-consultations.controller';
import {
  getPatientTimelineController,
  getPatientHypothesesController,
  getPatientTreatmentsController,
  getPatientCognitiveSummaryController,
} from './controllers/patient-clinical-data.controller';

const patientConsultationsRoutes = Router();

patientConsultationsRoutes.get(
  '/:patientId/consultations',
  asyncAuthHandler(listPatientConsultationsController),
);

patientConsultationsRoutes.get(
  '/:patientId/timeline',
  asyncAuthHandler(getPatientTimelineController),
);

patientConsultationsRoutes.get(
  '/:patientId/hypotheses',
  asyncAuthHandler(getPatientHypothesesController),
);

patientConsultationsRoutes.get(
  '/:patientId/treatments',
  asyncAuthHandler(getPatientTreatmentsController),
);

patientConsultationsRoutes.get(
  '/:patientId/cognitive-summary',
  asyncAuthHandler(getPatientCognitiveSummaryController),
);

export { patientConsultationsRoutes };
