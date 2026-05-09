import { pool } from '../../config/postgres_local';

export interface IAlternativeResponse {
  id_answer: number;
  texto: string;
}

export interface IQuestionResponse {
  id_questao: string;
  texto: string;
  alternativas: IAlternativeResponse[];
}

export class QuestionsModel {
  public async getRandomQuestions(limit: number, level?: number, category?: string): Promise<IQuestionResponse[]> {
    let query = `
      SELECT 
        q.id as id_questao,
        q.question_text as texto,
        json_agg(
          json_build_object(
            'id_alternative', a.order_index,
            'texto', a.alternative_text
          ) ORDER BY a.order_index
        ) as alternativas
      FROM question q
      JOIN alternative a ON q.id = a.id_question
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramIndex = 1;

    if (level !== undefined) {
      query += ` AND q.question_level = $${paramIndex}`;
      values.push(level);
      paramIndex++;
    }

    if (category) {
      query += ` AND q.question_subject = $${paramIndex}`;
      values.push(category);
      paramIndex++;
    }

    query += ` GROUP BY q.id, q.question_text ORDER BY RANDOM() LIMIT $${paramIndex};`;
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows;
  }
}