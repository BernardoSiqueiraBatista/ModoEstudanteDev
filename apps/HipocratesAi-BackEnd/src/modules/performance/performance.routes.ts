import { Router } from 'express';
import { PerformanceController } from './performance.controller';

const performanceRoutes = Router();
const controller = new PerformanceController();

performanceRoutes.get('/:id', (req, res) => controller.getStats(req, res));

export default performanceRoutes;