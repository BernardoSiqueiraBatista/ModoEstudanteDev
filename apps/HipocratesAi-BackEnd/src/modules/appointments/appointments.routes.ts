import { Router } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import { validateQuery } from '../../shared/http/validate-query';
import { AppointmentsController } from './appointments.controller';
import { listAppointmentsQueryDtoSchema } from './dtos/list-appointments.query';
import { weeklyAppointmentsQueryDtoSchema } from './dtos/weekly-appointments.query';

const router = Router();
const controller = new AppointmentsController();

router.get('/', validateQuery(listAppointmentsQueryDtoSchema), asyncHandler(controller.list));
router.get('/weekly', validateQuery(weeklyAppointmentsQueryDtoSchema), asyncHandler(controller.listWeekly));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', asyncHandler(controller.create));
router.patch('/:id/status', asyncHandler(controller.updateStatus));

export { router as appointmentsRoutes };
