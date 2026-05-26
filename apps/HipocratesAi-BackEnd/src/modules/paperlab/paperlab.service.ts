import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { env } from '../../config/env';
import { supabase } from '../../config/supabase';
import { openai } from '../consultations/ai/openai-client';
import { embedText } from '../consultations/ai/embeddings.service';
import { PaperlabModel } from './paperlab.model';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/logger/logger';
import {
  PaperlabSessionRow,
  PaperlabSourceRow,
  PaperlabMaterialRow,
  FlashcardRow,
  ChatMessage,
  SourceChunkRow,
  SessionShareRow,
  SessionCollaboratorRow,
  ChatMessageRow
} from './types/paperlab.types';

// Pasta local para salvar os uploads das fontes do Paperlab
const UPLOADS_DIR = path.join(__dirname, '../../../uploads/paperlab');

export class PaperlabService {
  private model: PaperlabModel;

  constructor() {
    this.model = new PaperlabModel();
    // Garante que o diretório de uploads local existe
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  async checkSessionAccess(sessionId: string, studentId: string): Promise<'owner' | 'collaborator'> {
    // 1. Verifica se é dono
    const isOwner = await this.model.isOwner(sessionId, studentId);
    if (isOwner) {
      return 'owner';
    }

    // 2. Verifica se é colaborador
    const isCollaborator = await this.model.isCollaborator(sessionId, studentId);
    if (isCollaborator) {
      return 'collaborator';
    }

    // Se não for nenhum, lança 404 por segurança (para não revelar a existência do notebook)
    throw new AppError('Notebook não encontrado.', 404);
  }

  // ===========================================================================
  // SESSÕES (NOTEBOOKS)
  // ===========================================================================

  async createSession(studentId: string, titulo: string): Promise<PaperlabSessionRow> {
    return this.model.createSession(studentId, titulo);
  }

  async listSessions(studentId: string): Promise<PaperlabSessionRow[]> {
    return this.model.findSessionsByStudent(studentId);
  }

  async getSessionDetail(sessionId: string, studentId: string): Promise<PaperlabSessionRow & { sources: PaperlabSourceRow[]; materials: PaperlabMaterialRow[] }> {
    await this.checkSessionAccess(sessionId, studentId);
    const session = await this.model.findSessionById(sessionId);
    if (!session) {
      throw new AppError('Notebook não encontrado.', 404);
    }
    const sources = await this.model.findSourcesBySession(sessionId);
    const materials = await this.model.findMaterialsBySession(sessionId);

    return {
      ...session,
      sources,
      materials,
    };
  }

  async deleteSession(sessionId: string, studentId: string): Promise<void> {
    const role = await this.checkSessionAccess(sessionId, studentId);
    if (role !== 'owner') {
      throw new AppError('Apenas o proprietário do notebook pode excluí-lo.', 403);
    }

    // 1. Busca todas as fontes desta sessão
    const sources = await this.model.findSourcesBySession(sessionId);

    // 2. Remove os arquivos locais correspondentes
    for (const src of sources) {
      try {
        if (fs.existsSync(src.url_ou_path)) {
          fs.unlinkSync(src.url_ou_path);
        }
      } catch (err) {
        logger.error({ err, path: src.url_ou_path }, 'Erro ao remover arquivo de fonte excluído.');
      }
    }

    // 3. Remove os chunks locais desta sessão
    await this.model.deleteChunksBySession(sessionId);

    // 4. Deleta a sessão localmente (cascade remove as fontes e materiais)
    const success = await this.model.deleteSession(sessionId);
    if (!success) {
      throw new AppError('Erro ao deletar sessão.', 500);
    }
  }

  // ===========================================================================
  // FONTES (SOURCES) - INGESTÃO ASSÍNCRONA E OCR
  // ===========================================================================

  async addSource(
    sessionId: string,
    studentId: string,
    tipo: 'pdf' | 'docx' | 'image' | 'youtube' | 'link',
    titulo: string,
    file?: Express.Multer.File,
    url?: string
  ): Promise<PaperlabSourceRow> {
    const role = await this.checkSessionAccess(sessionId, studentId);
    if (role !== 'owner') {
      throw new AppError('Apenas o proprietário do notebook pode adicionar fontes.', 403);
    }

    const session = await this.model.findSessionById(sessionId);
    if (!session) {
      throw new AppError('Notebook não encontrado.', 404);
    }

    let urlOuPath = '';

    if (file) {
      // Salva o arquivo na pasta de uploads local
      const ext = file.originalname.split('.').pop() ?? 'bin';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      fs.writeFileSync(filePath, file.buffer);
      urlOuPath = filePath;
    } else if (url) {
      urlOuPath = url;
    } else {
      throw new AppError('Buffer de arquivo ou URL da fonte é obrigatório.', 400);
    }

    // Cria a fonte no banco local com status 'indexing'
    return this.model.createSource(sessionId, tipo, urlOuPath, titulo, 'indexing');
  }

  async listSources(sessionId: string, studentId: string): Promise<PaperlabSourceRow[]> {
    await this.checkSessionAccess(sessionId, studentId);
    const session = await this.model.findSessionById(sessionId);
    if (!session) {
      throw new AppError('Notebook não encontrado.', 404);
    }
    return this.model.findSourcesBySession(sessionId);
  }

  async deleteSource(sourceId: string, studentId: string): Promise<void> {
    const source = await this.model.findSourceById(sourceId);
    if (!source) {
      throw new AppError('Fonte não encontrada.', 404);
    }

    const role = await this.checkSessionAccess(source.session_id, studentId);
    if (role !== 'owner') {
      throw new AppError('Apenas o proprietário do notebook pode excluir fontes.', 403);
    }

    // Deleta o arquivo físico local
    try {
      if (fs.existsSync(source.url_ou_path)) {
        fs.unlinkSync(source.url_ou_path);
      }
    } catch (err) {
      logger.error({ err, path: source.url_ou_path }, 'Falha ao deletar arquivo local da fonte.');
    }

    // Deleta os chunks locais desta fonte
    await this.model.deleteChunksBySource(sourceId);

    // Deleta a fonte no banco local
    const success = await this.model.deleteSource(sourceId);
    if (!success) {
      throw new AppError('Erro ao deletar fonte do banco local.', 500);
    }
  }

  // ===========================================================================
  // CHAT UNIVERSAL (RAG)
  // ===========================================================================

  async answerChatQuestion(sessionId: string, studentId: string, pergunta: string): Promise<{ resposta: string; fontesCitadas: string[] }> {
    await this.checkSessionAccess(sessionId, studentId);
    const session = await this.model.findSessionById(sessionId);
    if (!session) {
      throw new AppError('Notebook não encontrado.', 404);
    }

    // 1. Busca histórico recente de chat do banco local (últimas 5 mensagens)
    const chatHistory = await this.model.findRecentChatMessages(sessionId, 5);

    // 2. Gera o embedding vetorial da pergunta do estudante
    let queryEmbedding: number[];
    try {
      queryEmbedding = await embedText(pergunta);
    } catch (err) {
      logger.error({ err }, 'Erro ao criar embedding da pergunta para o RAG.');
      throw new AppError('Serviço de busca vetorial temporariamente indisponível.', 503);
    }

    // 3. Busca os chunks locais desta sessão
    const localChunks = await this.model.findChunksBySession(sessionId);

    // 4. Calcula a similaridade de cosseno em JavaScript para os chunks locais
    const scoredChunks = localChunks.map(chunk => {
      const chunkEmbedding = typeof chunk.embedding === 'string'
        ? JSON.parse(chunk.embedding)
        : (chunk.embedding as number[]);
      
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
      return {
        ...chunk,
        similarity
      };
    });

    // Filtra pelo threshold (0.3) e ordena decrescente pela similaridade
    const matchedChunks = scoredChunks
      .filter(c => c.similarity >= 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    // 5. Concatena os textos dos chunks como o contexto para a LLM
    let context = '';
    const uniqueSourceIds = new Set<string>();

    if (matchedChunks.length > 0) {
      context = matchedChunks.map((c: any, index: number) => {
        if (c.source_id) uniqueSourceIds.add(c.source_id);
        return `[Fonte ${index + 1}]: "${c.chunk_text}"`;
      }).join('\n\n');
    }

    // 6. Resolve os títulos das fontes locais citadas para resposta amigável
    const fontesCitadas: string[] = [];
    if (uniqueSourceIds.size > 0) {
      for (const srcId of uniqueSourceIds) {
        const src = await this.model.findSourceById(srcId);
        if (src) {
          fontesCitadas.push(src.titulo);
        }
      }
    }

    // 7. Envia o prompt unificado RAG para o modelo GPT-4o-mini
    const systemPrompt = `Você é o assistente inteligente de estudos do Hipócrates Paperlab (estilo NotebookLM).
Seu objetivo é ajudar o estudante a compreender suas fontes de estudo de forma precisa e didática.

Abaixo está o CONTEXTO contendo trechos relevantes das fontes carregadas no notebook atual pelo estudante:
---
${context || 'Nenhuma fonte relevante encontrada para esta sessão de estudos.'}
---

Instruções críticas:
1. Responda à pergunta do estudante baseando-se estritamente nas fontes fornecidas no CONTEXTO acima.
2. Se a informação não puder ser respondida com base nas fontes, informe de forma educada que não encontrou essa informação nas fontes carregadas.
3. Seja sempre didático, claro e utilize formatação Markdown rica (negritos, listas, tabelas) para facilitar a leitura.
4. Escreva as respostas estritamente em Português do Brasil.
`;

    try {
      // Mapeia histórico de chat para o formato do OpenAI
      const historyMessages = chatHistory.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      let resposta = '';

      if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.startsWith('sk-mock-')) {
        logger.info('answerChatQuestion: detectada chave mockada. Retornando resposta didática sintética...');
        resposta = `### Débito Cardíaco (Resposta Simulada de IA)\n\nO **débito cardíaco (DC)** é a quantidade de sangue bombeada por cada ventrículo em um minuto. Ele é o produto da **frequência cardíaca (FC)** e do **volume sistólico (VS)**:\n\n$$\\text{DC} = \\text{FC} \\times \\text{VS}$$\n\n* **Frequência Cardíaca:** Número de batimentos por minuto (~70 bpm em repouso).\n* **Volume Sistólico:** Volume de sangue ejetado a cada batimento (~70 ml).\n\nPara um adulto típico, o débito cardíaco de repouso é de cerca de **4.900 a 5.000 mL/min** (aproximadamente 5 litros/min).`;
      } else {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: pergunta }
          ],
          temperature: 0.3,
        });

        resposta = response.choices[0]?.message?.content || 'Não foi possível formular uma resposta.';
      }

      // Salva as mensagens de pergunta e resposta no banco de dados local
      await this.model.saveChatMessage(sessionId, studentId, 'user', pergunta);
      await this.model.saveChatMessage(sessionId, studentId, 'assistant', resposta);

      return {
        resposta,
        fontesCitadas,
      };
    } catch (err) {
      logger.error({ err }, 'Erro ao gerar resposta no GPT-4o-mini.');
      throw new AppError('Erro ao consultar o serviço de Inteligência Artificial.', 500);
    }
  }

  // ===========================================================================
  // MATERIAIS DE ESTUDO (FLASHCARDS, RESUMO, SIMULADO, MAPA MENTAL ASCII)
  // ===========================================================================

  async triggerMaterialGeneration(
    sessionId: string,
    studentId: string,
    tipo: 'flashcards' | 'resumo' | 'simulado' | 'mapa_mental',
    prompt: string,
    numeroCards?: 'menos' | 'padrao' | 'mais',
    dificuldade?: 'facil' | 'medio' | 'dificil'
  ): Promise<PaperlabMaterialRow> {
    const role = await this.checkSessionAccess(sessionId, studentId);
    if (role !== 'owner') {
      throw new AppError('Apenas o proprietário do notebook pode gerar novos materiais de estudo.', 403);
    }

    const session = await this.model.findSessionById(sessionId);
    if (!session) {
      throw new AppError('Notebook não encontrado.', 404);
    }

    // Valida se existem fontes 'ready' vinculadas ao notebook (NotebookLM exige fontes)
    const sources = await this.model.findSourcesBySession(sessionId);
    const hasReadySources = sources.some(s => s.status === 'ready');
    if (!hasReadySources) {
      throw new AppError('Adicione pelo menos uma fonte ativa (status ready) ao seu notebook para gerar materiais de estudo.', 400);
    }

    // Valida o Rate Limit de 6 horas para geração do mesmo material no mesmo notebook
    const recentMaterial = await this.model.findLastMaterialGeneratedInLast6Hours(sessionId, tipo);
    if (recentMaterial) {
      throw new AppError(`Você já gerou um material do tipo '${tipo}' nas últimas 6 horas. Por favor, aguarde para gerar novamente.`, 429);
    }

    // Enfileira a geração serializando parâmetros estruturados se for flashcard
    let finalPrompt = prompt;
    if (tipo === 'flashcards') {
      finalPrompt = JSON.stringify({
        prompt,
        numeroCards: numeroCards || 'padrao',
        dificuldade: dificuldade || 'medio',
      });
    }

    return this.model.createMaterial(sessionId, tipo, finalPrompt, 'pending');
  }

  async listMaterials(sessionId: string, studentId: string): Promise<PaperlabMaterialRow[]> {
    await this.checkSessionAccess(sessionId, studentId);
    const session = await this.model.findSessionById(sessionId);
    if (!session) {
      throw new AppError('Notebook não encontrado.', 404);
    }
    return this.model.findMaterialsBySession(sessionId);
  }

  async getMaterialDetail(materialId: string, studentId: string, onlyDue = false): Promise<any> {
    const material = await this.model.findMaterialById(materialId);
    if (!material) {
      throw new AppError('Material não encontrado.', 404);
    }

    await this.checkSessionAccess(material.session_id, studentId);

    if (material.tipo === 'flashcards') {
      const cards = await this.model.findFlashcardsByMaterial(materialId, onlyDue);
      return {
        ...material,
        flashcards: cards,
      };
    }

    return material;
  }

  async updateMaterialContent(materialId: string, studentId: string, conteudo: any): Promise<PaperlabMaterialRow> {
    const material = await this.model.findMaterialById(materialId);
    if (!material) {
      throw new AppError('Material não encontrado.', 404);
    }

    const role = await this.checkSessionAccess(material.session_id, studentId);
    if (role !== 'owner') {
      throw new AppError('Apenas o proprietário do notebook pode atualizar o conteúdo de materiais.', 403);
    }

    const updated = await this.model.updateMaterialPartial(materialId, conteudo);
    if (!updated) {
      throw new AppError('Falha ao atualizar material.', 500);
    }
    return updated;
  }

  async deleteMaterial(materialId: string, studentId: string): Promise<void> {
    const material = await this.model.findMaterialById(materialId);
    if (!material) {
      throw new AppError('Material não encontrado.', 404);
    }

    const role = await this.checkSessionAccess(material.session_id, studentId);
    if (role !== 'owner') {
      throw new AppError('Apenas o proprietário do notebook pode excluir materiais.', 403);
    }

    const success = await this.model.deleteMaterial(materialId);
    if (!success) {
      throw new AppError('Material não encontrado ou falha ao excluir.', 404);
    }
  }

  // ===========================================================================
  // AGENDAMENTO E REVISÃO DE FLASHCARDS (ANKI SCHEDULER)
  // ===========================================================================

  async reviewFlashcard(cardId: string, studentId: string, resultado: 'acerto' | 'erro'): Promise<FlashcardRow> {
    const card = await this.model.findFlashcardById(cardId);
    if (!card) {
      throw new AppError('Flashcard não encontrado.', 404);
    }

    const material = await this.model.findMaterialById(card.material_id);
    if (!material) {
      throw new AppError('Material associado não encontrado.', 404);
    }

    await this.checkSessionAccess(material.session_id, studentId);

    const ultimoReview = new Date();
    let proximoReviewEm: Date;
    let acertos = card.acertos;
    let erros = card.erros;

    if (resultado === 'acerto') {
      acertos++;
      // Sucesso: agenda o card para revisão daqui a 2 dias (48 horas)
      proximoReviewEm = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    } else {
      erros++;
      // Erro: bloqueia / agenda o card para revisão daqui a 10 minutos
      proximoReviewEm = new Date(Date.now() + 10 * 60 * 1000);
    }

    const updated = await this.model.updateFlashcardReview(
      cardId,
      ultimoReview,
      proximoReviewEm,
      acertos,
      erros
    );

    if (!updated) {
      throw new AppError('Erro ao registrar revisão de flashcard.', 500);
    }

    return updated;
  }

  // ===========================================================================
  // HELPERS INTERNOS DE PROCESSAMENTO DE ARQUIVOS (PDF & OCR)
  // ===========================================================================

  async extractTextFromLocalFile(
    tipo: 'pdf' | 'docx' | 'image' | 'youtube' | 'link',
    filePath: string,
    titulo?: string
  ): Promise<string> {
    if (tipo === 'pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      // @ts-ignore
      const parsed = await pdfParse(dataBuffer);
      return parsed.text || '';
    }

    if (tipo === 'image') {
      const imageBuffer = fs.readFileSync(filePath);
      logger.info({ filePath }, 'Iniciando OCR local com Tesseract.js...');
      
      const worker = await createWorker('por');
      try {
        const ret = await worker.recognize(imageBuffer);
        return ret.data.text || '';
      } finally {
        await worker.terminate();
      }
    }

    if (tipo === 'docx') {
      // Leitura de texto DOCX simples baseada no buffer (em fallback)
      const buffer = fs.readFileSync(filePath);
      return buffer.toString('utf8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    }

    if (tipo === 'youtube') {
      logger.info({ url: filePath, titulo }, 'Buscando legenda automática do YouTube via youtube-transcript...');
      
      if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.startsWith('sk-mock-')) {
        logger.info('extractTextFromLocalFile: detectada chave mockada. Retornando transcrição sintética offline para YouTube...');
        return `Transcrição da Aula do YouTube "${titulo || 'Fisiologia Cardiovascular'}":\n\nNesta aula revisamos detalhadamente o funcionamento cardíaco. O coração atua como uma bomba de duplo estágio. Discutimos sístole, diástole, volume sistólico e o cálculo do débito cardíaco. A regulação intrínseca e extrínseca pelos ramos simpático e parassimpático também foram exploradas de forma aprofundada para residência médica.`;
      }

      try {
        const { YoutubeTranscript } = require('youtube-transcript');
        
        // Extrai o ID do vídeo da URL para garantir compatibilidade máxima com a biblioteca
        let videoId = filePath;
        const ytRegExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
        const match = filePath.match(ytRegExp);
        if (match && match[1] && match[1].length === 11) {
          videoId = match[1];
          logger.info({ url: filePath, videoId }, 'ID do vídeo do YouTube extraído com sucesso.');
        }

        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (transcript && transcript.length > 0) {
          const transcriptText = transcript.map((t: any) => t.text).join(' ');
          logger.info({ url: filePath, videoId, length: transcriptText.length }, 'Legenda obtida com sucesso do YouTube.');
          return `Transcrição da Aula do YouTube "${titulo || 'Sem título'}":\n\n${transcriptText}`;
        }
      } catch (err: any) {
        logger.warn({ err: err.message || err, url: filePath }, 'Falha ao buscar legenda do YouTube via youtube-transcript. Usando gerador de conteúdo baseado em IA como fallback...');
      }
      
      // Fallback usando OpenAI
      logger.info({ url: filePath, titulo }, 'Iniciando gerador de conteúdo de fallback baseado em IA para YouTube...');
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um gerador de conteúdo acadêmico médico. O estudante forneceu um link ou vídeo do YouTube para indexação. Como estamos indexando isso no RAG e não podemos ler o vídeo/link em tempo real, use o título e o contexto fornecidos para gerar um resumo didático detalhado, robusto e conciso (com ~350 a 450 palavras) sobre esse tema médico para servir como fonte no banco vetorial. Escreva em Português do Brasil.',
            },
            {
              role: 'user',
              content: `Título da Aula/Documento: "${titulo || 'Sem título'}"\nURL/Link: "${filePath}"`
            }
          ],
          temperature: 0.5,
        });
        return response.choices[0]?.message?.content || `Conteúdo gerado a partir de ${filePath}`;
      } catch (err) {
        logger.error({ err }, 'Erro ao gerar fallback de conteúdo de link via OpenAI.');
        return `Conteúdo e notas de estudo baseados na aula: ${titulo || filePath}`;
      }
    }

    if (tipo === 'link') {
      // Raspagem/Simulação rica de conteúdo de link médico caso offline ou sem transcrição
      logger.info({ url: filePath, titulo }, 'Extraindo base de conhecimento RAG para Link...');
      
      if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.startsWith('sk-mock-')) {
        logger.info('extractTextFromLocalFile: detectada chave mockada. Retornando base de conhecimento sintética offline para Link...');
        return `Base de Conhecimento do Link "${titulo || 'Sistema Circulatório'}":\n\nO sistema circulatório é composto pelo coração, vasos sanguíneos e sangue. Sua principal função é o transporte de oxigênio, nutrientes, hormônios e resíduos metabólicos. O coração bombeia o sangue oxigenado do ventrículo esquerdo para a artéria aorta, distribuindo-o por todo o corpo de forma contínua e regulada.`;
      }

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um gerador de conteúdo acadêmico médico. O estudante forneceu um link ou artigo médico para indexação. Como estamos indexando isso no RAG e não podemos ler o link em tempo real, use o título e o contexto fornecidos para gerar um resumo didático detalhado, robusto e conciso (com ~350 a 450 palavras) sobre esse tema médico para servir como fonte no banco vetorial. Escreva em Português do Brasil.',
            },
            {
              role: 'user',
              content: `Título da Aula/Documento: "${titulo || 'Sem título'}"\nURL/Link: "${filePath}"`
            }
          ],
          temperature: 0.5,
        });
        return response.choices[0]?.message?.content || `Conteúdo gerado a partir de ${filePath}`;
      } catch (err) {
        logger.error({ err }, 'Erro ao gerar fallback de conteúdo de link via OpenAI.');
        return `Conteúdo e notas de estudo baseados na aula: ${titulo || filePath}`;
      }
    }

    return '';
  }

  // Fatiador de texto em blocos de ~1000 caracteres com sobreposição de 15%
  splitIntoChunks(text: string, chunkSize = 1000, overlap = 150): string[] {
    const chunks: string[] = [];
    const normalizedText = text.replace(/\s+/g, ' ').trim();
    let start = 0;

    while (start < normalizedText.length) {
      const end = start + chunkSize;
      chunks.push(normalizedText.slice(start, end));
      start += chunkSize - overlap;
    }

    return chunks;
  }

  // ===========================================================================
  // COMPARTILHAMENTO PÚBLICO E COLABORADORES
  // ===========================================================================

  async shareSession(
    sessionId: string,
    studentId: string,
    visibilidade: 'link' | 'privado',
    expiraEm?: string | null
  ): Promise<SessionShareRow> {
    const role = await this.checkSessionAccess(sessionId, studentId);
    if (role !== 'owner') {
      throw new AppError('Apenas o proprietário do notebook pode compartilhá-lo.', 403);
    }

    const parsedExpiraEm = expiraEm ? new Date(expiraEm) : null;
    return this.model.createOrUpdateShare(sessionId, visibilidade, parsedExpiraEm);
  }

  async unshareSession(sessionId: string, studentId: string): Promise<void> {
    const role = await this.checkSessionAccess(sessionId, studentId);
    if (role !== 'owner') {
      throw new AppError('Apenas o proprietário do notebook pode revogar o compartilhamento.', 403);
    }

    const success = await this.model.revokeShare(sessionId);
    if (!success) {
      throw new AppError('Erro ao revogar o compartilhamento.', 500);
    }
  }

  async getSharedSession(shareToken: string): Promise<any> {
    const share = await this.model.findByShareToken(shareToken);
    if (!share) {
      throw new AppError('Notebook compartilhado não encontrado ou acesso revogado.', 404);
    }

    // Valida expiração
    if (share.expira_em && new Date(share.expira_em) < new Date()) {
      throw new AppError('O link de compartilhamento para este notebook expirou.', 410);
    }

    // Retorna apenas fontes e materiais (visibilidade pública restrita, sem chat)
    const sources = await this.model.findSourcesBySession(share.id);
    const materials = await this.model.findMaterialsBySession(share.id);

    return {
      id: share.id,
      titulo: share.titulo,
      criado_em: share.criado_em,
      visibilidade: share.visibilidade,
      expira_em: share.expira_em,
      share_token: share.share_token,
      sources: sources.filter(s => s.status === 'ready'),
      materials: materials.filter(m => m.status === 'ready'),
    };
  }

  async addCollaborator(sessionId: string, ownerStudentId: string, targetStudentId: string): Promise<SessionCollaboratorRow> {
    const role = await this.checkSessionAccess(sessionId, ownerStudentId);
    if (role !== 'owner') {
      throw new AppError('Apenas o proprietário do notebook pode convidar colaboradores.', 403);
    }

    if (ownerStudentId === targetStudentId) {
      throw new AppError('Você não pode convidar a si mesmo como colaborador.', 400);
    }

    // Adiciona colaborador
    try {
      return await this.model.addCollaborator(sessionId, targetStudentId);
    } catch (err: any) {
      if (err.code === '23505') { // UNIQUE Constraint Violation
        throw new AppError('Este estudante já é um colaborador deste notebook.', 409);
      }
      throw err;
    }
  }

  async listCollaborators(sessionId: string, studentId: string): Promise<any[]> {
    await this.checkSessionAccess(sessionId, studentId);
    // Proprietários e colaboradores podem listar
    return this.model.findCollaboratorsBySession(sessionId);
  }

  async removeCollaborator(sessionId: string, collaboratorId: string, ownerStudentId: string): Promise<void> {
    const role = await this.checkSessionAccess(sessionId, ownerStudentId);
    if (role !== 'owner') {
      throw new AppError('Apenas o proprietário do notebook pode remover colaboradores.', 403);
    }

    const success = await this.model.removeCollaborator(sessionId, collaboratorId);
    if (!success) {
      throw new AppError('Colaborador não encontrado ou não pertence a este notebook.', 404);
    }
  }

  async getChatHistory(
    sessionId: string,
    studentId: string,
    page = 1,
    size = 20
  ): Promise<{ items: ChatMessageRow[]; total: number; page: number; size: number }> {
    await this.checkSessionAccess(sessionId, studentId);
    const { items, total } = await this.model.findChatMessagesPaginated(sessionId, page, size);
    
    return {
      items,
      total,
      page,
      size,
    };
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
