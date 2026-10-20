const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {mkdtempSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');
const path=require('node:path');
const dir=mkdtempSync(path.join(tmpdir(),'vetluna-test-'));
let processServer,cookie;
const base='http://127.0.0.1:3199/api/';
async function request(route,method='GET',data,auth=true){return fetch(base+route,{method,headers:{'Content-Type':'application/json',...(auth&&cookie?{cookie}:{})},...(data?{body:JSON.stringify(data)}:{})})}
before(async()=>{processServer=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:'3199',DB_PATH:path.join(dir,'test.sqlite'),ADMIN_PASSWORD:'Test-password-2026'}});await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Server startup timeout')),10000);processServer.stdout.on('data',data=>{if(data.toString().includes('puerto')){clearTimeout(t);resolve()}});processServer.on('error',reject)})});
after(()=>{processServer?.kill();rmSync(dir,{recursive:true,force:true})});
test('authentication protects private data and rejects bad password',async()=>{assert.equal((await request('pacientes','GET',null,false)).status,401);assert.equal((await request('login','POST',{username:'admin',password:'wrong'},false)).status,401);const r=await request('login','POST',{username:'admin',password:'Test-password-2026'},false);assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];assert.match(r.headers.get('set-cookie'),/HttpOnly/)});
test('records can be created, read, updated and deleted',async()=>{assert.equal((await request('pacientes','POST',{nombre:'Test paciente',tutor:'Test tutor'})).status,200);const list=await(await request('pacientes')).json();const row=list.find(r=>r.nombre==='Test paciente');assert.ok(row);assert.equal((await request('pacientes/'+row.id,'PUT',{nombre:'Paciente actualizado',tutor:'Test tutor'})).status,200);assert.ok((await(await request('pacientes')).json()).some(r=>r.nombre==='Paciente actualizado'));await request('pacientes/'+row.id,'DELETE');assert.ok(!(await(await request('pacientes')).json()).some(r=>r.id===row.id))});
test('all clinical modules have available data',async()=>{for(const section of ['citas','historial','inventario','facturacion']){const r=await request(section);assert.equal(r.status,200);assert.ok((await r.json()).length>0)}});
test('cross-origin mutations are rejected and logout invalidates session',async()=>{const r=await fetch(base+'pacientes',{method:'POST',headers:{cookie,Origin:'https://other.example','Content-Type':'application/json'},body:'{}'});assert.equal(r.status,403);await request('logout','POST');assert.equal((await request('pacientes')).status,401)});
