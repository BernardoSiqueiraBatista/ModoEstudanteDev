import { Router } from 'express';
import multer from 'multer';

const patientsRoutes = Router();
const upload = multer({ storage: multer.memoryStorage() });

function asyncHandler(fn: any) {
  if (typeof fn !== 'function') {
    throw new Error('Route handler is not a function – check controller import/export.');
  }
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

// Importa e loga cada controller individualmente
import('../controllers/list-patients.controller').then(m => {
  console.log('listPatientsController:', typeof m.listPatientsController);
});
import('../controllers/create-patient.controller').then(m => {
  console.log('createPatientController:', typeof m.createPatientController);
});
import('../controllers/import-clinical-file.controller').then(m => {
  console.log('importClinicalFileController:', typeof m.importClinicalFileController);
});

export { patientsRoutes };