import { supabaseAdmin } from '../../infra/supabase/supabase-admin';
import { AppError } from '../../shared/errors/app-error';
import { logger } from '../../shared/logger/logger';
import { randomUUID } from 'node:crypto';

const BUCKET = 'patient-documents';

export class StorageService {
  async upload(params: {
    orgId: string;
    file: Express.Multer.File;
    prefix?: string;
  }): Promise<{ path: string; signedUrl: string }> {
    const { orgId, file, prefix = 'uploads' } = params;
    const ext = file.originalname.split('.').pop() ?? 'bin';
    const path = `${orgId}/${prefix}/${randomUUID()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      logger.error({ err: uploadError, path }, 'Failed to upload to storage');
      throw new AppError('Erro ao fazer upload do arquivo.', 500);
    }

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600);

    if (signedError || !signedData) {
      logger.error({ err: signedError, path }, 'Failed to create signed URL');
      throw new AppError('Erro ao gerar URL do arquivo.', 500);
    }

    return { path, signedUrl: signedData.signedUrl };
  }

  async delete(path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    if (error) {
      logger.error({ err: error, path }, 'Failed to delete from storage');
      throw new AppError('Erro ao deletar arquivo.', 500);
    }
  }
}
