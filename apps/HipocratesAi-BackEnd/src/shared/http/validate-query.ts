import type { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        message: 'Query inválida.',
        errors: result.error.flatten(),
      });
    }
    (req as Request & { validatedQuery: T }).validatedQuery = result.data;
    next();
  };
}
