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
