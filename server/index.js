import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const SEGREDO = process.env.JWT_SECRET || 'troque-este-segredo';
const app = express();
app.use(cors());
app.use(express.json());

const gerarToken = (u) => jwt.sign({ uid: u.id_usuario }, SEGREDO, { expiresIn: '7d' });
const publico = (u) => ({ id_usuario: u.id_usuario, nome: u.nome, email: u.email });

function auth(req, res, next) {
  try {
    req.uid = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SEGREDO).uid;
    next();
  } catch {
    res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
  }
}

async function transacao(fn) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await fn(c);
    await c.query('COMMIT');
    return r;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}

/* ---------- Conta ---------- */
app.post('/api/cadastro', async (req, res, next) => {
  try {
    const { nome, email, senha } = req.body || {};
    if (!nome?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || (senha || '').length < 6)
      return res.status(400).json({ erro: 'Preencha nome, um e-mail válido e uma senha de pelo menos 6 caracteres.' });
    const { rows: [u] } = await pool.query(
      'INSERT INTO usuario (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING *',
      [nome.trim(), email.trim().toLowerCase(), await bcrypt.hash(senha, 10)]
    );
    res.status(201).json({ token: gerarToken(u), usuario: publico(u) });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ erro: 'Já existe uma conta com este e-mail. Use outro ou entre na conta.' });
    next(e);
  }
});

app.post('/api/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body || {};
    const { rows: [u] } = await pool.query('SELECT * FROM usuario WHERE email = $1', [(email || '').trim().toLowerCase()]);
    if (!u || !(await bcrypt.compare(senha || '', u.senha_hash)))
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    res.json({ token: gerarToken(u), usuario: publico(u) });
  } catch (e) { next(e); }
});

/* ---------- Escalas ---------- */
app.get('/api/escalas', auth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id_escala, titulo, data_criacao FROM escala WHERE id_usuario = $1 AND salva ORDER BY data_criacao DESC, id_escala DESC',
      [req.uid]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// Devolve a escala no mesmo formato que o front usa: { d: {...}, grid: {"topico_data": [nomes]} }
app.get('/api/escalas/:id', auth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rows: [e] } = await pool.query('SELECT * FROM escala WHERE id_escala = $1 AND id_usuario = $2', [id, req.uid]);
    if (!e) return res.status(404).json({ erro: 'Escala não encontrada.' });
    const q = (sql) => pool.query(sql, [id]).then((r) => r.rows);
    const [T, P, D, A, I] = await Promise.all([
      q('SELECT * FROM topico WHERE id_escala = $1 ORDER BY ordem'),
      q('SELECT * FROM participante WHERE id_escala = $1 ORDER BY id_participante'),
      q("SELECT id_data, to_char(data_evento, 'YYYY-MM-DD') AS data_evento FROM data_escala WHERE id_escala = $1 ORDER BY data_evento"),
      q('SELECT a.* FROM designacao a JOIN topico t USING (id_topico) WHERE t.id_escala = $1 ORDER BY a.id_designacao'),
      q('SELECT i.* FROM indisponibilidade i JOIN participante p USING (id_participante) WHERE p.id_escala = $1'),
    ]);
    const nome = Object.fromEntries(P.map((p) => [p.id_participante, p.nome]));
    const grid = {};
    T.forEach((t, ti) => D.forEach((dt, di) => {
      grid[`${ti}_${di}`] = t.para_todos
        ? ['Todos']
        : A.filter((a) => a.id_topico === t.id_topico && a.id_data === dt.id_data).map((a) => nome[a.id_participante]);
    }));
    const indisp = {};
    I.forEach((i) => {
      const dt = D.find((x) => x.id_data === i.id_data);
      (indisp[nome[i.id_participante]] ||= []).push(dt.data_evento);
    });
    res.json({
      d: {
        id, titulo: e.titulo,
        topicos: T.map((t) => t.descricao),
        nomes: P.map((p) => p.nome),
        datas: D.map((x) => x.data_evento),
        qtd: Object.fromEntries(T.map((t) => [t.descricao, t.quantidade])),
        todos: Object.fromEntries(T.map((t) => [t.descricao, t.para_todos])),
        indisp,
      },
      grid,
    });
  } catch (e) { next(e); }
});

// Grava a escala inteira (escala, topicos, participantes, datas, designacoes e indisponibilidades)
async function gravar(c, uid, { d, grid }, idAntigo) {
  if (idAntigo) {
    const { rowCount } = await c.query('SELECT 1 FROM escala WHERE id_escala = $1 AND id_usuario = $2', [idAntigo, uid]);
    if (!rowCount) { const err = new Error('Escala não encontrada.'); err.status = 404; throw err; }
    for (const sql of [
      'DELETE FROM indisponibilidade WHERE id_participante IN (SELECT id_participante FROM participante WHERE id_escala = $1)',
      'DELETE FROM designacao WHERE id_topico IN (SELECT id_topico FROM topico WHERE id_escala = $1)',
      'DELETE FROM topico WHERE id_escala = $1',
      'DELETE FROM participante WHERE id_escala = $1',
      'DELETE FROM data_escala WHERE id_escala = $1',
      'DELETE FROM escala WHERE id_escala = $1',
    ]) await c.query(sql, [idAntigo]);
  }
  const um = async (sql, p) => (await c.query(sql, p)).rows[0];
  const { id_escala } = await um('INSERT INTO escala (id_usuario, titulo, salva) VALUES ($1, $2, TRUE) RETURNING id_escala', [uid, d.titulo.trim()]);
  const T = [], P = [], D = [];
  for (const [i, t] of d.topicos.entries())
    T.push((await um('INSERT INTO topico (id_escala, descricao, quantidade, para_todos, ordem) VALUES ($1, $2, $3, $4, $5) RETURNING id_topico',
      [id_escala, t, d.qtd?.[t] || 1, !!d.todos?.[t], i + 1])).id_topico);
  for (const n of d.nomes)
    P.push((await um('INSERT INTO participante (id_escala, nome) VALUES ($1, $2) RETURNING id_participante', [id_escala, n])).id_participante);
  for (const dt of d.datas)
    D.push((await um('INSERT INTO data_escala (id_escala, data_evento) VALUES ($1, $2) RETURNING id_data', [id_escala, dt])).id_data);
  for (const [ti, t] of d.topicos.entries()) {
    if (d.todos?.[t]) continue; // "Todos" nao tem designacao individual
    for (const [di] of d.datas.entries())
      for (const n of grid[`${ti}_${di}`] || []) {
        if (n === '—') continue; // vaga sem ninguem disponivel
        await c.query('INSERT INTO designacao (id_topico, id_data, id_participante) VALUES ($1, $2, $3)', [T[ti], D[di], P[d.nomes.indexOf(n)]]);
      }
  }
  for (const [pi, n] of d.nomes.entries())
    for (const dt of d.indisp?.[n] || []) {
      const di = d.datas.indexOf(dt);
      if (di >= 0) await c.query('INSERT INTO indisponibilidade (id_participante, id_data) VALUES ($1, $2)', [P[pi], D[di]]);
    }
  return { id_escala };
}

const valido = (b) => b?.d?.titulo?.trim() && b.d.topicos?.length && b.d.nomes?.length && b.d.datas?.length && b.grid;

app.post('/api/escalas', auth, async (req, res, next) => {
  try {
    if (!valido(req.body)) return res.status(400).json({ erro: 'Dados da escala incompletos.' });
    res.status(201).json(await transacao((c) => gravar(c, req.uid, req.body, null)));
  } catch (e) { next(e); }
});

app.put('/api/escalas/:id', auth, async (req, res, next) => {
  try {
    if (!valido(req.body)) return res.status(400).json({ erro: 'Dados da escala incompletos.' });
    res.json(await transacao((c) => gravar(c, req.uid, req.body, Number(req.params.id))));
  } catch (e) { next(e); }
});

app.use((e, _req, res, _next) => {
  console.error(e);
  res.status(e.status || 500).json({ erro: e.status ? e.message : 'Erro no servidor. Veja o terminal.' });
});

app.listen(process.env.PORT || 3001, () => console.log('API Roster em http://localhost:' + (process.env.PORT || 3001)));
