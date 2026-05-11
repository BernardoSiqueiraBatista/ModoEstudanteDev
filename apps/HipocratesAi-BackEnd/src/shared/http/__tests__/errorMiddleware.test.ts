import { z } from 'zod';
import { errorMiddleware } from '../errorMiddleware';
import { AppError } from '../../errors/AppError';

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorMiddleware', () => {
  it('handles AppError with correct statusCode and message', () => {
    const res = makeRes();
    const err = new AppError('Not found', 404, { foo: 'bar' });

    errorMiddleware(err, {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Not found',
      details: { foo: 'bar' },
    });
  });

  it('handles ZodError with 400 and flattened errors', () => {
    const res = makeRes();
    let zodErr: z.ZodError | undefined;
    try {
      z.object({ name: z.string() }).parse({ name: 123 });
    } catch (e) {
      zodErr = e as z.ZodError;
    }

    errorMiddleware(zodErr!, {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Validation error', errors: expect.any(Object) }),
    );
  });

  it('handles unknown errors with 500 and generic message', () => {
    const res = makeRes();

    errorMiddleware(new Error('boom'), {} as any, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
