import { pool } from '../../config/postgres_local';
import {
  PaperlabSessionRow,
  PaperlabSourceRow,
  PaperlabMaterialRow,
  FlashcardRow
} from './types/paperlab.types';

export class PaperlabModel {

  // ===========================================================================
  // SESSÕES (NOTEBOOKS)
  // ===========================================================================

  async createSession(studentId: string, titulo: string): Promise<PaperlabSessionRow> {
    const query = `
      INSERT INTO paperlab_sessions (id_student, titulo)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const result = await pool.query<PaperlabSessionRow>(query, [studentId, titulo]);
    return result.rows[0];
  }

  async findSessionsByStudent(studentId: string): Promise<PaperlabSessionRow[]> {
    const query = `
      SELECT * FROM paperlab_sessions
      WHERE id_student = $1
      ORDER BY criado_em DESC;
    `;
    const result = await pool.query<PaperlabSessionRow>(query, [studentId]);
    return result.rows;
  }

  async findSessionById(sessionId: string): Promise<PaperlabSessionRow | null> {
    const query = `
      SELECT * FROM paperlab_sessions
      WHERE id = $1;
    `;
    const result = await pool.query<PaperlabSessionRow>(query, [sessionId]);
    return result.rows[0] ?? null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const query = `
      DELETE FROM paperlab_sessions
      WHERE id = $1;
    `;
    const result = await pool.query(query, [sessionId]);
    return (result.rowCount ?? 0) > 0;
  }

  async updateSessionTitle(sessionId: string, titulo: string): Promise<PaperlabSessionRow | null> {
    const query = `
      UPDATE paperlab_sessions
      SET titulo = $1
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query<PaperlabSessionRow>(query, [titulo, sessionId]);
    return result.rows[0] ?? null;
  }

  // ===========================================================================
  // FONTES (SOURCES)
  // ===========================================================================

  async createSource(
    sessionId: string,
    tipo: 'pdf' | 'docx' | 'image' | 'youtube' | 'link',
    urlOuPath: string,
    titulo: string,
    status: 'indexing' | 'ready' | 'error' = 'indexing'
  ): Promise<PaperlabSourceRow> {
    const query = `
      INSERT INTO paperlab_sources (session_id, tipo, url_ou_path, titulo, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query<PaperlabSourceRow>(query, [
      sessionId,
      tipo,
      urlOuPath,
      titulo,
      status,
    ]);
    return result.rows[0];
  }

  async findSourcesBySession(sessionId: string): Promise<PaperlabSourceRow[]> {
    const query = `
      SELECT * FROM paperlab_sources
      WHERE session_id = $1
      ORDER BY criado_em DESC;
    `;
    const result = await pool.query<PaperlabSourceRow>(query, [sessionId]);
    return result.rows;
  }

  async findSourceById(sourceId: string): Promise<PaperlabSourceRow | null> {
    const query = `
      SELECT * FROM paperlab_sources
      WHERE id = $1;
    `;
    const result = await pool.query<PaperlabSourceRow>(query, [sourceId]);
    return result.rows[0] ?? null;
  }

  async updateSourceStatus(sourceId: string, status: 'ready' | 'error'): Promise<PaperlabSourceRow | null> {
    const query = `
      UPDATE paperlab_sources
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query<PaperlabSourceRow>(query, [status, sourceId]);
    return result.rows[0] ?? null;
  }

  async deleteSource(sourceId: string): Promise<boolean> {
    const query = `
      DELETE FROM paperlab_sources
      WHERE id = $1;
    `;
    const result = await pool.query(query, [sourceId]);
    return (result.rowCount ?? 0) > 0;
  }

  // ===========================================================================
  // MATERIAIS (MATERIALS)
  // ===========================================================================

  async createMaterial(
    sessionId: string,
    tipo: 'flashcards' | 'resumo' | 'simulado' | 'mapa_mental',
    prompt: string,
    status: 'pending' | 'ready' | 'error' = 'pending'
  ): Promise<PaperlabMaterialRow> {
    const query = `
      INSERT INTO paperlab_materials (session_id, tipo, prompt, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query<PaperlabMaterialRow>(query, [
      sessionId,
      tipo,
      prompt,
      status,
    ]);
    return result.rows[0];
  }

  async findMaterialsBySession(sessionId: string): Promise<PaperlabMaterialRow[]> {
    const query = `
      SELECT * FROM paperlab_materials
      WHERE session_id = $1
      ORDER BY criado_em DESC;
    `;
    const result = await pool.query<PaperlabMaterialRow>(query, [sessionId]);
    return result.rows;
  }

  async findMaterialById(materialId: string): Promise<PaperlabMaterialRow | null> {
    const query = `
      SELECT * FROM paperlab_materials
      WHERE id = $1;
    `;
    const result = await pool.query<PaperlabMaterialRow>(query, [materialId]);
    return result.rows[0] ?? null;
  }

  async updateMaterialContent(
    materialId: string,
    conteudo: any,
    status: 'ready' | 'error'
  ): Promise<PaperlabMaterialRow | null> {
    const query = `
      UPDATE paperlab_materials
      SET conteudo = $1, status = $2
      WHERE id = $3
      RETURNING *;
    `;
    const result = await pool.query<PaperlabMaterialRow>(query, [
      JSON.stringify(conteudo),
      status,
      materialId,
    ]);
    return result.rows[0] ?? null;
  }

  async updateMaterialPartial(
    materialId: string,
    conteudo: any
  ): Promise<PaperlabMaterialRow | null> {
    const query = `
      UPDATE paperlab_materials
      SET conteudo = $1
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query<PaperlabMaterialRow>(query, [
      JSON.stringify(conteudo),
      materialId
    ]);
    return result.rows[0] ?? null;
  }

  async deleteMaterial(materialId: string): Promise<boolean> {
    const query = `
      DELETE FROM paperlab_materials
      WHERE id = $1;
    `;
    const result = await pool.query(query, [materialId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Verifica se há algum material do mesmo tipo criado na mesma sessão nas últimas 6 horas.
   * Usado para fins de validação do rate limit.
   */
  async findLastMaterialGeneratedInLast6Hours(
    sessionId: string,
    tipo: 'flashcards' | 'resumo' | 'simulado' | 'mapa_mental'
  ): Promise<PaperlabMaterialRow | null> {
    const query = `
      SELECT * FROM paperlab_materials
      WHERE session_id = $1 AND tipo = $2 AND criado_em >= NOW() - INTERVAL '6 hours'
      ORDER BY criado_em DESC
      LIMIT 1;
    `;
    const result = await pool.query<PaperlabMaterialRow>(query, [sessionId, tipo]);
    return result.rows[0] ?? null;
  }

  // ===========================================================================
  // FLASHCARDS (ANKI)
  // ===========================================================================

  async createFlashcard(materialId: string, frente: string, verso: string): Promise<FlashcardRow> {
    const query = `
      INSERT INTO flashcards (material_id, frente, verso)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query<FlashcardRow>(query, [materialId, frente, verso]);
    return result.rows[0];
  }

  async findFlashcardsByMaterial(materialId: string, onlyDue = false): Promise<FlashcardRow[]> {
    let query = `
      SELECT * FROM flashcards
      WHERE material_id = $1
    `;
    
    if (onlyDue) {
      query += ` AND (proximo_review_em <= NOW() OR proximo_review_em IS NULL)`;
    }
    
    query += ` ORDER BY id ASC;`;
    
    const result = await pool.query<FlashcardRow>(query, [materialId]);
    return result.rows;
  }

  async findFlashcardById(cardId: string): Promise<FlashcardRow | null> {
    const query = `
      SELECT * FROM flashcards
      WHERE id = $1;
    `;
    const result = await pool.query<FlashcardRow>(query, [cardId]);
    return result.rows[0] ?? null;
  }

  async updateFlashcardReview(
    cardId: string,
    ultimoReview: Date,
    proximoReviewEm: Date,
    acertos: number,
    erros: number
  ): Promise<FlashcardRow | null> {
    const query = `
      UPDATE flashcards
      SET ultimo_review = $1,
          proximo_review_em = $2,
          acertos = $3,
          erros = $4
      WHERE id = $5
      RETURNING *;
    `;
    const result = await pool.query<FlashcardRow>(query, [
      ultimoReview,
      proximoReviewEm,
      acertos,
      erros,
      cardId,
    ]);
    return result.rows[0] ?? null;
  }

  // ===========================================================================
  // QUEUE WORKER - SELECT FOR UPDATE SKIP LOCKED
  // ===========================================================================

  async getNextPendingMaterial(): Promise<PaperlabMaterialRow | null> {
    const query = `
      SELECT * FROM paperlab_materials
      WHERE status = 'pending'
      ORDER BY criado_em ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;
    `;
    const result = await pool.query<PaperlabMaterialRow>(query);
    return result.rows[0] ?? null;
  }

  async getNextIndexingSource(): Promise<PaperlabSourceRow | null> {
    const query = `
      SELECT * FROM paperlab_sources
      WHERE status = 'indexing'
      ORDER BY criado_em ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;
    `;
    const result = await pool.query<PaperlabSourceRow>(query);
    return result.rows[0] ?? null;
  }
}
