import { Agendamento, StatusAgendamento } from '../../domain/agendamento.entity';

export interface FiltroAgendamentos {
  barbeiroId?: string;
  clienteId?: string;
  status?: StatusAgendamento;
}

export interface IAgendamentoRepository {
  existeConflitoDeHorario(barbeiroId: string, inicio: Date, fim: Date): Promise<boolean>;
  criar(agendamento: Agendamento): Promise<Agendamento>;
  listar(filtros?: FiltroAgendamentos): Promise<Agendamento[]>;
  buscarPorId(id: string): Promise<Agendamento | null>;
  atualizarStatus(id: string, status: StatusAgendamento): Promise<Agendamento | null>;
}