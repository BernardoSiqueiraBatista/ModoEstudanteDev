import type { Request, Response } from 'express';
import { ImportClinicalFileService } from '../services/import-clinical-file.service';

export async function importClinicalFileController(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo não enviado.' });
    }

    const service = new ImportClinicalFileService();

    const result = await service.execute({
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao importar ficha clínica:', error);
    return res.status(500).json({ message: 'Erro ao processar ficha clínica.' });
  }
}
