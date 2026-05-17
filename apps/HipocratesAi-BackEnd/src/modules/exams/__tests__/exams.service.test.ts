import { ExamsService } from '../exams.service';
import { ExamsModel } from '../exams.model';
import { AppError } from '../../../shared/errors/AppError';

jest.mock('../exams.model');

describe('ExamsService', () => {
  let service: ExamsService;
  let mockCheckStudentExists: jest.Mock;
  let mockGetExistingQuestionIds: jest.Mock;
  let mockGetCorrectAlternatives: jest.Mock;
  let mockSavePerformance: jest.Mock;

  beforeEach(() => {
    mockCheckStudentExists = jest.fn();
    mockGetExistingQuestionIds = jest.fn();
    mockGetCorrectAlternatives = jest.fn();
    mockSavePerformance = jest.fn();

    (ExamsModel as jest.Mock).mockImplementation(() => ({
      checkStudentExists: mockCheckStudentExists,
      getExistingQuestionIds: mockGetExistingQuestionIds,
      getCorrectAlternatives: mockGetCorrectAlternatives,
      savePerformance: mockSavePerformance
    }));

    service = new ExamsService();
    jest.clearAllMocks();
  });

  it('deve estourar erro 404 se estudante nao existir', async () => {
    mockCheckStudentExists.mockResolvedValueOnce(false);
    
    await expect(service.processExamResults('inexistente', [])).rejects.toThrow(
      new AppError('Estudante com ID inexistente não encontrado.', 404)
    );
  });

  it('deve estourar erro 404 se alguma questao nao for encontrada no banco', async () => {
    mockCheckStudentExists.mockResolvedValueOnce(true);
    mockGetExistingQuestionIds.mockResolvedValueOnce(['q1']); // banco acha só 1

    const answers = [
      { question_id: 'q1', id_answer: 1 },
      { question_id: 'q2', id_answer: 2 }
    ];

    await expect(service.processExamResults('aluno-123', answers)).rejects.toThrow(
      new AppError('Uma ou mais questões não foram encontradas.', 404)
    );
  });

  it('deve processar o simulado, contabilizar acertos e salvar performance (200)', async () => {
    mockCheckStudentExists.mockResolvedValueOnce(true);
    mockGetExistingQuestionIds.mockResolvedValueOnce(['q1', 'q2']);
    
    mockGetCorrectAlternatives.mockResolvedValueOnce([
      { id_question: 'q1', correct_order_index: 1 },
      { id_question: 'q2', correct_order_index: 3 }
    ]);

    const answers = [
      { question_id: 'q1', id_answer: 1 }, // acertou
      { question_id: 'q2', id_answer: 2 }  // errou
    ];

    const result = await service.processExamResults('aluno-123', answers);

    expect(result.totalNumberQuestions).toBe(2);
    expect(result.correctAnswers).toBe(1);
    expect(result.hitPercentage).toBe(50.0);
    expect(result.details[0].correct).toBe(true);
    expect(result.details[1].correct).toBe(false);
    expect(result.details[1].correctAnswer).toBe(3);

    expect(mockSavePerformance).toHaveBeenCalledWith('aluno-123', [
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: false }
    ]);
  });
});
