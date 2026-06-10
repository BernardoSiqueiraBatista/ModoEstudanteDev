import { Router } from 'express';
import { StudyPlansV1Controller } from './study-plans-v1.controller';
import { FixedCommitmentsController } from '../fixed-commitments/fixed-commitments.controller';

const studyPlansV1Router = Router();
const ctrl = new StudyPlansV1Controller();
const fcCtrl = new FixedCommitmentsController();

// Uploads
studyPlansV1Router.post('/uploads', ...ctrl.uploadFile);

// CRUD de planos
studyPlansV1Router.post('/', ctrl.createPlan);
studyPlansV1Router.get('/', ctrl.listPlans);

// Visualização diária (Task 5 Contrato 4)
studyPlansV1Router.get('/daily', ctrl.getDailyView);

// Resumo para pop-up
studyPlansV1Router.get('/:id/summary', ctrl.getSummary);

// Task 4 (Contrato 4): CRUD compromissos fixos — módulo dedicado do João
studyPlansV1Router.get('/:id/fixed-commitments', fcCtrl.listCommitments);
studyPlansV1Router.post('/:id/fixed-commitments', fcCtrl.createCommitment);
studyPlansV1Router.patch('/:id/fixed-commitments/:cid', fcCtrl.updateCommitment);
studyPlansV1Router.delete('/:id/fixed-commitments/:cid', fcCtrl.deleteCommitment);

// Regenerar / compartilhar
studyPlansV1Router.post('/:id/regenerate', ctrl.regeneratePlan);
studyPlansV1Router.post('/:id/share', ctrl.sharePlan);

// Detalhe, edição, exclusão
studyPlansV1Router.get('/:id', ctrl.getPlan);
studyPlansV1Router.put('/:id', ctrl.updatePlan);
studyPlansV1Router.delete('/:id', ctrl.deletePlan);

export { studyPlansV1Router };
