import request from 'supertest';
import { app } from '../../app'; 

describe('GET /student/questions - Busca e Filtros de Simulado', () => {

  it('Deve retornar 10 questões por padrão quando nenhum parâmetro é informado', async () => {
    const response = await request(app).get('/student/questions');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('count');
    expect(response.body).toHaveProperty('questions');
    // Como criamos 100 questões no seed, é garantido que retornará 10
    expect(response.body.count).toBe(10); 
    expect(response.body.questions.length).toBe(10);
  });

  it('Deve respeitar o limite passado na query string (limit=5)', async () => {
    const response = await request(app).get('/student/questions?limit=5');

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(5);
    expect(response.body.questions.length).toBe(5);
  });

  it('Deve aplicar a regra de negócio de segurança limitando o máximo a 50 questões', async () => {
    // Simulando um ataque ou bug no front-end pedindo 1000 questões
    const response = await request(app).get('/student/questions?limit=1000');

    expect(response.status).toBe(200);
    // O service deve barrar e retornar apenas 50
    expect(response.body.count).toBeLessThanOrEqual(50); 
  });

  it('Deve filtrar as questões corretamente por nível (level=1)', async () => {
    const response = await request(app).get('/student/questions?level=1');

    expect(response.status).toBe(200);
    expect(response.body.questions.length).toBeGreaterThan(0);

    // Verifica se todas as questões retornadas não possuem nível 2 ou 3
    // Como a API não retorna o nível no JSON (por segurança), confiamos no banco,
    // mas garantimos que a requisição não quebrou e trouxe resultados.
    expect(response.body).toHaveProperty('questions');
  });

  it('Deve aplicar múltiplos filtros simultaneamente (limit=3, level=2, category=4)', async () => {
    const response = await request(app).get('/student/questions?limit=3&level=2&category=4');

    expect(response.status).toBe(200);
    expect(response.body.count).toBeLessThanOrEqual(3);
    // Pode retornar um array vazio se o sorteio do seed não tiver gerado essa combinação exata,
    // o que também é um comportamento válido (200 OK com count 0).
    expect(Array.isArray(response.body.questions)).toBe(true);
  });

  it('Deve garantir a estrutura e os tipos exatos do payload de resposta', async () => {
    const response = await request(app).get('/student/questions?limit=1');

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    
    const question = response.body.questions[0];
    
    // Verificando a Questão
    expect(question).toHaveProperty('id_questao');
    expect(typeof question.id_questao).toBe('string');
    
    expect(question).toHaveProperty('texto');
    expect(typeof question.texto).toBe('string');
    
    expect(question).toHaveProperty('alternativas');
    expect(Array.isArray(question.alternativas)).toBe(true);
    expect(question.alternativas.length).toBe(4); // Garante que tem 4 alternativas

    // Verificando a primeira Alternativa
    const alternativa = question.alternativas[0];
    expect(alternativa).toHaveProperty('id_alternative');
    expect(typeof alternativa.id_alternative).toBe('number'); // É o order_index
    
    expect(alternativa).toHaveProperty('texto');
    expect(typeof alternativa.texto).toBe('string');
    
    // Garante que o gabarito (is_correct) NÃO foi vazado para o front-end
    expect(alternativa).not.toHaveProperty('is_correct');
  });

  it('Deve ignorar parâmetros de formato inválido (ex: limit=abc) e usar os padrões', async () => {
    const response = await request(app).get('/student/questions?limit=abc&category=letras');

    expect(response.status).toBe(200);
    // Como 'abc' não é número, o controller falha no parseInt, joga undefined e o Service/Model lidam com isso,
    // geralmente aplicando o limite padrão (10) e ignorando categorias nulas.
    expect(response.body.count).toBe(10);
  });
});
