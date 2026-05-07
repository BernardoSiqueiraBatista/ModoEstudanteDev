import { Router } from 'express';
import { ExamController } from './exams.controller';

const examRoutes = Router();
const controller = new ExamController();

// Rota POST para receber e processar as respostas do simulado
examRoutes.post('', (req, res) => controller.processExam(req, res));

export default examRoutes;