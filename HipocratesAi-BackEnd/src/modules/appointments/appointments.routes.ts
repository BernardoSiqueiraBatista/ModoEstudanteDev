import { Router } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import { AppointmentsController } from './appointments.controller';

const router = Router();
const controller = new AppointmentsController();

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', asyncHandler(controller.create));
router.patch('/:id/status', asyncHandler(controller.updateStatus));

export { router as appointmentsRoutes };