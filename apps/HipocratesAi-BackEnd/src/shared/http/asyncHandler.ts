import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/**
 * Wrapper para handlers que usam AuthRequest (rotas autenticadas).
 * Evita a necessidade de `as any` nos arquivos de rota.
 */
type AsyncAuthHandler = (
  req: any,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export function asyncAuthHandler(handler: AsyncAuthHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}