# Roster – gerador de escalas

Front-end em React (Vite) + API em Node/Express + banco PostgreSQL.

```
roster/
├── database/   criacaoTabelas.sql, insercaoDados.sql, modeloER.mmd
├── server/     API (Express + pg) e script que cria o banco
└── client/     React (Vite)
```

## Como rodar

1. **Banco**: crie um banco vazio no PostgreSQL (ex.: `CREATE DATABASE roster;`).
2. **Configuração**: copie `.env.example` para `server/.env` e coloque seu usuário, senha e nome do banco em `DATABASE_URL`.
3. **API** (terminal 1):
   ```bash
   cd server
   npm install
   npm run db:setup     # cria as tabelas e carrega os dados de teste
   npm run dev          # API em http://localhost:3001
   ```
4. **Front** (terminal 2):
   ```bash
   cd client
   npm install
   npm run dev          # abra http://localhost:5173
   ```

Login de teste (criado pelo `db:setup`): `maysa.souza@email.com` / `123456`.
Para recriar tudo do zero: `npm run db:reset` (apaga as tabelas antes).

## Rotas da API

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/cadastro` | cria usuário (`usuario`) |
| POST | `/api/login` | entra e devolve o token |
| GET | `/api/escalas` | lista as escalas salvas do usuário |
| GET | `/api/escalas/:id` | devolve a escala e a grade |
| POST | `/api/escalas` | salva escala nova |
| PUT | `/api/escalas/:id` | substitui uma escala editada |

Tabelas: `usuario`, `escala`, `topico` (quantidade e para_todos), `participante`, `data_escala`, `designacao`, `indisponibilidade`.
