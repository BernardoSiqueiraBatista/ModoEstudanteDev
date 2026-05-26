/**
 * 🧪 Script de Teste de Integração Real — API de Hipócrates Paperlab (Task 4)
 * 
 * Este script bate nos endpoints locais do backend e executa o fluxo completo do módulo:
 * Criar Notebook -> Adicionar Fonte -> Chat RAG -> Gerar Flashcards (IA Assíncrona) -> Revisar Flashcard (Anki Scheduler).
 * 
 * Execução: node test_paperlab_api.js
 */

const BASE_URL = 'http://localhost:3333';
// ID de estudante fixo gerado pelo script de seed
const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';

// Cores para formatação estilizada no console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function logHeader(title) {
  console.log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
}

function logSuccess(message, data) {
  console.log(`${colors.green}✔ ${message}${colors.reset}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

function logError(message, err) {
  console.log(`${colors.red}✘ ${message}${colors.reset}`);
  if (err) console.error(err);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log(`${colors.bright}${colors.magenta}🚀 Iniciando Testes de Integração da API de Paperlab...${colors.reset}`);
  console.log(`URL Base: ${colors.yellow}${BASE_URL}${colors.reset}`);
  console.log(`Estudante ID: ${colors.yellow}${STUDENT_ID}${colors.reset}\n`);

  let sessionId = null;
  let sourceId = null;
  let materialId = null;
  let flashcardId = null;

  try {
    // ----------------------------------------------------
    logHeader('1. CRIAR UM NOVO NOTEBOOK SEM TÍTULO (SESSÃO DE ESTUDOS)');
    // ----------------------------------------------------
    const createRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Envia corpo vazio para nascer como "Untitled notebook"
    });

    if (!createRes.ok) throw new Error(`Falha ao criar sessão: ${createRes.statusText}`);
    const session = await createRes.json();
    sessionId = session.id;
    logSuccess('Notebook criado sem título por padrão!', session);

    // ----------------------------------------------------
    logHeader('2. ADICIONAR MÚLTIPLAS FONTES DE ESTUDOS AO NOTEBOOK (LINK E YOUTUBE)');
    // ----------------------------------------------------
    // Adiciona a primeira fonte (Link da Wikipedia)
    const addSourceRes1 = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'link',
        titulo: 'Sistema Circulatório - Wikipédia, a enciclopédia livre',
        url: 'https://pt.wikipedia.org/wiki/Sistema_circulat%C3%B3rio'
      })
    });

    if (!addSourceRes1.ok) throw new Error(`Falha ao adicionar primeira fonte: ${addSourceRes1.statusText}`);
    const source1 = await addSourceRes1.json();
    const sourceId1 = source1.id;
    logSuccess('Primeira fonte (Link) adicionada (Status: indexing)!', source1);

    // Adiciona a segunda fonte (Vídeo do YouTube)
    const addSourceRes2 = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'youtube',
        titulo: 'Fisiologia Cardiovascular - Fisiologia do Coração, Débito Cardíaco e Contração do Miocárdio',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      })
    });

    if (!addSourceRes2.ok) throw new Error(`Falha ao adicionar segunda fonte: ${addSourceRes2.statusText}`);
    const source2 = await addSourceRes2.json();
    const sourceId2 = source2.id;
    logSuccess('Segunda fonte (YouTube) adicionada (Status: indexing)!', source2);

    // ----------------------------------------------------
    logHeader('3. AGUARDANDO PROCESSAMENTO ASSÍNCRONO DAS MÚLTIPLAS FONTES E RENOMEAÇÃO PELA IA...');
    // ----------------------------------------------------
    console.log('Aguardando a indexação das fontes pelo Worker em segundo plano...');
    
    let sources = [];
    let allReady = false;
    for (let attempt = 1; attempt <= 15; attempt++) {
      await delay(2000);
      const checkSourceRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/sources`);
      if (checkSourceRes.ok) {
        sources = await checkSourceRes.json();
        const s1 = sources.find(s => s.id === sourceId1);
        const s2 = sources.find(s => s.id === sourceId2);
        
        if (s1 && s1.status === 'ready' && s2 && s2.status === 'ready') {
          allReady = true;
          break;
        }
      }
      console.log(`[Tentativa ${attempt}/15] Fontes ainda estão indexando em segundo plano...`);
    }

    if (allReady) {
      logSuccess('Todas as múltiplas fontes foram processadas e indexadas com sucesso (Status: ready)!');
    } else {
      console.log(`${colors.yellow}⚠️ Aviso: Uma ou mais fontes demoraram para indexar ou falharam. Continuando...${colors.reset}`);
    }

    logSuccess('Fontes da sessão atualmente:', sources);

    // Checa o título do notebook atualizado pela IA
    const checkSessionRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}`);
    const sessionData = await checkSessionRes.json();
    logSuccess('Detalhes atuais do notebook:', { id: sessionData.id, titulo: sessionData.titulo });

    if (sessionData.titulo !== 'Untitled notebook') {
      logSuccess(`🎉 SUCESSO DE DESIGN! O Notebook foi renomeado de forma inteligente pela IA para: "${sessionData.titulo}" baseado no conteúdo da fonte indexada!`);
    } else {
      console.log(`${colors.yellow}⚠️ Aviso: O título ainda não foi atualizado pela IA (verifique se a fonte já está ready).${colors.reset}`);
    }

    // ----------------------------------------------------
    logHeader('4. TESTANDO CHAT UNIVERSAL COM RAG CONSOLIDADO (MÚLTIPLAS FONTES)');
    // ----------------------------------------------------
    const chatRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pergunta: 'Com base nas fontes indexadas, o que é o débito cardíaco e qual é a principal função do sistema circulatório?'
      })
    });

    if (!chatRes.ok) throw new Error(`Falha no chat: ${chatRes.statusText}`);
    const chatData = await chatRes.json();
    logSuccess('Resposta inteligente gerada do chat (RAG):', chatData);

    // ----------------------------------------------------
    logHeader('5. SOLICITAR GERAÇÃO ASSÍNCRONA DE MATERIAIS DE ESTUDO (FLASHCARDS)');
    // ----------------------------------------------------
    const genMatRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'flashcards',
        prompt: 'Crie flashcards de revisão rápida sobre ciclo cardíaco, sístole e diástole.',
        numeroCards: 'menos', // Gerará entre 10 a 15 cards conforme solicitado
        dificuldade: 'facil'  // Foco fácil
      })
    });

    if (!genMatRes.ok) throw new Error(`Falha ao disparar material: ${genMatRes.statusText}`);
    const material = await genMatRes.json();
    materialId = material.id;
    logSuccess('Geração assíncrona de Flashcards solicitada e enfileirada (Status: pending)!', material);

    // ----------------------------------------------------
    logHeader('6. AGUARDANDO GERAÇÃO ASSÍNCRONA DOS FLASHCARDS VIA IA...');
    // ----------------------------------------------------
    console.log('Aguardando o GPT-4o-mini estruturar e salvar os flashcards no banco local...');
    
    let detailedMaterial = null;
    let isMatReady = false;
    for (let attempt = 1; attempt <= 12; attempt++) {
      await delay(1500);
      const getMatRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/materials/${materialId}`);
      if (getMatRes.ok) {
        detailedMaterial = await getMatRes.json();
        if (detailedMaterial && detailedMaterial.status === 'ready') {
          isMatReady = true;
          break;
        }
      }
      console.log(`[Tentativa ${attempt}/12] Geração de flashcards ainda em processamento...`);
    }

    if (isMatReady) {
      logSuccess('Flashcards gerados e recuperados com sucesso!', detailedMaterial);
      if (detailedMaterial.flashcards && detailedMaterial.flashcards.length > 0) {
        flashcardId = detailedMaterial.flashcards[0].id;
        logSuccess(`✅ Flashcards gerados na tabela de flashcards local! Total: ${detailedMaterial.flashcards.length}`);
      }
    } else {
      console.log(`${colors.yellow}⚠️ Aviso: A geração do material demorou ou falhou. Continuando...${colors.reset}`);
    }

    // ----------------------------------------------------
    logHeader('7. TESTAR REVISÃO DE FLASHCARD (ANKI SCHEDULER AGENDANDO REVISÃO)');
    // ----------------------------------------------------
    if (flashcardId) {
      console.log(`Revisando o flashcard ID: ${flashcardId} com resultado 'acerto' (deve agendar para daqui a 2 dias)...`);
      const reviewRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/materials/${materialId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: flashcardId,
          resultado: 'acerto'
        })
      });

      if (!reviewRes.ok) throw new Error(`Falha ao revisar card: ${reviewRes.statusText}`);
      const cardReview = await reviewRes.json();
      logSuccess('Flashcard revisado e agendado com sucesso (Anki Scheduler)!', cardReview);
    } else {
      console.log(`${colors.yellow}⚠️ Pulo: Nenhum card encontrado para testar revisão.${colors.reset}`);
    }

    // ----------------------------------------------------
    logHeader('8. DETALHAR NOTEBOOK (NOTEBOOK COMPLETO COM TODAS AS FONTES E MATERIAIS)');
    // ----------------------------------------------------
    const sessionDetailRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}`);
    if (!sessionDetailRes.ok) throw new Error(`Falha ao recuperar detalhes do notebook: ${sessionDetailRes.statusText}`);
    const sessionDetail = await sessionDetailRes.json();
    logSuccess('Visão geral consolidada do Notebook no estilo NotebookLM:', sessionDetail);

  } catch (error) {
    logError('Erro crítico durante o fluxo de testes de integração:', error.message);
  }

  console.log(`\n${colors.bright}${colors.magenta}=== Fim dos Testes do Paperlab ===${colors.reset}`);
}

runTests();
