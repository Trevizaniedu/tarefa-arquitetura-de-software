import { Pool } from 'pg';
import {
  FiltroAgendamentos,
  IAgendamentoRepository,
} from '../application/ports/agendamento-repository.interface';
import { Agendamento, StatusAgendamento } from '../domain/agendamento.entity';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgrespassword@localhost:5432/barber_db',
});

export class AgendamentoRepository implements IAgendamentoRepository {
  private mapRowToEntity(row: any): Agendamento {
    return new Agendamento({
      id: row.id,
      clienteId: row.cliente_id,
      barbeiroId: row.barbeiro_id,
      servicoId: row.servico_id,
      dataHoraInicio: new Date(row.data_hora_inicio),
      dataHoraFim: new Date(row.data_hora_fim),
      status: row.status as StatusAgendamento,
      correlationId: row.correlation_id ?? undefined,
    });
  }

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

  async listar(filtros?: FiltroAgendamentos): Promise<Agendamento[]> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filtros?.barbeiroId) {
      values.push(filtros.barbeiroId);
      conditions.push(`barbeiro_id = $${values.length}`);
    }

    if (filtros?.clienteId) {
      values.push(filtros.clienteId);
      conditions.push(`cliente_id = $${values.length}`);
    }

    if (filtros?.status) {
      values.push(filtros.status);
      conditions.push(`status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT *
      FROM agendamentos
      ${whereClause}
      ORDER BY data_hora_inicio ASC;
    `;

    const result = await pool.query(query, values);
    return result.rows.map((row) => this.mapRowToEntity(row));
  }

  async buscarPorId(id: string): Promise<Agendamento | null> {
    const query = `SELECT * FROM agendamentos WHERE id = $1 LIMIT 1;`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async atualizarStatus(
    id: string,
    status: StatusAgendamento
  ): Promise<Agendamento | null> {
    const query = `
      UPDATE agendamentos
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [status, id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }
}