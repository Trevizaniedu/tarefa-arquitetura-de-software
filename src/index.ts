import express from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { correlationIdMiddleware } from './interfaces/middleware/correlation-id.middleware';
import { idempotencyMiddleware } from './interfaces/middleware/idempotency.middleware';
import { errorHandlerMiddleware } from './interfaces/middleware/error-handler.middleware';
import { AgendamentoController } from './interfaces/controllers/agendamento.controller';
import { CriarAgendamentoUseCase } from './application/use-cases/criar-agendamento.use-case';
import { ListarAgendamentosUseCase } from './application/use-cases/listar-agendamentos.use-case';
import { BuscarAgendamentoPorIdUseCase } from './application/use-cases/buscar-agendamento-por-id.use-case';
import { AtualizarStatusAgendamentoUseCase } from './application/use-cases/atualizar-status-agendamento.use-case';
import { AgendamentoRepository } from './infrastructure/agendamento.repository';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// --- Configuração do Contrato OpenAPI / Swagger ---
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Agendamento da Barbearia',
      version: '1.0.0',
      description:
        'Contrato oficial da API desenvolvida com Clean Architecture, Express, PostgreSQL e Redis (Idempotência, Correlation ID e RFC 7807).',
    },
    servers: [
      {
        url: '/',
        description: 'Servidor Atual (Local ou VPS)',
      },
    ],
    components: {
      schemas: {
        Agendamento: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'a3b8e912-74c1-482d-8910-1c3905e912ab' },
            clienteId: { type: 'string', example: 'cli-001' },
            barbeiroId: { type: 'string', example: 'barbeiro-999' },
            servicoId: { type: 'string', example: 'corte-cabelo' },
            dataHoraInicio: { type: 'string', format: 'date-time', example: '2026-10-20T14:00:00.000Z' },
            dataHoraFim: { type: 'string', format: 'date-time', example: '2026-10-20T14:30:00.000Z' },
            status: {
              type: 'string',
              enum: ['PENDENTE', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO'],
              example: 'PENDENTE',
            },
            correlationId: { type: 'string', example: 'req-uuid-123' },
          },
        },
        ProblemDetails: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'https://api.barbearia.com/erros/conflito-de-horario' },
            title: { type: 'string', example: 'Conflito de Agendamento' },
            status: { type: 'integer', example: 409 },
            detail: { type: 'string', example: 'O barbeiro selecionado já possui um agendamento neste horário.' },
            instance: { type: 'string', example: '/agendamentos' },
            correlationId: { type: 'string', example: '9fdea8ba-a2e5-4077-a389-acd7b3db301e' },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, 'index.{ts,js}'),
    path.join(__dirname, 'interfaces/controllers/*.{ts,js}'),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 1. Middlewares globais de resiliência e observabilidade
app.use(correlationIdMiddleware);

// 2. Injeção de dependências (repositório -> use cases -> controller)
const agendamentoRepository = new AgendamentoRepository();
const criarAgendamentoUseCase = new CriarAgendamentoUseCase(agendamentoRepository);
const listarAgendamentosUseCase = new ListarAgendamentosUseCase(agendamentoRepository);
const buscarAgendamentoPorIdUseCase = new BuscarAgendamentoPorIdUseCase(agendamentoRepository);
const atualizarStatusAgendamentoUseCase = new AtualizarStatusAgendamentoUseCase(agendamentoRepository);

const agendamentoController = new AgendamentoController(
  criarAgendamentoUseCase,
  listarAgendamentosUseCase,
  buscarAgendamentoPorIdUseCase,
  atualizarStatusAgendamentoUseCase
);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Verifica a saúde da API
 *     tags: [Infraestrutura]
 *     responses:
 *       200:
 *         description: API operacional.
 */
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * @openapi
 * /agendamentos:
 *   post:
 *     summary: Cria um novo agendamento de barbearia
 *     tags: [Agendamentos]
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
 *             required: [clienteId, barbeiroId, servicoId, dataHoraInicio, duracaoMinutos]
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
 *                 format: date-time
 *                 example: "2026-10-20T14:00:00.000Z"
 *               duracaoMinutos:
 *                 type: integer
 *                 example: 30
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agendamento'
 *       400:
 *         description: Dados inválidos (RFC 7807).
 *         content:
 *           application/problem+json:
 *             schema:
 *               $ref: '#/components/schemas/ProblemDetails'
 *       409:
 *         description: Conflito de horário para o barbeiro informado (RFC 7807).
 *         content:
 *           application/problem+json:
 *             schema:
 *               $ref: '#/components/schemas/ProblemDetails'
 */
app.post('/agendamentos', idempotencyMiddleware, async (req, res, next) => {
  await agendamentoController.criar(req, res, next);
});

/**
 * @openapi
 * /agendamentos:
 *   get:
 *     summary: Lista todos os agendamentos (com filtros opcionais)
 *     tags: [Agendamentos]
 *     parameters:
 *       - in: query
 *         name: barbeiroId
 *         schema:
 *           type: string
 *         description: Filtrar por ID do barbeiro
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: string
 *         description: Filtrar por ID do cliente
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDENTE, CONFIRMADO, CONCLUIDO, CANCELADO]
 *         description: Filtrar por status do agendamento
 *     responses:
 *       200:
 *         description: Lista de agendamentos retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Agendamento'
 */
app.get('/agendamentos', async (req, res, next) => {
  await agendamentoController.listar(req, res, next);
});

/**
 * @openapi
 * /agendamentos/{id}:
 *   get:
 *     summary: Busca um agendamento pelo ID
 *     tags: [Agendamentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID do agendamento
 *     responses:
 *       200:
 *         description: Agendamento encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agendamento'
 *       404:
 *         description: Agendamento não encontrado (RFC 7807).
 *         content:
 *           application/problem+json:
 *             schema:
 *               $ref: '#/components/schemas/ProblemDetails'
 */
app.get('/agendamentos/:id', async (req, res, next) => {
  await agendamentoController.buscarPorId(req, res, next);
});

/**
 * @openapi
 * /agendamentos/{id}/status:
 *   patch:
 *     summary: Atualiza o status de um agendamento
 *     tags: [Agendamentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDENTE, CONFIRMADO, CONCLUIDO, CANCELADO]
 *                 example: "CONFIRMADO"
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agendamento'
 *       404:
 *         description: Agendamento não encontrado (RFC 7807).
 *       409:
 *         description: Transição de status inválida (RFC 7807).
 */
app.patch('/agendamentos/:id/status', async (req, res, next) => {
  await agendamentoController.atualizarStatus(req, res, next);
});

/**
 * @openapi
 * /agendamentos/{id}:
 *   delete:
 *     summary: Cancela um agendamento (Soft Delete / status CANCELADO)
 *     tags: [Agendamentos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Agendamento cancelado com sucesso (libera o horário para novos agendamentos).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Agendamento'
 *       404:
 *         description: Agendamento não encontrado (RFC 7807).
 */
app.delete('/agendamentos/:id', async (req, res, next) => {
  await agendamentoController.cancelar(req, res, next);
});

// 5. Middleware global de tratamento de erros (RFC 7807), sempre por último
app.use(errorHandlerMiddleware);

app.listen(port, () => {
  console.log(`🚀 API da Barbearia rodando na porta ${port}`);
  console.log(`📑 Swagger UI disponível em http://localhost:${port}/api-docs`);
});