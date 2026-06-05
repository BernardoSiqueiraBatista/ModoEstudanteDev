/**
 * 🧪 Script de Teste Interativo — API de Hipócrates Papers (Task 3)
 * 
 * Este script bate nos endpoints locais do backend e executa o fluxo completo do módulo:
 * Criar paper -> Listar -> Detalhar -> Atualizar -> Compartilhar -> Acessar publicamente -> Soft delete -> Verificar 404.
 * 
 * Execução: node test_papers_api.js
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

async function runTests() {
  console.log(`${colors.bright}${colors.magenta}🚀 Iniciando Testes de Integração da API de Papers...${colors.reset}`);
  console.log(`URL Base: ${colors.yellow}${BASE_URL}${colors.reset}`);
  console.log(`Estudante ID: ${colors.yellow}${STUDENT_ID}${colors.reset}\n`);

  let createdPaperId = null;
  let shareToken = null;

  try {
    // ----------------------------------------------------
    logHeader('1. CRIAR UM NOVO PAPER (RASCUNHO)');
    // ----------------------------------------------------
    const createRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/papers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Fisiologia Cardiovascular Avançada',
        conteudo: '# Fisiologia do Coração\nEstudo detalhado dos mecanismos de contração do miocárdio.',
        conteudo_tipo: 'markdown',
        tags: ['cardiologia', 'fisiologia', 'ciclo-cardiaco'],
        status: 'rascunho'
      })
    });

    if (!createRes.ok) throw new Error(`Falha ao criar: ${createRes.statusText}`);
    const createdPaper = await createRes.json();
    createdPaperId = createdPaper.id;
    logSuccess('Paper criado com sucesso!', createdPaper);

    // ----------------------------------------------------
    logHeader('2. LISTAR OS PAPERS DO ESTUDANTE (PAGINADO)');
    // ----------------------------------------------------
    const listRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/papers?page=1&size=5`);
    if (!listRes.ok) throw new Error(`Falha ao listar: ${listRes.statusText}`);
    const listData = await listRes.json();
    logSuccess('Papers listados com sucesso!', listData);

    // ----------------------------------------------------
    logHeader('3. DETALHAR O PAPER CRIADO');
    // ----------------------------------------------------
    const getRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/papers/${createdPaperId}`);
    if (!getRes.ok) throw new Error(`Falha ao detalhar: ${getRes.statusText}`);
    const detailedPaper = await getRes.json();
    logSuccess('Detalhes do paper recuperados!', detailedPaper);

    // ----------------------------------------------------
    logHeader('4. ATUALIZAR O PAPER (MUDAR STATUS PARA PUBLICADO)');
    // ----------------------------------------------------
    const updateRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/papers/${createdPaperId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Fisiologia Cardiovascular e Ciclo Cardíaco Avançado',
        status: 'publicado',
        tags: ['cardiologia', 'fisiologia', 'ciclo-cardiaco', 'enare-2026']
      })
    });
    if (!updateRes.ok) throw new Error(`Falha ao atualizar: ${updateRes.statusText}`);
    const updatedPaper = await updateRes.json();
    logSuccess('Paper atualizado com sucesso!', updatedPaper);

    // ----------------------------------------------------
    logHeader('5. GERAR LINK DE COMPARTILHAMENTO PÚBLICO');
    // ----------------------------------------------------
    const shareRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/papers/${createdPaperId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!shareRes.ok) throw new Error(`Falha ao compartilhar: ${shareRes.statusText}`);
    const shareData = await shareRes.json();
    shareToken = shareData.share_token;
    logSuccess('Token de compartilhamento gerado!', shareData);

    // ----------------------------------------------------
    logHeader('6. ACESSAR PAPER VIA ROTA PÚBLICA (SEM AUTENTICAÇÃO)');
    // ----------------------------------------------------
    const publicRes = await fetch(`${BASE_URL}/papers/shared/${shareToken}`);
    if (!publicRes.ok) throw new Error(`Falha ao acessar rota pública: ${publicRes.statusText}`);
    const publicPaper = await publicRes.json();
    logSuccess('Paper acessado de forma anônima e pública!', publicPaper);

    // ----------------------------------------------------
    logHeader('7. DELETAR PAPER (SOFT DELETE)');
    // ----------------------------------------------------
    const deleteRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/papers/${createdPaperId}`, {
      method: 'DELETE'
    });
    if (deleteRes.status !== 204) throw new Error(`Falha ao deletar: Status ${deleteRes.status}`);
    logSuccess('Soft delete do Paper executado com sucesso! (Status 204 No Content)');

    // ----------------------------------------------------
    logHeader('8. TENTAR DETALHAR O PAPER EXCLUÍDO (DEVE RETORNAR 404)');
    // ----------------------------------------------------
    const checkDeletedRes = await fetch(`${BASE_URL}/student/${STUDENT_ID}/papers/${createdPaperId}`);
    if (checkDeletedRes.status === 404) {
      logSuccess('Segurança de Soft Delete validada! Endpoint retornou 404 Not Found para o recurso excluído.');
    } else {
      logError(`Falha na validação! Esperava 404 mas retornou ${checkDeletedRes.status}`);
    }

  } catch (error) {
    logError('Erro durante o fluxo de testes:', error.message);
  }

  console.log(`\n${colors.bright}${colors.magenta}=== Fim dos Testes ===${colors.reset}`);
}

runTests();
