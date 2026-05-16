import { Router } from 'express';
import performanceRoutes from '../performance/performance.routes';
import questionsRoutes from '../questions/questions.routes';
import examsRoutes from '../exams/exams.routes';
import dashboardRoutes from '../student-dashboard/student-dashboard.routes';
import insightsRoutes from '../insights/insights.routes';
import { studyPlansRoutes } from '../study-plans/study-plans.routes';

const studentRouter = Router();

studentRouter.use('/exams', examsRoutes);
studentRouter.use('/questions', questionsRoutes);
studentRouter.use('/performance', performanceRoutes);

studentRouter.use('/:id/', dashboardRoutes);
studentRouter.use('/:id/insights', insightsRoutes);

studentRouter.use('/:id/study-plans', studyPlansRoutes)

export default studentRouter;