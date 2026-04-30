import { AppError } from '../AppError';

describe('AppError', () => {
  it('creates with message and default 400 status', () => {
    const error = new AppError('Algo deu errado.');

    expect(error.message).toBe('Algo deu errado.');
    expect(error.statusCode).toBe(400);
    expect(error.details).toBeUndefined();
  });

  it('creates with custom status code', () => {
    const error = new AppError('Não encontrado.', 404);

    expect(error.message).toBe('Não encontrado.');
    expect(error.statusCode).toBe(404);
  });

  it('creates with details', () => {
    const details = { field: 'email' };
    const error = new AppError('Erro de validação.', 422, details);

    expect(error.details).toEqual({ field: 'email' });
  });

  it('is an instance of Error', () => {
    const error = new AppError('Teste');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('has name set to AppError', () => {
    const error = new AppError('Teste');

    expect(error.name).toBe('AppError');
  });
});
