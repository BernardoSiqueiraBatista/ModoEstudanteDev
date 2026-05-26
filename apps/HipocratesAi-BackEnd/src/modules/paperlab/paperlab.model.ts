import { pool } from '../../config/postgres_local';
import {
  PaperlabSessionRow,
  PaperlabSourceRow,
  PaperlabMaterialRow,
  FlashcardRow,
  SourceChunkRow,
  SessionShareRow,
  SessionCollaboratorRow,
  ChatMessageRow
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

  // ===========================================================================
  // LOCAL CHUNKS (RAG LOCAL)
  // ===========================================================================

  async ensureChunksTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS paperlab_chunks (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_id   UUID NOT NULL REFERENCES paperlab_sources(id) ON DELETE CASCADE,
          session_id  UUID NOT NULL REFERENCES paperlab_sessions(id) ON DELETE CASCADE,
          chunk_text  TEXT NOT NULL,
          embedding   JSONB NOT NULL, -- Array de floats salvo como JSONB
          ordem       INT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_paperlab_chunks_session ON paperlab_chunks(session_id);
    `;
    await pool.query(query);
  }

  async saveChunk(sourceId: string, sessionId: string, chunkText: string, embedding: number[], ordem: number): Promise<void> {
    await this.ensureChunksTable();
    const query = `
      INSERT INTO paperlab_chunks (source_id, session_id, chunk_text, embedding, ordem)
      VALUES ($1, $2, $3, $4, $5);
    `;
    await pool.query(query, [sourceId, sessionId, chunkText, JSON.stringify(embedding), ordem]);
  }

  async findChunksBySession(sessionId: string): Promise<SourceChunkRow[]> {
    await this.ensureChunksTable();
    const query = `
      SELECT id, source_id, session_id, chunk_text, embedding, ordem
      FROM paperlab_chunks
      WHERE session_id = $1
      ORDER BY ordem ASC;
    `;
    const result = await pool.query(query, [sessionId]);
    return result.rows.map(r => ({
      ...r,
      embedding: typeof r.embedding === 'string' ? JSON.parse(r.embedding) : r.embedding
    }));
  }

  async deleteChunksBySource(sourceId: string): Promise<void> {
    await this.ensureChunksTable();
    const query = `
      DELETE FROM paperlab_chunks
      WHERE source_id = $1;
    `;
    await pool.query(query, [sourceId]);
  }

  async deleteChunksBySession(sessionId: string): Promise<void> {
    await this.ensureChunksTable();
    const query = `
      DELETE FROM paperlab_chunks
      WHERE session_id = $1;
    `;
    await pool.query(query, [sessionId]);
  }

  // ===========================================================================
  // COMPARTILHAMENTO POR LINK PÚBLICO
  // ===========================================================================

  async createOrUpdateShare(
    sessionId: string,
    visibilidade: 'link' | 'privado',
    expiraEm: Date | null = null
  ): Promise<SessionShareRow> {
    const query = `
      INSERT INTO paperlab_session_shares (session_id, visibilidade, expira_em)
      VALUES ($1, $2, $3)
      ON CONFLICT (session_id)
      DO UPDATE SET visibilidade = EXCLUDED.visibilidade, expira_em = EXCLUDED.expira_em, share_token = gen_random_uuid()
      RETURNING *;
    `;
    const result = await pool.query<SessionShareRow>(query, [sessionId, visibilidade, expiraEm]);
    return result.rows[0];
  }

  async revokeShare(sessionId: string): Promise<boolean> {
    const query = `
      UPDATE paperlab_session_shares
      SET visibilidade = 'privado', expira_em = NULL
      WHERE session_id = $1;
    `;
    const result = await pool.query(query, [sessionId]);
    return (result.rowCount ?? 0) > 0;
  }

  async findByShareToken(shareToken: string): Promise<(PaperlabSessionRow & { visibilidade: string, expira_em: string | null, share_token: string }) | null> {
    const query = `
      SELECT s.*, sh.visibilidade, sh.expira_em, sh.share_token
      FROM paperlab_session_shares sh
      JOIN paperlab_sessions s ON s.id = sh.session_id
      WHERE sh.share_token = $1 AND sh.visibilidade = 'link';
    `;
    const result = await pool.query<PaperlabSessionRow & { visibilidade: string, expira_em: string | null, share_token: string }>(query, [shareToken]);
    return result.rows[0] ?? null;
  }

  // ===========================================================================
  // COLABORADORES (CONVITE)
  // ===========================================================================

  async addCollaborator(
    sessionId: string,
    studentId: string,
    permissao: 'leitura_chat' = 'leitura_chat'
  ): Promise<SessionCollaboratorRow> {
    const query = `
      INSERT INTO paperlab_session_collaborators (session_id, id_student, permissao)
      VALUES ($1, $2, $3)
      ON CONFLICT (session_id, id_student) DO UPDATE SET permissao = EXCLUDED.permissao
      RETURNING *;
    `;
    const result = await pool.query<SessionCollaboratorRow>(query, [sessionId, studentId, permissao]);
    return result.rows[0];
  }

  async findCollaboratorsBySession(sessionId: string): Promise<(SessionCollaboratorRow & { nome: string, email: string })[]> {
    const query = `
      SELECT c.*, 'Estudante Colaborador' as nome, 'estudante@modoestudante.com' as email
      FROM paperlab_session_collaborators c
      JOIN student s ON s.id = c.id_student
      WHERE c.session_id = $1
      ORDER BY c.criado_em ASC;
    `;
    const result = await pool.query<SessionCollaboratorRow & { nome: string, email: string }>(query, [sessionId]);
    return result.rows;
  }

  async removeCollaborator(sessionId: string, collaboratorId: string): Promise<boolean> {
    const query = `
      DELETE FROM paperlab_session_collaborators
      WHERE id = $1 AND session_id = $2;
    `;
    const result = await pool.query(query, [collaboratorId, sessionId]);
    return (result.rowCount ?? 0) > 0;
  }

  async isCollaborator(sessionId: string, studentId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM paperlab_session_collaborators
      WHERE session_id = $1 AND id_student = $2;
    `;
    const result = await pool.query(query, [sessionId, studentId]);
    return (result.rowCount ?? 0) > 0;
  }

  async isOwner(sessionId: string, studentId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM paperlab_sessions
      WHERE id = $1 AND id_student = $2;
    `;
    const result = await pool.query(query, [sessionId, studentId]);
    return (result.rowCount ?? 0) > 0;
  }

  // ===========================================================================
  // CHAT (HISTÓRICO E PERSISTÊNCIA)
  // ===========================================================================

  async saveChatMessage(
    sessionId: string,
    studentId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<ChatMessageRow> {
    const query = `
      INSERT INTO paperlab_chat_messages (session_id, id_student, role, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query<ChatMessageRow>(query, [sessionId, studentId, role, content]);
    return result.rows[0];
  }

  async findRecentChatMessages(sessionId: string, limit: number): Promise<ChatMessageRow[]> {
    const query = `
      SELECT * FROM (
        SELECT * FROM paperlab_chat_messages
        WHERE session_id = $1
        ORDER BY criado_em DESC
        LIMIT $2
      ) sub
      ORDER BY criado_em ASC;
    `;
    const result = await pool.query<ChatMessageRow>(query, [sessionId, limit]);
    return result.rows;
  }

  async findChatMessagesPaginated(
    sessionId: string,
    page: number,
    size: number
  ): Promise<{ items: ChatMessageRow[]; total: number }> {
    const offset = (page - 1) * size;
    
    const countQuery = `
      SELECT COUNT(*) as total FROM paperlab_chat_messages
      WHERE session_id = $1;
    `;
    const countResult = await pool.query<{ total: string }>(countQuery, [sessionId]);
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);
    
    const itemsQuery = `
      SELECT * FROM paperlab_chat_messages
      WHERE session_id = $1
      ORDER BY criado_em DESC
      LIMIT $2 OFFSET $3;
    `;
    const itemsResult = await pool.query<ChatMessageRow>(itemsQuery, [sessionId, size, offset]);
    
    return {
      items: itemsResult.rows,
      total,
    };
  }
}

