import { zodResponseFormat } from 'openai/helpers/zod';
import { OpenAI } from 'openai';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/logger/logger';
import { CasesModel } from './cases.model';
import {
  CaseIntroResponse,
  StartAttemptResponse,
  RegisterEventResponse,
  FinishAttemptResponse,
} from './cases.dto';
import { getOsceFeedbackPrompt, OsceFeedbackResponseSchema } from '../../prompts/cases-osce-feedback';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-mock-key-value-for-testing-purposes-only',
});

export class CasesService {
  private model: CasesModel;

  constructor() {
    this.model = new CasesModel();
  }

  // ---------------------------------------------------------------------------
  // GET /:id/intro — Resumo do caso para pop-up
  // ---------------------------------------------------------------------------

  async getIntro(caseId: string): Promise<CaseIntroResponse> {
    const row = await this.model.getCaseIntro(caseId);
    if (!row) {
      throw new AppError('Caso não encontrado.', 404);
    }

    const payload = row.payload_mock ?? {};

    // Extrair checklist OSCE resumido (só nomes dos critérios e descrições dos itens)
    const checklistRaw = payload.checklist_osce ?? [];
    const checklistResumo = checklistRaw.map((c: any) => ({
      criterio: c.criterio,
      itens: (c.itens ?? []).map((i: any) => i.descricao),
    }));

    return {
      id: row.id,
      titulo: row.titulo,
      descricao: payload.contexto_resumido ?? row.descricao,
      especialidade: row.especialidade,
      dificuldade: row.dificuldade,
      tempo_estimado_min: row.tempo_estimado_min,
      checklist_osce: checklistResumo,
      recursos_habilitados: payload.recursos_habilitados ?? {},
    };
  }

  // ---------------------------------------------------------------------------
  // POST /:id/attempts — Inicia tentativa
  // ---------------------------------------------------------------------------

  async startAttempt(
    caseId: string,
    studentId: string,
    modo: 'hm' | 'osce',
  ): Promise<StartAttemptResponse> {
    // Validar que o caso existe
    const caseRow = await this.model.findCaseById(caseId);
    if (!caseRow) {
      throw new AppError('Caso não encontrado.', 404);
    }

    // Criar attempt
    const attempt = await this.model.createAttempt({
      user_id: studentId,
      case_id: caseId,
      modo,
    });

    // Montar dados da sessão para o frontend
    const payload = caseRow.payload_mock ?? {};
    const sessao = {
      case_id: caseRow.id,
      titulo: caseRow.titulo,
      paciente: payload.paciente ?? {},
      queixa_principal: payload.queixa_principal ?? caseRow.descricao,
    };

    return {
      attempt_id: attempt.id,
      sessao,
      modo: attempt.modo,
    };
  }

  // ---------------------------------------------------------------------------
  // POST /attempts/:aid/events — Registra evento OSCE
  // ---------------------------------------------------------------------------

  async registerEvent(
    attemptId: string,
    eventData: {
      tipo: 'procedimento_correto' | 'erro' | 'omissao';
      ref: string;
      pontos: number;
      timestamp?: string;
    },
  ): Promise<RegisterEventResponse> {
    // Validar que o attempt existe
    const attempt = await this.model.findAttemptById(attemptId);
    if (!attempt) {
      throw new AppError('Tentativa não encontrada.', 404);
    }

    // Validar que o attempt está em andamento
    if (attempt.status !== 'em_andamento') {
      throw new AppError('Esta tentativa já foi finalizada.', 422);
    }

    // Validar que o modo é OSCE (eventos só para OSCE)
    if (attempt.modo !== 'osce') {
      throw new AppError('Registro de eventos é permitido apenas no modo OSCE.', 422);
    }

    // Inserir evento
    await this.model.createEvent({
      attempt_id: attemptId,
      tipo: eventData.tipo,
      ref: eventData.ref,
      pontos: eventData.pontos,
      timestamp: eventData.timestamp,
    });

    // Calcular acumulado
    const { acumulado } = await this.model.sumPointsByAttempt(attemptId);

    // Montar texto da notificação
    const sinal = eventData.pontos >= 0 ? '+' : '';
    const tipoLabel = eventData.tipo === 'procedimento_correto'
      ? eventData.ref.replace(/_/g, ' ')
      : eventData.tipo === 'erro'
        ? `erro — ${eventData.ref.replace(/_/g, ' ')}`
        : `omissão — ${eventData.ref.replace(/_/g, ' ')}`;

    return {
      acumulado,
      notificacao: {
        texto: `${sinal}${eventData.pontos} pts — ${tipoLabel}`,
        ttl_ms: 2500,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // POST /attempts/:aid/finish — Finaliza tentativa
  // ---------------------------------------------------------------------------

  async finishAttempt(
    attemptId: string,
    studentId: string,
  ): Promise<FinishAttemptResponse> {
    // Validar que o attempt existe
    const attempt = await this.model.findAttemptById(attemptId);
    if (!attempt) {
      throw new AppError('Tentativa não encontrada.', 404);
    }

    // Validar propriedade
    if (attempt.user_id !== studentId) {
      throw new AppError('Você não tem permissão para finalizar esta tentativa.', 403);
    }

    // Validar que está em andamento
    if (attempt.status !== 'em_andamento') {
      throw new AppError('Esta tentativa já foi finalizada.', 422);
    }

    // Buscar dados do caso
    const caseRow = await this.model.findCaseById(attempt.case_id);

    // Calcular tempo em segundos
    const agora = new Date();
    const inicio = new Date(attempt.iniciado_em);
    const tempoSegundos = Math.round((agora.getTime() - inicio.getTime()) / 1000);

    // Calcular pontuação (events OSCE ou 0 para HM)
    let pontuacaoFinal = 0;
    let totalAcertos = 0;
    let totalErros = 0;
    let feedbackLlm = '';

    if (attempt.modo === 'osce') {
      const stats = await this.model.sumPointsByAttempt(attemptId);
      pontuacaoFinal = Math.max(0, stats.acumulado); // Pontuação não pode ser negativa
      totalAcertos = stats.total_acertos;
      totalErros = stats.total_erros;

      // Gerar feedback via OpenAI
      feedbackLlm = await this.generateOsceFeedback(
        attemptId,
        caseRow?.titulo ?? 'Caso clínico',
        caseRow?.especialidade ?? 'Geral',
        pontuacaoFinal,
        totalAcertos,
        totalErros,
        tempoSegundos,
      );
    } else {
      // Modo HM: feedback genérico (sem pontuação)
      feedbackLlm = 'Simulação convencional concluída com sucesso. Revise os pontos abordados durante a consulta para consolidar seu aprendizado.';
    }

    // Atualizar attempt no banco
    await this.model.finishAttempt(attemptId, {
      pontuacao: pontuacaoFinal,
      acertos: totalAcertos,
      erros: totalErros,
      tempo_segundos: tempoSegundos,
    });

    return {
      pontuacao_final: pontuacaoFinal,
      acertos: totalAcertos,
      erros: totalErros,
      tempo_segundos: tempoSegundos,
      feedback_llm: feedbackLlm,
    };
  }

  // ---------------------------------------------------------------------------
  // Private: Gerar feedback OSCE via OpenAI
  // ---------------------------------------------------------------------------

  private async generateOsceFeedback(
    attemptId: string,
    caseTitle: string,
    specialty: string,
    score: number,
    hits: number,
    errors: number,
    durationSeconds: number,
  ): Promise<string> {
    try {
      // Buscar eventos para contexto
      const events = await this.model.getEventsByAttempt(attemptId);
      const eventsSummary = events
        .map(e => {
          const sinal = e.tipo === 'procedimento_correto' ? '✅' : e.tipo === 'erro' ? '❌' : '⚠️';
          return `${sinal} [${e.tipo}] ${e.ref.replace(/_/g, ' ')} → ${e.pontos >= 0 ? '+' : ''}${e.pontos} pts`;
        })
        .join('\n');

      const durationMinutes = Math.round(durationSeconds / 60);

      const promptText = getOsceFeedbackPrompt({
        case_title: caseTitle,
        specialty,
        score,
        hits,
        errors,
        duration_minutes: durationMinutes,
        events_summary: eventsSummary || 'Nenhum evento registrado.',
      });

      const start = Date.now();
      const response = await openai.chat.completions.parse({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: promptText }],
        // @ts-ignore: Conflito interno de tipos do Zod e OpenAI SDK
        response_format: zodResponseFormat(OsceFeedbackResponseSchema, 'osce_feedback'),
      });
      const end = Date.now();

      const parsed = response.choices[0].message.parsed;

      logger.info({
        event: 'llm_call',
        module: 'cases_osce_feedback',
        latency_ms: end - start,
        tokens: response.usage,
        attempt_id: attemptId,
      }, 'OSCE feedback generation successful');

      return parsed?.feedback ?? response.choices[0].message.content ?? 'Feedback não disponível no momento.';
    } catch (error: any) {
      logger.error({
        event: 'llm_call_error',
        module: 'cases_osce_feedback',
        attempt_id: attemptId,
        error: error.message,
      }, 'Erro ao gerar feedback OSCE');

      // Fallback: retornar feedback genérico em vez de falhar
      return `Simulação OSCE finalizada. Pontuação: ${score}/100 com ${hits} acertos e ${errors} erros. Revise os pontos de atenção para melhorar seu desempenho na próxima tentativa.`;
    }
  }
}
