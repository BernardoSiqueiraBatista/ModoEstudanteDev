import { Router } from 'express';
import performanceRoutes from '../modules/performance/performance.routes';
import questionsRoutes from '../modules/questions/questions.routes';
import examsRoutes from '../modules/exams/exams.routes';

const studentRouter = Router();

studentRouter.use('/exams', examsRoutes);
studentRouter.use('/questions', questionsRoutes);
studentRouter.use('/performance', performanceRoutes);

export default studentRouter;