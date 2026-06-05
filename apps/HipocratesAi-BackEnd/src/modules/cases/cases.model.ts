import { pool } from '../../config/postgres_local';
import {
  ICaseRow,
  ICaseAttemptRow,
  ICaseAttemptEventRow,
} from './cases.dto';

export class CasesModel {

  // ---------------------------------------------------------------------------
  // Cases
  // ---------------------------------------------------------------------------

  /** Busca caso por ID */
  async findCaseById(id: string): Promise<ICaseRow | null> {
    const result = await pool.query<ICaseRow>(
      `SELECT * FROM cases WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  /** Retorna dados resumidos do caso para o pop-up de intro */
  async getCaseIntro(id: string): Promise<ICaseRow | null> {
    const result = await pool.query<ICaseRow>(
      `SELECT id, titulo, descricao, especialidade, dificuldade, tempo_estimado_min, payload_mock
       FROM cases WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  // ---------------------------------------------------------------------------
  // Attempts
  // ---------------------------------------------------------------------------

  /** Cria uma nova tentativa (attempt) para um caso */
  async createAttempt(data: {
    user_id: string;
    case_id: string;
    modo: 'hm' | 'osce';
  }): Promise<ICaseAttemptRow> {
    const result = await pool.query<ICaseAttemptRow>(
      `INSERT INTO case_attempts (user_id, case_id, modo, status)
       VALUES ($1, $2, $3, 'em_andamento')
       RETURNING *`,
      [data.user_id, data.case_id, data.modo],
    );
    return result.rows[0];
  }

  /** Busca attempt por ID */
  async findAttemptById(aid: string): Promise<ICaseAttemptRow | null> {
    const result = await pool.query<ICaseAttemptRow>(
      `SELECT * FROM case_attempts WHERE id = $1`,
      [aid],
    );
    return result.rows[0] ?? null;
  }

  /** Finaliza um attempt: atualiza pontuação, acertos, erros, tempo e status */
  async finishAttempt(
    aid: string,
    data: {
      pontuacao: number;
      acertos: number;
      erros: number;
      tempo_segundos: number;
    },
  ): Promise<ICaseAttemptRow> {
    const result = await pool.query<ICaseAttemptRow>(
      `UPDATE case_attempts
       SET pontuacao      = $2,
           acertos        = $3,
           erros          = $4,
           tempo_segundos = $5,
           status         = 'finalizado',
           finalizado_em  = NOW()
       WHERE id = $1
       RETURNING *`,
      [aid, data.pontuacao, data.acertos, data.erros, data.tempo_segundos],
    );
    return result.rows[0];
  }

  // ---------------------------------------------------------------------------
  // Events (OSCE)
  // ---------------------------------------------------------------------------

  /** Registra um evento OSCE (acerto, erro ou omissão) */
  async createEvent(data: {
    attempt_id: string;
    tipo: string;
    ref: string;
    pontos: number;
    timestamp?: string;
  }): Promise<ICaseAttemptEventRow> {
    const ts = data.timestamp ?? new Date().toISOString();
    const result = await pool.query<ICaseAttemptEventRow>(
      `INSERT INTO case_attempt_events (attempt_id, tipo, ref, pontos, timestamp)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.attempt_id, data.tipo, data.ref, data.pontos, ts],
    );
    return result.rows[0];
  }

  /** Lista todos os eventos de um attempt */
  async getEventsByAttempt(attemptId: string): Promise<ICaseAttemptEventRow[]> {
    const result = await pool.query<ICaseAttemptEventRow>(
      `SELECT * FROM case_attempt_events
       WHERE attempt_id = $1
       ORDER BY criado_em ASC`,
      [attemptId],
    );
    return result.rows;
  }

  /** Calcula pontuação acumulada de um attempt (soma de todos os pontos, positivos e negativos) */
  async sumPointsByAttempt(attemptId: string): Promise<{
    acumulado: number;
    total_acertos: number;
    total_erros: number;
  }> {
    const result = await pool.query<{
      acumulado: string;
      total_acertos: string;
      total_erros: string;
    }>(
      `SELECT
         COALESCE(SUM(pontos), 0) AS acumulado,
         COALESCE(SUM(CASE WHEN tipo = 'procedimento_correto' THEN 1 ELSE 0 END), 0) AS total_acertos,
         COALESCE(SUM(CASE WHEN tipo IN ('erro', 'omissao') THEN 1 ELSE 0 END), 0) AS total_erros
       FROM case_attempt_events
       WHERE attempt_id = $1`,
      [attemptId],
    );

    const row = result.rows[0];
    return {
      acumulado: Number(row.acumulado),
      total_acertos: Number(row.total_acertos),
      total_erros: Number(row.total_erros),
    };
  }
}
