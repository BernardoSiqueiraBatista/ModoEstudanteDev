import { Router } from 'express';
import performanceRoutes from '../performance/performance.routes';
import questionsRoutes from '../questions/questions.routes';
import examsRoutes from '../exams/exams.routes';

const studentRouter = Router();

studentRouter.use('/exams', examsRoutes);
studentRouter.use('/questions', questionsRoutes);
studentRouter.use('/performance', performanceRoutes);

export default studentRouter;