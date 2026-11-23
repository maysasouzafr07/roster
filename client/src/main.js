import React,{useState,useRef,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import htm from 'htm';
import './styles.css';
const html=htm.bind(React.createElement);

/* ---------- Comunicacao com a API (server/index.js) ---------- */
let token='';
async function api(caminho,{method='GET',body}={}){
  const r=await fetch('/api'+caminho,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined}).catch(()=>{throw new Error('Nao foi possivel falar com o servidor. Ele esta rodando?')});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.erro||'Erro no servidor.');
  return j;
}
const fmt=d=>d?d.slice(8)+'/'+d.slice(5,7):'';

/* ---------- Geração da escala: sorteio em rodízio, sem repetir nome na mesma data ---------- */
/* Rodadas: uma pessoa só volta a ser sorteada depois que todas as outras já foram usadas.
   Quem esteve na data anterior só é repetido em seguida se não houver mais ninguém disponível.
   Tópicos marcados como "Todos" mostram apenas "Todos" e não entram no sorteio.
   Indisponíveis ficam no sorteio para uma data em que possam. Vaga sem ninguém livre fica como "—". */
function gerar(d){
  const g={};let pool=[...d.nomes],falhas=0,prev=[];
  const livre=(n,dt)=>!((d.indisp||{})[n]||[]).includes(dt);
  d.datas.forEach((dt,di)=>{const dia=[];
    d.topicos.forEach((t,ti)=>{
      if((d.todos||{})[t]){g[ti+'_'+di]=['Todos'];return}
      const u=[],k=Math.min(d.qtd[t]||1,d.nomes.length);
      while(u.length<k){
        const ok=n=>livre(n,dt)&&!dia.includes(n);
        const bom=n=>ok(n)&&!prev.includes(n);
        let c=pool.filter(bom);
        if(!c.length){pool=[...d.nomes];c=pool.filter(bom)}
        if(!c.length)c=d.nomes.filter(ok);
        if(!c.length){falhas++;u.push('—');continue}
        const n=c[Math.floor(Math.random()*c.length)];
        pool=pool.filter(x=>x!==n);dia.push(n);u.push(n);
      }
      g[ti+'_'+di]=u});
    prev=dia;
  });
  g.falhas=falhas;return g;
}
function desenhar(d,g){
  const cw=130,tw=150,lh=20,rh=Math.max(48,Math.max(1,...d.topicos.map(t=>d.qtd[t]||1))*lh+24),W=tw+cw*d.datas.length,H=90+rh*d.topicos.length;
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,W,H);x.fillStyle='#14213d';x.fillRect(0,0,W,54);
  x.font='700 20px sans-serif';x.fillStyle='#fff';x.fillText(d.titulo||'Escala',14,34);
  x.fillStyle='#f5a524';x.fillRect(0,54,W,36);x.fillStyle='#14213d';x.font='700 15px sans-serif';
  d.datas.forEach((dt,i)=>x.fillText(fmt(dt),tw+i*cw+10,78));
  d.topicos.forEach((t,ti)=>{const y=90+ti*rh;x.strokeStyle='#cfd7e6';x.strokeRect(0,y,W,rh);
    x.fillStyle='#14213d';x.font='700 14px sans-serif';x.fillText(t.slice(0,20),10,y+28);
    x.font='14px sans-serif';d.datas.forEach((_,di)=>g[ti+'_'+di].forEach((n,j)=>x.fillText(n.slice(0,16),tw+di*cw+10,y+26+j*lh)))});
  return c.toDataURL('image/png');
}

/* ---------- Componentes ---------- */
const Tela=({children})=>html`<main class="app"><div class="brand"><i><b/><b/><b/><b/><b/><b/></i>Roster</div>${children}</main>`;

function Login({go}){return html`<${Tela}>
  <h2>Monte escalas em minutos</h2><p class="sub">Informe tópicos, nomes e datas. O Roster sorteia e organiza a grade.</p>
  <button class="btn ac" onClick=${()=>go('cadastro')}>Criar conta</button>
  <p class="ou">ou</p>
  <button class="btn ghost" onClick=${()=>go('entrar')}>Já tenho minha conta</button>
  <p class="foot">Programado por: Maysa Souza</p><//>`}

function Cadastro({go,onOk}){
  const [f,setF]=useState({nome:'',email:'',senha:''});const set=k=>e=>setF({...f,[k]:e.target.value});
  async function enviar(e){e.preventDefault();
    const email=f.email.trim().toLowerCase();
    if(!f.nome.trim()||!/^\S+@\S+\.\S+$/.test(email)||f.senha.length<6)return go('erroCadastro','Preencha nome, um e-mail válido e uma senha de pelo menos 6 caracteres.');
    try{onOk(await api('/cadastro',{method:'POST',body:{nome:f.nome.trim(),email,senha:f.senha}}))}
    catch(err){go('erroCadastro',err.message)}}
  return html`<${Tela}><h2>Criar conta</h2><p class="sub">Leva menos de um minuto.</p>
  <form onSubmit=${enviar}>
    <label>Nome</label><input value=${f.nome} onInput=${set('nome')} autocomplete="name"/>
    <label>Email</label><input type="email" value=${f.email} onInput=${set('email')} autocomplete="email"/>
    <label>Password</label><input type="password" value=${f.senha} onInput=${set('senha')} autocomplete="new-password"/>
    <button class="btn ac">Entrar</button></form>
  <button class="btn ghost" onClick=${()=>go('login')}>Voltar</button><//>`}

function Entrar({go,onOk}){
  const [f,setF]=useState({email:'',senha:''});const set=k=>e=>setF({...f,[k]:e.target.value});
  async function enviar(e){e.preventDefault();
    try{onOk(await api('/login',{method:'POST',body:{email:f.email.trim().toLowerCase(),senha:f.senha}}))}
    catch(err){go('erroEntrar')}}
  return html`<${Tela}><h2>Entrar</h2><p class="sub">Use o e-mail e a senha do cadastro.</p>
  <form onSubmit=${enviar}>
    <label>Email</label><input type="email" value=${f.email} onInput=${set('email')} autocomplete="email"/>
    <label>Password</label><input type="password" value=${f.senha} onInput=${set('senha')} autocomplete="current-password"/>
    <button class="btn ac">Entrar</button></form>
  <button class="btn ghost" onClick=${()=>go('login')}>Voltar</button><//>`}

const Erro=({titulo,msg,voltar,go})=>html`<${Tela}><div class="err" role="alert"><h2>${titulo}</h2><p>${msg}</p></div>
  <button class="btn" onClick=${()=>go(voltar)}>Tentar novamente</button><//>`;

function Home({user,go,abrir,sair}){
  const [minhas,setMinhas]=useState([]);
  useEffect(()=>{api('/escalas').then(setMinhas).catch(()=>setMinhas([]))},[]);
  return html`<${Tela}><h2>Olá, ${user.nome.split(' ')[0]}</h2><p class="sub">O que você vai organizar hoje?</p>
  <button class="btn ac" onClick=${()=>go('criar')}>Criar escala</button>
  <h2 style=${{marginTop:30,fontSize:18}}>Escalas salvas</h2>
  ${minhas.length===0?html`<p class="sub">Nenhuma escala salva ainda. Crie a primeira acima.</p>`:minhas.map(e=>html`
    <button key=${e.id_escala} class="card row" style=${{width:'100%',cursor:'pointer',color:'inherit',font:'inherit',textAlign:'left'}} onClick=${()=>abrir(e)}>
      <span><b>${e.titulo}</b><br/><span class="ok">${new Date(e.data_criacao).toLocaleDateString('pt-BR')}</span></span><span>Abrir</span></button>`)}
  <button class="btn ghost" style=${{marginTop:30}} onClick=${sair}>Sair da conta</button><//>`}

function Criar({d,setD,go}){
  const ok=d.topicos.length&&d.nomes.length&&d.datas.length;
  const L=(rot,n,tela)=>html`<div class="card row"><span><b>${rot}</b><br/><span class="ok">${n} adicionado${n===1?'':'s'}</span></span>
    <button class="btn ghost" style=${{width:'auto',margin:0}} onClick=${()=>go(tela)}>Editar</button></div>`;
  return html`<${Tela}><h2>Nova escala</h2><p class="sub">Preencha as três listas e gere a grade.</p>
  <label>Título da escala</label><input value=${d.titulo} onInput=${e=>setD({...d,titulo:e.target.value})} placeholder="Ex.: Limpeza da sala"/>
  ${L('Adicione os tópicos',d.topicos.length,'topicos')}${L('Adicione os nomes',d.nomes.length,'nomes')}${L('Adicione as datas',d.datas.length,'datas')}
  ${(()=>{const n=d.nomes.filter(x=>(d.indisp[x]||[]).some(dt=>d.datas.includes(dt))).length;const pode=d.nomes.length&&d.datas.length;return html`<div class="card row"><span><b>Quem não pode em alguma data</b><br/><span class="ok">${pode?n+' pessoa'+(n===1?'':'s')+' com datas bloqueadas':'Adicione nomes e datas primeiro'}</span></span><button class="btn ghost" disabled=${!pode} style=${{width:'auto',margin:0}} onClick=${()=>go('indisp')}>Editar</button></div>`})()}
  <button class="btn ac" disabled=${!ok||!d.titulo.trim()} onClick=${()=>go('grade',null,true)}>Gerar escala</button>
  <button class="btn ghost" onClick=${()=>go('home')}>Voltar ao Home</button><//>`}

function Lista({titulo,campo,d,setD,go,tipo,children}){
  const [v,setV]=useState('');const ref=useRef();
  const itens=d[campo];
  const setQ=(t,n)=>setD({...d,qtd:{...d.qtd,[t]:Math.min(10,Math.max(1,(d.qtd[t]||1)+n))}});
  function add(e){e.preventDefault();const x=v.trim();if(!x||itens.includes(x))return;setD({...d,[campo]:tipo==='date'?[...itens,x].sort():[...itens,x]});setV('');ref.current&&ref.current.focus()}
  const rot=x=>tipo==='date'?fmt(x)+'/'+x.slice(0,4):x;
  return html`<${Tela}><h2>${titulo}</h2>${children}
  <form class="add" style=${{marginTop:14}} onSubmit=${add}><input ref=${ref} type=${tipo||'text'} value=${v} onInput=${e=>setV(e.target.value)} placeholder=${tipo==='date'?'':titulo+' ...'}/><button class="btn ac">adicionar +</button></form>
  <div class="chips">${itens.map((x,i)=>html`<span class="chip" key=${x}>${rot(x)}<button aria-label="Remover ${rot(x)}" onClick=${()=>setD({...d,[campo]:itens.filter((_,j)=>j!==i)})}>×</button></span>`)}</div>
  ${campo==='topicos'&&itens.length?html`<h2 style=${{marginTop:24,fontSize:18}}>Pessoas por tópico</h2>${itens.map(t=>html`<div class="card" key=${t}><div class="row"><b>${t}</b><button class="tg sel" aria-pressed=${!!d.todos[t]} onClick=${()=>setD({...d,todos:{...d.todos,[t]:!d.todos[t]}})}>Todos</button></div>${d.todos[t]?html`<p class="ok" style=${{margin:'8px 0 0'}}>A escala vai mostrar apenas "Todos" neste tópico.</p>`:html`<div class="stepper" style=${{marginTop:10}}><button aria-label="Diminuir ${t}" onClick=${()=>setQ(t,-1)}>−</button><b>${d.qtd[t]||1}</b><button aria-label="Aumentar ${t}" onClick=${()=>setQ(t,1)}>+</button></div>`}</div>`)}`:null}
  <button class="btn" onClick=${()=>go('criar')}>Salvar e voltar</button><//>`}

function Indisp({d,setD,go}){
  const tog=(n,dt)=>{const cur=d.indisp[n]||[];setD({...d,indisp:{...d.indisp,[n]:cur.includes(dt)?cur.filter(x=>x!==dt):[...cur,dt]}})};
  return html`<${Tela}><h2>Quem não pode em qual data?</h2><p class="sub">Toque nas datas em que cada pessoa não está disponível. O sorteio vai pular essas datas.</p>
  ${d.nomes.map(n=>html`<div class="card" key=${n}><b>${n}</b><div class="chips">${d.datas.map(dt=>{const off=(d.indisp[n]||[]).includes(dt);return html`<button class="tg" key=${dt} aria-pressed=${off} onClick=${()=>tog(n,dt)}>${fmt(dt)}</button>`})}</div></div>`)}
  <button class="btn" onClick=${()=>go('criar')}>Salvar e voltar</button><//>`}

function Grade({d,grid,go,salvar,salva,resortear}){
  const [img,setImg]=useState(null);
  return html`<${Tela}><h2>${d.titulo}</h2><p class="sub">Escala gerada com a quantidade de pessoas definida em cada tópico.</p>
  <div class="scroll"><table><thead><tr><th>Tópico</th>${d.datas.map(x=>html`<th key=${x}>${fmt(x)}</th>`)}</tr></thead>
  <tbody>${d.topicos.map((t,ti)=>html`<tr key=${t}><td class="t">${t}</td>${d.datas.map((_,di)=>html`<td key=${di}>${grid[ti+'_'+di].map((n,i)=>html`<span key=${i}>${n}</span>`)}</td>`)}</tr>`)}</tbody></table></div>
  ${grid.falhas?html`<div class="err" role="alert"><p style=${{margin:0}}>${grid.falhas} vaga${grid.falhas>1?'s ficaram':' ficou'} sem ninguém disponível (marcada${grid.falhas>1?'s':''} com —). Revise as indisponibilidades ou adicione mais nomes.</p></div>`:null}
  ${salva?html`<p class="ok">Escala salva no banco.</p>`:null}
  <button class="btn ac" onClick=${async()=>{try{await salvar();setImg(desenhar(d,grid))}catch(e){alert(e.message)}}}>Salvar escala</button>
  <button class="btn ghost" onClick=${resortear}>Sortear de novo</button>
  <button class="btn ghost" onClick=${()=>go('criar')}>Editar escala</button>
  <button class="btn ghost" onClick=${()=>go('home')}>Voltar ao Home</button>
  ${img?html`<div class="modal" onClick=${()=>setImg(null)}><div onClick=${e=>e.stopPropagation()}>
    <h2>Escala salva</h2><p class="ok">Imagem da escala pronta. Clique com o botão direito (ou segure no celular) para baixar. O envio por e-mail precisa de um servidor e ainda não está ligado.</p>
    <img src=${img} alt="Imagem da escala"/><button class="btn" onClick=${()=>setImg(null)}>Fechar</button></div></div>`:null}<//>`}

function App(){
  const [v,setV]=useState('login');const [user,setUser]=useState(null);const [msg,setMsg]=useState('');
  const vazio={titulo:'',topicos:[],nomes:[],datas:[],qtd:{},todos:{},indisp:{},id:null};
  const [d,setD]=useState(vazio);const [grid,setGrid]=useState({});const [salvo,setSalvo]=useState(false);
  const go=(t,m,gera)=>{if(m)setMsg(m);if(t==='home')setD(vazio);if(gera){setGrid(gerar(d));setSalvo(false)}setV(t);window.scrollTo(0,0)};
  const entrou=r=>{token=r.token;setUser(r.usuario);setD(vazio);setV('home')};
  async function salvar(){
    const r=await api(d.id?'/escalas/'+d.id:'/escalas',{method:d.id?'PUT':'POST',body:{d,grid}});
    setD({...d,id:r.id_escala});setSalvo(true);
  }
  async function abrir(e){
    try{const r=await api('/escalas/'+e.id_escala);setD({...vazio,...r.d});setGrid(r.grid);setSalvo(true);setV('grade')}
    catch(err){alert(err.message)}
  }
  const P={d,setD,go};
  switch(v){
    case'cadastro':return html`<${Cadastro} go=${go} onOk=${entrou}/>`;
    case'erroCadastro':return html`<${Erro} titulo="Erro ao criar conta" msg=${msg} voltar="cadastro" go=${go}/>`;
    case'entrar':return html`<${Entrar} go=${go} onOk=${entrou}/>`;
    case'erroEntrar':return html`<${Erro} titulo="Erro ao entrar na conta" msg="E-mail ou senha incorretos. Confira os dados e tente de novo." voltar="entrar" go=${go}/>`;
    case'home':return html`<${Home} user=${user} go=${go} abrir=${abrir} sair=${()=>{token='';setUser(null);setV('login')}}/>`;
    case'criar':return html`<${Criar} ...${P}/>`;
    case'topicos':return html`<${Lista} ...${P} titulo="Adicione os tópicos" campo="topicos"/>`;
    case'nomes':return html`<${Lista} ...${P} titulo="Adicione os nomes" campo="nomes"/>`;
    case'datas':return html`<${Lista} ...${P} titulo="Adicione as datas" campo="datas" tipo="date"/>`;
    case'indisp':return html`<${Indisp} ...${P}/>`;
    case'grade':return html`<${Grade} d=${d} grid=${grid} go=${go} salvar=${salvar} salva=${salvo} resortear=${()=>{setGrid(gerar(d));setSalvo(false)}}/>`;
    default:return html`<${Login} go=${go}/>`;
  }
}
createRoot(document.getElementById('root')).render(html`<${App}/>`);
