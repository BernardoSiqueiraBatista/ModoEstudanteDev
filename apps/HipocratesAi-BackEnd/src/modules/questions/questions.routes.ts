import { Router } from 'express';
import { QuestionsController } from './questions.controller';

const questionsRoutes = Router();
const controller = new QuestionsController();

questionsRoutes.get('', (req, res) => controller.getQuestions(req, res));

export default questionsRoutes;