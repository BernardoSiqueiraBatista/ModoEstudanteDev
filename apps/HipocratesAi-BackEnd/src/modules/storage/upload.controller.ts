import type { Response } from 'express';
import type { AuthRequest } from '../../shared/http/auth-request';
import { AppError } from '../../shared/errors/app-error';
import { StorageService } from './storage.service';
import { ExtractPdfService } from '../patients/services/extract-pdf.service';

export async function uploadPatientDocumentController(
  req: AuthRequest,
  res: Response
) {
  const orgId = req.user?.orgId;
  if (!orgId) throw new AppError('Organização não identificada.', 400);
  if (!req.file) throw new AppError('Arquivo não enviado.', 400);

  const storage = new StorageService();
  const result = await storage.upload({
    orgId,
    file: req.file,
    prefix: 'patients',
  });
  return res.status(201).json(result);
}

export async function extractPatientPdfController(
  req: AuthRequest,
  res: Response
) {
  if (!req.file) throw new AppError('Arquivo PDF não enviado.', 400);
  if (req.file.mimetype !== 'application/pdf') {
    throw new AppError('Arquivo deve ser um PDF.', 400);
  }

  const extractor = new ExtractPdfService();
  const data = await extractor.execute(req.file.buffer);
  return res.status(200).json(data);
}
