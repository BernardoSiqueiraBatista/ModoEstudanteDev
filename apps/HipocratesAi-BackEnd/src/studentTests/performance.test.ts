import request from 'supertest';
import { app } from '../app.student'; 
import { Pool } from 'pg';

describe('Performance Feature - Student Mode', () => {
  
  const VALID_STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
  const INEXISTENT_STUDENT_ID = '00000000-0000-0000-0000-000000000000';
  const INVALID_FORMAT_ID = 'id-invalido-123';

  /**
   * TESTE 1: Sucesso (200)
   */
  it('Deve retornar 200 e os dados de performance para um aluno válido', async () => {
    const response = await request(app)
      .get(`/student/performance/${VALID_STUDENT_ID}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('taxaAcertos');
    expect(response.body.data).toHaveProperty('questoesResolvidas');
    expect(typeof response.body.data.taxaAcertos).toBe('number');
  });

  /**
   * TESTE 2: Aluno não encontrado (404)
   */
  it('Deve retornar 404 quando o UUID é válido mas o aluno não existe no banco', async () => {
    const response = await request(app)
      .get(`/student/performance/${INEXISTENT_STUDENT_ID}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Student not Found!');
  });

  /**
   * TESTE 3: Formato de ID inválido (400)
   */
  it('Deve retornar 400 quando o formato do ID não é um UUID', async () => {
    const response = await request(app)
      .get(`/student/performance/${INVALID_FORMAT_ID}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('formato inválido');
  });

  /**
   * TESTE 4: Rota inexistente (404 do Express)
   */
  it('Deve retornar 404 para uma rota que não existe no sistema', async () => {
    const response = await request(app)
      .get('/student/performance-errada/123');

    expect(response.status).toBe(404);
  });
});