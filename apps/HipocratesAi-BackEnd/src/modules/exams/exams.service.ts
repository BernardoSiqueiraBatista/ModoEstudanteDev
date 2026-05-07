import { ExamsModel } from './exams.model';

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
    const questionIds = answers.map(a => a.question_id);
    
    // 1. Busca os gabaritos no banco
    const correctAlternatives = await this.model.getCorrectAlternatives(questionIds);

    let correctCount = 0;
    const details = answers.map(userAns => {
      const correctAlt = correctAlternatives.find(ca => ca.id_question === userAns.question_id);
      
      const isCorrect = correctAlt ? correctAlt.correct_order_index === userAns.id_answer : false;
      
      if (isCorrect) correctCount++;

      return {
        question_id: userAns.question_id,
        correct: isCorrect,
        // Se errou, informa qual era a correta (order_index)
        ...( !isCorrect && { correctAnswer: correctAlt?.correct_order_index } )
      };
    });

    // 2. Prepara os dados para salvar na performance
    const performanceData = details.map(d => ({
      questionId: d.question_id,
      isCorrect: d.correct
    }));

    // 3. Persiste no banco de dados
    await this.model.savePerformance(studentId, performanceData);

    // 4. Retorna o objeto formatado conforme o contrato do front
    return {
      totalNumberQuestions: answers.length,
      correctAnswers: correctCount,
      hitPercentage: Number(((correctCount / answers.length) * 100).toFixed(1)),
      details
    };
  }
}