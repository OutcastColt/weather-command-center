import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err.stack);
  const message = process.env.NODE_ENV !== 'production' ? err.message : undefined;
  res.status(500).json({ error: 'Internal server error', ...(message !== undefined && { message }) });
}
