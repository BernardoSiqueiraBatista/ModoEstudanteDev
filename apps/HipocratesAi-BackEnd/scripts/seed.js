/**
 * 🌱 Script de Seed Universal em JavaScript (Node.js) — Hipócrates
 * 
 * Este script substitui o script em Python, eliminando a dependência do psycopg2.
 * Ele limpa o esquema local do Postgres, aplica o dbSchema.sql e injeta 
 * os dados sintéticos necessários para testes e desenvolvimento local.
 * 
 * Execução: node scripts/seed.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'postgres',
});

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSample(array, size) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

async function runSeed() {
  const client = await pool.connect();
  try {
    console.log('🔌 Conectando ao banco de dados PostgreSQL local...');

    // 0. Recriar Esquema e aplicar dbSchema.sql
    console.log('🏗️  Limpando esquema e aplicando dbSchema.sql...');
    const schemaPath = path.join(__dirname, '..', 'src', 'config', 'dbSchema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Esquema dbSchema.sql não encontrado no caminho: ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await client.query(schemaSql);
    console.log('✅ Esquema recriado e dbSchema.sql aplicado!');

    console.log('🧹 Limpando tabelas antigas por cascata...');
    await client.query('TRUNCATE study_plan_blocks, study_plans, performance_insights, performance, alternative, student, question CASCADE;');

    // 1. Injetar Estudantes
    console.log('👨‍🎓 Criando 10 estudantes sintéticos...');
    const studentIds = [];
    const fixedStudentId = 'e1925b44-9694-477c-a496-5e638e4a9e25';
    const collaboratorStudentId = 'f1925b44-9694-477c-a496-5e638e4a9e26';
    
    // Insere o estudante de testes fixo
    await client.query(
      "INSERT INTO student (id, study_time) VALUES ($1, $2 * INTERVAL '1 second')",
      [fixedStudentId, randomInt(0, 360000)]
    );
    studentIds.push(fixedStudentId);

    // Insere o estudante colaborador de testes fixo
    await client.query(
      "INSERT INTO student (id, study_time) VALUES ($1, $2 * INTERVAL '1 second')",
      [collaboratorStudentId, randomInt(0, 360000)]
    );
    studentIds.push(collaboratorStudentId);

    // Insere mais 8 estudantes (totalizando 10)
    for (let i = 0; i < 8; i++) {
      const sId = uuidv4();
      await client.query(
        "INSERT INTO student (id, study_time) VALUES ($1, $2 * INTERVAL '1 second')",
        [sId, randomInt(0, 360000)]
      );
      studentIds.push(sId);
    }

    // 2. Injetar Questões e Alternativas
    console.log('📚 Criando 100 questões e 400 alternativas...');
    const questionIds = [];
    for (let i = 0; i < 100; i++) {
      const qId = uuidv4();
      const level = randomInt(1, 3);
      const subject = randomInt(0, 10);
      
      await client.query(
        'INSERT INTO question (id, question_text, question_level, question_subject) VALUES ($1, $2, $3, $4)',
        [qId, `Questão sintética ${i + 1} focada no assunto ${subject} de nível ${level}.`, level, subject]
      );
      questionIds.push(qId);

      // 4 Alternativas por questão
      const correctIndex = randomInt(0, 3);
      for (let orderIdx = 0; orderIdx < 4; orderIdx++) {
        const isCorrect = (orderIdx === correctIndex);
        await client.query(
          'INSERT INTO alternative (id_question, alternative_text, is_correct, order_index) VALUES ($1, $2, $3, $4)',
          [qId, `Alternativa índice ${orderIdx} da questão ${i + 1}`, isCorrect, orderIdx]
        );
      }
    }

    // 3. Injetar Histórico de Performance
    console.log('📊 Gerando histórico de resoluções de simulados...');
    for (const sId of studentIds) {
      const qty = randomInt(15, 60);
      const chosenQuestions = randomSample(questionIds, qty);
      for (const qId of chosenQuestions) {
        const acertou = Math.random() < 0.65;
        await client.query(
          'INSERT INTO performance (id_student, id_question, correct_answer) VALUES ($1, $2, $3)',
          [sId, qId, acertou]
        );
      }
    }

    // 4. Injetar Insights sintéticos
    console.log('💡 Gerando insights sintéticos...');
    for (const sId of studentIds) {
      const fortes = [
        { titulo: 'Clínica Médica', descricao_curta: 'Bom índice de acertos.', modulo_referencia: 'Clínica Médica', severidade: null },
        { titulo: 'Constância', descricao_curta: 'Bom tempo médio de estudo.', modulo_referencia: 'Geral', severidade: null },
        { titulo: 'Cirurgia Básica', descricao_curta: 'Acertos acima da média.', modulo_referencia: 'Cirurgia', severidade: null }
      ];
      const atencao = [
        { titulo: 'Ginecologia e Obstetrícia', descricao_curta: 'Abaixo da média.', modulo_referencia: 'GO', severidade: 'alta' },
        { titulo: 'Pediatria Neonatal', descricao_curta: 'Confusão em marcos de desenvolvimento.', modulo_referencia: 'Pediatria', severidade: 'media' },
        { titulo: 'Ortopedia', descricao_curta: 'Pequena dificuldade com fraturas.', modulo_referencia: 'Ortopedia', severidade: 'baixa' }
      ];
      
      const dataPast = new Date();
      dataPast.setDate(dataPast.getDate() - 1);

      await client.query(
        'INSERT INTO performance_insights (id_student, pontos_fortes, pontos_atencao, gerado_em) VALUES ($1, $2, $3, $4)',
        [sId, JSON.stringify(fortes), JSON.stringify(atencao), dataPast]
      );
    }

    // 5. Injetar Planos de Estudos e Blocos
    console.log('📅 Gerando planos de estudo e blocos...');
    const fixedPlanId = 'b1925b44-9694-477c-a496-5e638e4a9e25';
    const fixedBlockId = 'c1925b44-9694-477c-a496-5e638e4a9e25';

    for (const sId of studentIds) {
      const isFixed = (sId === fixedStudentId);
      const pId = isFixed ? fixedPlanId : uuidv4();

      await client.query(
        `INSERT INTO study_plans (id, id_student, titulo, categoria, duracao, areas_foco, parametros, briefing_texto) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          pId,
          sId,
          'Plano de Estudos - Residência Médica',
          'geral',
          'mensal',
          JSON.stringify(['Cardiologia', 'Ginecologia']),
          JSON.stringify({ horas_por_dia: 4, dias_semana: ['Segunda', 'Terça'] }),
          'Estudando para prova de residência do ENARE.'
        ]
      );

      // Gerar 5 blocos por plano
      const hoje = new Date();
      for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const bId = (isFixed && dayOffset === 0) ? fixedBlockId : uuidv4();
        const dataBloco = new Date();
        dataBloco.setDate(hoje.getDate() + dayOffset);

        await client.query(
          `INSERT INTO study_plan_blocks (id, id_plan, data, hora_inicio, hora_fim, tipo, titulo, especialidade, descricao, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            bId,
            pId,
            dataBloco.toISOString().split('T')[0],
            '08:00:00',
            '10:00:00',
            'teoria',
            `Bloco de estudo ${dayOffset + 1}`,
            'Cardiologia',
            'Leitura de capítulos e resumo.',
            'pendente'
          ]
        );
      }
    }

    // 6. Injetar Casos Clínicos (Tasks 6 e 7)
    console.log('🏥 Criando casos clínicos mock...');
    const caseSeed = [
      {
        titulo: 'Dor torácica em paciente hipertenso',
        descricao: 'Paciente de 45 anos, hipertenso e diabético, com dor torácica em aperto há 2 horas irradiando para o braço esquerdo.',
        especialidade: 'Cardiologia',
        dificuldade: 'media',
        tempo_estimado_min: 20,
        payload_mock: {
          paciente: { nome: 'Carlos Mendes', idade: 45, sexo: 'M', antecedentes: ['HAS', 'DM tipo 2', 'Tabagismo'], medicamentos: ['Losartana 50mg', 'Metformina 850mg', 'AAS 100mg'], alergias: ['Dipirona'] },
          queixa_principal: 'Dor torácica em aperto há 2 horas irradiando para braço esquerdo',
          contexto_resumido: 'Homem de 45 anos, hipertenso e diabético, com dor torácica típica sugestiva de SCA.',
          recursos_habilitados: { suporte_cognitivo: true, chatbot_ia: true, dicas: true },
          checklist_osce: [
            { criterio: 'Anamnese', itens: [{ ref: 'historico_dor', descricao: 'Investigou características da dor (OPQRST)', pontos: 15 }, { ref: 'fatores_risco', descricao: 'Identificou fatores de risco cardiovascular', pontos: 10 }] },
            { criterio: 'Conduta', itens: [{ ref: 'ecg_10min', descricao: 'Solicitou ECG em < 10 minutos', pontos: 20 }, { ref: 'troponina', descricao: 'Solicitou troponina', pontos: 15 }] }
          ]
        }
      },
      {
        titulo: 'Crise asmática grave',
        descricao: 'Paciente de 22 anos com broncoespasmo grave, uso de musculatura acessória e SpO2 88%.',
        especialidade: 'Pneumologia',
        dificuldade: 'media',
        tempo_estimado_min: 15,
        payload_mock: {
          paciente: { nome: 'Ana Lima', idade: 22, sexo: 'F', antecedentes: ['Asma desde infância'], medicamentos: ['Salbutamol SOS'], alergias: [] },
          queixa_principal: 'Falta de ar intensa após contato com alérgenos',
          contexto_resumido: 'Jovem asmática em crise grave, saturando 88%, uso de musculatura acessória.',
          recursos_habilitados: { suporte_cognitivo: true, chatbot_ia: true, dicas: true },
          checklist_osce: [
            { criterio: 'Avaliação', itens: [{ ref: 'avaliacao_gravidade', descricao: 'Classificou gravidade da crise', pontos: 15 }, { ref: 'sat_o2', descricao: 'Verificou saturação de oxigênio', pontos: 10 }] },
            { criterio: 'Conduta', itens: [{ ref: 'broncodilatador', descricao: 'Administrou broncodilatador inalatório', pontos: 20 }, { ref: 'corticoide', descricao: 'Prescreveu corticoide sistêmico', pontos: 15 }] }
          ]
        }
      },
      {
        titulo: 'AVC isquêmico agudo',
        descricao: 'Paciente de 72 anos com hemiplegia súbita e afasia. Janela terapêutica para trombólise aberta.',
        especialidade: 'Neurologia',
        dificuldade: 'dificil',
        tempo_estimado_min: 25,
        payload_mock: {
          paciente: { nome: 'Roberto Nunes', idade: 72, sexo: 'M', antecedentes: ['Fibrilação atrial'], medicamentos: [], alergias: [] },
          queixa_principal: 'Fraqueza no lado direito e dificuldade para falar — início há 90 min',
          contexto_resumido: 'Idoso com FA, sem anticoagulação, AVC isquêmico agudo dentro da janela de trombólise.',
          recursos_habilitados: { suporte_cognitivo: true, chatbot_ia: true, dicas: false },
          checklist_osce: [
            { criterio: 'Avaliação', itens: [{ ref: 'escala_nihss', descricao: 'Aplicou escala NIHSS', pontos: 20 }, { ref: 'tempo_onset', descricao: 'Confirmou tempo de início dos sintomas', pontos: 15 }] },
            { criterio: 'Conduta', itens: [{ ref: 'tc_sem_contraste', descricao: 'Solicitou TC sem contraste urgente', pontos: 20 }, { ref: 'rtpa', descricao: 'Indicou trombólise com rt-PA', pontos: 25 }] }
          ]
        }
      },
      {
        titulo: 'Cetoacidose diabética',
        descricao: 'DM1 com glicemia 450 mg/dL, vômitos, dor abdominal e respiração de Kussmaul.',
        especialidade: 'Endocrinologia',
        dificuldade: 'dificil',
        tempo_estimado_min: 20,
        payload_mock: {
          paciente: { nome: 'Lucas Pereira', idade: 19, sexo: 'M', antecedentes: ['DM tipo 1 desde 12 anos'], medicamentos: ['Insulina NPH (uso irregular)'], alergias: [] },
          queixa_principal: 'Dor abdominal, vômitos e mal-estar há 12 horas',
          contexto_resumido: 'Jovem DM1 com uso irregular de insulina, quadro de CAD instalado.',
          recursos_habilitados: { suporte_cognitivo: true, chatbot_ia: true, dicas: true },
          checklist_osce: [
            { criterio: 'Diagnóstico', itens: [{ ref: 'gasometria', descricao: 'Solicitou gasometria arterial', pontos: 15 }, { ref: 'cetonas', descricao: 'Solicitou cetonas séricas/urinárias', pontos: 15 }] },
            { criterio: 'Tratamento', itens: [{ ref: 'hidratacao_sv', descricao: 'Iniciou hidratação com soro fisiológico', pontos: 20 }, { ref: 'insulina_iv', descricao: 'Prescreveu insulina IV em bomba', pontos: 20 }] }
          ]
        }
      },
      {
        titulo: 'Pneumonia adquirida na comunidade',
        descricao: 'Paciente com febre, tosse produtiva e dispneia. Radiografia com consolidação lobar.',
        especialidade: 'Pneumologia',
        dificuldade: 'facil',
        tempo_estimado_min: 15,
        payload_mock: {
          paciente: { nome: 'Pedro Costa', idade: 45, sexo: 'M', antecedentes: [], medicamentos: [], alergias: [] },
          queixa_principal: 'Febre e tosse produtiva há 5 dias com piora da dispneia',
          contexto_resumido: 'Adulto jovem sem comorbidades com síndrome pneumônica clássica e consolidação lobar.',
          recursos_habilitados: { suporte_cognitivo: true, chatbot_ia: true, dicas: true },
          checklist_osce: [
            { criterio: 'Diagnóstico', itens: [{ ref: 'rx_torax', descricao: 'Solicitou radiografia de tórax', pontos: 15 }, { ref: 'psa_curb65', descricao: 'Calculou escore CURB-65', pontos: 10 }] },
            { criterio: 'Tratamento', itens: [{ ref: 'antibiotico', descricao: 'Prescreveu antibiótico adequado', pontos: 20 }] }
          ]
        }
      }
    ];

    const caseIds = [];
    for (const c of caseSeed) {
      const cId = uuidv4();
      caseIds.push(cId);
      await client.query(
        `INSERT INTO cases (id, titulo, descricao, especialidade, dificuldade, tempo_estimado_min, payload_mock) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [cId, c.titulo, c.descricao, c.especialidade, c.dificuldade, c.tempo_estimado_min, JSON.stringify(c.payload_mock)]
      );
    }
    console.log(`✅ ${caseIds.length} casos clínicos criados.`);

    // 7. Injetar tentativas e eventos OSCE para popular métricas do dashboard
    console.log('📋 Gerando tentativas e eventos de casos...');
    const modos = ['hm', 'osce'];
    for (const sId of studentIds.slice(0, 5)) {
      const numAttempts = randomInt(2, 4);
      const chosenCases = randomSample(caseIds, numAttempts);
      for (const cId of chosenCases) {
        const aId = uuidv4();
        const modo = modos[randomInt(0, 1)];
        const acertos = randomInt(2, 6);
        const erros = randomInt(0, 3);
        const pontuacao = modo === 'osce' ? randomInt(40, 95) : 0;
        const tempo = randomInt(600, 1800);
        const iniciadoEm = new Date(Date.now() - randomInt(1, 30) * 24 * 3600 * 1000);
        const finalizadoEm = new Date(iniciadoEm.getTime() + tempo * 1000);
        await client.query(
          `INSERT INTO case_attempts (id, user_id, case_id, modo, pontuacao, acertos, erros, tempo_segundos, status, iniciado_em, finalizado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'finalizado',$9,$10)`,
          [aId, sId, cId, modo, pontuacao, acertos, erros, tempo, iniciadoEm, finalizadoEm]
        );
        if (modo === 'osce') {
            for (let k = 0; k < acertos; k++) {
            await client.query(
              `INSERT INTO case_attempt_events (attempt_id, tipo, ref, pontos) VALUES ($1,'procedimento_correto',$2,$3)`,
              [aId, `procedimento_${k + 1}`, randomInt(10, 20)]
            );
          }
          for (let k = 0; k < erros; k++) {
            await client.query(
              `INSERT INTO case_attempt_events (attempt_id, tipo, ref, pontos) VALUES ($1,'erro',$2,$3)`,
              [aId, `erro_${k + 1}`, -randomInt(5, 10)]
            );
          }
        }
      }
    }
    console.log('✅ Tentativas e eventos de casos gerados.');

    console.log('✅ Seed finalizado com sucesso absoluto! Banco de dados local 100% pronto para testes.');
  } catch (err) {
    console.error('❌ Erro crítico ao rodar o seed do banco:', err.message);
  } finally {
    client.release();
    await pool.end();
    console.log('🔒 Conexão com o PostgreSQL liberada.');
  }
}

runSeed();
