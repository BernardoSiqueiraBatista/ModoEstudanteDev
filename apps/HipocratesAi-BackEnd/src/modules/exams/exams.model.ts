import { pool } from '../../config/postgres_local';

export interface ICorrectAlternative {
  id_question: string;
  correct_order_index: number;
}

export class ExamsModel {

  // Esse método poderia ser genérico de uma rota /student
  public async checkStudentExists(studentId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM student WHERE id = $1';
    const result = await pool.query(query, [studentId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Esse método poderia ser genérico de uma rota /question
  public async getExistingQuestionIds(questionIds: string[]): Promise<string[]> {
    const query = 'SELECT id FROM question WHERE id = ANY($1)';
    const result = await pool.query(query, [questionIds]);
    
    return result.rows.map(row => row.id);
  }
  
  
  public async getCorrectAlternatives(questionIds: string[]): Promise<ICorrectAlternative[]> {
    const query = `
      SELECT id_question, order_index as correct_order_index
      FROM alternative
      WHERE id_question = ANY($1) AND is_correct = true
    `;
    const result = await pool.query(query, [questionIds]);
    return result.rows;
  }


  public async savePerformance(studentId: string, results: { questionId: string, isCorrect: boolean }[], timeSpentSeconds: number = 0): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO performance (id_student, id_question, correct_answer)
        VALUES ($1, $2, $3)
        ON CONFLICT (id_student, id_question) DO UPDATE SET correct_answer = EXCLUDED.correct_answer
      `;
      for (const res of results) {
        await client.query(insertQuery, [studentId, res.questionId, res.isCorrect]);
      }

      if (timeSpentSeconds > 0) {
        await client.query(
          `UPDATE student SET study_time = study_time + make_interval(secs => $1) WHERE id = $2`,
          [timeSpentSeconds, studentId]
        );
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;

    } finally {
      client.release();
    }
  }
}