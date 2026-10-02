import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { correlationIdMiddleware } from './interfaces/middleware/correlation-id.middleware';
import { idempotencyMiddleware } from './interfaces/middleware/idempotency.middleware';
import { errorHandlerMiddleware } from './interfaces/middleware/error-handler.middleware';
import { AgendamentoController } from './interfaces/controllers/agendamento.controller';
import { CriarAgendamentoUseCase } from './application/use-cases/criar-agendamento.use-case';
import { AgendamentoRepository } from './infrastructure/agendamento.repository';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// --- Configuração do Swagger / OpenAPI ---
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Agendamento da Barbearia',
      version: '1.0.0',
      description: 'Documentação interativa da API desenvolvida com Clean Architecture, Express, PostgreSQL e Redis.',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Servidor Local (Docker)',
      },
    ],
  },
  apis: ['./src/index.ts', './src/interfaces/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 1. Middlewares globais de resiliência e observabilidade
app.use(correlationIdMiddleware);

// 2. Injeção de dependências (repositório -> use case -> controller)
const agendamentoRepository = new AgendamentoRepository();
const criarAgendamentoUseCase = new CriarAgendamentoUseCase(agendamentoRepository);
const agendamentoController = new AgendamentoController(criarAgendamentoUseCase);

// 3. Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * @openapi
 * /agendamentos:
 *   post:
 *     summary: Cria um novo agendamento de barbearia
 *     description: Realiza a reserva de um serviço garantindo validação de conflito no PostgreSQL e cache de idempotência no Redis.
 *     parameters:
 *       - in: header
 *         name: idempotency-key
 *         required: false
 *         schema:
 *           type: string
 *         description: Chave única de idempotência para evitar agendamentos duplicados no Redis.
 *       - in: header
 *         name: x-correlation-id
 *         required: false
 *         schema:
 *           type: string
 *         description: Identificador de correlação para rastreabilidade nos logs.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clienteId
 *               - barbeiroId
 *               - servicoId
 *               - dataHoraInicio
 *               - duracaoMinutos
 *             properties:
 *               clienteId:
 *                 type: string
 *                 example: "cli-001"
 *               barbeiroId:
 *                 type: string
 *                 example: "barbeiro-999"
 *               servicoId:
 *                 type: string
 *                 example: "corte-cabelo"
 *               dataHoraInicio:
 *                 type: string
 *                 example: "2026-10-20T14:00:00.000Z"
 *               duracaoMinutos:
 *                 type: integer
 *                 example: 30
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso.
 *       409:
 *         description: Conflito de horário para o barbeiro informado (RFC 7807).
 */
// 4. Rota de agendamento com proteção de idempotência
app.post('/agendamentos', idempotencyMiddleware, async (req, res, next) => {
  try {
    await agendamentoController.criar(req, res, next);
  } catch (erro) {
    next(erro);
  }
});

// 5. Middleware global de tratamento de erros (RFC 7807), sempre por último
app.use(errorHandlerMiddleware);

app.listen(port, () => {
  console.log(`🚀 API da Barbearia rodando na porta ${port}`);
  console.log(`📑 Swagger UI disponível em http://localhost:${port}/api-docs`);
});