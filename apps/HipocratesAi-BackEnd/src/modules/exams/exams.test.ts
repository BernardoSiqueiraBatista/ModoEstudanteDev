import request from 'supertest';
import { app } from '../../app';

describe('Exams Integration Tests - Regras de Negócio e Edge Cases', () => {
  const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';

  /**
   * 1. TESTE DE NÃO REPETIÇÃO (ALGORITMO DE SELEÇÃO)
   * Valida se o sistema traz questões únicas quando há estoque no banco.
   */
  it('Deve retornar questões únicas quando houver quantidade suficiente no banco', async () => {
    const limit = 5;
    const response = await request(app).get(`/student/questions?limit=${limit}`);

    expect(response.status).toBe(200);
    const ids = response.body.questions.map((q: any) => q.id_questao);
    const uniqueIds = [...new Set(ids)];

    // O tamanho do Set deve ser igual ao limite pedido
    expect(uniqueIds.length).toBe(limit);
  });

  /**
   * 2. TESTE DE INTEGRIDADE DA TABELA PERFORMANCE
   * Valida que o banco não permite duplicidade para o mesmo par (aluno, questão).
   */
  it('O banco de performance deve atualizar o registro (UPSERT) em vez de criar duplicatas', async () => {
    // 1. Pega uma questão real
    const qRes = await request(app).get('/student/questions?limit=1');
    const questionId = qRes.body.questions[0].id_questao;

    // 2. Envia a resposta pela primeira vez (Errada)
    await request(app).post('/student/exams').send({
      studentID: STUDENT_ID,
      answers: [{ question_id: questionId, id_answer: 99 }] // Resposta errada proposital
    });

    // 3. Envia a mesma questão novamente (Corrigindo)
    const secondSubmit = await request(app).post('/student/exams').send({
      studentID: STUDENT_ID,
      answers: [{ question_id: questionId, id_answer: 0 }] 
    });

    expect(secondSubmit.status).toBe(200);
    
    // 4. Verificação lógica: Se o UPSERT funcionou, o resultado final deve ser baseado na última ação.
    // Detalhe: Se houver erro de constraint UNIQUE no banco, o teste falhará com Erro 500.
    expect(secondSubmit.body.totalNumberQuestions).toBe(1);
  });

  /**
   * 3. TESTE DE COERÊNCIA DE CÁLCULO
   * Valida se a porcentagem e os contadores estão matematicamente corretos.
   */
  it('Deve calcular a hitPercentage e correctAnswers com precisão matemática', async () => {
    // Simularemos 4 questões (2 certas, 2 erradas) -> 50%
    const qRes = await request(app).get('/student/questions?limit=4');
    const questions = qRes.body.questions;

    // Primeiro envio para descobrir as respostas corretas
    const discovery = await request(app).post('/student/exams').send({
      studentID: STUDENT_ID,
      answers: questions.map((q: any) => ({ question_id: q.id_questao, id_answer: 0 }))
    });

    const correctAnswersMap = discovery.body.details;

    // Agora montamos o payload: 2 questões forçamos o acerto, 2 forçamos o erro
    const mixedAnswers = questions.map((q: any, index: number) => {
      const isCorrect = correctAnswersMap.find((d: any) => d.question_id === q.id_questao);
      const rightAnswer = isCorrect.correct ? 0 : isCorrect.correctAnswer;
      
      return {
        question_id: q.id_questao,
        id_answer: index < 2 ? rightAnswer : (rightAnswer + 1) % 4 // Erra as duas últimas
      };
    });

    const response = await request(app).post('/student/exams').send({
      studentID: STUDENT_ID,
      answers: mixedAnswers
    });

    expect(response.status).toBe(200);
    expect(response.body.correctAnswers).toBe(2);
    expect(response.body.hitPercentage).toBe(50.0);
  });

  /**
   * 4. EDGE CASE: REQUISIÇÃO VAZIA
   */
  it('Deve retornar erro 400 ao enviar um simulado sem questões', async () => {
    const response = await request(app).post('/student/exams').send({
      studentID: STUDENT_ID,
      answers: []
    });

    // Dependendo da sua implementação, pode retornar 400 ou 200 com 0%. 
    // Ajuste conforme sua regra de negócio.
    expect(response.status).toBe(400); 
  });

  /**
   * 5. EDGE CASE: IDs MALFORMATADOS
   */
  it('Deve lidar com UUIDs inválidos no processamento sem derrubar o servidor', async () => {
    const response = await request(app).post('/student/exams').send({
      studentID: 'id-invalido',
      answers: [{ question_id: 'outro-id-ruim', id_answer: 1 }]
    });

    // O sistema deve tratar o erro e retornar 500 ou 400, mas nunca "congelar".
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});