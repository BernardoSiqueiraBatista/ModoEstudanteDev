import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existing = req.headers['x-request-id'];
  const id = typeof existing === 'string' && existing ? existing : randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
