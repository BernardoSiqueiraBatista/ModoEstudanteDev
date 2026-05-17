import { ExamsModel } from './exams.model';
import { AppError } from '../../shared/errors/AppError';

export interface IExamAnswer {
  question_id: string;
  id_answer: number;
}

export class ExamsService {
  private model: ExamsModel;

  constructor() {
    this.model = new ExamsModel();
  }

  public async processExamResults(studentId: string, answers: IExamAnswer[]) {
    const studentExists = await this.model.checkStudentExists(studentId);
    if (!studentExists) {
      throw new AppError(`Estudante com ID ${studentId} não encontrado.`, 404);
    }
    
    const questionIds = answers.map(a => a.question_id);
    const uniqueQuestionIds = [...new Set(questionIds)];

    const existingQuestions = await this.model.getExistingQuestionIds(uniqueQuestionIds);
    
    if (existingQuestions.length !== uniqueQuestionIds.length) {
      throw new AppError('Uma ou mais questões não foram encontradas.', 404);
    }

    const correctAlternatives = await this.model.getCorrectAlternatives(uniqueQuestionIds);

    let correctCount = 0;
    const details = answers.map(userAns => {
      const correctAlt = correctAlternatives.find(ca => ca.id_question === userAns.question_id);
      const isCorrect = correctAlt ? correctAlt.correct_order_index === userAns.id_answer : false;
      
      if (isCorrect) correctCount++;

      return {
        question_id: userAns.question_id,
        correct: isCorrect,
        ...( !isCorrect && { correctAnswer: correctAlt?.correct_order_index } )
      };
    });

    const performanceData = details.map(d => ({
      questionId: d.question_id,
      isCorrect: d.correct
    }));

    // 5. Persistência
    await this.model.savePerformance(studentId, performanceData);

    return {
      totalNumberQuestions: answers.length,
      correctAnswers: correctCount,
      hitPercentage: Number(((correctCount / answers.length) * 100).toFixed(1)),
      details
    };
  }
}