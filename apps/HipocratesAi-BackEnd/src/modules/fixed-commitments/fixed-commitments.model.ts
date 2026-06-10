import { pool } from '../../config/postgres_local';

export interface IFixedCommitment {
  id: string;
  id_plan: string;
  dia: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
  inicio: string;
  fim: string;
  label?: string;
  tipo: string;
  criado_em: Date;
  atualizado_em: Date;
}

export class FixedCommitmentsModel {
  /**
   * Lista todos os compromissos fixos de um plano.
   */
  async listByPlan(planId: string): Promise<IFixedCommitment[]> {
    const result = await pool.query<IFixedCommitment>(
      `SELECT * FROM study_plan_fixed_commitments
       WHERE id_plan = $1
       ORDER BY CASE dia
         WHEN 'seg' THEN 1 WHEN 'ter' THEN 2 WHEN 'qua' THEN 3
         WHEN 'qui' THEN 4 WHEN 'sex' THEN 5 WHEN 'sab' THEN 6
         WHEN 'dom' THEN 7 END,
       inicio ASC`,
      [planId]
    );
    return result.rows;
  }

  /**
   * Busca um compromisso fixo pelo ID.
   */
  async getById(id: string): Promise<IFixedCommitment | null> {
    const result = await pool.query<IFixedCommitment>(
      `SELECT * FROM study_plan_fixed_commitments WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  /**
   * Cria um novo compromisso fixo.
   */
  async create(data: {
    id_plan: string;
    dia: string;
    inicio: string;
    fim: string;
    label?: string;
    tipo?: string;
  }): Promise<IFixedCommitment> {
    const result = await pool.query<IFixedCommitment>(
      `INSERT INTO study_plan_fixed_commitments (id_plan, dia, inicio, fim, label, tipo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.id_plan,
        data.dia,
        data.inicio,
        data.fim,
        data.label ?? null,
        data.tipo ?? 'compromisso_fixo',
      ]
    );
    return result.rows[0];
  }

  /**
   * Insere vários compromissos fixos de uma vez (usado na criação do plano).
   */
  async createBatch(
    planId: string,
    items: { dia: string; inicio: string; fim: string; label?: string; tipo?: string }[]
  ): Promise<IFixedCommitment[]> {
    if (!items || items.length === 0) return [];

    const values = items
      .map((_, i) => {
        const base = i * 6;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
      })
      .join(', ');

    const params = items.flatMap((item) => [
      planId,
      item.dia,
      item.inicio,
      item.fim,
      item.label ?? null,
      item.tipo ?? 'compromisso_fixo',
    ]);

    const result = await pool.query<IFixedCommitment>(
      `INSERT INTO study_plan_fixed_commitments (id_plan, dia, inicio, fim, label, tipo)
       VALUES ${values}
       RETURNING *`,
      params
    );
    return result.rows;
  }

  /**
   * Atualiza campos editáveis de um compromisso fixo.
   */
  async update(
    id: string,
    data: { dia?: string; inicio?: string; fim?: string; label?: string }
  ): Promise<IFixedCommitment | null> {
    const result = await pool.query<IFixedCommitment>(
      `UPDATE study_plan_fixed_commitments
       SET dia           = COALESCE($2, dia),
           inicio        = COALESCE($3, inicio),
           fim           = COALESCE($4, fim),
           label         = COALESCE($5, label),
           atualizado_em = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, data.dia ?? null, data.inicio ?? null, data.fim ?? null, data.label ?? null]
    );
    return result.rows[0] ?? null;
  }

  /**
   * Remove um compromisso fixo pelo ID.
   */
  async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM study_plan_fixed_commitments WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Remove todos os compromissos fixos de um plano.
   */
  async deleteByPlan(planId: string): Promise<void> {
    await pool.query(
      `DELETE FROM study_plan_fixed_commitments WHERE id_plan = $1`,
      [planId]
    );
  }

  /**
   * Verifica se há sobreposição de horários no mesmo dia para o mesmo plano.
   * Retorna true se houver conflito.
   */
  async checkOverlap(
    planId: string,
    dia: string,
    inicio: string,
    fim: string,
    excludeId?: string
  ): Promise<boolean> {
    const params: (string | null)[] = [planId, dia, inicio, fim];
    let excludeClause = '';

    if (excludeId) {
      excludeClause = ' AND id != $5';
      params.push(excludeId);
    }

    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM study_plan_fixed_commitments
       WHERE id_plan = $1
         AND dia = $2
         AND inicio < $4::TIME
         AND fim > $3::TIME
         ${excludeClause}`,
      params
    );
    return parseInt(result.rows[0].count, 10) > 0;
  }
}
