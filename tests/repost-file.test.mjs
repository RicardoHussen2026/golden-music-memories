import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {configuration} from '../server/runtime/config.mjs';
import {createApplication} from '../server/runtime/http.mjs';

test('MP4 reutilizado exige sessão e preserva bytes, nome, Range e origem',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'gmm-history-file-'));
 const config=configuration({GMM_PORT:'0',GMM_DATA_DIR:directory,GMM_LOCAL_ACCESS:'true'}),app=createApplication(config);
 const address=await app.listen();config.origin='http://127.0.0.1:'+address.port;
 const id=randomUUID(),bytes=Buffer.from('isolated MP4 transport fixture'),name='Artista - Música - YouTube - V1.mp4';
 try{
  app.store.put('media',id,{id,name,hash:'fixture-completed',state:'ready'});
  await writeFile(join(directory,'media',id+'.mp4'),bytes);
  const url=config.origin+'/api/library/'+id+'/file';
  assert.equal((await fetch(url)).status,401);
  const session=await fetch(config.origin+'/api/session/local',{method:'POST',headers:{Origin:config.origin,'X-GMM-Request':'1'}});
  assert.equal(session.status,200);const Cookie=session.headers.get('set-cookie').split(';')[0];
  const full=await fetch(url+'?download=1',{headers:{Cookie}});
  assert.equal(full.status,200);assert.equal(full.headers.get('cache-control'),'no-store');
  assert.equal(decodeURIComponent(full.headers.get('content-disposition').split("''")[1]),name);
  assert.deepEqual(Buffer.from(await full.arrayBuffer()),bytes);
  const range=await fetch(url,{headers:{Cookie,Range:'bytes=2-8'}});
  assert.equal(range.status,206);assert.equal(range.headers.get('content-range'),'bytes 2-8/'+bytes.length);
  assert.deepEqual(Buffer.from(await range.arrayBuffer()),bytes.subarray(2,9));
  for(const Range of ['bytes=999-1000','bytes=-5','bytes=8-2'])assert.equal((await fetch(url,{headers:{Cookie,Range}})).status,416);
  assert.equal((await fetch(url,{headers:{Cookie,'X-Forwarded-For':'127.0.0.1'}})).status,403);
  assert.equal((await fetch(config.origin+'/api/library/'+randomUUID()+'/file',{headers:{Cookie}})).status,404);
  assert.equal(app.store.list('publication').length,0);app.store.put('media',id,{...app.store.get('media',id),trashedAt:new Date().toISOString()});assert.equal((await(await fetch(config.origin+'/api/library',{headers:{Cookie}})).json()).media.length,0);assert.equal((await(await fetch(config.origin+'/api/library?includeTrashed=1',{headers:{Cookie}})).json()).media[0].id,id);
 }finally{await app.close();assert.ok(resolve(directory).startsWith(resolve(tmpdir(),'gmm-history-file-')));await rm(directory,{recursive:true,force:true});}
});
