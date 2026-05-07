import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../studentMode/.env') });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export interface ICorrectAlternative {
  id_question: string;
  correct_order_index: number;
}

export class ExamsModel {
  /**
   * Busca o índice correto (order_index) de uma lista de questões
   */
  public async getCorrectAlternatives(questionIds: string[]): Promise<ICorrectAlternative[]> {
    const query = `
      SELECT id_question, order_index as correct_order_index
      FROM alternative
      WHERE id_question = ANY($1) AND is_correct = true
    `;
    const result = await pool.query(query, [questionIds]);
    return result.rows;
  }

  /**
   * Salva os resultados na tabela de performance.
   * Utiliza o "ON CONFLICT" para atualizar caso o aluno refaça a questão.
   */
  public async savePerformance(studentId: string, results: { questionId: string, isCorrect: boolean }[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO performance (id_student, id_question, correct_answer)
        VALUES ($1, $2, $3)
        ON CONFLICT (id_student, id_question) 
        DO UPDATE SET correct_answer = EXCLUDED.correct_answer;
      `;

      for (const res of results) {
        await client.query(query, [studentId, res.questionId, res.isCorrect]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}