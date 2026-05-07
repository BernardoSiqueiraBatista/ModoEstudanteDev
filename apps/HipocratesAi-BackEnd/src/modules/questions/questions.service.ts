import { QuestionsModel, IQuestionResponse } from './questions.model';

export class QuestionsService {
  private model: QuestionsModel;

  constructor() {
    this.model = new QuestionsModel();
  }

  public async getRandomQuestions(limit: number, level?: number, category?: string): Promise<IQuestionResponse[]> {
    
    const safeLimit = limit > 50 ? 50 : limit;

    const questions = await this.model.getRandomQuestions(safeLimit, level, category);

    return questions;
  }
}