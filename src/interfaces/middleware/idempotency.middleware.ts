import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Executa apenas em métodos de modificação (POST, PUT, DELETE)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] as string;

  // 2. Bloqueia se a chave de idempotência não for enviada
  if (!idempotencyKey) {
    return res.status(400).json({
      type: 'https://api.barbearia.com/erros/idempotency-key-missing',
      title: 'Cabeçalho Idempotency-Key Ausente',
      status: 400,
      detail: 'As requisições de agendamento exigem o cabeçalho Idempotency-Key para evitar duplicidade.',
      instance: req.originalUrl,
    });
  }

  try {
    // 3. Procura a chave no Redis
    const cachedResponse = await redis.get(`idempotency:${idempotencyKey}`);

    if (cachedResponse) {
      // Se já foi processada, retorna a resposta salva diretamente do cache
      const parsed = JSON.parse(cachedResponse);
      return res.status(parsed.status).json(parsed.body);
    }

    // 4. Intercepta a resposta da API para salvar no Redis antes de mandar pro cliente
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Salva por 24 horas (86400 segundos)
        redis.set(`idempotency:${idempotencyKey}`, JSON.stringify({ status: res.statusCode, body }), 'EX', 86400);
      }
      return originalJson(body);
    };

    next();
  } catch (error) {
    next(error);
  }
}