import { Router } from 'express';
import multer from 'multer';
import { asyncAuthHandler } from '../../shared/http/asyncHandler';
import {
  uploadPatientDocumentController,
  extractPatientPdfController,
} from './upload.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de arquivo não permitido.'));
  },
});

const storageRoutes = Router();

storageRoutes.post(
  '/patient-documents',
  upload.single('file'),
  asyncAuthHandler(uploadPatientDocumentController)
);

storageRoutes.post(
  '/extract-pdf',
  upload.single('file'),
  asyncAuthHandler(extractPatientPdfController)
);

export { storageRoutes };
