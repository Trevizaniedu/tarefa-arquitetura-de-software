# 💈 API de Agendamento de Barbearia — Arquitetura de Software e Computação em Nuvem

API RESTful escalável para gestão de agendamentos de barbearia, desenvolvida em **Node.js**, **TypeScript** e **Express**, aplicando **Clean Architecture**, persistência relacional com **PostgreSQL**, cache/resiliência com **Redis** e deploy conteinerizado com **Docker** em **VPS (AWS EC2)**.

---

## 🌐 Ambiente em Produção (VPS AWS EC2)

* **Swagger UI (Contrato Interativo):** http://18.225.167.127:3000/api-docs
* **Contrato OpenAPI (JSON):** http://18.225.167.127:3000/api-docs.json
* **Health Check:** http://18.225.167.127:3000/health

---

## 🏗️ Arquitetura do Sistema (Clean Architecture & Modelo C4)

O projeto segue os princípios da **Clean Architecture**, garantindo baixo acoplamento e independência entre regras de negócio, frameworks web e bancos de dados:

```text
src/
├── domain/          # Entidades de negócio, regras de domínio e interfaces de repositório
├── application/     # Casos de uso (Criar, Listar, Buscar por ID, Atualizar Status, Cancelar)
├── infrastructure/  # Implementações de persistência (PostgreSQL) e integrações externas
├── interfaces/      # Controllers HTTP, middlewares (JWT/RBAC, Idempotência, Correlation-ID, RFC 7807)
└── index.ts         # Ponto de entrada, injeção de dependências e configuração OpenAPI/Swagger
