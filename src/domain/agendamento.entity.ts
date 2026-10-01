export type StatusAgendamento = 'PENDENTE' | 'CONFIRMADO' | 'CONCLUIDO' | 'CANCELADO';

export interface AgendamentoProps {
  id: string;
  clienteId: string;
  barbeiroId: string;
  servicoId: string;
  dataHoraInicio: Date;
  dataHoraFim: Date;
  status: StatusAgendamento;
  correlationId?: string;
}

export class Agendamento {
  public id: string;
  public clienteId: string;
  public barbeiroId: string;
  public servicoId: string;
  public dataHoraInicio: Date;
  public dataHoraFim: Date;
  public status: StatusAgendamento;
  public correlationId?: string;

  constructor(props: AgendamentoProps) {
    this.id = props.id;
    this.clienteId = props.clienteId;
    this.barbeiroId = props.barbeiroId;
    this.servicoId = props.servicoId;
    this.dataHoraInicio = props.dataHoraInicio;
    this.dataHoraFim = props.dataHoraFim;
    this.status = props.status;
    this.correlationId = props.correlationId;
  }
}