const uploadMock = jest.fn();
const createSignedUrlMock = jest.fn();
const removeMock = jest.fn();
const fromMock = jest.fn(() => ({
  upload: uploadMock,
  createSignedUrl: createSignedUrlMock,
  remove: removeMock,
}));

jest.mock('../../../infra/supabase/supabase-admin', () => ({
  supabaseAdmin: {
    storage: {
      from: fromMock,
    },
  },
}));

import { StorageService } from '../storage.service';
import { AppError } from '../../../shared/errors/app-error';

describe('StorageService', () => {
  let service: StorageService;

  const fakeFile = {
    originalname: 'doc.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('pdf-content'),
  } as Express.Multer.File;

  beforeEach(() => {
    service = new StorageService();
    uploadMock.mockReset();
    createSignedUrlMock.mockReset();
    removeMock.mockReset();
    fromMock.mockClear();
  });

  it('returns path and signed URL on successful upload', async () => {
    uploadMock.mockResolvedValue({ error: null });
    createSignedUrlMock.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed' },
      error: null,
    });

    const result = await service.upload({ orgId: 'org-1', file: fakeFile });

    expect(result.signedUrl).toBe('https://example.com/signed');
    expect(result.path).toMatch(/^org-1\/uploads\/.+\.pdf$/);
    expect(fromMock).toHaveBeenCalledWith('patient-documents');
    expect(uploadMock).toHaveBeenCalled();
    expect(createSignedUrlMock).toHaveBeenCalledWith(result.path, 3600);
  });

  it('throws AppError when storage upload fails', async () => {
    uploadMock.mockResolvedValue({ error: { message: 'boom' } });

    await expect(
      service.upload({ orgId: 'org-1', file: fakeFile })
    ).rejects.toBeInstanceOf(AppError);
    expect(createSignedUrlMock).not.toHaveBeenCalled();
  });
});
