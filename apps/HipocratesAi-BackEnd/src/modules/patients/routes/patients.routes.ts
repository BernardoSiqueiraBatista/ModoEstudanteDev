import { Router } from 'express';
import { asyncAuthHandler } from '../../../shared/http/asyncHandler';
import { validateQuery } from '../../../shared/http/validate-query';
import { listPatientsQuerySchema } from '../dtos/list-patients.query';
import { listPatientsController } from '../controllers/list-patients.controller';
import { createPatientController } from '../controllers/create-patient.controller';
import { getPatientController } from '../controllers/get-patient.controller';
import { updatePatientController } from '../controllers/update-patient.controller';
import { deletePatientController } from '../controllers/delete-patient.controller';

const patientsRoutes = Router();

patientsRoutes.get('/', validateQuery(listPatientsQuerySchema), asyncAuthHandler(listPatientsController));
patientsRoutes.get('/:id', asyncAuthHandler(getPatientController));
patientsRoutes.post('/', asyncAuthHandler(createPatientController));
patientsRoutes.put('/:id', asyncAuthHandler(updatePatientController));
patientsRoutes.delete('/:id', asyncAuthHandler(deletePatientController));

export { patientsRoutes };
