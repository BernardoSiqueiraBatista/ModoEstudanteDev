const { Pool } = require('pg');

const API_URL = 'http://localhost:3333/student/v1';

// Configuração do banco (ajuste se necessário)
const pool = new Pool({
  user: 'bsb',
  host: 'localhost',
  database: 'postgres-db',
  password: 'Berna123',
  port: 5432,
});

async function runTests() {
  console.log('🧪 Iniciando testes integrados da Task 7 (Hipócrates Cases)...\n');

  try {
    // 1. Pegar um student_id válido
    console.log('Buscando um student_id válido no banco...');
    const studentRes = await pool.query('SELECT id FROM student LIMIT 1');
    if (studentRes.rowCount === 0) {
      throw new Error('Nenhum estudante encontrado no banco de dados. Crie um estudante primeiro.');
    }
    const studentId = studentRes.rows[0].id;
    console.log(`✅ Estudante encontrado: ${studentId}\n`);

    // 2. Pegar um case_id válido
    console.log('Buscando um case_id válido no banco...');
    const caseRes = await pool.query('SELECT id FROM cases LIMIT 1');
    if (caseRes.rowCount === 0) {
      throw new Error('Nenhum caso encontrado no banco. Rode as migrations e o seed_cases.sql.');
    }
    const caseId = caseRes.rows[0].id;
    console.log(`✅ Caso encontrado: ${caseId}\n`);

    // =========================================================================
    // ENDPOINT 1: GET /cases/:id/intro
    // =========================================================================
    console.log(`[1] Testando GET ${API_URL}/cases/${caseId}/intro`);
    const introRes = await fetch(`${API_URL}/cases/${caseId}/intro`);
    const introData = await introRes.json();
    console.log('Status:', introRes.status);
    console.log('Resposta:', JSON.stringify(introData, null, 2), '\n');
    if (!introRes.ok) throw new Error('Falha no GET intro');

    // =========================================================================
    // ENDPOINT 2: POST /cases/:id/attempts (Modo OSCE)
    // =========================================================================
    console.log(`[2] Testando POST ${API_URL}/cases/${caseId}/attempts`);
    const attemptPayload = { modo: 'osce', student_id: studentId };
    console.log('Payload:', attemptPayload);
    const attemptRes = await fetch(`${API_URL}/cases/${caseId}/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attemptPayload),
    });
    const attemptData = await attemptRes.json();
    console.log('Status:', attemptRes.status);
    console.log('Resposta:', JSON.stringify(attemptData, null, 2), '\n');
    if (!attemptRes.ok) throw new Error('Falha no POST attempts');
    
    const attemptId = attemptData.attempt_id;

    // =========================================================================
    // ENDPOINT 3: POST /cases/attempts/:aid/events (Registrar eventos)
    // =========================================================================
    console.log(`[3] Testando POST ${API_URL}/cases/attempts/${attemptId}/events`);
    
    // Evento 1 (Acerto)
    const event1Payload = { tipo: 'procedimento_correto', ref: 'auscultacao_cardiaca', pontos: 15 };
    console.log('Enviando Evento 1:', event1Payload);
    const event1Res = await fetch(`${API_URL}/cases/attempts/${attemptId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event1Payload),
    });
    const event1Data = await event1Res.json();
    console.log('Status:', event1Res.status);
    console.log('Resposta 1:', JSON.stringify(event1Data, null, 2));

    // Evento 2 (Erro)
    const event2Payload = { tipo: 'erro', ref: 'atraso_conduta', pontos: -5 };
    console.log('Enviando Evento 2:', event2Payload);
    const event2Res = await fetch(`${API_URL}/cases/attempts/${attemptId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event2Payload),
    });
    const event2Data = await event2Res.json();
    console.log('Status:', event2Res.status);
    console.log('Resposta 2:', JSON.stringify(event2Data, null, 2), '\n');

    // =========================================================================
    // ENDPOINT 4: POST /cases/attempts/:aid/finish
    // =========================================================================
    console.log(`[4] Testando POST ${API_URL}/cases/attempts/${attemptId}/finish`);
    const finishPayload = { student_id: studentId };
    console.log('Payload:', finishPayload);
    
    // Aguardar 2 segundos para dar tempo do feedback ser mais realista
    console.log('Simulando simulação... aguardando 2s antes de finalizar...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const finishRes = await fetch(`${API_URL}/cases/attempts/${attemptId}/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finishPayload),
    });
    const finishData = await finishRes.json();
    console.log('Status:', finishRes.status);
    console.log('Resposta Final:', JSON.stringify(finishData, null, 2), '\n');
    if (!finishRes.ok) throw new Error('Falha no POST finish');

    console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO! 🎉');

  } catch (error) {
    console.error('❌ ERRO DURANTE OS TESTES:', error.message);
  } finally {
    await pool.end();
  }
}

runTests();
