import { Request, Response, NextFunction } from 'express';
import { CriarAgendamentoUseCase } from '../../application/use-cases/criar-agendamento.use-case';

export class AgendamentoController {
  constructor(private criarAgendamentoUseCase: CriarAgendamentoUseCase) {}

  async criar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clienteId, barbeiroId, servicoId, dataHoraInicio, duracaoMinutos } = req.body;
      const correlationId = req.headers['x-correlation-id'] as string | undefined;

      // Validação da data
      const inicio = new Date(dataHoraInicio);
      if (Number.isNaN(inicio.getTime())) {
        const erro: any = new Error('O campo dataHoraInicio é obrigatório e deve ser uma data válida (ex: 2026-10-01T14:00:00Z).');
        erro.status = 400;
        erro.type = 'https://api.barbearia.com/erros/requisicao-invalida';
        erro.title = 'Requisição Inválida';
        throw erro;
      }

      const agendamento = await this.criarAgendamentoUseCase.execute({
        clienteId,
        barbeiroId,
        servicoId,
        dataHoraInicio: inicio,
        duracaoMinutos,
        correlationId,
      });

      res.status(201).json(agendamento);
    } catch (error) {
      next(error); // Encaminha o erro para o Middleware do RFC 7807
    }
  }
}