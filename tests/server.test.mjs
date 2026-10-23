import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {Store,sha,publicJob} from '../server/runtime/store.mjs';
import {configuration,availability} from '../server/runtime/config.mjs';
import {canonical,validateEnvelope,Transfers} from '../server/runtime/contracts.mjs';
import {Providers} from '../server/runtime/providers.mjs';
import {Worker} from '../server/runtime/worker.mjs';
import {createApplication} from '../server/runtime/http.mjs';
import {backupService} from '../server/runtime/backup.mjs';

const bytes=await readFile(new URL('./fixtures/youtube-teste.mp4',import.meta.url));
const scopes=['https://www.googleapis.com/auth/youtube.upload','https://www.googleapis.com/auth/youtube.readonly'];
function envelope(patch={}){
  const e={schemaVersion:2,mode:'simulation',publicationId:'pub-1',productionId:'production-1',productionVersion:1,assetId:'asset-1',fileVersion:1,fileSize:bytes.length,fileHash:sha(bytes),accountId:'simulation:youtube',platform:'youtube',audioReady:true,metadata:{title:'Vídeo de teste',description:'Teste isolado',hashtags:'#Teste',plannedAt:'',timeZone:'America/Sao_Paulo',options:{privacy:'private',tags:[],madeForKids:false,containsSyntheticMedia:false}},rights:{confirmed:true,productionUntil:'',assetUntil:''},...patch};
  if(e.platform==='tiktok'&&!patch.metadata)e.metadata={...e.metadata,options:{musicUsageConsent:true}};
  const {schemaVersion,fileSize,approval,...bound}=e;e.approval={at:new Date().toISOString(),assetId:e.assetId,fileHash:e.fileHash,binding:sha(canonical(bound))};return e;
}
async function fixture(run,{network=false,publishing=false,...extra}={}){
  const directory=await mkdtemp(join(tmpdir(),'gmm-server-'));const config={...configuration({GMM_DATA_DIR:directory}),encryptionKey:randomBytes(32),network,publishing,...extra};let store=new Store(directory,config.encryptionKey);
  const reopen=()=>{store.close();store=new Store(directory,config.encryptionKey);return store;};
  try{return await run({config,get store(){return store;},reopen,directory});}finally{store.close();assert.ok(resolve(directory).startsWith(resolve(tmpdir(),'gmm-server-')));await rm(directory,{recursive:true,force:true});}
}
function receive(store,config,e=envelope()){const transfers=new Transfers(store,config),t=transfers.begin('operator',e);for(let offset=t.offset;offset<bytes.length;offset+=config.chunkBytes)transfers.append('operator',t.id,offset,bytes.subarray(offset,offset+config.chunkBytes));return transfers.complete('operator',t.id);}
function connect(store,platform='youtube',patch={}){const id=platform+':account';store.put('connection',id,{id,owner:'operator',platform,identity:'account',label:'Canal fictício',state:'connected',scopes,encrypted:store.seal({access_token:'TEST_ACCESS',refresh_token:'TEST_REFRESH',expiresAt:Date.now()+3600000}),...patch});return id;}
const response=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...headers}});

test('configuração inicial bloqueia rede, publicação e OAuth; valida HTTPS e chave',()=>{
  const c=configuration({});assert.equal(c.network,false);assert.equal(c.publishing,false);assert.equal(c.worker,false);assert.ok(availability(c).providers.every(p=>!p.oauthEnabled&&!p.directPostEnabled));
  assert.throws(()=>configuration({GMM_PUBLIC_ORIGIN:'http://example.com'}),/HTTPS/);assert.throws(()=>configuration({GMM_ENCRYPTION_KEY:'curta'}),/cifragem/);
});
test('contrato recusa aprovação antiga, áudio pendente, direitos e fuso inválidos',()=>{
  const c=configuration({});for(const patch of [{audioReady:false},{rights:{confirmed:false}},{metadata:{title:'Outro'}}])assert.throws(()=>validateEnvelope({...envelope(),...patch},c));
  const e=envelope();e.metadata.title='Título após aprovação';assert.throws(()=>validateEnvelope(e,c),/mudaram/);
  assert.throws(()=>validateEnvelope(envelope({rights:{confirmed:true,productionUntil:'2000-01-01'}}),c),/licença/);
  assert.throws(()=>validateEnvelope(envelope({metadata:{...envelope().metadata,timeZone:'Lua/Base'}}),c),/Fuso/);
});
test('agendamento exige futuro, UTC e YouTube privado; licença cobre a data',()=>{
  const c=configuration({}),m=envelope().metadata;assert.throws(()=>validateEnvelope(envelope({metadata:{...m,plannedAt:'2000-01-01T12:00:00Z'}}),c),/futura/);
  const future=new Date(Date.now()+86400000).toISOString();assert.throws(()=>validateEnvelope(envelope({metadata:{...m,plannedAt:future,options:{privacy:'public'}}}),c),/privado/);
  assert.ok(validateEnvelope(envelope({metadata:{...m,plannedAt:future}}),c));
});
test('transferência interrompida retoma após reinício e não duplica bloco ou tarefa',async()=>fixture(async f=>{
  let tr=new Transfers(f.store,f.config);const e=envelope(),t=tr.begin('operator',e),half=Math.floor(bytes.length/2);tr.append('operator',t.id,0,bytes.subarray(0,half));assert.throws(()=>tr.append('operator',t.id,0,Buffer.alloc(half)),/diferentes/);
  assert.equal(tr.append('operator',t.id,0,bytes.subarray(0,half)).offset,half);const store=f.reopen();tr=new Transfers(store,f.config);assert.equal(tr.begin('operator',e).offset,half);tr.append('operator',t.id,half,bytes.subarray(half));const job=tr.complete('operator',t.id);assert.equal(tr.complete('operator',t.id).id,job.id);assert.equal(store.jobs('operator').length,1);assert.equal(job.state,'received');assert.equal(job.remote,undefined);
}));
test('posição e integridade inválidas são recusadas sem criar tarefa',async()=>fixture(async f=>{
  const tr=new Transfers(f.store,f.config),t=tr.begin('operator',envelope());assert.throws(()=>tr.append('other',t.id,0,bytes),/encontrada/);assert.throws(()=>tr.append('operator',t.id,1,bytes),/Posição/);tr.append('operator',t.id,0,Buffer.alloc(bytes.length));assert.throws(()=>tr.complete('operator',t.id),/corrompida/);assert.equal(f.store.jobs('operator').length,0);
}));
test('segunda versão da mesma publicação precisa cancelar a tarefa anterior',async()=>fixture(async f=>{
  receive(f.store,f.config);const tr=new Transfers(f.store,f.config);assert.throws(()=>tr.begin('operator',envelope({metadata:{...envelope().metadata,title:'Novo texto'}})),/Já existe/);
}));
test('autorização é separada do recebimento e simulação nunca preenche ID externo',async()=>fixture(async f=>{
  const job=receive(f.store,f.config),worker=new Worker(f.store,f.config,new Providers(f.store,f.config));assert.equal(await worker.tick(),null);
  assert.throws(()=>worker.authorize('operator',job.id,job.revision,{confirm:false}),/Aprovação/);
  const authorized=worker.authorize('operator',job.id,job.revision,{confirm:true,binding:job.envelope.approval.binding});assert.equal(authorized.state,'authorized');const result=await worker.tick('operator',job.id);assert.equal(result.state,'simulated_complete');assert.equal(result.result.externalId,null);assert.equal(await worker.tick('operator',job.id),null);
}));
test('cancelamento e revisões concorrentes preservam tarefas e histórico',async()=>fixture(async f=>{
  const job=receive(f.store,f.config),worker=new Worker(f.store,f.config,{});assert.throws(()=>worker.cancel('operator',job.id,0),/Atualize/);const cancelled=worker.cancel('operator',job.id,job.revision);assert.equal(cancelled.state,'cancelled');assert.equal(await worker.tick(),null);assert.equal(f.store.db.prepare('SELECT count(*) AS n FROM events').get().n,2);
}));
test('dois processadores não adquirem a mesma tarefa e retomam após lease expirada',async()=>fixture(async f=>{
  const job=receive(f.store,f.config),worker=new Worker(f.store,f.config,{});worker.authorize('operator',job.id,job.revision,{confirm:true,binding:job.envelope.approval.binding});const other=new Store(f.directory,f.config.encryptionKey);
  try{assert.ok(f.store.claim());assert.equal(other.claim(),null);f.store.db.prepare('UPDATE jobs SET lease_until=0 WHERE id=?').run(job.id);assert.ok(other.claim());}finally{other.close();}
}));
test('falha transitória simulada repete com a mesma tarefa após reinício',async()=>fixture(async f=>{
  const job=receive(f.store,f.config);let worker=new Worker(f.store,f.config,{});worker.authorize('operator',job.id,job.revision,{confirm:true,binding:job.envelope.approval.binding,scenario:'network'});assert.equal((await worker.tick()).state,'retry_wait');
  const store=f.reopen();store.db.prepare('UPDATE jobs SET due=0').run();worker=new Worker(store,f.config,{});assert.equal((await worker.tick()).state,'simulated_complete');assert.equal(store.jobs('operator').length,1);
}));
test('YouTube e TikTok são tarefas independentes; real bloqueado sem configuração',async()=>fixture(async f=>{
  const yt=receive(f.store,f.config),tt=receive(f.store,f.config,envelope({publicationId:'pub-tt',platform:'tiktok',accountId:'simulation:tiktok'})),worker=new Worker(f.store,f.config,{});
  for(const [j,scenario] of [[yt,'success'],[tt,'rejected']]){worker.authorize('operator',j.id,j.revision,{confirm:true,binding:j.envelope.approval.binding,scenario});await worker.tick('operator',j.id);}
  assert.equal(f.store.job(yt.id,'operator').state,'simulated_complete');assert.equal(f.store.job(tt.id,'operator').state,'failed');
  const real=receive(f.store,f.config,envelope({publicationId:'real-1',mode:'real',accountId:'youtube:account'}));assert.throws(()=>worker.authorize('operator',real.id,real.revision,{confirm:true,binding:real.envelope.approval.binding}),/desativada/);
}));
test('OAuth state é de uso único, vinculado à sessão e expira; consentimento negado não conecta',async()=>fixture(async f=>{
  const config={...f.config,network:true,youtube:{...f.config.youtube,clientId:'FAKE',clientSecret:'FAKE'}};const provider=new Providers(f.store,config,()=>{throw Error('Rede não deve ser usada');});
  let start=provider.begin('operator','session','youtube'),state=new URL(start.url).searchParams.get('state');await assert.rejects(provider.callback('operator','other','youtube',{state,code:'fake'}),/State/);
  await assert.rejects(provider.callback('operator','session','youtube',{state,error:'access_denied'}),/recusada/);await assert.rejects(provider.callback('operator','session','youtube',{state,code:'fake'}),/State/);
  start=provider.begin('operator','session','youtube');state=new URL(start.url).searchParams.get('state');const record=f.store.get('oauth',sha(state));f.store.put('oauth',sha(state),{...record,expires:0});await assert.rejects(provider.callback('operator','session','youtube',{state,code:'fake'}),/expirado/);assert.equal(provider.connections('operator').length,0);
}));
test('OAuth troca código, confirma canal, cifra tokens e renova sem expor segredos',async()=>fixture(async f=>{
  let refreshes=0;const config={...f.config,network:true,youtube:{...f.config.youtube,clientId:'FAKE_CLIENT',clientSecret:'FAKE_SECRET'}};
  const provider=new Providers(f.store,config,async(url,opt)=>url.includes('/channels?')?response({items:[{id:'channel',snippet:{title:'Canal fictício'}}]}):response({access_token:'SECRET_ACCESS_'+(++refreshes),refresh_token:'SECRET_REFRESH',expires_in:3600,scope:scopes.join(' ')}));
  const state=new URL(provider.begin('operator','session','youtube').url).searchParams.get('state');await provider.callback('operator','session','youtube',{state,code:'FAKE_CODE'});
  let c=f.store.get('connection','youtube:channel');assert.ok(!JSON.stringify(c).includes('SECRET_'));assert.ok(!JSON.stringify(provider.connections('operator')).includes('SECRET_'));const tokens=f.store.open(c.encrypted);f.store.put('connection',c.id,{...c,encrypted:f.store.seal({...tokens,expiresAt:0})});assert.equal(await provider.token(c.id),'SECRET_ACCESS_2');
}));
test('revogação na renovação exige reconexão e nunca dispara novo upload',async()=>fixture(async f=>{
  const id=connect(f.store);let c=f.store.get('connection',id);f.store.put('connection',id,{...c,encrypted:f.store.seal({refresh_token:'TEST_REFRESH',expiresAt:0})});
  const p=new Providers(f.store,{...f.config,network:true,youtube:{clientId:'fake',clientSecret:'fake'}},async()=>response({error:'invalid_grant'},400));await assert.rejects(p.token(id),/invalid_grant/);assert.equal(f.store.get('connection',id).state,'reconnect_required');
}));
test('YouTube: upload retomável consulta offset após interrupção e confirma privado',async()=>fixture(async f=>{
  const config={...f.config,network:true,publishing:true,youtube:{clientId:'fake',clientSecret:'fake'}},id=connect(f.store),job=receive(f.store,config,envelope({mode:'real',accountId:id}));let uploads=0;
  const provider=new Providers(f.store,config,async(url,opt)=>{
    if(url.includes('part=status,processingDetails'))return response({items:[{status:{uploadStatus:'processed',privacyStatus:'private'}}]});
    if(opt.method==='POST')return response({},200,{Location:'https://www.googleapis.com/upload/session'});
    if(opt.headers['Content-Range'].startsWith('bytes */'))return new Response(null,{status:308});
    uploads++;if(uploads===1)throw Error('Conexão perdida');return response({id:'video123'} ,201);
  });
  const worker=new Worker(f.store,config,provider);worker.authorize('operator',job.id,job.revision,{confirm:true,binding:job.envelope.approval.binding});
  for(let i=0;i<7;i++){f.store.db.prepare('UPDATE jobs SET due=0').run();await worker.tick();}
  const result=f.store.job(job.id,'operator');assert.equal(result.state,'completed_private');assert.equal(result.remote.videoId,'video123');assert.equal(uploads,2);assert.equal(result.result.visibility,'private');assert.equal(publicJob(result).remote,undefined);
}));
test('YouTube: sessão expirada não inicia outro upload',async()=>fixture(async f=>{
  const config={...f.config,network:true,publishing:true,youtube:{clientId:'fake',clientSecret:'fake'}},id=connect(f.store),job=receive(f.store,config,envelope({mode:'real',accountId:id}));let starts=0;
  const p=new Providers(f.store,config,async(url,opt)=>{if(opt.method==='POST'){starts++;return response({},200,{Location:'https://www.googleapis.com/upload/session'});}return response({},404);});const w=new Worker(f.store,config,p);w.authorize('operator',job.id,job.revision,{confirm:true,binding:job.envelope.approval.binding});await w.tick();await w.tick();assert.equal(f.store.job(job.id,'operator').state,'needs_reconciliation');assert.equal(starts,1);
}));
test('inicialização de upload ambígua não é repetida automaticamente',async()=>fixture(async f=>{
  const config={...f.config,network:true,publishing:true,youtube:{clientId:'fake',clientSecret:'fake'}},id=connect(f.store),job=receive(f.store,config,envelope({mode:'real',accountId:id}));let calls=0;
  const w=new Worker(f.store,config,new Providers(f.store,config,async()=>{calls++;throw Error('Resposta perdida');}));w.authorize('operator',job.id,job.revision,{confirm:true,binding:job.envelope.approval.binding});await w.tick();assert.equal(f.store.job(job.id,'operator').state,'needs_reconciliation');await w.tick();assert.equal(calls,1);
}));
test('TikTok: upload assistido termina aguardando usuário; status desconhecido não vira público',async()=>fixture(async f=>{
  const config={...f.config,network:true,publishing:true,secure:true,tiktok:{clientId:'fake',clientSecret:'fake',uploadApproved:true}},id=connect(f.store,'tiktok'),job=receive(f.store,config,envelope({mode:'real',accountId:id,platform:'tiktok'}));
  const p=new Providers(f.store,config,async(url,opt)=>url.includes('/init/')?response({data:{publish_id:'publish-id',upload_url:'https://open-upload.tiktokapis.com/video/test'},error:{code:'ok'}}):url.includes('/status/')?response({data:{status:'SEND_TO_USER_INBOX'},error:{code:'ok'}}):new Response(null,{status:201}));
  const w=new Worker(f.store,config,p);w.authorize('operator',job.id,job.revision,{confirm:true,binding:job.envelope.approval.binding,assistedUpload:true,musicUsage:true});for(let i=0;i<3;i++){f.store.db.prepare('UPDATE jobs SET due=0').run();await w.tick();}assert.equal(f.store.job(job.id,'operator').state,'awaiting_user');assert.equal(f.store.job(job.id,'operator').result.url,null);
}));
test('destinos externos arbitrários e redirecionamentos não recebem tokens',async()=>fixture(async f=>{
  let requests=0;const p=new Providers(f.store,{...f.config,network:true},async()=>{requests++;return response({},302,{Location:'http://127.0.0.1/private'});});await assert.rejects(p.request('https://evil.example/'),/permitido/);await assert.rejects(p.request('http://127.0.0.1/'),/permitido/);assert.equal(requests,0);await p.request('https://www.googleapis.com/test');assert.equal(requests,1);
}));
test('transferências concorrentes com metadados distintos não criam duas tarefas da mesma publicação',async()=>fixture(async f=>{
  const tr=new Transfers(f.store,f.config),a=tr.begin('operator',envelope()),b=tr.begin('operator',envelope({metadata:{...envelope().metadata,title:'Outra revisão'}}));for(const t of [a,b])tr.append('operator',t.id,0,bytes);tr.complete('operator',a.id);assert.throws(()=>tr.complete('operator',b.id),/Outra transferência/);assert.equal(f.store.jobs('operator').length,1);
}));
test('campos estranhos de opções e segredos não são persistidos no manifesto',async()=>fixture(async f=>{
  const tr=new Transfers(f.store,f.config);assert.throws(()=>tr.begin('operator',envelope({metadata:{...envelope().metadata,options:{privacy:'private',access_token:'SECRET'}}})),/Opção/);assert.equal(f.store.db.prepare('SELECT count(*) AS n FROM transfers').get().n,0);
}));
test('YouTube distingue privado, não listado, agendado e público após processamento',async()=>fixture(async f=>{
  const config={...f.config,network:true,publishing:true,youtube:{clientId:'fake',clientSecret:'fake'}},accountId=connect(f.store);
  for(const [privacy,state] of [['private','completed_private'],['unlisted','completed_unlisted'],['scheduled','scheduled'],['public','published']]){
    const job=receive(f.store,config,envelope({mode:'real',accountId,publicationId:'visibility-'+privacy}));const current=f.store.job(job.id,'operator');f.store.update(current,{state:'processing',authorizedAt:new Date().toISOString(),remote:{videoId:'video123'}},'fixture');
    const p=new Providers(f.store,config,async()=>response({items:[{status:{uploadStatus:'processed',privacyStatus:privacy==='scheduled'?'private':privacy,...(privacy==='scheduled'?{publishAt:new Date(Date.now()+86400000).toISOString()}:{})}}]}));await new Worker(f.store,config,p).tick('operator',job.id);assert.equal(f.store.job(job.id,'operator').state,state);
  }
}));
test('YouTube altera e remove agendamento sem reenviar vídeo nem apagar opções',async()=>fixture(async f=>{
  const config={...f.config,network:true,publishing:true,youtube:{clientId:'fake',clientSecret:'fake',manageSchedules:true}},accountId=connect(f.store,'youtube',{scopes:['https://www.googleapis.com/auth/youtube.force-ssl']}),metadata={...envelope().metadata,plannedAt:new Date(Date.now()+86400000).toISOString()};
  const job=receive(f.store,config,envelope({mode:'real',accountId,metadata}));let current=f.store.update(f.store.job(job.id,'operator'),{state:'scheduled',remote:{videoId:'video123'},result:{externalId:'video123',visibility:'private',publishAt:metadata.plannedAt}},'fixture');const puts=[];
  const provider=new Providers(f.store,config,async(url,opt)=>{if(opt.method==='PUT'){const input=JSON.parse(opt.body);puts.push(input);return response({id:'video123',status:input.status});}return response({items:[{status:{privacyStatus:'private',publishAt:metadata.plannedAt,embeddable:false,license:'youtube',publicStatsViewable:false}}]});});
  const next=envelope({mode:'real',accountId,metadata:{...metadata,plannedAt:new Date(Date.now()+172800000).toISOString()}});current=await provider.changeSchedule('operator',current,current.revision,{confirm:true,envelope:next});assert.equal(current.state,'scheduled');assert.equal(puts[0].status.publishAt,next.metadata.plannedAt);assert.equal(puts[0].status.embeddable,false);assert.equal(puts[0].snippet,undefined);
  current=await provider.changeSchedule('operator',current,current.revision,{confirm:true,cancel:true});assert.equal(current.state,'completed_private');assert.equal(puts[1].status.publishAt,undefined);assert.equal(puts[1].status.privacyStatus,'private');assert.equal(f.store.jobs('operator').length,1);
}));
test('resultado ambíguo de reagendamento fica para conciliação; não repete sozinho',async()=>fixture(async f=>{
  const config={...f.config,network:true,publishing:true,youtube:{clientId:'fake',clientSecret:'fake'}},accountId=connect(f.store,'youtube',{scopes:['https://www.googleapis.com/auth/youtube.force-ssl']}),metadata={...envelope().metadata,plannedAt:new Date(Date.now()+86400000).toISOString()},job=receive(f.store,config,envelope({mode:'real',accountId,metadata}));const current=f.store.update(f.store.job(job.id,'operator'),{state:'scheduled',remote:{videoId:'video123'}},'fixture');let puts=0;
  const p=new Providers(f.store,config,async(url,opt)=>{if(opt.method==='PUT'){puts++;throw Error('Resposta perdida');}return response({items:[{status:{privacyStatus:'private',publishAt:metadata.plannedAt}}]});});await assert.rejects(p.changeSchedule('operator',current,current.revision,{confirm:true,cancel:true}));assert.equal(f.store.job(job.id,'operator').state,'needs_reconciliation');assert.equal(await new Worker(f.store,config,p).tick(),null);assert.equal(puts,1);
}));
test('falhas transitórias após muitos blocos ainda recebem retentativas limitadas',async()=>fixture(async f=>{
  const config={...f.config,network:true,publishing:true,youtube:{clientId:'fake',clientSecret:'fake'}},accountId=connect(f.store),job=receive(f.store,config,envelope({mode:'real',accountId})),current=f.store.job(job.id,'operator');f.store.update(current,{state:'uploading',attempts:100,authorizedAt:new Date().toISOString(),remote:{session:'https://www.googleapis.com/upload/session',probe:true,offset:0}},'fixture');
  const p=new Providers(f.store,config,async()=>response({},503)),w=new Worker(f.store,config,p);await w.tick();assert.equal(f.store.job(job.id,'operator').state,'retry_wait');
  for(let i=0;i<6;i++){f.store.db.prepare('UPDATE jobs SET due=0').run();await w.tick();}assert.equal(f.store.job(job.id,'operator').state,'failed');assert.equal(f.store.job(job.id,'operator').failures,5);
}));
test('sessão cifrada rejeita chave incorreta e desconexão elimina tokens locais',async()=>fixture(async f=>{
  const id=connect(f.store),c=f.store.get('connection',id),other=new Store(f.directory,randomBytes(32));try{assert.throws(()=>other.open(c.encrypted));}finally{other.close();}
  const result=await new Providers(f.store,f.config).disconnect('operator',id);assert.equal(result.remoteRevocationConfirmed,false);assert.equal(f.store.get('connection',id).encrypted,undefined);
}));
test('backup SQLite inclui tarefas e blocos confirmados; não sobrescreve cópias anteriores',async()=>fixture(async f=>{
  const job=receive(f.store,f.config),destination=join(f.directory,'snapshot.sqlite');await backupService(f.directory,destination);await assert.rejects(backupService(f.directory,destination),/já existe/);
  const {DatabaseSync}=await import('node:sqlite'),copy=new DatabaseSync(destination,{readOnly:true});try{assert.equal(copy.prepare('SELECT id FROM jobs').get().id,job.id);assert.equal(copy.prepare('SELECT sum(length(bytes)) AS size FROM chunks').get().size,bytes.length);assert.equal(copy.prepare('PRAGMA user_version').get().user_version,1);}finally{copy.close();}
}));
test('API exige sessão e origem; não serve arquivos privados nem revela senha em falhas',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'gmm-server-'));const config={...configuration({GMM_PORT:'0',GMM_DATA_DIR:directory}),password:'TEST_ONLY_PASSWORD_1234'};const logs=[];let app=createApplication(config,{log:e=>logs.push(e)}),address=await app.listen();config.origin='http://127.0.0.1:'+address.port;
  try{const base=config.origin,call=(path,opt={})=>fetch(base+path,{...opt,headers:{Connection:'close',...opt.headers}});assert.equal((await call('/api/health')).status,200);assert.equal((await call('/api/jobs')).status,401);assert.equal((await call('/.cache/publishing-private/publishing.sqlite')).status,404);assert.equal((await call('/server/runtime/config.mjs')).status,404);
    assert.equal((await call('/api/session',{method:'POST',body:JSON.stringify({password:config.password})})).status,403);
    const headers={'Content-Type':'application/json','Origin':base,'X-GMM-Request':'1'};const login=await call('/api/session',{method:'POST',headers,body:JSON.stringify({password:config.password})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/);
    const auth={...headers,Cookie:cookie};const unauthorized=await call('/api/jobs',{headers:{Cookie:'gmm_session=invalid'}});assert.equal(unauthorized.status,401);
    const create=await call('/api/transfers',{method:'POST',headers:auth,body:JSON.stringify(envelope())});assert.equal(create.status,201);const t=await create.json();const put=await call('/api/transfers/'+t.id,{method:'PUT',headers:{...auth,'X-Upload-Offset':'0'},body:bytes});assert.equal(put.status,200);
    const complete=await call('/api/transfers/'+t.id+'/complete',{method:'POST',headers:auth,body:'{}'}),job=await complete.json();assert.equal(job.state,'received');
    await app.close();app=createApplication(config,{log:e=>logs.push(e)});app.server.listen(address.port,'127.0.0.1');await new Promise(r=>app.server.once('listening',r));const list=await call('/api/jobs',{headers:auth});assert.equal((await list.json()).jobs[0].id,job.id);
    assert.equal((await call('/api/jobs/'+job.id+'/authorize',{method:'POST',headers:auth,body:JSON.stringify({confirm:true,binding:job.envelope.approval.binding,revision:job.revision})})).status,200);
    const run=await call('/api/jobs/'+job.id+'/run',{method:'POST',headers:auth,body:'{}'});assert.equal((await run.json()).state,'simulated_complete');assert.ok(!JSON.stringify(logs).includes('TEST_ONLY_PASSWORD'));
  }finally{await app.close();assert.ok(resolve(directory).startsWith(resolve(tmpdir(),'gmm-server-')));await rm(directory,{recursive:true,force:true});}
});
