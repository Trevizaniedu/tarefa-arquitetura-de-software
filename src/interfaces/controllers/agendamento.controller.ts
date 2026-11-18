import { Request, Response, NextFunction } from 'express';
import { CriarAgendamentoUseCase } from '../../application/use-cases/criar-agendamento.use-case';
import { ListarAgendamentosUseCase } from '../../application/use-cases/listar-agendamentos.use-case';
import { BuscarAgendamentoPorIdUseCase } from '../../application/use-cases/buscar-agendamento-por-id.use-case';
import { AtualizarStatusAgendamentoUseCase } from '../../application/use-cases/atualizar-status-agendamento.use-case';
import { StatusAgendamento } from '../../domain/agendamento.entity';

export class AgendamentoController {
  constructor(
    private criarAgendamentoUseCase: CriarAgendamentoUseCase,
    private listarAgendamentosUseCase: ListarAgendamentosUseCase,
    private buscarAgendamentoPorIdUseCase: BuscarAgendamentoPorIdUseCase,
    private atualizarStatusAgendamentoUseCase: AtualizarStatusAgendamentoUseCase
  ) {}

  async criar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { clienteId, barbeiroId, servicoId, dataHoraInicio, duracaoMinutos } = req.body;
      const correlationId = req.headers['x-correlation-id'] as string | undefined;

      const inicio = new Date(dataHoraInicio);
      if (Number.isNaN(inicio.getTime())) {
        const erro: any = new Error(
          'O campo dataHoraInicio é obrigatório e deve ser uma data válida (ex: 2026-10-01T14:00:00Z).'
        );
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
      next(error);
    }
  }

  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { barbeiroId, clienteId, status } = req.query;

      const agendamentos = await this.listarAgendamentosUseCase.execute({
        barbeiroId: barbeiroId as string | undefined,
        clienteId: clienteId as string | undefined,
        status: status as StatusAgendamento | undefined,
      });

      res.status(200).json(agendamentos);
    } catch (error) {
      next(error);
    }
  }

  async buscarPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const agendamento = await this.buscarAgendamentoPorIdUseCase.execute(id);

      res.status(200).json(agendamento);
    } catch (error) {
      next(error);
    }
  }

  async atualizarStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      const agendamento = await this.atualizarStatusAgendamentoUseCase.execute(id, status);

      res.status(200).json(agendamento);
    } catch (error) {
      next(error);
    }
  }

  async cancelar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const agendamento = await this.atualizarStatusAgendamentoUseCase.execute(
        id,
        'CANCELADO'
      );

      res.status(200).json(agendamento);
    } catch (error) {
      next(error);
    }
  }
}