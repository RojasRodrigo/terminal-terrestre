import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code ?? 'APP_ERROR',
    });
    return;
  }

  // Error de constraint de PostgreSQL
  if ((err as any).code === '23505') {
    res.status(409).json({ error: 'Registro duplicado', code: 'DUPLICATE' });
    return;
  }
  if ((err as any).code === '23503') {
    res.status(400).json({ error: 'Referencia inválida', code: 'FK_VIOLATION' });
    return;
  }

  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Error interno del servidor', code: 'INTERNAL' });
}

// Wrapper para controladores async — evita try/catch repetitivo
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
