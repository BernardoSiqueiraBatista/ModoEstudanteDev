import { pool } from '../../config/postgres_local';

export interface IRawPerformanceData {
  total_resolvidas: string;
  total_acertos: string;
  segundos_estudo: number;
}

export class PerformanceModel {
  public async getRawStatsByStudent(studentId: string): Promise<IRawPerformanceData | null> {
    try {
      const studentCheck = await pool.query('SELECT id FROM student WHERE id = $1', [studentId]);
      if (studentCheck.rows.length === 0) return null;

      const query = `
        SELECT
          COALESCE(SUM(e.total_questions), 0)  AS total_resolvidas,
          COALESCE(SUM(e.correct_answers), 0)  AS total_acertos,
          (SELECT EXTRACT(EPOCH FROM study_time) FROM student WHERE id = $1) AS segundos_estudo
        FROM exam e
        WHERE e.id_student = $1;
      `;

      const result = await pool.query(query, [studentId]);
      return result.rows[0];

    } catch (error: any) {
      if (error.code === '22P02') return null;
      throw error;
    }
  }
}
