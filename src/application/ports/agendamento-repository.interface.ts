import { Agendamento } from '../../domain/agendamento.entity';

export interface IAgendamentoRepository {
  /**
   * Verifica se existe algum agendamento ativo para o barbeiro no intervalo solicitado
   */
  existeConflitoDeHorario(barbeiroId: string, inicio: Date, fim: Date): Promise<boolean>;

  /**
   * Salva um novo agendamento no banco de dados
   */
  criar(agendamento: Agendamento): Promise<Agendamento>;
}