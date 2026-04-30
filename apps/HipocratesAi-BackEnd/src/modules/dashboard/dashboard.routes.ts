import { Router } from 'express';
import { asyncAuthHandler } from '../../shared/http/asyncHandler';
import { DashboardController } from './dashboard.controller';

const router = Router();
const controller = new DashboardController();

router.get('/stats', asyncAuthHandler(controller.getStats));

export { router as dashboardRoutes };
