import { Router } from 'express';
import { StudyPlansController } from './study-plans.controller';

const studyPlansRoutes = Router({ mergeParams: true });
const controller = new StudyPlansController();

studyPlansRoutes.post('', controller.createPlan);
studyPlansRoutes.get('', controller.listPlans);
studyPlansRoutes.get('/:planId', controller.getPlanDetails);
studyPlansRoutes.patch('/:planId/blocks/:blockId', controller.updateBlock);
studyPlansRoutes.delete('/:planId', controller.deletePlan);

export { studyPlansRoutes };