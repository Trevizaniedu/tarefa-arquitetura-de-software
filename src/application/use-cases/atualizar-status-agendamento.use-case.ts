import { IAgendamentoRepository } from '../ports/agendamento-repository.interface';
import { Agendamento, StatusAgendamento } from '../../domain/agendamento.entity';

const STATUS_VALIDOS: StatusAgendamento[] = [
  'PENDENTE',
  'CONFIRMADO',
  'CONCLUIDO',
  'CANCELADO',
];

export class AtualizarStatusAgendamentoUseCase {
  constructor(private agendamentoRepository: IAgendamentoRepository) {}

  async execute(id: string, novoStatus: StatusAgendamento): Promise<Agendamento> {
    if (!STATUS_VALIDOS.includes(novoStatus)) {
      const erro: any = new Error(
        `Status inválido. Valores permitidos: ${STATUS_VALIDOS.join(', ')}.`
      );
      erro.status = 400;
      erro.type = 'https://api.barbearia.com/erros/requisicao-invalida';
      erro.title = 'Status Inválido';
      throw erro;
    }

    const existente = await this.agendamentoRepository.buscarPorId(id);
    if (!existente) {
      const erro: any = new Error(`Agendamento com ID '${id}' não encontrado.`);
      erro.status = 404;
      erro.type = 'https://api.barbearia.com/erros/nao-encontrado';
      erro.title = 'Agendamento Não Encontrado';
      throw erro;
    }

    if (existente.status === 'CANCELADO' && novoStatus !== 'CANCELADO') {
      const erro: any = new Error(
        'Não é possível alterar o status de um agendamento já cancelado.'
      );
      erro.status = 409;
      erro.type = 'https://api.barbearia.com/erros/conflito-status';
      erro.title = 'Transição de Status Inválida';
      throw erro;
    }

    const atualizado = await this.agendamentoRepository.atualizarStatus(id, novoStatus);
    return atualizado!;
  }
}