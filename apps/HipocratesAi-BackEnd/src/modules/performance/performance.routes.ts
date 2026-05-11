import { Router } from 'express';
import { PerformanceController } from './performance.controller';

const performanceRoutes = Router();
const controller = new PerformanceController();

performanceRoutes.get('/:id', (req, res, next) => controller.getStats(req, res, next));

export default performanceRoutes;