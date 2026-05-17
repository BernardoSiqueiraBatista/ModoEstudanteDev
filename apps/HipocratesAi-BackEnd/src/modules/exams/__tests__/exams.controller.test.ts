import request from 'supertest';
import express, { Express } from 'express';
const mockProcessExamResults = jest.fn();

jest.mock('../exams.service', () => {
  return {
    ExamsService: jest.fn().mockImplementation(() => ({
      processExamResults: (...args: any[]) => mockProcessExamResults(...args)
    }))
  };
});

import { ExamController } from '../exams.controller';
import { ExamsService } from '../exams.service';
import { AppError } from '../../../shared/errors/AppError';

describe('ExamController', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json() as express.RequestHandler);
    const controller = new ExamController();
    app.post('/student/exams', controller.processExam as express.RequestHandler);
    
    app.use((err: any, req: any, res: any, next: any) => {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Internal server error' });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /student/exams deve retornar 400 se request body for inválido', async () => {
    const response = await request(app).post('/student/exams').send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Dados do simulado inválidos ou incompletos.');
  });

  it('POST /student/exams deve retornar 200 e processar simulado corretamente', async () => {
    mockProcessExamResults.mockResolvedValueOnce({
      totalNumberQuestions: 2,
      correctAnswers: 1,
      hitPercentage: 50.0,
      details: []
    });

    const body = {
      studentID: 'aluno-123',
      answers: [{ question_id: 'q1', id_answer: 1 }, { question_id: 'q2', id_answer: 2 }]
    };

    const response = await request(app).post('/student/exams').send(body);
    
    expect(response.status).toBe(200);
    expect(response.body.totalNumberQuestions).toBe(2);
    expect(response.body.hitPercentage).toBe(50.0);
    expect(mockProcessExamResults).toHaveBeenCalledWith('aluno-123', body.answers);
  });
});
