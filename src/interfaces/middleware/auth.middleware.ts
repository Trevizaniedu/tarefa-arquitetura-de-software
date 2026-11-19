import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface TokenPayload {
  sub: string;
  email: string;
  papel: 'ADMIN' | 'BARBEIRO' | 'CLIENTE';
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const JWT_SECRET = process.env.JWT_SECRET || 'barber-api-super-secret-jwt-2026';

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .contentType('application/problem+json')
      .json({
        type: 'https://api.barbearia.com/erros/nao-autenticado',
        title: 'Token de autenticação ausente ou inválido',
        status: 401,
        detail: 'Forneça um token JWT válido no cabeçalho Authorization: Bearer <token>.',
        instance: req.originalUrl,
        correlationId: req.headers['x-correlation-id'],
      });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    return next();
  } catch {
    return res
      .status(401)
      .contentType('application/problem+json')
      .json({
        type: 'https://api.barbearia.com/erros/token-invalido',
        title: 'Token JWT inválido ou expirado',
        status: 401,
        detail: 'O token informado não pôde ser verificado ou já expirou.',
        instance: req.originalUrl,
        correlationId: req.headers['x-correlation-id'],
      });
  }
}

export function requireRole(papeisPermitidos: Array<'ADMIN' | 'BARBEIRO' | 'CLIENTE'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !papeisPermitidos.includes(req.user.papel)) {
      return res
        .status(403)
        .contentType('application/problem+json')
        .json({
          type: 'https://api.barbearia.com/erros/acesso-negado',
          title: 'Acesso negado (RBAC)',
          status: 403,
          detail: `Esta operação exige um dos seguintes papéis: ${papeisPermitidos.join(', ')}.`,
          instance: req.originalUrl,
          correlationId: req.headers['x-correlation-id'],
        });
    }
    return next();
  };
}