import { randomUUID } from 'crypto';
import { Agendamento } from '../../domain/agendamento.entity';
import { IAgendamentoRepository } from '../ports/agendamento-repository.interface';

export interface CriarAgendamentoInput {
  clienteId: string;
  barbeiroId: string;
  servicoId: string;
  dataHoraInicio: Date;
  duracaoMinutos: number; // Ex: 30, 45 ou 60 minutos
  correlationId?: string;
}

export class CriarAgendamentoUseCase {
  constructor(private agendamentoRepository: IAgendamentoRepository) {}

 async execute(input: CriarAgendamentoInput): Promise<Agendamento> {
    const inicio = new Date(input.dataHoraInicio);
    
    // 1. Calcula o horário de término com base na duração do serviço
    const fim = new Date(inicio.getTime() + input.duracaoMinutos * 60000);

    // 2. Valida se o barbeiro já tem agendamento nesse intervalo
    const temConflito = await this.agendamentoRepository.existeConflitoDeHorario(
      input.barbeiroId,
      inicio,
      fim
    );

    if (temConflito) {
      const erro: any = new Error('O barbeiro selecionado já possui um agendamento neste horário.');
      erro.status = 409;
      erro.type = 'https://api.barbearia.com/erros/conflito-de-horario';
      erro.title = 'Conflito de Agendamento';
      throw erro;
    }

    // 3. Instancia a entidade de domínio
    const novoAgendamento = new Agendamento({
      id: randomUUID(),
      clienteId: input.clienteId,
      barbeiroId: input.barbeiroId,
      servicoId: input.servicoId,
      dataHoraInicio: inicio,
      dataHoraFim: fim,
      status: 'CONFIRMADO',
      correlationId: input.correlationId,
    });

    // 4. Salva no banco de dados
    return await this.agendamentoRepository.criar(novoAgendamento);
  }
}