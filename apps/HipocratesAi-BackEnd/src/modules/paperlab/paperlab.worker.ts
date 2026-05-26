import { PaperlabModel } from './paperlab.model';
import { PaperlabService } from './paperlab.service';
import { supabase } from '../../config/supabase';
import { openai } from '../consultations/ai/openai-client';
import { embedText } from '../consultations/ai/embeddings.service';
import { logger } from '../../shared/logger/logger';

const model = new PaperlabModel();
const service = new PaperlabService();

let isRunning = false;
let workerIntervalId: NodeJS.Timeout | null = null;

async function processNextIndexingSource(): Promise<boolean> {
  const source = await model.getNextIndexingSource();
  if (!source) return false;

  logger.info({ sourceId: source.id, titulo: source.titulo }, '[WORKER] Processando indexação de fonte...');

  try {
    // 1. Extrai o texto da fonte (PDF, Imagem OCR, DOCX ou fallback link)
    const rawText = await service.extractTextFromLocalFile(source.tipo, source.url_ou_path);
    
    if (!rawText.trim()) {
      throw new Error('A extração não retornou nenhum texto legível da fonte.');
    }

    // 2. Fatiamento em chunks
    const chunks = service.splitIntoChunks(rawText);
    logger.info({ sourceId: source.id, chunksCount: chunks.length }, '[WORKER] Texto fatiado com sucesso.');

    // 3. Processamento de embeddings e inserção no banco local
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const embedding = await embedText(chunkText);

      await model.saveChunk(source.id, source.session_id, chunkText, embedding, i + 1);
    }

    // 4. Marca a fonte como concluída
    await model.updateSourceStatus(source.id, 'ready');
    logger.info({ sourceId: source.id }, '[WORKER] Ingestão vetorial e OCR concluídos com sucesso!');

    // 5. Renomeação inteligente do notebook caso o título atual seja padrão (Untitled notebook)
    try {
      const session = await model.findSessionById(source.session_id);
      if (
        session &&
        (session.titulo === 'Untitled notebook' ||
          session.titulo === 'Notebook sem título' ||
          !session.titulo.trim())
      ) {
        logger.info({ sessionId: session.id }, '[WORKER] Gerando título inteligente para o notebook baseado na primeira fonte indexada...');
        
        const titleResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente de estudos de medicina e saúde. O estudante carregou uma fonte de estudos em um notebook sem título. Baseado no trecho da fonte fornecido, sugira um título acadêmico e científico conciso e inteligente para o notebook (máximo 4 a 5 palavras). Retorne APENAS o título sugerido cru, sem aspas, explicações ou markdown. Responda estritamente em Português do Brasil.',
            },
            {
              role: 'user',
              content: `Trecho da fonte: "${rawText.slice(0, 1500)}"`
            }
          ],
          temperature: 0.5,
        });

        const novoTitulo = titleResponse.choices[0]?.message?.content?.trim() || 'Notebook de Estudos';
        
        await model.updateSessionTitle(session.id, novoTitulo);
        logger.info({ sessionId: session.id, novoTitulo }, '[WORKER] Notebook renomeado de forma inteligente com sucesso!');
      }
    } catch (renameErr) {
      logger.error({ renameErr, sessionId: source.session_id }, '[WORKER] Erro ao renomear notebook de forma inteligente.');
    }

    return true;
  } catch (err) {
    logger.error({ err, sourceId: source.id }, '[WORKER] Falha crítica na indexação da fonte.');
    await model.updateSourceStatus(source.id, 'error');
    return true;
  }
}

async function processNextPendingMaterial(): Promise<boolean> {
  const material = await model.getNextPendingMaterial();
  if (!material) return false;

  logger.info({ materialId: material.id, tipo: material.tipo }, '[WORKER] Processando geração de material...');

  try {
    // 1. Busca todos os chunks semânticos locais da sessão no Postgres para servir como base
    const chunks = await model.findChunksBySession(material.session_id);

    const context = chunks.map(c => c.chunk_text).join('\n\n');
    if (!context.trim()) {
      throw new Error('Nenhuma fonte ativa e indexada foi encontrada para o RAG.');
    }

    // 2. Monta o prompt do sistema customizado para o tipo de material solicitado
    let systemPrompt = '';
    let promptEstudante = material.prompt;
    let numeroCards = 'padrao';
    let dificuldade = 'medio';

    try {
      if (material.prompt.startsWith('{')) {
        const parsedPrompt = JSON.parse(material.prompt);
        promptEstudante = parsedPrompt.prompt || '';
        numeroCards = parsedPrompt.numeroCards || 'padrao';
        dificuldade = parsedPrompt.dificuldade || 'medio';
      }
    } catch (e) {
      // Ignora e assume texto cru
    }

    let userPrompt = `Instrução do Estudante: "${promptEstudante}"\n\nBaseie-se nas seguintes fontes de estudo:\n---\n${context}\n---`;

    if (material.tipo === 'flashcards') {
      let quantidadeTexto = 'Gere entre 20 e 30 flashcards altamente relevantes.';
      if (numeroCards === 'menos') {
        quantidadeTexto = 'Gere entre 10 e 15 flashcards altamente relevantes.';
      } else if (numeroCards === 'mais') {
        quantidadeTexto = 'Gere entre 40 e 50 flashcards altamente relevantes.';
      }

      let dificuldadeTexto = 'Nível de Dificuldade: Médio (focado em conceitos intermediários, causa-efeito e raciocínio clínico comum).';
      if (dificuldade === 'facil') {
        dificuldadeTexto = 'Nível de Dificuldade: Fácil (focado em definições diretas, conceitos simples e de memorização básica).';
      } else if (dificuldade === 'dificil') {
        dificuldadeTexto = 'Nível de Dificuldade: Difícil (focado em cenários clínicos complexos, diagnósticos diferenciais profundos, fisiopatologia detalhada e exceções clínicas).';
      }

      systemPrompt = `Você é o gerador oficial de Flashcards do Hipócrates Paperlab (estilo Anki).
Sua tarefa é analisar as fontes de estudo fornecidas e extrair os conceitos mais importantes na forma de flashcards (perguntas e respostas diretas).

Você DEVE responder EXCLUSIVAMENTE com um JSON Array válido de flashcards contendo os campos "frente" e "verso", seguindo este formato exato:
[
  {
    "frente": "Pergunta ou conceito/afirmação a ser revisado (extremamente curto, de 1 a 5 palavras)",
    "verso": "Resposta curta, direta e didática"
  }
]

Critérios:
1. ${quantidadeTexto}
2. ${dificuldadeTexto}
3. Variedade de Formato: Misture o estilo dos flashcards! Crie tanto perguntas diretas com ponto de interrogação (ex: "O que é sístole?") quanto termos conceituais objetivos (ex: "Sístole"). Mantenha a frente sempre muito curta (máximo 5 palavras) para memorização rápida.
4. Não adicione nenhuma introdução, marcações de markdown do tipo \`\`\`json ou texto explicativo extra. Responda apenas com o JSON cru.
5. Escreva os flashcards estritamente em Português do Brasil.
`;
    } else if (material.tipo === 'resumo') {
      systemPrompt = `Você é o gerador oficial de Resumos Executivos do Hipócrates Paperlab.
Sua tarefa é ler as fontes fornecidas e sintetizar o conteúdo em um resumo aprofundado, bonito e estruturado em Markdown clássico.

Diretrizes:
1. Crie seções claras utilizando cabeçalhos (##, ###).
2. Use listas, negritos e tabelas para destacar os pontos cruciais.
3. Garanta que o tom seja acadêmico e de fácil compreensão.
4. Escreva estritamente em Português do Brasil.
`;
    } else if (material.tipo === 'simulado') {
      systemPrompt = `Você é o gerador oficial de Simulados Acadêmicos do Hipócrates Paperlab.
Sua tarefa é criar um mini-exame baseado nas fontes fornecidas para testar a retenção de conhecimento do estudante.

Você DEVE responder com um conteúdo formatado em Markdown contendo:
1. De 5 a 8 perguntas de múltipla escolha (com opções A, B, C, D) ou discursivas curtas.
2. Um gabarito detalhado com explicações e citações das fontes ao final do documento.
3. Formatação clara e profissional em Português do Brasil.
`;
    } else if (material.tipo === 'mapa_mental') {
      systemPrompt = `Você é o arquiteto de mapas mentais em ASCII do Hipócrates Paperlab.
Sua tarefa é gerar um mapa mental lindo em formato de texto ASCII puro que mapeie os conceitos cruciais e suas relações lógicas derivados das fontes carregadas.

Regras:
1. Use caixas, setas (-->), ramificações e recuos para criar um diagrama visualmente impactante no formato de texto.
2. Adicione breves descrições conceituais abaixo de cada nó importante do mapa.
3. Escreva estritamente em Português do Brasil.
`;
    }

    // 3. Consulta o modelo GPT-4o-mini da OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
    });

    let contentString = response.choices[0]?.message?.content || '';
    let finalContent: any = { text: contentString };

    // 4. Se for Flashcard, realiza o parser do JSON e insere na tabela correspondente
    if (material.tipo === 'flashcards') {
      try {
        // Limpa possíveis marcações de markdown json que a LLM possa ter colocado
        let cleanedJson = contentString.replace(/```json/g, '').replace(/```/g, '').trim();
        const cardsArray = JSON.parse(cleanedJson);

        if (Array.isArray(cardsArray)) {
          finalContent = { cards: cardsArray };
          
          // Insere os cards na tabela flashcards do banco de dados local
          for (const card of cardsArray) {
            if (card.frente && card.verso) {
              await model.createFlashcard(material.id, card.frente, card.verso);
            }
          }
        }
      } catch (jsonErr) {
        logger.error({ jsonErr, contentString }, '[WORKER] Falha ao fazer parse do JSON de flashcards.');
        // Cria um fallback em caso de falha de parser do JSON
        finalContent = {
          cards: [
            { frente: 'Erro na geração automática do JSON', verso: 'Tente gerar novamente o material.' }
          ]
        };
      }
    }

    // 5. Atualiza o status do material local para 'ready'
    await model.updateMaterialContent(material.id, finalContent, 'ready');
    logger.info({ materialId: material.id }, '[WORKER] Geração de material de estudos concluída com sucesso!');
    return true;
  } catch (err) {
    logger.error({ err, materialId: material.id }, '[WORKER] Erro crítico ao gerar material de estudos.');
    await model.updateMaterialContent(material.id, { text: 'Falha durante o processamento de Inteligência Artificial.' }, 'error');
    return true;
  }
}

// Loop principal do Worker que roda em background
async function workerTick() {
  if (isRunning) return;
  isRunning = true;

  try {
    // Processa uma tarefa de cada vez para evitar sobrecarga
    let processed = await processNextIndexingSource();
    if (!processed) {
      await processNextPendingMaterial();
    }
  } catch (err) {
    logger.error({ err }, '[WORKER] Erro inesperado no tick do Worker do Paperlab.');
  } finally {
    isRunning = false;
  }
}

// Inicia o loop em background a cada N segundos
export function startPaperlabWorker(intervalMs = 3000) {
  if (workerIntervalId) {
    logger.warn('[WORKER] O Worker do Paperlab já está ativo.');
    return;
  }

  logger.info({ intervalMs }, '[WORKER] Inicializando Worker em segundo plano do Paperlab (Queue-on-DB)...');
  workerIntervalId = setInterval(workerTick, intervalMs);
}

// Para o loop
export function stopPaperlabWorker() {
  if (workerIntervalId) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;
    logger.info('[WORKER] Worker do Paperlab desativado.');
  }
}
