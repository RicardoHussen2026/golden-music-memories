import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {request} from 'node:http';
import {configuration} from '../server/runtime/config.mjs';
import {createApplication} from '../server/runtime/http.mjs';
function call(base,path,headers={},method='GET'){return new Promise((resolve,reject)=>{const req=request(base+path,{method,headers:{Connection:'close',...headers}},res=>{let text='';res.on('data',d=>text+=d);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:JSON.parse(text)}));});req.on('error',reject);req.end(method==='POST'?'{}':undefined);});}
test('modo local é explícito e recusa configuração de rede/proxy público',()=>{
 assert.equal(configuration({}).localAccess,false);
 for(const origin of ['http://localhost:8877','https://painel.example','http://192.168.1.2:8877','http://127.0.0.1:9999'])assert.throws(()=>configuration({GMM_LOCAL_ACCESS:'true',GMM_PUBLIC_ORIGIN:origin}));
 const config=configuration({GMM_LOCAL_ACCESS:'true'});
 assert.throws(()=>createApplication({...config,host:'0.0.0.0'}),/127.0.0.1/);
});
test('sessão local exige origem/Host; persiste, encerra e deixa de valer no modo protegido',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'gmm-local-access-'));
 const config=configuration({GMM_PORT:'0',GMM_DATA_DIR:directory,GMM_LOCAL_ACCESS:'true'});
 let app=createApplication(config);let address=await app.listen();config.port=address.port;config.origin='http://127.0.0.1:'+address.port;
 try{
  assert.equal(address.address,'127.0.0.1');
  const base=config.origin,headers={Origin:base,'X-GMM-Request':'1','Content-Type':'application/json'};
  assert.equal((await call(base,'/api/operations')).status,401);
  for(const patch of [{Origin:'https://evil.example'},{Origin:'null'},{Origin:''},{'X-GMM-Request':''},{Host:'evil.example'},{'X-Forwarded-For':'127.0.0.1'},{Forwarded:'for=127.0.0.1'},{'Sec-Fetch-Site':'cross-site'}])assert.equal((await call(base,'/api/session/local',{...headers,...patch},'POST')).status,403);
  const session=await call(base,'/api/session/local',headers,'POST');assert.equal(session.status,200);
  const setCookie=session.headers['set-cookie'][0],cookie=setCookie.split(';')[0];assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/SameSite=Strict/);
  assert.deepEqual(session.body,{authenticated:true,accessMode:'local'});
  assert.equal((await call(base,'/api/operations',{Cookie:cookie})).status,200);
  assert.equal((await call(base,'/api/operations',{Cookie:cookie,Host:'evil.example'})).status,403);
  app.store.put('production','local-test',{id:'local-test',title:'Amostra isolada'});
  await app.close();app=createApplication(config);await app.listen();
  assert.equal(app.store.get('production','local-test').title,'Amostra isolada');
  assert.equal((await call(base,'/api/operations',{Cookie:cookie})).status,200);
  assert.equal((await call(base,'/api/session',{...headers,Cookie:cookie},'DELETE')).status,200);
  assert.equal((await call(base,'/api/operations',{Cookie:cookie})).status,401);
  const again=await call(base,'/api/session/local',headers,'POST'),cookie2=again.headers['set-cookie'][0].split(';')[0];
  await app.close();config.localAccess=false;app=createApplication(config);await app.listen();
  assert.equal((await call(base,'/api/session/local',headers,'POST')).status,404);
  assert.equal((await call(base,'/api/operations',{Cookie:cookie2})).status,401);
  assert.equal((await call(base,'/api/health')).body.localAccessEnabled,false);
 }finally{await app.close();assert.ok(resolve(directory).startsWith(resolve(tmpdir(),'gmm-local-access-')));await rm(directory,{recursive:true,force:true});}
});
