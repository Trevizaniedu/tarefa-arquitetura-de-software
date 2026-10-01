import express from 'express';
import { correlationIdMiddleware } from './interfaces/middleware/correlation-id.middleware';
import { idempotencyMiddleware } from './interfaces/middleware/idempotency.middleware';
import { errorHandlerMiddleware } from './interfaces/middleware/error-handler.middleware';
import { AgendamentoController } from './interfaces/controllers/agendamento.controller';
import { CriarAgendamentoUseCase } from './application/use-cases/criar-agendamento.use-case';
import { AgendamentoRepository } from './infrastructure/agendamento.repository';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

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
});