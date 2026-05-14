import { pool } from '../../config/postgres_local';

export interface IRawPerformanceStats {
  total_resolvidas: string;
  total_acertos: string;
  segundos_estudo: string;
}

export interface IInsightRecord {
  id: string;
  id_student: string;
  gerado_em: Date;
  versao_prompt: string;
  pontos_fortes: unknown;
  pontos_atencao: unknown;
}

export class InsightsModel {
  /**
   * Busca o último insight persistido para o aluno
   */
  async getLastInsight(studentId: string): Promise<IInsightRecord | null> {
    const query = `
      SELECT id, id_student, gerado_em, versao_prompt, pontos_fortes, pontos_atencao
      FROM performance_insights
      WHERE id_student = $1
      ORDER BY gerado_em DESC
      LIMIT 1;
    `;
    const result = await pool.query<IInsightRecord>(query, [studentId]);
    return result.rows[0] ?? null;
  }

  /**
   * Coleta as métricas dos últimos 30 dias do aluno na tabela de performance.
   * O tempo de estudo total do aluno vem da tabela student.
   */
  async getStatsLast30Days(studentId: string): Promise<IRawPerformanceStats | null> {
    // Como a tabela performance atual não tem data (timestamp), 
    // faremos uma contagem global para esta fase.
    // Futuramente, se a tabela performance ganhar um timestamp, podemos adicionar um WHERE data >= NOW() - INTERVAL '30 days'.
    const query = `
      SELECT
        COUNT(p.id)::TEXT                                           AS total_resolvidas,
        COUNT(p.id) FILTER (WHERE p.correct_answer = TRUE)::TEXT   AS total_acertos,
        COALESCE(
          (SELECT EXTRACT(EPOCH FROM study_time)::TEXT FROM student WHERE id = $1),
          '0'
        ) AS segundos_estudo
      FROM performance p
      WHERE p.id_student = $1;
    `;
    const result = await pool.query<IRawPerformanceStats>(query, [studentId]);
    
    if (result.rows.length === 0 || !result.rows[0].total_resolvidas) {
       return null;
    }
    return result.rows[0];
  }

  /**
   * Salva um novo insight no banco de dados.
   */
  async saveInsight(
    studentId: string, 
    pontosFortes: string[], 
    pontosAtencao: string[],
    versaoPrompt: string = 'v1'
  ): Promise<IInsightRecord> {
    const query = `
      INSERT INTO performance_insights (id_student, versao_prompt, pontos_fortes, pontos_atencao)
      VALUES ($1, $2, $3, $4)
      RETURNING id, id_student, gerado_em, versao_prompt, pontos_fortes, pontos_atencao;
    `;
    const result = await pool.query<IInsightRecord>(query, [
      studentId, 
      versaoPrompt, 
      JSON.stringify(pontosFortes), 
      JSON.stringify(pontosAtencao)
    ]);
    return result.rows[0];
  }
}
