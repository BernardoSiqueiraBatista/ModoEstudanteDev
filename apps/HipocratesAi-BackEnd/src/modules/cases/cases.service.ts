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
  ICaseRow,
  ICaseMessage,
} from './cases.dto';
import { getOsceFeedbackPrompt, OsceFeedbackResponseSchema } from '../../prompts/cases-osce-feedback';
import { getCasePatientSystemPrompt, getCaseHintSystemPrompt, getCaseFeedbackPrompt } from '../../prompts/cases-hm.prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-mock-key-value-for-testing-purposes-only',
});

export class CasesService {
  private model = new CasesModel();

  // ── Listing / Dashboard ────────────────────────────────────────────────────

  async listCases(filters?: { especialidade?: string; dificuldade?: string; search?: string }): Promise<ICaseRow[]> {
    return this.model.listCases(filters);
  }

  async getMetrics(studentId: string) {
    return this.model.getMetrics(studentId);
  }

  // ── Intro pop-up ───────────────────────────────────────────────────────────

  async getIntro(caseId: string): Promise<CaseIntroResponse> {
    const row = await this.model.getCaseIntro(caseId);
    if (!row) throw new AppError('Caso não encontrado.', 404);
    const payload = row.payload_mock ?? {};
    const checklistRaw = (payload.checklist_osce as any[]) ?? [];
    return {
      id: row.id,
      titulo: row.titulo,
      descricao: (payload.contexto_resumido as string) ?? row.descricao,
      especialidade: row.especialidade,
      dificuldade: row.dificuldade,
      tempo_estimado_min: row.tempo_estimado_min,
      checklist_osce: checklistRaw.map((c: any) => ({
        criterio: c.criterio,
        itens: (c.itens ?? []).map((i: any) => i.descricao),
      })),
      recursos_habilitados: (payload.recursos_habilitados as Record<string, boolean>) ?? {},
    };
  }

  // ── Start attempt ──────────────────────────────────────────────────────────

  async startAttempt(caseId: string, studentId: string, modo: 'hm' | 'osce'): Promise<StartAttemptResponse> {
    const caseRow = await this.model.findCaseById(caseId);
    if (!caseRow) throw new AppError('Caso não encontrado.', 404);
    const attempt = await this.model.createAttempt({ user_id: studentId, case_id: caseId, modo });
    const payload = caseRow.payload_mock ?? {};
    return {
      attempt_id: attempt.id,
      sessao: {
        case_id: caseRow.id,
        titulo: caseRow.titulo,
        paciente: (payload.paciente as Record<string, unknown>) ?? {},
        queixa_principal: (payload.queixa_principal as string) ?? caseRow.descricao,
      },
      modo: attempt.modo,
    };
  }

  // ── OSCE: Register event ───────────────────────────────────────────────────

  async registerEvent(
    attemptId: string,
    eventData: { tipo: 'procedimento_correto' | 'erro' | 'omissao'; ref: string; pontos: number; timestamp?: string }
  ): Promise<RegisterEventResponse> {
    const attempt = await this.model.findAttemptById(attemptId);
    if (!attempt) throw new AppError('Tentativa não encontrada.', 404);
    if (attempt.status !== 'em_andamento') throw new AppError('Esta tentativa já foi finalizada.', 422);
    if (attempt.modo !== 'osce') throw new AppError('Registro de eventos é permitido apenas no modo OSCE.', 422);

    await this.model.createEvent({ attempt_id: attemptId, ...eventData });
    const { acumulado } = await this.model.sumPointsByAttempt(attemptId);

    const sinal = eventData.pontos >= 0 ? '+' : '';
    const tipoLabel = eventData.tipo === 'procedimento_correto'
      ? eventData.ref.replace(/_/g, ' ')
      : `${eventData.tipo} — ${eventData.ref.replace(/_/g, ' ')}`;

    return {
      acumulado,
      notificacao: { texto: `${sinal}${eventData.pontos} pts — ${tipoLabel}`, ttl_ms: 2500 },
    };
  }

  // ── Finish attempt (HM + OSCE) ─────────────────────────────────────────────

  async finishAttempt(attemptId: string, studentId: string): Promise<FinishAttemptResponse> {
    const attempt = await this.model.findAttemptById(attemptId);
    if (!attempt) throw new AppError('Tentativa não encontrada.', 404);
    if (attempt.user_id !== studentId) throw new AppError('Sem permissão para finalizar esta tentativa.', 403);
    if (attempt.status !== 'em_andamento') throw new AppError('Esta tentativa já foi finalizada.', 422);

    const caseRow = await this.model.findCaseById(attempt.case_id);
    const tempoSegundos = Math.round((Date.now() - new Date(attempt.iniciado_em).getTime()) / 1000);

    let pontuacaoFinal = 0, totalAcertos = 0, totalErros = 0, feedbackLlm = '';

    if (attempt.modo === 'osce') {
      const stats = await this.model.sumPointsByAttempt(attemptId);
      pontuacaoFinal = Math.max(0, stats.acumulado);
      totalAcertos = stats.total_acertos;
      totalErros = stats.total_erros;
      feedbackLlm = await this._generateOsceFeedback(
        attemptId,
        caseRow?.titulo ?? 'Caso clínico',
        caseRow?.especialidade ?? 'Geral',
        pontuacaoFinal, totalAcertos, totalErros, Math.round(tempoSegundos / 60)
      );
    } else {
      feedbackLlm = 'Simulação HM concluída. Revise os pontos abordados durante a consulta para consolidar seu aprendizado.';
    }

    await this.model.finishAttempt(attemptId, {
      pontuacao: pontuacaoFinal, acertos: totalAcertos, erros: totalErros, tempo_segundos: tempoSegundos
    });

    return { pontuacao_final: pontuacaoFinal, acertos: totalAcertos, erros: totalErros, tempo_segundos: tempoSegundos, feedback_llm: feedbackLlm };
  }

  private async _generateOsceFeedback(
    attemptId: string, caseTitle: string, specialty: string,
    score: number, hits: number, errors: number, durationMinutes: number
  ): Promise<string> {
    try {
      const events = await this.model.getEventsByAttempt(attemptId);
      const eventsSummary = events.map(e => {
        const sinal = e.tipo === 'procedimento_correto' ? '✅' : e.tipo === 'erro' ? '❌' : '⚠️';
        return `${sinal} [${e.tipo}] ${e.ref.replace(/_/g, ' ')} → ${e.pontos >= 0 ? '+' : ''}${e.pontos} pts`;
      }).join('\n');

      const response = await openai.chat.completions.parse({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: getOsceFeedbackPrompt({ case_title: caseTitle, specialty, score, hits, errors, duration_minutes: durationMinutes, events_summary: eventsSummary || 'Nenhum evento.' }) }],
        // @ts-ignore
        response_format: zodResponseFormat(OsceFeedbackResponseSchema, 'osce_feedback'),
      });

      logger.info({ event: 'llm_call', module: 'cases_osce_feedback', attemptId }, 'OSCE feedback gerado');
      return response.choices[0].message.parsed?.feedback ?? response.choices[0].message.content ?? 'Feedback indisponível.';
    } catch (err: any) {
      logger.error({ err, attemptId }, 'Erro ao gerar feedback OSCE');
      return `Simulação OSCE finalizada. Pontuação: ${score}/100 com ${hits} acertos e ${errors} erros.`;
    }
  }

  // ── HM Chat ────────────────────────────────────────────────────────────────

  private async _resolveHMAttempt(attemptId: string, studentId: string) {
    const attempt = await this.model.findAttemptById(attemptId);
    if (!attempt) throw new AppError('Tentativa não encontrada.', 404);
    if (attempt.user_id !== studentId) throw new AppError('Sem permissão.', 403);
    if (attempt.status !== 'em_andamento') throw new AppError('Simulação já encerrada.', 409);
    if (attempt.modo !== 'hm') throw new AppError('Este endpoint é exclusivo para simulação HM.', 400);
    const caseData = await this.model.findCaseById(attempt.case_id);
    if (!caseData) throw new AppError('Caso clínico não encontrado.', 404);
    return { attempt, caseData };
  }

  private _extractCaseParams(caseData: ICaseRow) {
    const p = caseData.payload_mock ?? {};
    const paciente = (p.paciente as Record<string, unknown>) ?? {};
    return {
      titulo: caseData.titulo,
      especialidade: caseData.especialidade,
      dificuldade: caseData.dificuldade,
      paciente_nome: (paciente.nome as string) ?? 'Paciente',
      queixa_principal: (p.queixa_principal as string) ?? caseData.descricao,
      contexto: (p.contexto_resumido as string) ?? caseData.descricao,
    };
  }

  async sendChatMessage(attemptId: string, studentId: string, mensagem: string): Promise<{ resposta: string; historico: ICaseMessage[] }> {
    const { caseData } = await this._resolveHMAttempt(attemptId, studentId);
    const history = await this.model.getMessages(attemptId, 20);
    const params = this._extractCaseParams(caseData);
    const systemPrompt = getCasePatientSystemPrompt(params);
    const historyMessages = history.filter(m => m.role !== 'hint').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    let resposta: string;
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-mock-')) {
        resposta = `(offline) ${params.paciente_nome}: estou sentindo ${params.queixa_principal} desde ontem. Está piorando.`;
      } else {
        const r = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [{ role: 'system', content: systemPrompt }, ...historyMessages, { role: 'user', content: mensagem }],
          temperature: 0.7, max_tokens: 200,
        });
        resposta = r.choices[0]?.message?.content ?? 'Não entendi, doutor(a).';
      }
    } catch (err: any) {
      logger.error({ err, attemptId }, 'Erro ao gerar resposta HM');
      throw new AppError('Serviço de IA temporariamente indisponível.', 503);
    }

    await this.model.saveMessage(attemptId, studentId, 'user', mensagem);
    await this.model.saveMessage(attemptId, studentId, 'assistant', resposta);
    return { resposta, historico: await this.model.getMessages(attemptId) };
  }

  async getChatHistory(attemptId: string, studentId: string): Promise<ICaseMessage[]> {
    const attempt = await this.model.findAttemptById(attemptId);
    if (!attempt) throw new AppError('Tentativa não encontrada.', 404);
    if (attempt.user_id !== studentId) throw new AppError('Sem permissão.', 403);
    return this.model.getMessages(attemptId);
  }

  async requestHint(attemptId: string, studentId: string): Promise<{ dica: string }> {
    const { caseData } = await this._resolveHMAttempt(attemptId, studentId);
    const history = await this.model.getMessages(attemptId, 30);
    const historico = history.filter(m => m.role !== 'hint').map(m => `${m.role === 'user' ? 'Estudante' : 'Paciente'}: ${m.content}`).join('\n');
    const params = this._extractCaseParams(caseData);

    let dica: string;
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-mock-')) {
        dica = 'Dica (offline): explore HDA — início, duração, fatores de melhora/piora, sintomas associados.';
      } else {
        const r = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [{ role: 'system', content: getCaseHintSystemPrompt({ ...params, historico }) }],
          temperature: 0.4, max_tokens: 150,
        });
        dica = r.choices[0]?.message?.content ?? 'Continue explorando a anamnese.';
      }
    } catch (err: any) {
      logger.error({ err, attemptId }, 'Erro ao gerar dica HM');
      throw new AppError('Serviço de IA temporariamente indisponível.', 503);
    }

    await this.model.saveMessage(attemptId, studentId, 'hint', dica);
    return { dica };
  }

  async finishHMAttempt(attemptId: string, studentId: string, duracao_segundos?: number): Promise<{ attempt: any; feedback: Record<string, unknown> }> {
    const { attempt: raw, caseData } = await this._resolveHMAttempt(attemptId, studentId);
    const history = await this.model.getMessages(attemptId, 50);
    const historico = history.filter(m => m.role !== 'hint').map(m => `${m.role === 'user' ? 'Estudante' : 'Paciente'}: ${m.content}`).join('\n');
    const params = this._extractCaseParams(caseData);

    let feedback: Record<string, unknown>;
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-mock-')) {
        feedback = {
          pontos_positivos: ['Iniciou a anamnese', 'Perguntou sobre a queixa principal'],
          pontos_melhoria: ['Explorar antecedentes pessoais e familiares', 'Investigar medicamentos em uso'],
          diagnostico_provavel: caseData.titulo,
          proximos_passos_clinicos: ['Hemograma', 'ECG', 'Raio-X de tórax'],
          resumo_geral: 'Boa tentativa! Continue praticando a sistematização da anamnese.',
        };
      } else {
        const r = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [{ role: 'user', content: getCaseFeedbackPrompt({ ...params, historico, acertos: raw.acertos, erros: raw.erros }) }],
          temperature: 0.3, max_tokens: 600, response_format: { type: 'json_object' },
        });
        feedback = JSON.parse(r.choices[0]?.message?.content ?? '{}');
        logger.info({ event: 'hm_feedback', attemptId }, 'Feedback HM gerado');
      }
    } catch (err: any) {
      logger.error({ err, attemptId }, 'Erro ao gerar feedback HM');
      feedback = { resumo_geral: 'Simulação concluída. Feedback indisponível no momento.' };
    }

    const tempo = duracao_segundos ?? Math.round((Date.now() - new Date(raw.iniciado_em).getTime()) / 1000);
    const attempt = await this.model.finishAttempt(attemptId, { pontuacao: 0, acertos: raw.acertos, erros: raw.erros, tempo_segundos: tempo });
    return { attempt, feedback };
  }
}
