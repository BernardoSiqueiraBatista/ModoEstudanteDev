import { Router } from 'express';
import { QuestionsController } from './questions.controller';

const questionsRoutes = Router();
const controller = new QuestionsController();

questionsRoutes.get('', (req, res, next) => controller.getQuestions(req, res, next));

export default questionsRoutes;