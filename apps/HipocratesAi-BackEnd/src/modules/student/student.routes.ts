import { Router } from 'express';
import performanceRoutes from '../performance/performance.routes';
import questionsRoutes from '../questions/questions.routes';
import examsRoutes from '../exams/exams.routes';
import dashboardRoutes from '../student-dashboard/student-dashboard.routes';
import insightsRoutes from '../insights/insights.routes';
import { studyPlansRoutes } from '../study-plans/study-plans.routes';
import { studyPlansV1Router } from '../study-plans/study-plans-v1.routes';

const studentRouter = Router();

// Rotas legadas (sem versionamento)
studentRouter.use('/exams', examsRoutes);
studentRouter.use('/questions', questionsRoutes);
studentRouter.use('/performance', performanceRoutes);
studentRouter.use('/:id/', dashboardRoutes);
studentRouter.use('/:id/insights', insightsRoutes);
studentRouter.use('/:id/study-plan', studyPlansRoutes);

// Rotas v1 — Task 1 (summary), Task 2 (dashboard/insights já existem via legadas),
// Task 5 (focus-areas, uploads, criação com novo formato, regenerate),
// Task 6 (gestão completa de planos)
const v1Router = Router();
v1Router.use('/students/:id', dashboardRoutes);   // Task 2: GET /student/v1/students/:id/dashboard|focus-areas
v1Router.use('/students/:id/insights', insightsRoutes); // Task 2: GET|POST /student/v1/students/:id/insights[/regenerate]
v1Router.use('/study-plans', studyPlansV1Router);  // Tasks 1/5/6

studentRouter.use('/v1', v1Router);

export default studentRouter;