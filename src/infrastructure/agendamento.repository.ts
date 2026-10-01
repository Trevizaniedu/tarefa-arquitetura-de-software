import { Pool } from 'pg';
import { IAgendamentoRepository } from '../application/ports/agendamento-repository.interface';
import { Agendamento } from '../domain/agendamento.entity';

// Pool de conexão com o PostgreSQL
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgrespassword@localhost:5432/barber_db',
});

export class AgendamentoRepository implements IAgendamentoRepository {
  /**
   * Consulta SQL para verificar sobreposição de intervalos de tempo:
   * (InicioA < FimB) AND (FimA > InicioB)
   */
  async existeConflitoDeHorario(
    barbeiroId: string,
    inicio: Date,
    fim: Date
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(1) AS count
      FROM agendamentos
      WHERE barbeiro_id = $1
        AND status != 'CANCELADO'
        AND data_hora_inicio < $3
        AND data_hora_fim > $2;
    `;

    const result = await pool.query(query, [barbeiroId, inicio, fim]);
    const count = parseInt(result.rows[0]?.count ?? '0', 10);

    return count > 0;
  }

  async criar(agendamento: Agendamento): Promise<Agendamento> {
    const query = `
      INSERT INTO agendamentos (id, cliente_id, barbeiro_id, servico_id, data_hora_inicio, data_hora_fim, status, correlation_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      agendamento.id,
      agendamento.clienteId,
      agendamento.barbeiroId,
      agendamento.servicoId,
      agendamento.dataHoraInicio,
      agendamento.dataHoraFim,
      agendamento.status,
      agendamento.correlationId ?? null,
    ];

    await pool.query(query, values);

    return agendamento;
  }
}