import { Router } from 'express';
import performanceRoutes from '../performance/performance.routes.ts';
import examsRoutes from '../exams/exams.routes.ts';
import questionsRoutes from '../questions/questions.routes.ts';

const studentRouter = Router();

// Agrupando suas 3 features criadas
studentRouter.use('/questions', questionsRoutes);
studentRouter.use('/exams', examsRoutes);
studentRouter.use('/performance', performanceRoutes);

export default studentRouter;