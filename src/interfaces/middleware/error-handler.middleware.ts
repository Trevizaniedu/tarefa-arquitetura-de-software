import { Request, Response, NextFunction } from 'express';

export function errorHandlerMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  const correlationId = (req.headers['x-correlation-id'] as string) || 'N/A';
  const status = err.status || 500;

  // Log estruturado em JSON para observabilidade
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      correlationId,
      level: 'ERROR',
      message: err.message || 'Erro interno no servidor',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    })
  );

  // Resposta padronizada conforme a especificação RFC 7807 (Problem Details)
  return res.status(status).json({
    type: err.type || 'https://api.barbearia.com/erros/erro-interno',
    title: err.title || 'Erro Interno do Servidor',
    status,
    detail: err.message || 'Ocorreu um erro inesperado no processamento da requisição.',
    instance: req.originalUrl,
    correlationId,
  });
}