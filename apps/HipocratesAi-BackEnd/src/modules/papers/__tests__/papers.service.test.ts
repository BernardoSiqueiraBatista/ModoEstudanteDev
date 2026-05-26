import { AppError } from '../../../shared/errors/AppError';

// Mocks do model
const mockCreate = jest.fn();
const mockFindByStudentPaginated = jest.fn();
const mockFindById = jest.fn();
const mockUpdate = jest.fn();
const mockSoftDelete = jest.fn();
const mockCreateOrUpdateShare = jest.fn();
const mockFindByShareToken = jest.fn();
const mockFindShareByPaperId = jest.fn();
const mockHardDeleteExpired = jest.fn();

jest.mock('../papers.model', () => {
  return {
    PapersModel: jest.fn().mockImplementation(() => ({
      create: (...args: any[]) => mockCreate(...args),
      findByStudentPaginated: (...args: any[]) => mockFindByStudentPaginated(...args),
      findById: (...args: any[]) => mockFindById(...args),
      update: (...args: any[]) => mockUpdate(...args),
      softDelete: (...args: any[]) => mockSoftDelete(...args),
      createOrUpdateShare: (...args: any[]) => mockCreateOrUpdateShare(...args),
      findByShareToken: (...args: any[]) => mockFindByShareToken(...args),
      findShareByPaperId: (...args: any[]) => mockFindShareByPaperId(...args),
      hardDeleteExpired: (...args: any[]) => mockHardDeleteExpired(...args),
    })),
  };
});

import { PapersService } from '../papers.service';

describe('PapersService', () => {
  let service: PapersService;
  const mockStudentId = 'student-uuid-123';
  const mockPaperId = 'paper-uuid-456';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PapersService();
  });

  // ===== CREATE =====
  describe('createPaper', () => {
    it('deve criar um paper e retornar os dados', async () => {
      const input = {
        titulo: 'Fisiologia Cardiovascular',
        conteudo: '# Conteúdo',
        conteudo_tipo: 'markdown' as const,
        tags: ['cardiologia'],
        status: 'rascunho' as const,
      };

      const mockPaper = { id: mockPaperId, id_student: mockStudentId, ...input };
      mockCreate.mockResolvedValueOnce(mockPaper);

      const result = await service.createPaper(mockStudentId, input);

      expect(result.id).toBe(mockPaperId);
      expect(mockCreate).toHaveBeenCalledWith(mockStudentId, input);
    });
  });

  // ===== LIST =====
  describe('listPapers', () => {
    it('deve retornar resposta paginada', async () => {
      mockFindByStudentPaginated.mockResolvedValueOnce({
        rows: [{ id: '1', titulo: 'Paper 1' }],
        total: 25,
      });

      const result = await service.listPapers(mockStudentId, {
        page: 1,
        size: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3); // ceil(25/10)
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.size).toBe(10);
    });

    it('deve retornar totalPages 0 quando não há resultados', async () => {
      mockFindByStudentPaginated.mockResolvedValueOnce({
        rows: [],
        total: 0,
      });

      const result = await service.listPapers(mockStudentId, {
        page: 1,
        size: 20,
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  // ===== GET =====
  describe('getPaper', () => {
    it('deve retornar paper quando existe e pertence ao student', async () => {
      const mockPaper = { id: mockPaperId, id_student: mockStudentId, titulo: 'Test' };
      mockFindById.mockResolvedValueOnce(mockPaper);

      const result = await service.getPaper(mockPaperId, mockStudentId);
      expect(result.titulo).toBe('Test');
    });

    it('deve lançar 404 quando paper não existe', async () => {
      mockFindById.mockResolvedValueOnce(null);

      await expect(service.getPaper(mockPaperId, mockStudentId))
        .rejects
        .toThrow(AppError);
    });

    it('deve lançar 404 quando paper pertence a outro student', async () => {
      mockFindById.mockResolvedValueOnce({
        id: mockPaperId,
        id_student: 'outro-student',
      });

      await expect(service.getPaper(mockPaperId, mockStudentId))
        .rejects
        .toThrow(AppError);
    });
  });

  // ===== UPDATE =====
  describe('updatePaper', () => {
    it('deve atualizar paper e retornar os dados', async () => {
      const updated = { id: mockPaperId, titulo: 'Novo Título' };
      mockUpdate.mockResolvedValueOnce(updated);

      const result = await service.updatePaper(mockPaperId, mockStudentId, {
        titulo: 'Novo Título',
      });

      expect(result.titulo).toBe('Novo Título');
    });

    it('deve lançar 404 quando paper não existe', async () => {
      mockUpdate.mockResolvedValueOnce(null);

      await expect(
        service.updatePaper(mockPaperId, mockStudentId, { titulo: 'X' }),
      ).rejects.toThrow(AppError);
    });
  });

  // ===== DELETE =====
  describe('deletePaper', () => {
    it('deve fazer soft delete do paper', async () => {
      mockSoftDelete.mockResolvedValueOnce({ id: mockPaperId });

      await expect(
        service.deletePaper(mockPaperId, mockStudentId),
      ).resolves.not.toThrow();
    });

    it('deve lançar 404 quando paper não existe', async () => {
      mockSoftDelete.mockResolvedValueOnce(null);

      await expect(
        service.deletePaper(mockPaperId, mockStudentId),
      ).rejects.toThrow(AppError);
    });
  });

  // ===== SHARE =====
  describe('sharePaper', () => {
    it('deve gerar share e retornar token + url', async () => {
      mockFindById.mockResolvedValueOnce({
        id: mockPaperId,
        id_student: mockStudentId,
      });
      mockCreateOrUpdateShare.mockResolvedValueOnce({
        share_token: 'abc-123',
        visibilidade: 'link',
        expira_em: null,
      });

      const result = await service.sharePaper(mockPaperId, mockStudentId);

      expect(result.share_token).toBe('abc-123');
      expect(result.url).toBe('/papers/shared/abc-123');
      expect(result.visibilidade).toBe('link');
    });

    it('deve lançar 404 quando paper não pertence ao student', async () => {
      mockFindById.mockResolvedValueOnce({
        id: mockPaperId,
        id_student: 'outro-student',
      });

      await expect(
        service.sharePaper(mockPaperId, mockStudentId),
      ).rejects.toThrow(AppError);
    });
  });

  // ===== SHARED (Público) =====
  describe('getSharedPaper', () => {
    it('deve retornar paper compartilhado', async () => {
      const paper = {
        id: mockPaperId,
        titulo: 'Paper Público',
        visibilidade: 'link',
        expira_em: null,
      };
      mockFindByShareToken.mockResolvedValueOnce(paper);

      const result = await service.getSharedPaper('valid-token');
      expect(result.titulo).toBe('Paper Público');
    });

    it('deve lançar 404 com token inválido', async () => {
      mockFindByShareToken.mockResolvedValueOnce(null);

      await expect(
        service.getSharedPaper('invalid-token'),
      ).rejects.toThrow(AppError);
    });

    it('deve lançar 410 quando link expirou', async () => {
      const expiredDate = new Date(Date.now() - 86400000).toISOString(); // ontem
      mockFindByShareToken.mockResolvedValueOnce({
        id: mockPaperId,
        titulo: 'Expirado',
        visibilidade: 'link',
        expira_em: expiredDate,
      });

      await expect(
        service.getSharedPaper('expired-token'),
      ).rejects.toThrow(AppError);
    });
  });
});
