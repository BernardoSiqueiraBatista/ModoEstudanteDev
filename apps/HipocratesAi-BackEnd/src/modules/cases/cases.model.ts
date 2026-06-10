import { pool } from '../../config/postgres_local';
import { ICaseRow, ICaseAttemptRow, ICaseAttemptEventRow, ICaseMessage } from './cases.dto';

export class CasesModel {

  // ── Cases ──────────────────────────────────────────────────────────────────

  async listCases(filters?: { especialidade?: string; dificuldade?: string; search?: string }): Promise<ICaseRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters?.especialidade) { conditions.push(`especialidade = $${idx++}`); params.push(filters.especialidade); }
    if (filters?.dificuldade)   { conditions.push(`dificuldade = $${idx++}`);   params.push(filters.dificuldade); }
    if (filters?.search?.trim()) {
      conditions.push(`(titulo ILIKE $${idx} OR descricao ILIKE $${idx})`);
      params.push(`%${filters.search.trim()}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query<ICaseRow>(
      `SELECT * FROM cases ${where} ORDER BY especialidade, titulo`,
      params
    );
    return result.rows;
  }

  async findCaseById(id: string): Promise<ICaseRow | null> {
    const result = await pool.query<ICaseRow>(`SELECT * FROM cases WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
  }

  async getCaseIntro(id: string): Promise<ICaseRow | null> {
    const result = await pool.query<ICaseRow>(
      `SELECT id, titulo, descricao, especialidade, dificuldade, tempo_estimado_min, payload_mock FROM cases WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  // ── Attempts ───────────────────────────────────────────────────────────────

  async createAttempt(data: { user_id: string; case_id: string; modo: 'hm' | 'osce' }): Promise<ICaseAttemptRow> {
    const result = await pool.query<ICaseAttemptRow>(
      `INSERT INTO case_attempts (user_id, case_id, modo, status) VALUES ($1, $2, $3, 'em_andamento') RETURNING *`,
      [data.user_id, data.case_id, data.modo]
    );
    return result.rows[0];
  }

  async findAttemptById(aid: string): Promise<ICaseAttemptRow | null> {
    const result = await pool.query<ICaseAttemptRow>(`SELECT * FROM case_attempts WHERE id = $1`, [aid]);
    return result.rows[0] ?? null;
  }

  async finishAttempt(
    aid: string,
    data: { pontuacao: number; acertos: number; erros: number; tempo_segundos: number }
  ): Promise<ICaseAttemptRow> {
    const result = await pool.query<ICaseAttemptRow>(
      `UPDATE case_attempts
       SET pontuacao = $2, acertos = $3, erros = $4, tempo_segundos = $5, status = 'finalizado', finalizado_em = NOW()
       WHERE id = $1
       RETURNING *`,
      [aid, data.pontuacao, data.acertos, data.erros, data.tempo_segundos]
    );
    return result.rows[0];
  }

  // ── Events (OSCE) ──────────────────────────────────────────────────────────

  async createEvent(data: {
    attempt_id: string;
    tipo: string;
    ref: string;
    pontos: number;
    timestamp?: string;
  }): Promise<ICaseAttemptEventRow> {
    const ts = data.timestamp ?? new Date().toISOString();
    const result = await pool.query<ICaseAttemptEventRow>(
      `INSERT INTO case_attempt_events (attempt_id, tipo, ref, pontos, timestamp) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.attempt_id, data.tipo, data.ref, data.pontos, ts]
    );
    return result.rows[0];
  }

  async getEventsByAttempt(attemptId: string): Promise<ICaseAttemptEventRow[]> {
    const result = await pool.query<ICaseAttemptEventRow>(
      `SELECT * FROM case_attempt_events WHERE attempt_id = $1 ORDER BY criado_em ASC`,
      [attemptId]
    );
    return result.rows;
  }

  async sumPointsByAttempt(attemptId: string): Promise<{ acumulado: number; total_acertos: number; total_erros: number }> {
    const result = await pool.query<{ acumulado: string; total_acertos: string; total_erros: string }>(
      `SELECT
         COALESCE(SUM(pontos), 0) AS acumulado,
         COALESCE(SUM(CASE WHEN tipo = 'procedimento_correto' THEN 1 ELSE 0 END), 0) AS total_acertos,
         COALESCE(SUM(CASE WHEN tipo IN ('erro', 'omissao') THEN 1 ELSE 0 END), 0) AS total_erros
       FROM case_attempt_events WHERE attempt_id = $1`,
      [attemptId]
    );
    const r = result.rows[0];
    return { acumulado: Number(r.acumulado), total_acertos: Number(r.total_acertos), total_erros: Number(r.total_erros) };
  }

  // ── HM Chat ────────────────────────────────────────────────────────────────

  async saveMessage(attemptId: string, studentId: string, role: 'user' | 'assistant' | 'hint', content: string): Promise<ICaseMessage> {
    const result = await pool.query<ICaseMessage>(
      `INSERT INTO case_messages (attempt_id, student_id, role, content) VALUES ($1, $2, $3, $4) RETURNING *`,
      [attemptId, studentId, role, content]
    );
    return result.rows[0];
  }

  async getMessages(attemptId: string, limit = 30): Promise<ICaseMessage[]> {
    const result = await pool.query<ICaseMessage>(
      `SELECT * FROM case_messages WHERE attempt_id = $1 ORDER BY criado_em ASC LIMIT $2`,
      [attemptId, limit]
    );
    return result.rows;
  }

  // ── Dashboard Metrics ──────────────────────────────────────────────────────

  async getMetrics(studentId: string) {
    const [totals, dist, evo] = await Promise.all([
      pool.query<{ total_resolvidos: string; assertividade_media: string; tempo_medio_segundos: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'finalizado') AS total_resolvidos,
           COALESCE(AVG(
             CASE WHEN status = 'finalizado' AND (acertos + erros) > 0
             THEN acertos::float / (acertos + erros) * 100 END
           ), 0) AS assertividade_media,
           COALESCE(AVG(tempo_segundos) FILTER (WHERE status = 'finalizado'), 0) AS tempo_medio_segundos
         FROM case_attempts WHERE user_id = $1`,
        [studentId]
      ),
      pool.query<{ especialidade: string; total: string }>(
        `SELECT c.especialidade, COUNT(*) AS total
         FROM case_attempts ca JOIN cases c ON c.id = ca.case_id
         WHERE ca.user_id = $1 AND ca.status = 'finalizado'
         GROUP BY c.especialidade ORDER BY total DESC`,
        [studentId]
      ),
      pool.query<{ periodo_atual: string; periodo_anterior: string }>(
        `SELECT
           COUNT(*) FILTER (WHERE finalizado_em >= NOW() - INTERVAL '30 days') AS periodo_atual,
           COUNT(*) FILTER (WHERE finalizado_em >= NOW() - INTERVAL '60 days' AND finalizado_em < NOW() - INTERVAL '30 days') AS periodo_anterior
         FROM case_attempts WHERE user_id = $1 AND status = 'finalizado'`,
        [studentId]
      ),
    ]);
    const t = totals.rows[0];
    const e = evo.rows[0];
    const atual = Number(e.periodo_atual);
    const anterior = Number(e.periodo_anterior);
    return {
      total_resolvidos: Number(t.total_resolvidos),
      assertividade_media: Math.round(Number(t.assertividade_media) * 10) / 10,
      tempo_medio_segundos: Math.round(Number(t.tempo_medio_segundos)),
      distribuicao_especialidade: dist.rows.map(r => ({ especialidade: r.especialidade, total: Number(r.total) })),
      evolucao: { periodo_atual: atual, periodo_anterior: anterior, delta: anterior > 0 ? Math.round(((atual - anterior) / anterior) * 100) : 0 },
    };
  }
}
