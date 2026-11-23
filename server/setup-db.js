// Cria as tabelas e carrega os dados de teste no banco indicado em DATABASE_URL.
//   npm run db:setup   -> executa criacaoTabelas.sql e insercaoDados.sql
//   npm run db:reset   -> apaga as tabelas antes (cuidado: perde os dados)
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'database');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  if (process.argv.includes('--reset')) {
    await client.query('DROP TABLE IF EXISTS indisponibilidade, designacao, data_escala, participante, topico, escala, usuario CASCADE');
    console.log('Tabelas antigas apagadas.');
  }
  await client.query(fs.readFileSync(path.join(dir, 'criacaoTabelas.sql'), 'utf8'));
  console.log('Tabelas criadas.');
  await client.query(fs.readFileSync(path.join(dir, 'insercaoDados.sql'), 'utf8'));
  // Os usuarios de teste usam hash ficticio; aqui a senha deles vira 123456 para voce poder entrar.
  await client.query('UPDATE usuario SET senha_hash = $1', [await bcrypt.hash('123456', 10)]);
  console.log('Dados de teste carregados. Login de teste: maysa.souza@email.com / 123456');
} catch (e) {
  console.error('Erro:', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
