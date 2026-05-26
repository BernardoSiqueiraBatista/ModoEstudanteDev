import { Router } from 'express';
import { StudyPlansV1Controller } from './study-plans-v1.controller';

const studyPlansV1Router = Router();
const ctrl = new StudyPlansV1Controller();

// Task 5: upload de arquivos do ciclo
studyPlansV1Router.post('/uploads', ...ctrl.uploadFile);

// Task 5: criar plano (novo formato com pop-ups)
studyPlansV1Router.post('/', ctrl.createPlan);

// Task 6: listar planos do aluno
studyPlansV1Router.get('/', ctrl.listPlans);

// Task 1: resumo do plano para pop-up 4/4
studyPlansV1Router.get('/:id/summary', ctrl.getSummary);

// Task 5: regenerar cronograma (rate limit 6h)
studyPlansV1Router.post('/:id/regenerate', ctrl.regeneratePlan);

// Task 6: compartilhar plano
studyPlansV1Router.post('/:id/share', ctrl.sharePlan);

// Task 6: detalhe, edição e exclusão (soft delete)
studyPlansV1Router.get('/:id', ctrl.getPlan);
studyPlansV1Router.put('/:id', ctrl.updatePlan);
studyPlansV1Router.delete('/:id', ctrl.deletePlan);

export { studyPlansV1Router };
