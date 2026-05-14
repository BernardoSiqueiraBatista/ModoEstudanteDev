import { Router } from 'express';
import { InsightsController } from './insights.controller';

const insightsRoutes = Router({ mergeParams: true });
const controller = new InsightsController();

insightsRoutes.get('/', (req, res, next) => controller.getInsights(req, res, next));
insightsRoutes.post('/regenerate', (req, res, next) => controller.regenerateInsights(req, res, next));

export default insightsRoutes;
