const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
const db = new DatabaseSync(process.env.DB_PATH || path.join(__dirname, 'data/vetluna.sqlite'));
db.exec('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, salt TEXT, hash TEXT); CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY, section TEXT, payload TEXT);');
if (!db.prepare('SELECT username FROM users LIMIT 1').get()) {
  const salt = randomBytes(16).toString('hex');
  const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString('base64url');
  db.prepare('INSERT INTO users VALUES (?, ?, ?)').run('admin', salt, scryptSync(password, salt, 64).toString('hex'));
  console.log(`Primera cuenta: admin / ${password}\nGuarda esta contraseña; no volverá a mostrarse.`);
}
const sections = ['pacientes','citas','historial','inventario','facturacion'];
if (!db.prepare('SELECT id FROM records LIMIT 1').get()) {
  const today = new Date().toISOString().slice(0,10);
  const seed = {
    pacientes: [{nombre:'Luna', especie:'Canino', raza:'Golden retriever', tutor:'Valentina Torres', telefono:'987 654 321', edad:'3 años'}, {nombre:'Oliver', especie:'Felino', raza:'British shorthair', tutor:'Diego Mendoza', telefono:'912 345 678', edad:'2 años'}, {nombre:'Coco', especie:'Canino', raza:'Beagle', tutor:'Camila Rojas', telefono:'956 789 012', edad:'5 años'}],
    citas: [{paciente:'Luna', tutor:'Valentina Torres', fecha:today, hora:'09:30', motivo:'Control general', estado:'Confirmada'}, {paciente:'Oliver', tutor:'Diego Mendoza', fecha:today, hora:'11:00', motivo:'Vacunación', estado:'Pendiente'}, {paciente:'Coco', tutor:'Camila Rojas', fecha:today, hora:'15:30', motivo:'Control dental', estado:'Confirmada'}],
    historial: [{paciente:'Luna', fecha:today, veterinario:'Dra. Lucía Ramírez', diagnostico:'Paciente saludable', tratamiento:'Control preventivo en 6 meses'}],
    inventario: [{producto:'Vacuna antirrábica', categoria:'Vacunas', stock:'24', minimo:'10', precio:'65'}, {producto:'Antiparasitario oral', categoria:'Medicamentos', stock:'6', minimo:'10', precio:'35'}],
    facturacion: [{cliente:'Valentina Torres', concepto:'Consulta general · Luna', fecha:today, monto:'80', estado:'Pagada'}]
  };
  for (const [section, records] of Object.entries(seed)) for (const record of records) db.prepare('INSERT INTO records(section,payload) VALUES (?,?)').run(section, JSON.stringify(record));
}
const sessions = new Map();
const attempts = new Map();
function json(res, status, data) { res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); }
async function body(req) { let s=''; for await (const chunk of req) { s+=chunk; if(s.length>20000) throw Error('Solicitud demasiado grande'); } return JSON.parse(s || '{}'); }
const server = http.createServer(async (req,res) => {
  res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('X-Frame-Options','DENY');
  const url = new URL(req.url,'http://localhost');
  const token = (req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('vet_session='))?.slice(12);
  const session = sessions.get(token);
  const logged = session && session.expires > Date.now();
  try {
    if(req.method !== 'GET' && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return json(res,403,{error:'Origen no permitido'});
    if(url.pathname==='/api/login' && req.method==='POST') {
      const ip=req.socket.remoteAddress; const attempt=attempts.get(ip);
      if(attempt && attempt.count>=8 && attempt.until>Date.now()) return json(res,429,{error:'Demasiados intentos. Intenta en 15 minutos.'});
      const {username,password}=await body(req);
      const user=db.prepare('SELECT * FROM users WHERE username=?').get(String(username));
      if(!user || typeof password!=='string' || !timingSafeEqual(scryptSync(password,user.salt,64),Buffer.from(user.hash,'hex'))) {
        attempts.set(ip,{count:attempt && attempt.until>Date.now()?attempt.count+1:1,until:Date.now()+900000});
        return json(res,401,{error:'Usuario o contraseña incorrectos'});
      }
      attempts.delete(ip); const key=randomBytes(32).toString('hex'); sessions.set(key,{expires:Date.now()+28800000});
      res.setHeader('Set-Cookie',`vet_session=${key}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);
      return json(res,200,{username:'admin'});
    }
    if(url.pathname.startsWith('/api/')) {
      if(!logged) return json(res,401,{error:'Inicia sesión para continuar'});
      if(url.pathname==='/api/session') return json(res,200,{username:'admin'});
      if(url.pathname==='/api/logout' && req.method==='POST') { sessions.delete(token); res.setHeader('Set-Cookie','vet_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return json(res,200,{ok:true}); }
      const [, ,section,id]=url.pathname.split('/');
      if(!sections.includes(section)) return json(res,404,{error:'Sección no encontrada'});
      if(req.method==='GET') return json(res,200,db.prepare('SELECT * FROM records WHERE section=? ORDER BY id DESC').all(section).map(r=>({...JSON.parse(r.payload),id:r.id})));
      if(req.method==='DELETE' && /^\d+$/.test(id)) { db.prepare('DELETE FROM records WHERE id=? AND section=?').run(Number(id),section); return json(res,200,{ok:true}); }
      if(req.method==='POST' || req.method==='PUT') {
        const data=await body(req); delete data.id;
        if(!data || Array.isArray(data) || Object.values(data).some(v=>typeof v!=='string' || v.length>2000) || !Object.keys(data).length) return json(res,400,{error:'Datos no válidos'});
        if(req.method==='PUT') { if(!/^\d+$/.test(id)) return json(res,400,{error:'Identificador no válido'}); db.prepare('UPDATE records SET payload=? WHERE id=? AND section=?').run(JSON.stringify(data),Number(id),section); }
        else db.prepare('INSERT INTO records(section,payload) VALUES (?,?)').run(section,JSON.stringify(data));
        return json(res,200,{ok:true});
      }
      return json(res,405,{error:'Método no permitido'});
    }
    const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/logo.svg':'logo.svg','/mobile.js':'mobile.js','/sw.js':'sw.js','/manifest.webmanifest':'manifest.webmanifest','/icon-192.png':'icon-192.png','/icon-512.png':'icon-512.png','/icon-maskable.png':'icon-maskable.png','/apple-touch-icon.png':'apple-touch-icon.png'};
    if (url.pathname === '/sw.js') res.setHeader('Cache-Control', 'no-cache');
    const file=files[url.pathname]; if(!file) { res.writeHead(404); return res.end('No encontrado'); }
    res.setHeader('Content-Type',({'html':'text/html; charset=utf-8','js':'text/javascript; charset=utf-8','css':'text/css; charset=utf-8','svg':'image/svg+xml','png':'image/png','webmanifest':'application/manifest+json'})[file.split('.').pop()]);
    fs.createReadStream(path.join(__dirname,'public',file)).pipe(res);
  } catch(e) { json(res,400,{error:'No se pudo procesar la solicitud'}); }
});
server.listen(process.env.PORT || 3000,'0.0.0.0',()=>console.log('VetLuna disponible en el puerto '+(process.env.PORT||3000)));
