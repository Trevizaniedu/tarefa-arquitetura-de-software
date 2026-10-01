import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['x-correlation-id'];
  const correlationId = (Array.isArray(header) ? header[0] : header) || randomUUID();

  // Anexa o ID no objeto da requisição e no header de resposta
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  next();
}