import { Router } from 'express';
import { asyncAuthHandler } from '../../shared/http/asyncHandler';
import { createConsultationController } from './controllers/create-consultation.controller';
import { getConsultationController } from './controllers/get-consultation.controller';
import { updateConsultationController } from './controllers/update-consultation.controller';
import { finishConsultationController } from './controllers/finish-consultation.controller';
import { cancelConsultationController } from './controllers/cancel-consultation.controller';
import { acknowledgeInsightController } from './controllers/acknowledge-insight.controller';
import { researchConsultationController } from './controllers/research-consultation.controller';
import { draftSummaryController } from './controllers/draft-summary.controller';
import {
  saveDoctorNoteController,
  listDoctorNotesController,
} from './controllers/save-doctor-note.controller';

const consultationsRoutes = Router();

consultationsRoutes.post('/', asyncAuthHandler(createConsultationController));
consultationsRoutes.get('/:id', asyncAuthHandler(getConsultationController));
consultationsRoutes.patch('/:id', asyncAuthHandler(updateConsultationController));
consultationsRoutes.post('/:id/draft-summary', asyncAuthHandler(draftSummaryController));
consultationsRoutes.post('/:id/notes', asyncAuthHandler(saveDoctorNoteController));
consultationsRoutes.get('/:id/notes', asyncAuthHandler(listDoctorNotesController));
consultationsRoutes.post('/:id/finish', asyncAuthHandler(finishConsultationController));
consultationsRoutes.post('/:id/cancel', asyncAuthHandler(cancelConsultationController));
consultationsRoutes.post('/:id/research', asyncAuthHandler(researchConsultationController));
consultationsRoutes.post(
  '/:consultationId/insights/:insightId/ack',
  asyncAuthHandler(acknowledgeInsightController),
);

export { consultationsRoutes };
