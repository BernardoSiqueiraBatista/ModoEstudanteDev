import { Router } from 'express';
import { ExamController } from './exams.controller';

const examRoutes = Router();
const controller = new ExamController();

examRoutes.post('', (req, res, next) => controller.processExam(req, res, next));

export default examRoutes;