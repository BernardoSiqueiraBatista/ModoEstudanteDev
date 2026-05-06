import { Router } from 'express';
import { PerformanceController } from './performance.controller';

const performanceRoutes = Router();
const controller = new PerformanceController();

performanceRoutes.get('/:id/performance', controller.getStats);

export default performanceRoutes;