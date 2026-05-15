import { pool } from '../../config/postgres_local';

// -----------------------------------------------------------------------
// Tipos retornados pelo banco
// -----------------------------------------------------------------------

export interface IRawStudentKPIs {
  total_resolvidas: string;
  total_acertos: string;
  casos_clinicos_total: string;
  casos_clinicos_acertos: string;
  segundos_estudo: string;
}

export interface IRawLastInsight {
  id: string;
  gerado_em: Date;
  versao_prompt: string;
  pontos_fortes: unknown[];
  pontos_atencao: unknown[];
}

export interface IRawStudyDistribution {
  area: string;
  total_resolvidas: string;
}

export class StudentDashboardModel {
  async getKPIsByStudent(studentId: string): Promise<IRawStudentKPIs | null> {
    const check = await pool.query(
      'SELECT id FROM student WHERE id = $1',
      [studentId],
    );
    if (check.rows.length === 0) return null;

    const query = `
      SELECT
        COUNT(p.id)::TEXT                                           AS total_resolvidas,
        COUNT(p.id) FILTER (WHERE p.correct_answer = TRUE)::TEXT   AS total_acertos,
        '0'::TEXT                                                   AS casos_clinicos_total,
        '0'::TEXT                                                   AS casos_clinicos_acertos,
        COALESCE(
          EXTRACT(EPOCH FROM s.study_time)::TEXT,
          '0'
        )                                                           AS segundos_estudo
      FROM student s
      LEFT JOIN performance p ON p.id_student = s.id
      WHERE s.id = $1
      GROUP BY s.study_time;
    `;

    const result = await pool.query<IRawStudentKPIs>(query, [studentId]);

    if (result.rows.length === 0) {
      return {
        total_resolvidas: '0',
        total_acertos: '0',
        casos_clinicos_total: '0',
        casos_clinicos_acertos: '0',
        segundos_estudo: '0',
      };
    }

    return result.rows[0];
  }

  async getLastInsight(studentId: string): Promise<IRawLastInsight | null> {
    const result = await pool.query<IRawLastInsight>(
      `SELECT id, gerado_em, versao_prompt, pontos_fortes, pontos_atencao
       FROM performance_insights
       WHERE id_student = $1
       ORDER BY gerado_em DESC
       LIMIT 1;`,
      [studentId],
    );
    return result.rows[0] ?? null;
  }

  async getStudyDistribution(studentId: string): Promise<IRawStudyDistribution[]> {
    const query = `
      SELECT 
        'Tema ' || q.question_subject AS area,
        COUNT(p.id)::TEXT AS total_resolvidas
      FROM performance p
      JOIN question q ON p.id_question = q.id
      WHERE p.id_student = $1
      GROUP BY q.question_subject
      ORDER BY COUNT(p.id) DESC;
    `;
    const result = await pool.query<IRawStudyDistribution>(query, [studentId]);
    return result.rows;
  }
}
