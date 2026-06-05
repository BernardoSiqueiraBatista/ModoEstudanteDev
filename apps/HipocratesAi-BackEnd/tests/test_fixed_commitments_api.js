/**
 * 🧪 Script de Teste Interativo — API de Compromissos Fixos / Horários Bloqueados (Task 4)
 * 
 * Este script bate nos endpoints locais do backend e executa o fluxo completo do módulo:
 * Criar Plano de Estudos -> Listar compromissos vazios -> Criar compromisso -> 
 * Validar conflito de sobreposição (409) -> Validar horários inválidos (422) -> 
 * Atualizar compromisso (PATCH) -> Listar novamente -> Remover compromisso (DELETE) ->
 * Excluir o plano temporário.
 * 
 * Execução: node test_fixed_commitments_api.js
 */

const BASE_URL = 'http://localhost:3333';
// ID de estudante fixo gerado pelo script de seed do banco
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

function logWarning(message, data) {
  console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

function logError(message, err) {
  console.log(`${colors.red}✘ ${message}${colors.reset}`);
  if (err) console.error(err);
}

async function runTests() {
  console.log(`${colors.bright}${colors.magenta}🚀 Iniciando Testes de Integração da API de Compromissos Fixos (Task 4)...${colors.reset}`);
  console.log(`URL Base: ${colors.yellow}${BASE_URL}${colors.reset}`);
  console.log(`Estudante ID: ${colors.yellow}${STUDENT_ID}${colors.reset}\n`);

  let tempPlanId = null;
  let createdCommitmentId = null;

  try {
    // ----------------------------------------------------
    logHeader('1. CRIAR UM PLANO DE ESTUDOS TEMPORÁRIO');
    // ----------------------------------------------------
    const createPlanRes = await fetch(`${BASE_URL}/student/v1/study-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: STUDENT_ID,
        areas_foco: ['Cardiologia', 'Pneumologia'],
        duracao: 'semanal',
        instrucoes: 'Estudar matérias do ciclo básico',
        horas_dia: 4,
        considerar_performance: false,
        titulo: 'Plano de Teste Compromissos Fixos',
        categoria: 'geral'
      })
    });

    if (!createPlanRes.ok) {
      const errText = await createPlanRes.text();
      throw new Error(`Falha ao criar plano de estudos: ${createPlanRes.status} ${errText}`);
    }

    const planData = await createPlanRes.json();
    tempPlanId = planData.plan_id;
    logSuccess('Plano de estudos criado temporariamente com sucesso!', { plan_id: tempPlanId });

    // ----------------------------------------------------
    logHeader('2. LISTAR COMPROMISSOS FIXOS DO PLANO (DEVE ESTAR VAZIO)');
    // ----------------------------------------------------
    const listEmptyRes = await fetch(`${BASE_URL}/student/v1/study-plans/${tempPlanId}/fixed-commitments`);
    if (!listEmptyRes.ok) throw new Error(`Falha ao listar compromissos: ${listEmptyRes.statusText}`);
    const emptyList = await listEmptyRes.json();
    logSuccess('Lista inicial obtida (esperado vir vazio):', emptyList);

    // ----------------------------------------------------
    logHeader('3. CRIAR UM COMPROMISSO FIXO (HORÁRIO BLOQUEADO) VÁLIDO');
    // ----------------------------------------------------
    const createRes = await fetch(`${BASE_URL}/student/v1/study-plans/${tempPlanId}/fixed-commitments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dia: 'seg',
        inicio: '14:00',
        fim: '16:00',
        label: 'Aula Prática de Semiologia',
        tipo: 'compromisso_fixo'
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Falha ao criar compromisso: ${createRes.status} ${errText}`);
    }

    const commitment = await createRes.json();
    createdCommitmentId = commitment.id;
    logSuccess('Compromisso fixo criado com sucesso!', commitment);

    // ----------------------------------------------------
    logHeader('4. TENTAR CRIAR OUTRO COMPROMISSO NO MESMO HORÁRIO (DEVE RETORNAR 409 CONFLITO)');
    // ----------------------------------------------------
    const overlapRes = await fetch(`${BASE_URL}/student/v1/study-plans/${tempPlanId}/fixed-commitments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dia: 'seg',
        inicio: '15:00',
        fim: '17:00',
        label: 'Outra Aula Conflitante',
        tipo: 'compromisso_fixo'
      })
    });

    if (overlapRes.status === 409) {
      const errData = await overlapRes.json();
      logSuccess('Segurança contra sobreposição validada! Retornou status 409.', errData);
    } else {
      logError(`Falha na segurança contra sobreposição! Esperava 409 mas retornou ${overlapRes.status}`);
    }

    // ----------------------------------------------------
    logHeader('5. TENTAR CRIAR COMPROMISSO COM HORÁRIO INVÁLIDO (FIM < INÍCIO, DEVE RETORNAR 422)');
    // ----------------------------------------------------
    const invalidTimeRes = await fetch(`${BASE_URL}/student/v1/study-plans/${tempPlanId}/fixed-commitments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dia: 'ter',
        inicio: '18:00',
        fim: '17:00', // Inválido! Fim antes do Início.
        label: 'Horário Maluco',
        tipo: 'compromisso_fixo'
      })
    });

    if (invalidTimeRes.status === 422) {
      const errData = await invalidTimeRes.json();
      logSuccess('Validação de horários (Zod/Refine) funcionou! Retornou status 422.', errData);
    } else {
      logError(`Falha na validação de horários! Esperava 422 mas retornou ${invalidTimeRes.status}`);
    }

    // ----------------------------------------------------
    logHeader('6. ATUALIZAR COMPROMISSO FIXO (MUDAR HORÁRIO E RÓTULO)');
    // ----------------------------------------------------
    const updateRes = await fetch(`${BASE_URL}/student/v1/study-plans/${tempPlanId}/fixed-commitments/${createdCommitmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dia: 'seg',
        inicio: '14:30', // Alterou das 14:00 para 14:30
        fim: '16:30',   // Alterou das 16:00 para 16:30
        label: 'Aula Prática de Semiologia Avançada'
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`Falha ao atualizar compromisso: ${updateRes.status} ${errText}`);
    }

    const updatedCommitment = await updateRes.json();
    logSuccess('Compromisso atualizado com sucesso!', updatedCommitment);

    // ----------------------------------------------------
    logHeader('7. LISTAR COMPROMISSOS FIXOS DO PLANO (DEVE CONTER O REGISTRO ATUALIZADO)');
    // ----------------------------------------------------
    const listRes = await fetch(`${BASE_URL}/student/v1/study-plans/${tempPlanId}/fixed-commitments`);
    if (!listRes.ok) throw new Error(`Falha ao listar: ${listRes.statusText}`);
    const listData = await listRes.json();
    logSuccess('Lista de compromissos recuperada:', listData);

    // ----------------------------------------------------
    logHeader('8. EXCLUIR O COMPROMISSO FIXO (DELETE)');
    // ----------------------------------------------------
    const deleteRes = await fetch(`${BASE_URL}/student/v1/study-plans/${tempPlanId}/fixed-commitments/${createdCommitmentId}`, {
      method: 'DELETE'
    });

    if (deleteRes.status === 204) {
      logSuccess('Compromisso fixo excluído com sucesso! (Status 204 No Content)');
    } else {
      logError(`Falha ao excluir compromisso! Retornou status ${deleteRes.status}`);
    }

    // ----------------------------------------------------
    logHeader('9. VERIFICAR SE O COMPROMISSO FOI DE FATO REMOVIDO');
    // ----------------------------------------------------
    const checkDeletedRes = await fetch(`${BASE_URL}/student/v1/study-plans/${tempPlanId}/fixed-commitments`);
    const checkData = await checkDeletedRes.json();
    if (checkData.compromissos_fixos.length === 0) {
      logSuccess('Sucesso! Nenhum compromisso fixo encontrado no banco de dados para este plano.');
    } else {
      logError('Falha! O compromisso ainda consta listado no plano.', checkData);
    }

  } catch (error) {
    logError('Erro durante o fluxo de testes:', error.message);
  } finally {
    if (tempPlanId) {
      // ----------------------------------------------------
      logHeader('10. LIMPAR BANCO (DELETAR PLANO DE ESTUDOS TEMPORÁRIO)');
      // ----------------------------------------------------
      try {
        const cleanupRes = await fetch(`${BASE_URL}/student/v1/study-plans/${tempPlanId}?student_id=${STUDENT_ID}`, {
          method: 'DELETE'
        });
        if (cleanupRes.ok) {
          logSuccess('Plano de estudos temporário removido do banco com sucesso.');
        } else {
          logWarning(`Não foi possível remover o plano de estudos temporário ID ${tempPlanId}: status ${cleanupRes.status}`);
        }
      } catch (cleanupErr) {
        logWarning(`Erro na limpeza do plano de estudos temporário: ${cleanupErr.message}`);
      }
    }
  }

  console.log(`\n${colors.bright}${colors.magenta}=== Fim dos Testes de Compromissos Fixos ===${colors.reset}`);
}

runTests();
