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
}
