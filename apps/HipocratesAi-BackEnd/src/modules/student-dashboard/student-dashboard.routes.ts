import { Router } from 'express';
import { StudentDashboardController } from './student-dashboard.controller';

const dashboardRoutes = Router({ mergeParams: true });
const controller = new StudentDashboardController();

dashboardRoutes.get('/dashboard', (req, res, next) => controller.getDashboard(req, res, next));
dashboardRoutes.get('/study-distribution', (req, res, next) => controller.getStudyDistribution(req, res, next));
// Task 5: áreas de foco para pop-up 1/4
dashboardRoutes.get('/focus-areas', (req, res, next) => controller.getFocusAreas(req, res, next));

export default dashboardRoutes;
