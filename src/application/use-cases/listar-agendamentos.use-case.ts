import {
  FiltroAgendamentos,
  IAgendamentoRepository,
} from '../ports/agendamento-repository.interface';
import { Agendamento } from '../../domain/agendamento.entity';

export class ListarAgendamentosUseCase {
  constructor(private agendamentoRepository: IAgendamentoRepository) {}

  async execute(filtros?: FiltroAgendamentos): Promise<Agendamento[]> {
    return this.agendamentoRepository.listar(filtros);
  }
}