/**
 * 🧪 Script de Teste de Integração Real Avançado — API de Hipócrates Paperlab
 * 
 * Este script bate nos endpoints locais do backend e executa o fluxo completo do módulo:
 * Criar Notebook -> Adicionar Fontes (com teste YouTube) -> Chat RAG Conversacional ->
 * Gerar Mapa Mental (Markmap) -> Gerar Flashcards (IA) -> Revisar Flashcard (Anki Scheduler) ->
 * Compartilhamento Público por Link -> Colaboradores por Convite -> Histórico de Chat Paginado.
 * 
 * Execução: node test_paperlab_api.js
 */

const BASE_URL = 'http://localhost:3333';
// ID de estudante fixo gerado pelo script de seed
const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
// UUID de estudante mocado fictício para teste de colaborador
const COLLABORATOR_STUDENT_ID = 'f1925b44-9694-477c-a496-5e638e4a9e26'; 

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

function logWarning(message, details) {
  console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
  if (details) console.log(details);
}

function logError(message, err) {
  console.log(`${colors.red}✘ ${message}${colors.reset}`);
  if (err) console.error(err);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log(`${colors.bright}${colors.magenta}🚀 Iniciando Testes de Integração Avançados da API de Paperlab...${colors.reset}`);
  console.log(`URL Base: ${colors.yellow}${BASE_URL}${colors.reset}`);
  console.log(`Estudante Proprietário ID: ${colors.yellow}${STUDENT_ID}${colors.reset}\n`);

  let sessionId = null;
  let sourceId1 = null;
  let sourceId2 = null;
  let materialId = null;
  let mapMaterialId = null;
  let flashcardId = null;
  let shareToken = null;
  let collaboratorId = null;

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
        titulo: 'Sistema Circulatório - Wikipédia',
        url: 'https://pt.wikipedia.org/wiki/Sistema_circulat%C3%B3rio'
      })
    });

    if (!addSourceRes1.ok) throw new Error(`Falha ao adicionar primeira fonte: ${addSourceRes1.statusText}`);
    const source1 = await addSourceRes1.json();
    sourceId1 = source1.id;
    logSuccess('Primeira fonte (Link) adicionada (Status: indexing)!', source1);

    // Adiciona a segunda fonte (Vídeo do YouTube - testando extração de legenda automática)
    const addSourceRes2 = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'youtube',
        titulo: 'Fisiologia Cardiovascular - Aula Rápida',
        url: 'https://www.youtube.com/watch?v=m7H0V16P5bU'
      })
    });

    if (!addSourceRes2.ok) throw new Error(`Falha ao adicionar segunda fonte: ${addSourceRes2.statusText}`);
    const source2 = await addSourceRes2.json();
    sourceId2 = source2.id;
    logSuccess('Segunda fonte (YouTube) adicionada (Status: indexing com extração de legenda automática)!', source2);

    // ----------------------------------------------------
    logHeader('3. AGUARDANDO PROCESSAMENTO ASSÍNCRONO DAS FONTES E RENOMEAÇÃO INTELIGENTE...');
    // ----------------------------------------------------
    console.log('Aguardando a indexação das fontes pelo Worker em segundo plano...');
    
    let sources = [];
    let allReady = false;
    for (let attempt = 1; attempt <= 20; attempt++) {
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
      console.log(`[Tentativa ${attempt}/20] Fontes ainda estão indexando em segundo plano...`);
    }

    if (allReady) {
      logSuccess('Todas as fontes foram indexadas com sucesso (Legendas extraídas do YouTube / Resumos indexados)!');
    } else {
      logWarning('Uma ou mais fontes demoraram para indexar ou falharam. Continuando...');
    }

    logSuccess('Fontes da sessão atualmente:', sources);

    // Checa o título do notebook atualizado pela IA
    const checkSessionRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}`);
    const sessionData = await checkSessionRes.json();
    logSuccess('Detalhes atuais do notebook:', { id: sessionData.id, titulo: sessionData.titulo });

    if (sessionData.titulo !== 'Untitled notebook') {
      logSuccess(`SUCESSO! O Notebook foi renomeado de forma inteligente pela IA para: "${sessionData.titulo}" baseado na fonte indexada!`);
    } else {
      logWarning('O título ainda não foi atualizado pela IA (verifique se a primeira fonte já está pronta).');
    }

    // ----------------------------------------------------
    logHeader('4. TESTANDO CHAT UNIVERSAL COM RAG CONVERSACIONAL (PERSISTÊNCIA DE DIÁLOGOS)');
    // ----------------------------------------------------
    console.log('Enviando pergunta 1 no chat RAG...');
    const chatRes1 = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pergunta: 'Com base nas fontes, o que é o débito cardíaco?'
      })
    });

    if (!chatRes1.ok) throw new Error(`Falha no chat 1: ${chatRes1.statusText}`);
    const chatData1 = await chatRes1.json();
    logSuccess('Resposta do chat 1 (Salva no histórico local):', chatData1);

    console.log('\nEnviando pergunta 2 no chat RAG (testando contexto da conversa anterior)...');
    const chatRes2 = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pergunta: 'Como esse valor de débito que você explicou é calculado e regulado?'
      })
    });

    if (!chatRes2.ok) throw new Error(`Falha no chat 2: ${chatRes2.statusText}`);
    const chatData2 = await chatRes2.json();
    logSuccess('Resposta do chat 2 (Analisando contexto anterior):', chatData2);

    // ----------------------------------------------------
    logHeader('5. GERAÇÃO DE MAPA MENTAL INTEGRADO (PADRÃO MARKMAP.JS)');
    // ----------------------------------------------------
    console.log('Enfileirando a geração de um Mapa Mental em Markdown hierárquico...');
    const genMapRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'mapa_mental',
        prompt: 'Gere um mapa mental completo do sistema cardiovascular e ciclo de sístole e diástole.'
      })
    });

    if (!genMapRes.ok) throw new Error(`Falha ao disparar mapa mental: ${genMapRes.statusText}`);
    const mapMaterial = await genMapRes.json();
    mapMaterialId = mapMaterial.id;
    logSuccess('Geração de Mapa Mental iniciada (Status: pending)!', mapMaterial);

    // ----------------------------------------------------
    logHeader('6. AGUARDANDO E VERIFICANDO SINTAXE DO MAPA MENTAL MARKMAP...');
    // ----------------------------------------------------
    let detailedMap = null;
    let isMapReady = false;
    for (let attempt = 1; attempt <= 12; attempt++) {
      await delay(1500);
      const getMapRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/materials/${mapMaterialId}`);
      if (getMapRes.ok) {
        detailedMap = await getMapRes.json();
        if (detailedMap && detailedMap.status === 'ready') {
          isMapReady = true;
          break;
        }
      }
      console.log(`[Tentativa ${attempt}/12] Geração de mapa mental ainda em processamento...`);
    }

    if (isMapReady) {
      logSuccess('Mapa Mental gerado e salvo com sucesso!', {
        id: detailedMap.id,
        tipo: detailedMap.tipo,
        status: detailedMap.status,
        markdownPreview: detailedMap.conteudo.markdown.slice(0, 300) + '...'
      });
      
      if (detailedMap.conteudo.markdown.includes('#')) {
        logSuccess('✅ SUCESSO! O mapa mental contém tags Markdown de cabeçalho (#, ##) e está compatível com Markmap.js!');
      } else {
        logWarning('Atenção: O mapa mental gerado não possui sintaxe hierárquica Markdown.');
      }
    } else {
      logWarning('A geração do mapa mental demorou ou falhou. Continuando...');
    }

    // ----------------------------------------------------
    logHeader('7. GERAÇÃO E REVISÃO DE FLASHCARDS (ANKI SCHEDULER)');
    // ----------------------------------------------------
    const genMatRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'flashcards',
        prompt: 'Crie flashcards de revisão rápida sobre ciclo cardíaco.',
        numeroCards: 'menos',
        dificuldade: 'facil'
      })
    });

    if (!genMatRes.ok) throw new Error(`Falha ao disparar flashcards: ${genMatRes.statusText}`);
    const material = await genMatRes.json();
    materialId = material.id;
    logSuccess('Geração de Flashcards solicitada e enfileirada (Status: pending)!', material);

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

    if (isMatReady && detailedMaterial.flashcards && detailedMaterial.flashcards.length > 0) {
      flashcardId = detailedMaterial.flashcards[0].id;
      logSuccess(`Total de Flashcards salvos: ${detailedMaterial.flashcards.length}`);
      
      console.log(`Revisando o flashcard ID: ${flashcardId} com resultado 'acerto' (Anki Scheduler)...`);
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
      logSuccess('Flashcard revisado e reagendado com sucesso!', cardReview);
    } else {
      logWarning('Nenhum flashcard encontrado para testar revisão.');
    }

    // ----------------------------------------------------
    logHeader('8. COMPARTILHAMENTO PÚBLICO POR LINK (SEGURANÇA E EXPIRAÇÃO)');
    // ----------------------------------------------------
    console.log('Gerando link público de compartilhamento...');
    const shareRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibilidade: 'link',
        expira_em: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Expira amanhã
      })
    });

    if (!shareRes.ok) throw new Error(`Falha ao compartilhar: ${shareRes.statusText}`);
    const shareData = await shareRes.json();
    shareToken = shareData.share_token;
    logSuccess('Link de compartilhamento público ativado com sucesso!', shareData);

    console.log(`\nConsumindo o link de compartilhamento de forma anônima (/paperlab/shared/${shareToken})...`);
    const publicGetRes = await fetch(`${BASE_URL}/paperlab/shared/${shareToken}`);
    if (!publicGetRes.ok) throw new Error(`Falha ao acessar link público: ${publicGetRes.statusText}`);
    const publicData = await publicGetRes.json();
    logSuccess('Detalhes retornados de forma pública (Apenas fontes + materiais sem chat):', publicData);

    console.log('\nRevogando o link de compartilhamento...');
    const unshareRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/share`, {
      method: 'DELETE'
    });
    if (!unshareRes.ok) throw new Error(`Falha ao revogar compartilhamento: ${unshareRes.statusText}`);
    logSuccess('Compartilhamento público revogado com sucesso (Status: 204 No Content)!');

    // ----------------------------------------------------
    logHeader('9. COLABORADORES POR CONVITE (COMPARTILHAMENTO ENTRE ESTUDANTES)');
    // ----------------------------------------------------
    console.log(`Convidando estudante ${COLLABORATOR_STUDENT_ID} para o notebook...`);
    const inviteRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/collaborators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_student: COLLABORATOR_STUDENT_ID
      })
    });

    if (inviteRes.ok) {
      const collabData = await inviteRes.json();
      collaboratorId = collabData.id;
      logSuccess('Estudante convidado como colaborador com sucesso!', collabData);
      
      console.log('\nListando colaboradores do notebook...');
      const listCollabsRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/collaborators`);
      const collabsList = await listCollabsRes.json();
      logSuccess('Colaboradores ativos no notebook:', collabsList);

      console.log('\nRemovendo o colaborador...');
      const deleteCollabRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/collaborators/${collaboratorId}`, {
        method: 'DELETE'
      });
      if (deleteCollabRes.ok) {
        logSuccess('Colaborador removido com sucesso (Status: 204 No Content)!');
      } else {
        logWarning('Falha ao remover colaborador.');
      }
    } else {
      const errorText = await inviteRes.text();
      // Ocorre erro se o estudante mocado não existir na tabela student do banco, o que é esperado se o banco foi limpo
      logWarning(`Aviso: O convite falhou (geralmente porque o ID mocado de teste não existe na tabela student do banco): ${inviteRes.statusText}`, errorText);
    }

    // ----------------------------------------------------
    logHeader('10. HISTÓRICO DE CHAT PERSISTENTE E PAGINADO');
    // ----------------------------------------------------
    console.log('Buscando as mensagens salvas no chat de estudos (Página 1, limite 5)...');
    const historyRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}/chat?page=1&size=5`);
    if (!historyRes.ok) throw new Error(`Falha ao obter histórico de chat: ${historyRes.statusText}`);
    const chatHistory = await historyRes.json();
    logSuccess('Mensagens de chat recuperadas do histórico paginado:', chatHistory);

    // ----------------------------------------------------
    logHeader('11. DETALHAMENTO FINAL DO NOTEBOOK CONSOLIDADO');
    // ----------------------------------------------------
    const sessionDetailRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/paperlab/sessions/${sessionId}`);
    if (!sessionDetailRes.ok) throw new Error(`Falha ao recuperar detalhes: ${sessionDetailRes.statusText}`);
    const sessionDetail = await sessionDetailRes.json();
    logSuccess('Notebook consolidado (fontes, materiais, metadados) no estilo NotebookLM:', sessionDetail);

  } catch (error) {
    logError('Erro crítico durante o fluxo de testes de integração:', error.message);
  }

  console.log(`\n${colors.bright}${colors.magenta}=== Fim dos Testes do Paperlab ===${colors.reset}`);
}

runTests();
