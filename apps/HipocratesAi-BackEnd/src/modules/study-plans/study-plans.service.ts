import { OpenAI } from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/logger/logger';
import { StudyPlansModel, IStudyPlan, IStudyPlanBlock } from './study-plans.model';
import { InsightsModel } from '../insights/insights.model';
import { getStudyPlanPrompt, StudyPlanGenerationSchema } from '../../prompts/study-plans.prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class StudyPlansService {
  private model: StudyPlansModel;
  private insightsModel: InsightsModel;

  constructor() {
    this.model = new StudyPlansModel();
    this.insightsModel = new InsightsModel();
  }

  async generateStudyPlan(studentId: string, data: {
    titulo: string;
    categoria: string;
    areas_foco: string[];
    duracao: string;
    horas_por_dia: number;
    dias_semana: string[];
    horarios_bloqueados?: { dia: string; inicio: string; fim: string }[];
    briefing: string;
    considerar_insights?: boolean;
  }): Promise<{ plan: IStudyPlan; blocks: IStudyPlanBlock[] }> {

    let insightsText = '';

    if (data.considerar_insights) {
      const lastInsight = await this.insightsModel.getLastInsight(studentId);
      if (lastInsight && lastInsight.pontos_atencao) {
        const atencao = lastInsight.pontos_atencao as any[];
        insightsText = atencao.map(p => `- ${p.titulo}: ${p.descricao_curta}`).join('\n');
      }
    }

    const promptText = getStudyPlanPrompt({
      briefing: data.briefing,
      areas_foco: data.areas_foco,
      duracao: data.duracao,
      horas_por_dia: data.horas_por_dia,
      dias_semana: data.dias_semana,
      horarios_bloqueados: data.horarios_bloqueados,
      insights_performance: insightsText
    });

    try {
      const start = Date.now();
      const response = await openai.chat.completions.parse({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: promptText }],
        // @ts-ignore: Conflito interno de tipos do Zod e OpenAI SDK
        response_format: zodResponseFormat(StudyPlanGenerationSchema, 'study_plan_generation'),
      });
      const end = Date.now();

      const parsedData = response.choices[0].message.parsed;
      if (!parsedData || !parsedData.blocos) {
        throw new Error('IA retornou formato inválido');
      }

      logger.info({
        event: 'llm_call',
        module: 'study_plans',
        latency_ms: end - start,
        tokens: response.usage,
        input_length: promptText.length,
        blocks_generated: parsedData.blocos.length
      }, 'Study plan generation successful');

      const newPlan = await this.model.createPlan({
        id_student: studentId,
        titulo: data.titulo,
        categoria: data.categoria,
        duracao: data.duracao,
        areas_foco: data.areas_foco,
        parametros: {
          horas_por_dia: data.horas_por_dia,
          dias_semana: data.dias_semana,
          horarios_bloqueados: data.horarios_bloqueados
        },
        briefing_texto: data.briefing
      });

      const blocksToCreate = parsedData.blocos.map((b: any) => ({
        ...b,
        id_plan: newPlan.id,
        status: 'pendente' as const
      }));

      const createdBlocks = await this.model.createBlocks(blocksToCreate);

      return {
        plan: newPlan,
        blocks: createdBlocks
      };

    } catch (error: any) {
      logger.error({
        event: 'llm_call_error',
        module: 'study_plans',
        error: error.message
      }, 'Erro ao gerar plano de estudos com IA');
      throw new AppError(`Não foi possível gerar sua rotina no momento: ${error.message}`, 502);
    }
  }

  async listPlans(studentId: string): Promise<IStudyPlan[]> {
    return await this.model.listPlansByStudent(studentId);
  }

  async getPlanDetails(planId: string): Promise<{ plan: IStudyPlan; blocks: IStudyPlanBlock[] }> {
    const details = await this.model.getPlanDetails(planId);
    if (!details) {
      throw new AppError('Plano de estudos não encontrado.', 404);
    }
    return details;
  }

  async updateBlockStatus(blockId: string, status: 'pendente' | 'concluido' | 'pulado'): Promise<IStudyPlanBlock> {
    const updated = await this.model.updateBlockStatus(blockId, status);
    if (!updated) {
      throw new AppError('Bloco não encontrado.', 404);
    }
    return updated;
  }

  async deletePlan(planId: string, studentId: string): Promise<void> {
    await this.model.deletePlan(planId, studentId);
  }

  async softDeletePlan(planId: string, studentId: string): Promise<void> {
    const ok = await this.model.softDeletePlan(planId, studentId);
    if (!ok) throw new AppError('Plano não encontrado ou já excluído.', 404);
  }

  async listPlansFiltered(studentId: string): Promise<IStudyPlan[]> {
    return this.model.listPlansFiltered(studentId);
  }

  async updatePlan(planId: string, studentId: string, data: Partial<IStudyPlan>): Promise<IStudyPlan> {
    const updated = await this.model.updatePlan(planId, studentId, data);
    if (!updated) throw new AppError('Plano não encontrado.', 404);
    return updated;
  }

  async getPlanSummary(planId: string): Promise<Record<string, unknown>> {
    const summary = await this.model.getPlanSummary(planId);
    if (!summary) throw new AppError('Plano não encontrado.', 404);
    return summary;
  }

  async sharePlan(planId: string, studentId: string): Promise<{ share_token: string; url: string; visibilidade: string; expira_em: null }> {
    const plan = await this.model.getPlanByIdAndStudent(planId, studentId);
    if (!plan) throw new AppError('Plano não encontrado.', 404);
    const { share_token } = await this.model.createOrUpdateShare(planId);
    return {
      share_token,
      url: `/student/v1/study-plans/shared/${share_token}`,
      visibilidade: 'link',
      expira_em: null,
    };
  }

  async saveUpload(studentId: string, file: Express.Multer.File): Promise<{ id: string; original_name: string }> {
    const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new AppError('Tipo de arquivo não permitido. Use PDF, DOCX ou imagem.', 422);
    }
    const tipo = file.mimetype.includes('pdf') ? 'pdf'
      : file.mimetype.includes('word') ? 'docx'
      : 'imagem';
    const ref = await this.model.saveUploadRef(studentId, file.originalname, tipo);
    return { id: ref.id, original_name: file.originalname };
  }

  async generateStudyPlanV1(studentId: string, data: {
    areas_foco: string[];
    duracao: string;
    instrucoes: string;
    compromissos_fixos?: { dia: string; inicio: string; fim: string; label?: string }[];
    horas_dia: number;
    considerar_performance?: boolean;
    uploads?: string[];
    titulo?: string;
    categoria?: string;
  }): Promise<{ plan: IStudyPlan; blocks: IStudyPlanBlock[] }> {
    const titulo = data.titulo ?? `Plano ${data.duracao} — ${data.areas_foco.slice(0, 2).join(', ')}`;
    const diasDisponiveis = data.compromissos_fixos && data.compromissos_fixos.length > 0
      ? [...new Set(data.compromissos_fixos.map(c => c.dia))]
      : ['seg', 'ter', 'qua', 'qui', 'sex'];

    return this.generateStudyPlan(studentId, {
      titulo,
      categoria: data.categoria ?? 'geral',
      areas_foco: data.areas_foco,
      duracao: data.duracao,
      horas_por_dia: data.horas_dia,
      dias_semana: diasDisponiveis,
      horarios_bloqueados: data.compromissos_fixos,
      briefing: data.instrucoes,
      considerar_insights: data.considerar_performance ?? false,
    });
  }

  async regeneratePlan(planId: string, studentId: string): Promise<{ plan: IStudyPlan; blocks: IStudyPlanBlock[] }> {
    const plan = await this.model.getPlanByIdAndStudent(planId, studentId);
    if (!plan) throw new AppError('Plano não encontrado.', 404);

    const lastRegen = await this.model.getLastRegenerateTime(planId);
    if (lastRegen) {
      const diffHours = (Date.now() - new Date(lastRegen).getTime()) / 3_600_000;
      if (diffHours < 6) {
        const nextAllowed = new Date(new Date(lastRegen).getTime() + 6 * 3_600_000);
        throw new AppError(
          JSON.stringify({ status: 'rate_limited', proxima_execucao_permitida_em: nextAllowed.toISOString() }),
          429
        );
      }
    }

    const params = (plan.parametros as Record<string, unknown>) ?? {};
    const briefing = plan.briefing_texto ?? (plan.areas_foco ?? []).join(', ');
    const horas = (params.horas_por_dia ?? params.horas_dia ?? 4) as number;
    const dias = (params.dias_semana ?? params.dias_disponiveis ?? ['seg', 'ter', 'qua', 'qui', 'sex']) as string[];
    const bloqueados = (params.horarios_bloqueados ?? params.compromissos_fixos ?? []) as { dia: string; inicio: string; fim: string }[];

    let insightsText = '';
    const lastInsight = await this.insightsModel.getLastInsight(studentId);
    if (lastInsight && lastInsight.pontos_atencao) {
      const atencao = lastInsight.pontos_atencao as { titulo: string; descricao_curta: string }[];
      insightsText = atencao.map(p => `- ${p.titulo}: ${p.descricao_curta}`).join('\n');
    }

    const promptText = getStudyPlanPrompt({
      briefing,
      areas_foco: plan.areas_foco ?? [],
      duracao: plan.duracao,
      horas_por_dia: horas,
      dias_semana: dias,
      horarios_bloqueados: bloqueados,
      insights_performance: insightsText,
    });

    try {
      const response = await openai.chat.completions.parse({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: promptText }],
        // @ts-ignore
        response_format: zodResponseFormat(StudyPlanGenerationSchema, 'study_plan_generation'),
      });

      const parsed = response.choices[0].message.parsed;
      if (!parsed?.blocos) throw new Error('IA retornou formato inválido');

      logger.info({ event: 'llm_call', module: 'study_plans_regen', tokens: response.usage }, 'Regeneração concluída');

      await this.model.deleteBlocksByPlan(planId);
      const newBlocks = await this.model.createBlocks(
        parsed.blocos.map((b: IStudyPlanBlock) => ({ ...b, id_plan: planId, status: 'pendente' as const }))
      );
      await this.model.setLastRegenerateTime(planId);

      return { plan, blocks: newBlocks };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error({ event: 'llm_call_error', module: 'study_plans_regen', error: error.message }, 'Erro ao regenerar plano');
      throw new AppError(`Não foi possível regenerar o plano: ${error.message}`, 502);
    }
  }
}
