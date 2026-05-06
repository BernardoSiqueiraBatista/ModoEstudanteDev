import { Router } from 'express';
import performanceRoutes from '../modules/performance/performance.routes';
// import examsRoutes from '../modules/exams/exams.routes.js';
// import questionsRoutes from '../modules/questions/questions.routes.js';

const studentRouter = Router();

// Agrupando suas 3 features criadas
// studentRouter.use('/questions', questionsRoutes);
// studentRouter.use('/exams', examsRoutes);
studentRouter.use('/performance', performanceRoutes);

export default studentRouter;