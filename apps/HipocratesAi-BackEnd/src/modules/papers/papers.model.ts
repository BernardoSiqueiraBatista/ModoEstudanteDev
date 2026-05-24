import { pool } from '../../config/postgres_local';
import { PaperRow, PaperShareRow } from './types/paper.types';
import { CreatePaperDto } from './dtos/create-paper.dto';
import { UpdatePaperDto } from './dtos/update-paper.dto';
import { ListPapersQuery } from './dtos/list-papers.query';

export class PapersModel {

  /**
   * Cria um novo paper para o estudante.
   */
  async create(studentId: string, data: CreatePaperDto): Promise<PaperRow> {
    const query = `
      INSERT INTO papers (
        id_student, titulo, conteudo, conteudo_tipo, tags, fonte_paperlab_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const result = await pool.query<PaperRow>(query, [
      studentId,
      data.titulo,
      data.conteudo,
      data.conteudo_tipo,
      JSON.stringify(data.tags),
      data.fonte_paperlab_id ?? null,
      data.status,
    ]);
    return result.rows[0];
  }

  /**
   * Lista papers do estudante com paginação, filtros e busca.
   * Retorna apenas papers não excluídos (deleted_at IS NULL).
   */
  async findByStudentPaginated(
    studentId: string,
    filters: ListPapersQuery,
  ): Promise<{ rows: PaperRow[]; total: number }> {
    const conditions: string[] = ['id_student = $1', 'deleted_at IS NULL'];
    const params: unknown[] = [studentId];
    let paramIndex = 2;

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.tag) {
      conditions.push(`tags @> $${paramIndex}::jsonb`);
      params.push(JSON.stringify([filters.tag]));
      paramIndex++;
    }

    if (filters.search) {
      conditions.push(`titulo ILIKE $${paramIndex}`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const offset = (filters.page - 1) * filters.size;

    // Query de dados (sem conteudo na listagem para performance)
    const dataQuery = `
      SELECT id, id_student, titulo, conteudo_tipo, tags, fonte_paperlab_id,
             status, criado_em, atualizado_em
      FROM papers
      WHERE ${whereClause}
      ORDER BY atualizado_em DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    params.push(filters.size, offset);

    // Query de contagem
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM papers
      WHERE ${whereClause};
    `;
    // Params para o count são os mesmos exceto LIMIT/OFFSET
    const countParams = params.slice(0, paramIndex - 1);

    const [dataResult, countResult] = await Promise.all([
      pool.query<PaperRow>(dataQuery, params),
      pool.query<{ total: number }>(countQuery, countParams),
    ]);

    return {
      rows: dataResult.rows,
      total: countResult.rows[0]?.total ?? 0,
    };
  }

  /**
   * Busca paper por ID (apenas não excluídos).
   */
  async findById(paperId: string): Promise<PaperRow | null> {
    const query = `
      SELECT * FROM papers
      WHERE id = $1 AND deleted_at IS NULL;
    `;
    const result = await pool.query<PaperRow>(query, [paperId]);
    return result.rows[0] ?? null;
  }

  /**
   * Atualiza um paper existente.
   * Só atualiza campos fornecidos (partial update).
   */
  async update(
    paperId: string,
    studentId: string,
    data: UpdatePaperDto,
  ): Promise<PaperRow | null> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (data.titulo !== undefined) {
      setClauses.push(`titulo = $${paramIndex}`);
      params.push(data.titulo);
      paramIndex++;
    }
    if (data.conteudo !== undefined) {
      setClauses.push(`conteudo = $${paramIndex}`);
      params.push(data.conteudo);
      paramIndex++;
    }
    if (data.conteudo_tipo !== undefined) {
      setClauses.push(`conteudo_tipo = $${paramIndex}`);
      params.push(data.conteudo_tipo);
      paramIndex++;
    }
    if (data.tags !== undefined) {
      setClauses.push(`tags = $${paramIndex}`);
      params.push(JSON.stringify(data.tags));
      paramIndex++;
    }
    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      // Nada para atualizar — retorna o paper atual
      return this.findById(paperId);
    }

    // Sempre atualiza o timestamp
    setClauses.push(`atualizado_em = NOW()`);

    const query = `
      UPDATE papers
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex} AND id_student = $${paramIndex + 1} AND deleted_at IS NULL
      RETURNING *;
    `;
    params.push(paperId, studentId);

    const result = await pool.query<PaperRow>(query, params);
    return result.rows[0] ?? null;
  }

  /**
   * Soft delete — marca o paper como excluído preenchendo deleted_at.
   */
  async softDelete(paperId: string, studentId: string): Promise<PaperRow | null> {
    const query = `
      UPDATE papers
      SET deleted_at = NOW(), atualizado_em = NOW()
      WHERE id = $1 AND id_student = $2 AND deleted_at IS NULL
      RETURNING *;
    `;
    const result = await pool.query<PaperRow>(query, [paperId, studentId]);
    return result.rows[0] ?? null;
  }

  /**
   * Cria ou atualiza o compartilhamento de um paper.
   * Usa UPSERT — se já existe share para o paper, atualiza visibilidade.
   */
  async createOrUpdateShare(
    paperId: string,
    visibilidade: 'link' | 'privado' = 'link',
    expiraEm: string | null = null,
  ): Promise<PaperShareRow> {
    const query = `
      INSERT INTO paper_shares (paper_id, visibilidade, expira_em)
      VALUES ($1, $2, $3)
      ON CONFLICT (paper_id) DO UPDATE
        SET visibilidade = EXCLUDED.visibilidade,
            expira_em = EXCLUDED.expira_em
      RETURNING *;
    `;
    const result = await pool.query<PaperShareRow>(query, [
      paperId,
      visibilidade,
      expiraEm,
    ]);
    return result.rows[0];
  }

  /**
   * Busca paper pelo share_token (acesso público).
   * Verifica se o paper não está excluído e se o share está com visibilidade 'link'.
   */
  async findByShareToken(shareToken: string): Promise<(PaperRow & { visibilidade: string; expira_em: string | null }) | null> {
    const query = `
      SELECT p.*, ps.visibilidade, ps.expira_em
      FROM papers p
      INNER JOIN paper_shares ps ON ps.paper_id = p.id
      WHERE ps.share_token = $1
        AND p.deleted_at IS NULL
        AND ps.visibilidade = 'link';
    `;
    const result = await pool.query(query, [shareToken]);
    return result.rows[0] ?? null;
  }

  /**
   * Busca o share existente de um paper.
   */
  async findShareByPaperId(paperId: string): Promise<PaperShareRow | null> {
    const query = `
      SELECT * FROM paper_shares WHERE paper_id = $1;
    `;
    const result = await pool.query<PaperShareRow>(query, [paperId]);
    return result.rows[0] ?? null;
  }

  /**
   * Hard delete de papers excluídos há mais de N dias.
   * Retorna a quantidade de registros removidos.
   */
  async hardDeleteExpired(retentionDays: number): Promise<number> {
    const query = `
      DELETE FROM papers
      WHERE deleted_at IS NOT NULL
        AND deleted_at < NOW() - INTERVAL '1 day' * $1
      RETURNING id;
    `;
    const result = await pool.query(query, [retentionDays]);
    return result.rowCount ?? 0;
  }
}
