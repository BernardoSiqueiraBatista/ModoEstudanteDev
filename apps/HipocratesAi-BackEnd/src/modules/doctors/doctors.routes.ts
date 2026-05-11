import { Router } from 'express';
import { asyncAuthHandler } from '../../shared/http/asyncHandler';
import { getMeController, updateMeController } from './doctors.controller';

const router = Router();

router.get('/me', asyncAuthHandler(getMeController));
router.put('/me', asyncAuthHandler(updateMeController));

export { router as doctorsRoutes };
