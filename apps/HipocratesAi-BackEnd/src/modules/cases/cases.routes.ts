import { Router } from 'express';
import { CasesController } from './cases.controller';

const casesRouter = Router();
const ctrl = new CasesController();

// Task 7: Pop-up de intro do caso clínico
casesRouter.get('/:id/intro', ctrl.getIntro);

// Task 7: Iniciar tentativa (HM ou OSCE)
casesRouter.post('/:id/attempts', ctrl.startAttempt);

// Task 7: Registrar evento OSCE (acerto/erro/omissão)
casesRouter.post('/attempts/:aid/events', ctrl.registerEvent);

// Task 7: Finalizar tentativa e obter pontuação + feedback
casesRouter.post('/attempts/:aid/finish', ctrl.finishAttempt);

export { casesRouter };
