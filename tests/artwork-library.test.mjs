import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {configuration} from '../server/runtime/config.mjs';
import {createApplication} from '../server/runtime/http.mjs';
import {runProcess} from '../server/runtime/source-import.mjs';
import {fileHash} from '../server/runtime/media.mjs';
import {createServiceSnapshot,verifyServiceSnapshot,restoreServiceSnapshot} from '../server/runtime/storage-backup.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));

test('biblioteca de capas/aberturas: upload, geração, download, montagem e originais preservados',{timeout:120000},async()=>{
 const root=resolve('.cache/artworks-v220/test-'+randomUUID());mkdirSync(root,{recursive:true});
 const ff=resolve('.cache/import-tools/ffmpeg.exe'),image=join(root,'cover.png'),video=join(root,'source.mp4');
 await runProcess(ff,['-v','error','-f','lavfi','-i','color=c=gold:s=640x360','-frames:v','1',image]);
 await runProcess(ff,['-v','error','-f','lavfi','-i','testsrc2=size=640x360:rate=30:duration=4','-f','lavfi','-i','sine=frequency=440:duration=4','-c:v','libx264','-preset','ultrafast','-c:a','aac','-shortest',video]);
 const config=configuration({GMM_DATA_DIR:join(root,'db'),GMM_PORT:'0',GMM_LOCAL_ACCESS:'true',GMM_MIN_FREE_MIB:'0',GMM_RENDER_CPU_PROFILE:'conservative'}),app=createApplication(config,{bundledBranding:false,clipDirectory:join(root,'clips')});await app.listen();config.origin='http://127.0.0.1:'+app.server.address().port;
 const headers={Origin:config.origin,'X-GMM-Request':'1','Content-Type':'application/json'};
 const req=async(path,data)=>{const r=await fetch(config.origin+'/api'+path,{headers,method:data?'POST':'GET',body:data?JSON.stringify(data):undefined});const result=await r.json();assert.ok(r.ok,JSON.stringify(result));return result;};
 const finished=async id=>{while(app.artworks.running.has(id))await pause(100);const j=app.artworks.get(id);assert.equal(j.state,'completed',JSON.stringify(j));return j;};
 const upload=async(path,kind)=>{const bytes=readFileSync(path),row=await req('/artworks/inputs',{kind,name:path.split(/[\\/]/).at(-1),size:bytes.length});const r=await fetch(config.origin+'/api/assembly/inputs/'+row.id,{method:'PUT',headers:{...headers,'Content-Type':'application/octet-stream','X-Upload-Offset':'0'},body:bytes});assert.equal(r.status,200);return req('/assembly/inputs/'+row.id+'/complete',{});};
 try{
  const login=await fetch(config.origin+'/api/session/local',{method:'POST',headers,body:'{}'});headers.Cookie=login.headers.get('set-cookie').split(';')[0];
  const originalCount=app.assembler.intros.list().length,sourceHash=fileHash(video),imageHash=fileHash(image),im=await upload(image,'image');
  const cover=await finished((await req('/artworks',{kind:'cover',label:'Capa própria',inputId:im.id})).id);
  assert.equal(cover.sha256,imageHash);assert.equal(cover.width,640);assert.equal(cover.height,360);
  const intro=await finished((await req('/artworks',{kind:'intro',label:'Abertura criada',inputId:im.id,duration:2,format:'horizontal',fade:.25,motion:'gentle'})).id);
  assert.equal(app.assembler.intros.list().length,originalCount+1);assert.equal(app.assembler.intros.get(intro.id).sha256,intro.sha256);
  const media=await app.assembler.probe(app.artworks.file(intro.id).path);assert.equal(media.width,1920);assert.equal(media.height,1080);assert.equal(media.audioCodec,null);assert.ok(Math.abs(media.duration-2)<.1);
  const result=await fetch(config.origin+'/api/artworks/'+intro.id+'/file?download=1',{headers});assert.equal(result.status,200);assert.match(result.headers.get('content-disposition'),/Abertura/);assert.deepEqual(Buffer.from(await result.arrayBuffer()),readFileSync(app.artworks.file(intro.id).path));
  const range=await fetch(config.origin+'/api/artworks/'+intro.id+'/file',{headers:{...headers,Range:'bytes=0-99'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,100);
  const v=await upload(video,'video');
  const imported=await finished((await req('/artworks',{kind:'intro',label:'Vídeo próprio vertical',inputId:v.id,duration:1,start:1,format:'vertical',fade:0,fit:'contain'})).id);
  assert.equal(imported.width,1080);assert.equal(imported.height,1920);assert.equal(imported.sourceHash,sourceHash);
  await assert.rejects(()=>app.artworks.start({kind:'intro',inputId:v.id,label:'Corte inválido',duration:4,start:2}));
  const variant=await finished((await app.artworks.start({kind:'intro',introId:intro.id,label:'Variante',duration:1,start:.5,format:'horizontal',fade:0})).id);assert.notEqual(variant.id,intro.id);assert.equal(app.assembler.intros.get(intro.id).sha256,intro.sha256);
  // The existing renderer accepts a new opening without changing its timing policy.
  app.store.put('production','test',{id:'test',title:'Teste',artist:'Golden',songId:'fixture',version:1});
  app.store.put('render_input',v.id,{...app.store.get('render_input',v.id),productionId:'test'});
  const sourceDownload=await fetch(config.origin+'/api/assembly/source-video?'+new URLSearchParams({kind:'input',id:v.id,productionId:'test',download:'1'}),{headers});
  assert.equal(sourceDownload.status,200);assert.match(sourceDownload.headers.get('content-disposition'),/source\.mp4/);assert.deepEqual(Buffer.from(await sourceDownload.arrayBuffer()),readFileSync(video));
  const openingDownload=await fetch(config.origin+'/api/assembly/intros/'+intro.id+'/video?download=1',{headers});
  assert.equal(openingDownload.status,200);assert.match(openingDownload.headers.get('content-disposition'),/Abertura%20criada\.mp4/);assert.deepEqual(Buffer.from(await openingDownload.arrayBuffer()),readFileSync(app.artworks.file(intro.id).path));
  const prepared=await app.assembler.prepare({productionId:'test',sourceKind:'input',sourceId:v.id,destination:'youtube',introId:intro.id,calls:[],coverSeconds:0,fit:'original'});
  assert.equal(prepared.plan.intro.id,intro.id);
  await runProcess(ff,['-v','error','-i',app.artworks.file(intro.id).path,'-f','null','-']);
  assert.equal(fileHash(video),sourceHash);assert.equal(fileHash(image),imageHash);
  const cancelled=await app.artworks.start({kind:'intro',inputId:im.id,label:'Cancelamento isolado',duration:30,format:'vertical'});
  app.artworks.cancel(cancelled.id);while(app.artworks.running.has(cancelled.id))await pause(50);
  assert.equal(app.artworks.get(cancelled.id).state,'cancelled');assert.equal(fileHash(image),imageHash);
  const list=await req('/artworks');assert.equal(list.items.filter(a=>a.state==='completed').length,4);
  const snapshot=join(root,'snapshot'),restored=join(root,'restored');await createServiceSnapshot(app.store,snapshot);const manifest=await verifyServiceSnapshot(snapshot);assert.ok(manifest.files.filter(f=>f.path.startsWith('artworks/')).length>=8);await restoreServiceSnapshot(snapshot,restored);assert.equal(fileHash(join(restored,'artworks',intro.file)),intro.sha256);
 }finally{await app.close();}
});
