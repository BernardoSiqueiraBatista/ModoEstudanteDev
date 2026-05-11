import { PDFParse } from 'pdf-parse';
import { logger } from '../../../shared/logger/logger';
import { AppError } from '../../../shared/errors/app-error';

export interface ExtractedPatientData {
  fullName?: string;
  birthDate?: string;
  document?: string;
  phoneNumber?: string;
  chiefComplaint?: string;
  allergies?: string;
  currentMedications?: string;
  notes?: string;
  rawText: string;
}

export class ExtractPdfService {
  async execute(fileBuffer: Buffer): Promise<ExtractedPatientData> {
    try {
      const parser = new PDFParse({ data: new Uint8Array(fileBuffer) });
      const parsed = await parser.getText();
      const text = parsed.text;
      await parser.destroy();

      const cpfMatch = text.match(/(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/);
      const phoneMatch = text.match(/\(?(\d{2})\)?\s*(\d{4,5})-?(\d{4})/);
      const birthMatch = text.match(/(\d{2})[/-](\d{2})[/-](\d{4})/);

      const nameMatch = text.match(
        /(?:Nome|Paciente)[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+){1,4})/
      );

      return {
        fullName: nameMatch?.[1]?.trim(),
        document: cpfMatch?.[1],
        phoneNumber: phoneMatch
          ? `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}`
          : undefined,
        birthDate: birthMatch
          ? `${birthMatch[3]}-${birthMatch[2]}-${birthMatch[1]}`
          : undefined,
        rawText: text.slice(0, 2000),
      };
    } catch (err) {
      logger.error({ err }, 'Failed to extract PDF');
      throw new AppError('Não foi possível processar o PDF.', 400);
    }
  }
}
