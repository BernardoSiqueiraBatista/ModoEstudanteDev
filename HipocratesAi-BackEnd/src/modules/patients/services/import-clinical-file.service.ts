import axios from 'axios';
import FormData from 'form-data';
import type { ImportClinicalFileResponseDTO } from '../dtos/import-clinical-file-response.dto';

type ExecuteInput = {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
};

export class ImportClinicalFileService {
  async execute({
    fileBuffer,
    fileName,
    mimeType,
  }: ExecuteInput): Promise<ImportClinicalFileResponseDTO> {
    const form = new FormData();

    form.append('file', fileBuffer, {
      filename: fileName,
      contentType: mimeType,
    });

    const response = await axios.post(
      'http://127.0.0.1:8001/import-clinical-file',
      form,
      {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return response.data;
  }
}
