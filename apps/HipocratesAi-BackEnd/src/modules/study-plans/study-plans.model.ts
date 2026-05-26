import { pool } from '../../config/postgres_local';

export interface IStudyPlan {
  id: string;
  id_student: string;
  titulo: string;
  categoria: string;
  status: 'ativo' | 'pausado' | 'concluido';
  duracao: string;
  areas_foco: string[];
  parametros: any;
  briefing_texto?: string;
  base_conhecimento_ref?: string;
  criado_em: Date;
  atualizado_em: Date;
}

export interface IStudyPlanBlock {
  id: string;
  id_plan: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  tipo: 'revisao' | 'simulado' | 'aula' | 'caso_clinico' | 'teoria';
  titulo: string;
  especialidade?: string;
  descricao?: string;
  status: 'pendente' | 'concluido' | 'pulado';
  criado_em: Date;
}

export class StudyPlansModel {
  async createPlan(data: Partial<IStudyPlan>): Promise<IStudyPlan> {
    const query = `
      INSERT INTO study_plans (
        id_student, titulo, categoria, duracao, areas_foco, parametros, briefing_texto, base_conhecimento_ref
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const result = await pool.query<IStudyPlan>(query, [
      data.id_student,
      data.titulo,
      data.categoria,
      data.duracao,
      JSON.stringify(data.areas_foco || []),
      JSON.stringify(data.parametros || {}),
      data.briefing_texto || null,
      data.base_conhecimento_ref || null,
    ]);
    return result.rows[0];
  }

  async createBlocks(blocks: Partial<IStudyPlanBlock>[]): Promise<IStudyPlanBlock[]> {
    if (!blocks || blocks.length === 0) return [];

    const values = blocks.map((b, i) => {
      const base = i * 9;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`;
    }).join(', ');

    const params = blocks.flatMap(b => [
      b.id_plan,
      b.data,
      b.hora_inicio,
      b.hora_fim,
      b.tipo,
      b.titulo,
      b.especialidade || null,
      b.descricao || null,
      b.status || 'pendente'
    ]);

    const query = `
      INSERT INTO study_plan_blocks (
        id_plan, data, hora_inicio, hora_fim, tipo, titulo, especialidade, descricao, status
      ) VALUES ${values}
      RETURNING *;
    `;
    const result = await pool.query<IStudyPlanBlock>(query, params);
    return result.rows;
  }

  async listPlansByStudent(studentId: string): Promise<IStudyPlan[]> {
    const query = `
      SELECT * FROM study_plans
      WHERE id_student = $1
      ORDER BY criado_em DESC;
    `;
    const result = await pool.query<IStudyPlan>(query, [studentId]);
    return result.rows;
  }

  async getPlanDetails(planId: string): Promise<{ plan: IStudyPlan; blocks: IStudyPlanBlock[] } | null> {
    const planQuery = `SELECT * FROM study_plans WHERE id = $1;`;
    const planResult = await pool.query<IStudyPlan>(planQuery, [planId]);

    if (planResult.rows.length === 0) {
      return null;
    }

    const blocksQuery = `SELECT * FROM study_plan_blocks WHERE id_plan = $1 ORDER BY data ASC, hora_inicio ASC;`;
    const blocksResult = await pool.query<IStudyPlanBlock>(blocksQuery, [planId]);

    return {
      plan: planResult.rows[0],
      blocks: blocksResult.rows,
    };
  }

  async deletePlan(planId: string, studentId: string): Promise<void> {
    const query = `DELETE FROM study_plans WHERE id = $1 AND id_student = $2;`;
    await pool.query(query, [planId, studentId]);
  }

  async softDeletePlan(planId: string, studentId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE study_plans SET deleted_at = NOW() WHERE id = $1 AND id_student = $2 AND deleted_at IS NULL`,
      [planId, studentId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async updateBlockStatus(blockId: string, status: string): Promise<IStudyPlanBlock | null> {
    const query = `
      UPDATE study_plan_blocks
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query<IStudyPlanBlock>(query, [status, blockId]);
    return result.rows[0] || null;
  }

  async listPlansFiltered(studentId: string): Promise<IStudyPlan[]> {
    const result = await pool.query<IStudyPlan>(
      `SELECT * FROM study_plans WHERE id_student = $1 AND deleted_at IS NULL ORDER BY criado_em DESC`,
      [studentId]
    );
    return result.rows;
  }

  async getPlanByIdAndStudent(planId: string, studentId: string): Promise<IStudyPlan | null> {
    const result = await pool.query<IStudyPlan>(
      `SELECT * FROM study_plans WHERE id = $1 AND id_student = $2 AND deleted_at IS NULL`,
      [planId, studentId]
    );
    return result.rows[0] ?? null;
  }

  async updatePlan(planId: string, studentId: string, data: Partial<IStudyPlan>): Promise<IStudyPlan | null> {
    const result = await pool.query<IStudyPlan>(
      `UPDATE study_plans
       SET titulo        = COALESCE($3, titulo),
           areas_foco    = COALESCE($4, areas_foco),
           duracao       = COALESCE($5, duracao),
           parametros    = COALESCE($6, parametros),
           briefing_texto= COALESCE($7, briefing_texto),
           atualizado_em = NOW()
       WHERE id = $1 AND id_student = $2 AND deleted_at IS NULL
       RETURNING *`,
      [
        planId,
        studentId,
        data.titulo ?? null,
        data.areas_foco ? JSON.stringify(data.areas_foco) : null,
        data.duracao ?? null,
        data.parametros ? JSON.stringify(data.parametros) : null,
        data.briefing_texto ?? null,
      ]
    );
    return result.rows[0] ?? null;
  }

  async getPlanSummary(planId: string): Promise<Record<string, unknown> | null> {
    const result = await pool.query(
      `SELECT * FROM study_plans WHERE id = $1 AND deleted_at IS NULL`,
      [planId]
    );
    if (result.rows.length === 0) return null;
    const p = result.rows[0];
    const params = p.parametros ?? {};
    return {
      plan_id: p.id,
      areas_foco: p.areas_foco ?? [],
      duracao: p.duracao,
      horas_dia: params.horas_por_dia ?? params.horas_dia ?? 0,
      dias_disponiveis: params.dias_semana ?? params.dias_disponiveis ?? [],
      compromissos_fixos: params.compromissos_fixos ?? params.horarios_bloqueados ?? [],
      briefing_preview: p.briefing_texto ? String(p.briefing_texto).substring(0, 200) : '',
      render_mode: 'popup_no_blue',
    };
  }

  async createOrUpdateShare(planId: string): Promise<{ share_token: string }> {
    const result = await pool.query<{ share_token: string }>(
      `INSERT INTO study_plan_shares (plan_id, share_token, visibilidade)
       VALUES ($1, gen_random_uuid(), 'link')
       ON CONFLICT (plan_id) DO UPDATE SET share_token = gen_random_uuid()
       RETURNING share_token`,
      [planId]
    );
    return result.rows[0];
  }

  async saveUploadRef(studentId: string, originalName: string, tipo: string): Promise<{ id: string }> {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO study_plan_uploads (student_id, original_name, tipo) VALUES ($1, $2, $3) RETURNING id`,
      [studentId, originalName, tipo]
    );
    return result.rows[0];
  }

  async getLastRegenerateTime(planId: string): Promise<Date | null> {
    const result = await pool.query<{ ultima_regeneracao: Date | null }>(
      `SELECT ultima_regeneracao FROM study_plans WHERE id = $1`,
      [planId]
    );
    return result.rows[0]?.ultima_regeneracao ?? null;
  }

  async setLastRegenerateTime(planId: string): Promise<void> {
    await pool.query(
      `UPDATE study_plans SET ultima_regeneracao = NOW(), atualizado_em = NOW() WHERE id = $1`,
      [planId]
    );
  }

  async deleteBlocksByPlan(planId: string): Promise<void> {
    await pool.query(`DELETE FROM study_plan_blocks WHERE id_plan = $1`, [planId]);
  }
}
