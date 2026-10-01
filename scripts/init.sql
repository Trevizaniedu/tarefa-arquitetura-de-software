CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  papel VARCHAR(20) NOT NULL CHECK (papel IN ('ADMIN', 'BARBEIRO', 'CLIENTE')),
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS servicos (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  duracao_minutos INT NOT NULL CHECK (duracao_minutos > 0),
  preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0)
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id VARCHAR(36) PRIMARY KEY,
  cliente_id VARCHAR(36) NOT NULL REFERENCES usuarios(id),
  barbeiro_id VARCHAR(36) NOT NULL REFERENCES usuarios(id),
  servico_id VARCHAR(36) NOT NULL REFERENCES servicos(id),
  data_hora_inicio TIMESTAMP NOT NULL,
  data_hora_fim TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL,
  correlation_id VARCHAR(36),
  CHECK (data_hora_fim > data_hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_barbeiro_horario
  ON agendamentos (barbeiro_id, data_hora_inicio, data_hora_fim);