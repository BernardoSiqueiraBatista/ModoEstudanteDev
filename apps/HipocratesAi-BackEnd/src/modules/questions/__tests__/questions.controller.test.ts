import request from 'supertest';
import express, { Express } from 'express';
const mockGetRandomQuestions = jest.fn();

jest.mock('../questions.service', () => {
  return {
    QuestionsService: jest.fn().mockImplementation(() => ({
      getRandomQuestions: (...args: any[]) => mockGetRandomQuestions(...args)
    }))
  };
});

import { QuestionsController } from '../questions.controller';
import { QuestionsService } from '../questions.service';

describe('QuestionsController', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json() as express.RequestHandler);
    const controller = new QuestionsController();
    app.get('/student/questions', controller.getQuestions as express.RequestHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /student/questions deve retornar 200 com questoes e count', async () => {
    mockGetRandomQuestions.mockResolvedValueOnce([{ id: 'q-1' }, { id: 'q-2' }]);

    const response = await request(app).get('/student/questions?limit=5');
    
    expect(response.status).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.questions).toHaveLength(2);
    expect(mockGetRandomQuestions).toHaveBeenCalledWith(5, undefined, undefined);
  });

  it('GET /student/questions deve repassar o limit=10 default e parser options', async () => {
    mockGetRandomQuestions.mockResolvedValueOnce([]);

    const response = await request(app).get('/student/questions?level=3&category=5');
    
    expect(response.status).toBe(200);
    expect(mockGetRandomQuestions).toHaveBeenCalledWith(10, 3, 5);
  });
});
