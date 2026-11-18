import { IAgendamentoRepository } from '../ports/agendamento-repository.interface';
import { Agendamento } from '../../domain/agendamento.entity';

export class BuscarAgendamentoPorIdUseCase {
  constructor(private agendamentoRepository: IAgendamentoRepository) {}

  async execute(id: string): Promise<Agendamento> {
    const agendamento = await this.agendamentoRepository.buscarPorId(id);

    if (!agendamento) {
      const erro: any = new Error(`Agendamento com ID '${id}' não encontrado.`);
      erro.status = 404;
      erro.type = 'https://api.barbearia.com/erros/nao-encontrado';
      erro.title = 'Agendamento Não Encontrado';
      throw erro;
    }

    return agendamento;
  }
}