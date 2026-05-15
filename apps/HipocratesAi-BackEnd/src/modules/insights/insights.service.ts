import { OpenAI } from 'openai';
import { AppError } from '../../shared/errors/AppError';
import { InsightsModel, IInsightRecord } from './insights.model';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { logger } from '../../shared/logger/logger';
import { getInsightsPrompt } from '../../prompts/insights.prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const InsightItemSchema = z.object({
  titulo: z.string(),
  descricao_curta: z.string(),
  modulo_referencia: z.string(),
  severidade: z.enum(['baixa', 'media', 'alta']).nullable(),
});

const InsightSchema = z.object({
  pontos_fortes: z.array(InsightItemSchema),
  pontos_atencao: z.array(InsightItemSchema),
});

export class InsightsService {
  private model: InsightsModel;

  constructor() {
    this.model = new InsightsModel();
  }

  async getLastInsight(studentId: string): Promise<IInsightRecord | null> {
    return await this.model.getLastInsight(studentId);
  }

  async generateInsight(studentId: string): Promise<IInsightRecord> {
    const lastInsight = await this.model.getLastInsight(studentId);
    if (lastInsight) {
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - new Date(lastInsight.gerado_em).getTime()) / 3600000;

      if (diffInHours < 6) {
        throw new AppError('Você só pode gerar um novo mapa de performance a cada 6 horas.', 429);
      }
    }

    const stats = await this.model.getStatsLast30Days(studentId);
    if (!stats || stats.total_resolvidas === '0') {
      throw new AppError('Não há dados suficientes de performance para gerar insights.', 400);
    }

    const resolvidas = parseInt(stats.total_resolvidas, 10);
    const acertos = parseInt(stats.total_acertos, 10);
    const horas = Math.floor((parseFloat(stats.segundos_estudo) || 0) / 3600);

    const promptText = getInsightsPrompt(resolvidas, acertos, horas);

    try {
      const start = Date.now();
      const response = await openai.chat.completions.parse({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: promptText }],
        // @ts-ignore: Conflito de tipos entre a versão do zod local e a do SDK da OpenAI
        response_format: zodResponseFormat(InsightSchema, 'insight_response'),
      });
      const end = Date.now();

      const parsedData = response.choices[0].message.parsed;

      if (!parsedData) {
        throw new Error('Falha ao processar resposta do LLM.');
      }

      logger.info({
        event: 'llm_call',
        module: 'insights',
        latency_ms: end - start,
        tokens: response.usage,
        input: promptText,
        output: parsedData,
      }, 'Insights LLM generation successful');

      const savedInsight = await this.model.saveInsight(
        studentId,
        parsedData.pontos_fortes,
        parsedData.pontos_atencao,
        'v1'
      );

      return savedInsight;
    } catch (error: any) {
      logger.error({
        event: 'llm_call_error',
        module: 'insights',
        error: error.message,
      }, 'Erro na chamada ao LLM para geração de insights');

      if (lastInsight) {
        logger.warn({ studentId }, 'Retornando cache como fallback devido a erro no LLM');
        return lastInsight;
      }

      throw new AppError(`Não foi possível gerar a análise com a IA: ${error.message}`, 502);
    }
  }
}
