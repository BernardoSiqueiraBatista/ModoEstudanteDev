import { Router } from 'express';
import { CasesController } from './cases.controller';

const casesRouter = Router();
const ctrl = new CasesController();

// Dashboard
casesRouter.get('/metrics', ctrl.getMetrics);
casesRouter.get('/', ctrl.listCases);

// Case detail / intro pop-up (Task 7)
casesRouter.get('/:id/intro', ctrl.getIntro);

// Start attempt (HM or OSCE)
casesRouter.post('/:id/attempts', ctrl.startAttempt);

// OSCE: register event (acerto/erro/omissão → toast no frontend)
casesRouter.post('/attempts/:aid/events', ctrl.registerEvent);

// Finish attempt: calculates score + generates LLM feedback (HM or OSCE)
casesRouter.post('/attempts/:aid/finish', ctrl.finishAttempt);

// HM: chat with simulated patient
casesRouter.post('/attempts/:aid/chat', ctrl.sendChat);
casesRouter.get('/attempts/:aid/chat', ctrl.getChatHistory);

// HM: cognitive support hint
casesRouter.post('/attempts/:aid/hint', ctrl.requestHint);

// HM: finish with LLM structured feedback (structured JSON)
casesRouter.post('/attempts/:aid/finish-hm', ctrl.finishHMAttempt);

export { casesRouter };
