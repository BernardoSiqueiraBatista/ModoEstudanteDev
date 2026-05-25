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
  const sessionId = 'b8db5f1f-942d-43d0-ab0b-cda85f71905b';
  const materialId = 'cda85f71-942d-43d0-ab0b-bda85f71905b';
  const cardId = 'f1925b44-9694-477c-a496-5e638e4a9e25';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaperlabService();
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
    it('deve lançar AppError 404 se a sessão de notebook não existir', async () => {
      mockFindSessionById.mockResolvedValueOnce(null);

      await expect(service.getSessionDetail('invalid-id'))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('triggerMaterialGeneration', () => {
    it('deve lançar AppError 400 se o notebook não tiver fontes ativas prontas', async () => {
      mockFindSessionById.mockResolvedValueOnce({ id: sessionId });
      mockFindSourcesBySession.mockResolvedValueOnce([{ id: '1', status: 'indexing' }]); // Nenhuma fonte pronta

      await expect(
        service.triggerMaterialGeneration(sessionId, 'flashcards', 'fisiologia renal')
      ).rejects.toThrow(new AppError('Adicione pelo menos uma fonte ativa (status ready) ao seu notebook para gerar materiais de estudo.', 400));
    });

    it('deve lançar AppError 429 por causa do Rate Limit de 6 horas', async () => {
      mockFindSessionById.mockResolvedValueOnce({ id: sessionId });
      mockFindSourcesBySession.mockResolvedValueOnce([{ id: '1', status: 'ready' }]);
      mockFindLastMaterialGeneratedInLast6Hours.mockResolvedValueOnce({ id: 'material-recente', tipo: 'flashcards' });

      await expect(
        service.triggerMaterialGeneration(sessionId, 'flashcards', 'fisiologia renal')
      ).rejects.toThrow(new AppError("Você já gerou um material do tipo 'flashcards' nas últimas 6 horas. Por favor, aguarde para gerar novamente.", 429));
    });
  });

  describe('reviewFlashcard', () => {
    it('deve agendar o card para 2 dias no futuro caso seja um ACERTO (Anki)', async () => {
      const mockCard = { id: cardId, acertos: 1, erros: 0, material_id: materialId };
      mockFindFlashcardById.mockResolvedValueOnce(mockCard);
      
      const updatedCard = { ...mockCard, acertos: 2 };
      mockUpdateFlashcardReview.mockResolvedValueOnce(updatedCard);

      const result = await service.reviewFlashcard(cardId, 'acerto');

      expect(result.acertos).toBe(2);
      expect(mockUpdateFlashcardReview).toHaveBeenCalled();
      
      // Verifica se o intervalo agendado é de aproximadamente 2 dias (48 horas)
      const args = mockUpdateFlashcardReview.mock.calls[0];
      const proximoReview = args[2] as Date;
      const diferencaHoras = (proximoReview.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(diferencaHoras).toBeCloseTo(48, 0); // Permite pequena margem de tempo
    });

    it('deve agendar o card para 10 minutos no futuro caso seja um ERRO (Anki)', async () => {
      const mockCard = { id: cardId, acertos: 1, erros: 0, material_id: materialId };
      mockFindFlashcardById.mockResolvedValueOnce(mockCard);
      
      const updatedCard = { ...mockCard, erros: 1 };
      mockUpdateFlashcardReview.mockResolvedValueOnce(updatedCard);

      const result = await service.reviewFlashcard(cardId, 'erro');

      expect(result.erros).toBe(1);
      expect(mockUpdateFlashcardReview).toHaveBeenCalled();

      // Verifica se o intervalo agendado é de aproximadamente 10 minutos
      const args = mockUpdateFlashcardReview.mock.calls[0];
      const proximoReview = args[2] as Date;
      const diferencaMinutos = (proximoReview.getTime() - Date.now()) / (1000 * 60);
      expect(diferencaMinutos).toBeCloseTo(10, 0);
    });
  });
});
