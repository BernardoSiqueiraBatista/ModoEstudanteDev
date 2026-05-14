import request from 'supertest';
import { app } from '../../../app';
import { pool } from '../../../config/postgres_local';

// Mock do serviço de insights para não gastar token da OpenAI
jest.mock('../insights.service', () => {
  const originalModule = jest.requireActual('../insights.service');
  return {
    ...originalModule,
    InsightsService: jest.fn().mockImplementation(() => {
      return {
        getLastInsight: jest.fn().mockResolvedValue(null),
        generateInsight: jest.fn().mockResolvedValue({
          id: 'mocked-uuid',
          id_student: 'e1925b44-9694-477c-a496-5e638e4a9e25',
          gerado_em: new Date(),
          versao_prompt: 'v1',
          pontos_fortes: [
            { titulo: 'T1', descricao_curta: 'D1', modulo_referencia: 'M1', severidade: 'baixa' },
            { titulo: 'T2', descricao_curta: 'D2', modulo_referencia: 'M2', severidade: 'baixa' },
            { titulo: 'T3', descricao_curta: 'D3', modulo_referencia: 'M3', severidade: 'baixa' }
          ],
          pontos_atencao: [
            { titulo: 'T1', descricao_curta: 'D1', modulo_referencia: 'M1', severidade: 'alta' },
            { titulo: 'T2', descricao_curta: 'D2', modulo_referencia: 'M2', severidade: 'alta' },
            { titulo: 'T3', descricao_curta: 'D3', modulo_referencia: 'M3', severidade: 'alta' }
          ],
        }),
      };
    }),
  };
});

describe('Insights API', () => {
  const testStudentId = 'e1925b44-9694-477c-a496-5e638e4a9e25';

  beforeAll(async () => {
    // Garante que a tabela existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance_insights (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        id_student    UUID        NOT NULL REFERENCES student(id) ON DELETE CASCADE,
        gerado_em     TIMESTAMP   NOT NULL DEFAULT NOW(),
        versao_prompt VARCHAR(64) NOT NULL DEFAULT 'v1',
        pontos_fortes  JSONB      NOT NULL DEFAULT '[]',
        pontos_atencao JSONB      NOT NULL DEFAULT '[]'
      );
    `);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('GET /student/:id/insights deve retornar o último insight ou null', async () => {
    const response = await request(app).get(`/student/${testStudentId}/insights`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
  });

  it('POST /student/:id/insights/regenerate deve gerar novo insight mockado', async () => {
    const response = await request(app)
      .post(`/student/${testStudentId}/insights/regenerate`)
      .send();

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.pontos_fortes).toHaveLength(3);
  });
});
