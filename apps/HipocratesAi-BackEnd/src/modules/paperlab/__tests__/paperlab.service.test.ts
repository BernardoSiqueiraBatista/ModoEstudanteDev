process.env.OPENAI_API_KEY = 'mock-openai-api-key-for-testing';
import { AppError } from '../../../shared/errors/AppError';

// Mocks do model
const mockCreateSession = jest.fn();
const mockFindSessionsByStudent = jest.fn();
const mockFindSessionById = jest.fn();
const mockDeleteSession = jest.fn();
const mockCreateSource = jest.fn();
const mockFindSourcesBySession = jest.fn();
const mockFindSourceById = jest.fn();
const mockUpdateSourceStatus = jest.fn();
const mockDeleteSource = jest.fn();
const mockCreateMaterial = jest.fn();
const mockFindMaterialsBySession = jest.fn();
const mockFindMaterialById = jest.fn();
const mockUpdateMaterialContent = jest.fn();
const mockUpdateMaterialPartial = jest.fn();
const mockDeleteMaterial = jest.fn();
const mockFindLastMaterialGeneratedInLast6Hours = jest.fn();
const mockCreateFlashcard = jest.fn();
const mockFindFlashcardsByMaterial = jest.fn();
const mockFindFlashcardById = jest.fn();
const mockUpdateFlashcardReview = jest.fn();
const mockDeleteChunksBySession = jest.fn();
const mockDeleteChunksBySource = jest.fn();
const mockFindChunksBySession = jest.fn();
const mockSaveChunk = jest.fn();

// Novos mocks de compartilhamento, colaboradores e chat
const mockIsOwner = jest.fn();
const mockIsCollaborator = jest.fn();
const mockCreateOrUpdateShare = jest.fn();
const mockRevokeShare = jest.fn();
const mockFindByShareToken = jest.fn();
const mockAddCollaborator = jest.fn();
const mockFindCollaboratorsBySession = jest.fn();
const mockRemoveCollaborator = jest.fn();
const mockSaveChatMessage = jest.fn();
const mockFindRecentChatMessages = jest.fn();
const mockFindChatMessagesPaginated = jest.fn();

jest.mock('../paperlab.model', () => {
  return {
    PaperlabModel: jest.fn().mockImplementation(() => ({
      createSession: (...args: any[]) => mockCreateSession(...args),
      findSessionsByStudent: (...args: any[]) => mockFindSessionsByStudent(...args),
      findSessionById: (...args: any[]) => mockFindSessionById(...args),
      deleteSession: (...args: any[]) => mockDeleteSession(...args),
      createSource: (...args: any[]) => mockCreateSource(...args),
      findSourcesBySession: (...args: any[]) => mockFindSourcesBySession(...args),
      findSourceById: (...args: any[]) => mockFindSourceById(...args),
      updateSourceStatus: (...args: any[]) => mockUpdateSourceStatus(...args),
      deleteSource: (...args: any[]) => mockDeleteSource(...args),
      createMaterial: (...args: any[]) => mockCreateMaterial(...args),
      findMaterialsBySession: (...args: any[]) => mockFindMaterialsBySession(...args),
      findMaterialById: (...args: any[]) => mockFindMaterialById(...args),
      updateMaterialContent: (...args: any[]) => mockUpdateMaterialContent(...args),
      updateMaterialPartial: (...args: any[]) => mockUpdateMaterialPartial(...args),
      deleteMaterial: (...args: any[]) => mockDeleteMaterial(...args),
      findLastMaterialGeneratedInLast6Hours: (...args: any[]) => mockFindLastMaterialGeneratedInLast6Hours(...args),
      createFlashcard: (...args: any[]) => mockCreateFlashcard(...args),
      findFlashcardsByMaterial: (...args: any[]) => mockFindFlashcardsByMaterial(...args),
      findFlashcardById: (...args: any[]) => mockFindFlashcardById(...args),
      updateFlashcardReview: (...args: any[]) => mockUpdateFlashcardReview(...args),
      deleteChunksBySession: (...args: any[]) => mockDeleteChunksBySession(...args),
      deleteChunksBySource: (...args: any[]) => mockDeleteChunksBySource(...args),
      findChunksBySession: (...args: any[]) => mockFindChunksBySession(...args),
      saveChunk: (...args: any[]) => mockSaveChunk(...args),

      // Novos métodos
      isOwner: (...args: any[]) => mockIsOwner(...args),
      isCollaborator: (...args: any[]) => mockIsCollaborator(...args),
      createOrUpdateShare: (...args: any[]) => mockCreateOrUpdateShare(...args),
      revokeShare: (...args: any[]) => mockRevokeShare(...args),
      findByShareToken: (...args: any[]) => mockFindByShareToken(...args),
      addCollaborator: (...args: any[]) => mockAddCollaborator(...args),
      findCollaboratorsBySession: (...args: any[]) => mockFindCollaboratorsBySession(...args),
      removeCollaborator: (...args: any[]) => mockRemoveCollaborator(...args),
      saveChatMessage: (...args: any[]) => mockSaveChatMessage(...args),
      findRecentChatMessages: (...args: any[]) => mockFindRecentChatMessages(...args),
      findChatMessagesPaginated: (...args: any[]) => mockFindChatMessagesPaginated(...args),
    })),
  };
});

// Mock da biblioteca tesseract.js
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockResolvedValue({
    recognize: jest.fn().mockResolvedValue({ data: { text: 'Texto OCR' } }),
    terminate: jest.fn(),
  }),
}));

import { PaperlabService } from '../paperlab.service';

describe('PaperlabService', () => {
  let service: PaperlabService;
  const studentId = 'e1925b44-9694-477c-a496-5e638e4a9e25';
  const collaboratorId = 'f1925b44-9694-477c-a496-5e638e4a9e26';
  const sessionId = 'b8db5f1f-942d-43d0-ab0b-cda85f71905b';
  const materialId = 'cda85f71-942d-43d0-ab0b-bda85f71905b';
  const cardId = 'f1925b44-9694-477c-a496-5e638e4a9e25';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaperlabService();
    mockIsOwner.mockResolvedValue(true);
    mockIsCollaborator.mockResolvedValue(false);
  });

  describe('createSession', () => {
    it('deve criar uma sessão de notebook e retornar os dados', async () => {
      const mockSession = { id: sessionId, id_student: studentId, titulo: 'Meu Notebook de Anatomia' };
      mockCreateSession.mockResolvedValueOnce(mockSession);

      const result = await service.createSession(studentId, 'Meu Notebook de Anatomia');

      expect(result.id).toBe(sessionId);
      expect(result.titulo).toBe('Meu Notebook de Anatomia');
      expect(mockCreateSession).toHaveBeenCalledWith(studentId, 'Meu Notebook de Anatomia');
    });
  });

  describe('getSessionDetail', () => {
    it('deve lançar AppError 404 se o notebook não for encontrado (acesso não autorizado)', async () => {
      mockIsOwner.mockResolvedValueOnce(false);
      mockIsCollaborator.mockResolvedValueOnce(false);

      await expect(service.getSessionDetail(sessionId, studentId))
        .rejects
        .toThrow(new AppError('Notebook não encontrado.', 404));
    });

    it('deve retornar detalhes da sessão se for o proprietário', async () => {
      const mockSession = { id: sessionId, id_student: studentId, titulo: 'Patologia' };
      mockFindSessionById.mockResolvedValueOnce(mockSession);
      mockFindSourcesBySession.mockResolvedValueOnce([]);
      mockFindMaterialsBySession.mockResolvedValueOnce([]);

      const result = await service.getSessionDetail(sessionId, studentId);

      expect(result.id).toBe(sessionId);
      expect(result.titulo).toBe('Patologia');
      expect(mockIsOwner).toHaveBeenCalledWith(sessionId, studentId);
    });

    it('deve retornar detalhes da sessão se for um colaborador', async () => {
      mockIsOwner.mockResolvedValueOnce(false);
      mockIsCollaborator.mockResolvedValueOnce(true);

      const mockSession = { id: sessionId, id_student: 'outro-estudante', titulo: 'Patologia Compartilhada' };
      mockFindSessionById.mockResolvedValueOnce(mockSession);
      mockFindSourcesBySession.mockResolvedValueOnce([]);
      mockFindMaterialsBySession.mockResolvedValueOnce([]);

      const result = await service.getSessionDetail(sessionId, studentId);

      expect(result.titulo).toBe('Patologia Compartilhada');
      expect(mockIsCollaborator).toHaveBeenCalledWith(sessionId, studentId);
    });
  });

  describe('triggerMaterialGeneration', () => {
    it('deve lançar AppError 403 se um colaborador tentar gerar material', async () => {
      mockIsOwner.mockResolvedValueOnce(false);
      mockIsCollaborator.mockResolvedValueOnce(true);

      await expect(
        service.triggerMaterialGeneration(sessionId, studentId, 'flashcards', 'fisiologia renal')
      ).rejects.toThrow(new AppError('Apenas o proprietário do notebook pode gerar novos materiais de estudo.', 403));
    });

    it('deve lançar AppError 400 se o notebook não tiver fontes ativas prontas', async () => {
      mockFindSessionById.mockResolvedValueOnce({ id: sessionId });
      mockFindSourcesBySession.mockResolvedValueOnce([{ id: '1', status: 'indexing' }]); // Nenhuma fonte pronta

      await expect(
        service.triggerMaterialGeneration(sessionId, studentId, 'flashcards', 'fisiologia renal')
      ).rejects.toThrow(new AppError('Adicione pelo menos uma fonte ativa (status ready) ao seu notebook para gerar materiais de estudo.', 400));
    });

    it('deve lançar AppError 429 por causa do Rate Limit de 6 horas', async () => {
      mockFindSessionById.mockResolvedValueOnce({ id: sessionId });
      mockFindSourcesBySession.mockResolvedValueOnce([{ id: '1', status: 'ready' }]);
      mockFindLastMaterialGeneratedInLast6Hours.mockResolvedValueOnce({ id: 'material-recente', tipo: 'flashcards' });

      await expect(
        service.triggerMaterialGeneration(sessionId, studentId, 'flashcards', 'fisiologia renal')
      ).rejects.toThrow(new AppError("Você já gerou um material do tipo 'flashcards' nas últimas 6 horas. Por favor, aguarde para gerar novamente.", 429));
    });
  });

  describe('reviewFlashcard', () => {
    it('deve agendar o card para 2 dias no futuro caso seja um ACERTO (Anki)', async () => {
      const mockCard = { id: cardId, acertos: 1, erros: 0, material_id: materialId };
      mockFindFlashcardById.mockResolvedValueOnce(mockCard);
      mockFindMaterialById.mockResolvedValueOnce({ id: materialId, session_id: sessionId });
      
      const updatedCard = { ...mockCard, acertos: 2 };
      mockUpdateFlashcardReview.mockResolvedValueOnce(updatedCard);

      const result = await service.reviewFlashcard(cardId, studentId, 'acerto');

      expect(result.acertos).toBe(2);
      expect(mockUpdateFlashcardReview).toHaveBeenCalled();
      
      // Verifica se o intervalo agendado é de aproximadamente 2 dias (48 horas)
      const args = mockUpdateFlashcardReview.mock.calls[0];
      const proximoReview = args[2] as Date;
      const diferencaHoras = (proximoReview.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(diferencaHoras).toBeCloseTo(48, 0); // Permite pequena margem de tempo
    });
  });

  describe('shareSession', () => {
    it('deve permitir que o proprietário compartilhe o notebook', async () => {
      const mockShare = { id: 'share-id', session_id: sessionId, visibilidade: 'link', share_token: 'token-uuid' };
      mockCreateOrUpdateShare.mockResolvedValueOnce(mockShare);

      const result = await service.shareSession(sessionId, studentId, 'link');

      expect(result.share_token).toBe('token-uuid');
      expect(mockCreateOrUpdateShare).toHaveBeenCalledWith(sessionId, 'link', null);
    });

    it('deve lançar 403 se um colaborador tentar compartilhar', async () => {
      mockIsOwner.mockResolvedValueOnce(false);
      mockIsCollaborator.mockResolvedValueOnce(true);

      await expect(
        service.shareSession(sessionId, studentId, 'link')
      ).rejects.toThrow(new AppError('Apenas o proprietário do notebook pode compartilhá-lo.', 403));
    });
  });

  describe('getSharedSession', () => {
    it('deve permitir acesso público e retornar fontes + materiais', async () => {
      const mockShare = { id: sessionId, titulo: 'Patologia Pública', visibilidade: 'link', expira_em: null, share_token: 'token-uuid' };
      mockFindByShareToken.mockResolvedValueOnce(mockShare);
      mockFindSourcesBySession.mockResolvedValueOnce([{ id: 'src-1', status: 'ready', titulo: 'Fonte 1' }]);
      mockFindMaterialsBySession.mockResolvedValueOnce([{ id: 'mat-1', status: 'ready', tipo: 'resumo' }]);

      const result = await service.getSharedSession('token-uuid');

      expect(result.titulo).toBe('Patologia Pública');
      expect(result.sources.length).toBe(1);
      expect(result.materials.length).toBe(1);
    });

    it('deve lançar 410 se o compartilhamento público tiver expirado', async () => {
      const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const mockShare = { id: sessionId, titulo: 'Patologia Expirada', visibilidade: 'link', expira_em: ontem, share_token: 'token-uuid' };
      mockFindByShareToken.mockResolvedValueOnce(mockShare);

      await expect(
        service.getSharedSession('token-uuid')
      ).rejects.toThrow(new AppError('O link de compartilhamento para este notebook expirou.', 410));
    });
  });

  describe('addCollaborator', () => {
    it('deve permitir que o proprietário convide um colaborador', async () => {
      const mockCollaborator = { id: 'collab-id', session_id: sessionId, id_student: collaboratorId };
      mockAddCollaborator.mockResolvedValueOnce(mockCollaborator);

      const result = await service.addCollaborator(sessionId, studentId, collaboratorId);

      expect(result.id_student).toBe(collaboratorId);
      expect(mockAddCollaborator).toHaveBeenCalledWith(sessionId, collaboratorId);
    });

    it('deve lançar 400 se o proprietário tentar convidar a si mesmo', async () => {
      await expect(
        service.addCollaborator(sessionId, studentId, studentId)
      ).rejects.toThrow(new AppError('Você não pode convidar a si mesmo como colaborador.', 400));
    });
  });
});
