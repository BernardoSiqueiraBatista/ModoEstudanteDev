import { QuestionsService } from '../questions.service';
import { QuestionsModel } from '../questions.model';

jest.mock('../questions.model');
const mockGetRandomQuestions = jest.fn();
(QuestionsModel as jest.Mock).mockImplementation(() => ({
  getRandomQuestions: mockGetRandomQuestions
}));

describe('QuestionsService', () => {
  let service: QuestionsService;

  beforeEach(() => {
    service = new QuestionsService();
    jest.clearAllMocks();
  });

  it('getRandomQuestions: deve repassar limite máximo de 100 se pedido for maior', async () => {
    mockGetRandomQuestions.mockResolvedValueOnce([{ id: 1 }]);
    
    const result = await service.getRandomQuestions(150);
    expect(result).toHaveLength(1);
    expect(mockGetRandomQuestions).toHaveBeenCalledWith(100, undefined, undefined);
  });

  it('getRandomQuestions: deve repassar parametros corretos', async () => {
    mockGetRandomQuestions.mockResolvedValueOnce([{ id: 2 }]);
    
    await service.getRandomQuestions(25, 2, 'Cardio');
    expect(mockGetRandomQuestions).toHaveBeenCalledWith(25, 2, 'Cardio');
  });
});
