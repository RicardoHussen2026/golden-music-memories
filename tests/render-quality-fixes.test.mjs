import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {configuration} from '../server/runtime/config.mjs';
import {createApplication} from '../server/runtime/http.mjs';
import {runProcess} from '../server/runtime/source-import.mjs';
import {fileHash} from '../server/runtime/media.mjs';
import {displayDuration,editedSequence} from '../app/sequence-edit.js';

test('duração exibida e meta sem repetição ou preenchimento silencioso',()=>{
 assert.equal(displayDuration(3599.999957),'01:00:00');
 assert.equal(editedSequence([{duration:10,trimStart:2},{duration:10}],{durationMode:'exact',targetSeconds:15})[1].trimEnd,7);
 assert.throws(()=>editedSequence([{duration:10}],{durationMode:'exact',targetSeconds:11}),/Faltam/);
 assert.throws(()=>editedSequence([{duration:10},{duration:10}],{durationMode:'exact',targetSeconds:5}),/última/);
 assert.throws(()=>editedSequence([{duration:10,trimEnd:20}]),/fonte/);
});

test('render real: cortes por faixa, AAC verificado, início sem silêncio e duração exata',{timeout:240000},async()=>{
 const dir=resolve('.cache/correcoes-v214/test-'+randomUUID());mkdirSync(dir,{recursive:true});
 const config=configuration({GMM_DATA_DIR:join(dir,'db'),GMM_PORT:'0',GMM_MIN_FREE_MIB:'0'}),app=createApplication(config,{clipDirectory:join(dir,'clips')}),a=app.assembler,c=app.collections,items=[],hashes=[];
 await app.listen();
 try{
  for(let n=0;n<2;n++){
   const id='p'+n;app.store.put('production',id,{id,songId:'s'+n,title:'Teste '+n,artist:'Fixture'});
   const file=join(dir,n+'.mp4');await runProcess(a.tool('ffmpeg'),['-v','error','-f','lavfi','-i',`color=${n?'blue':'red'}:size=320x180:rate=30:duration=6`,'-f','lavfi','-i',`sine=frequency=${n?880:440}:sample_rate=48000:duration=4`,'-af','adelay=1000:all=1,apad=whole_dur=6','-t','6','-c:v','libx264','-c:a','aac',file]);
   const bytes=readFileSync(file),u=a.begin({productionId:id,purpose:'video',name:n+'.mp4',size:bytes.length});a.append(u.id,0,bytes);await a.complete(u.id);hashes.push([file,fileHash(file)]);items.push({productionId:id,sourceKind:'input',sourceId:u.id,trimStart:1,trimEnd:5});
  }
  const input={title:'Q01 Q02',destination:'youtube',openingMode:'once',mode:'manual',durationMode:'exact',targetSeconds:7,fit:'original',normalizeAudio:true,calls:[],items};
  const draft=await c.save(input);assert.equal(draft.total,7);assert.equal(draft.items[1].plan.sourceDuration,3);assert.equal(draft.wholeTracks,false);
  for(const i of draft.items){i.plan.width=320;i.plan.height=180;}app.store.put('collection',draft.id,draft);
  await c.start(draft.id,draft.revision);await assert.rejects(c.start(draft.id,draft.revision),/Aguarde/);await c.running.get(draft.id).promise;
  const done=c.get(draft.id);assert.equal(done.state,'completed',done.error);assert.equal(done.actualDuration,7);assert.ok(done.audioVerification.truePeak<=-1.5);
  c.update(done,{preview:true});const preservedHash=fileHash(c.file(done.id));const approved=c.approve(done.id,done.revision);assert.equal(approved.preview,false);assert.equal(fileHash(c.file(done.id)),preservedHash);assert.throws(()=>c.approve(done.id,0),/mudou/);const short=c.sample(done.id,0);assert.throws(()=>c.approve(short.id,short.revision),/completo/);
  const info=await a.probe(c.file(done.id));assert.equal(info.videoStart,0);assert.equal(info.audioSampleRate,48000);assert.ok(Math.abs(info.audioDuration-7)<.025);
  const scan=await runProcess(a.tool('ffmpeg'),['-hide_banner','-nostats','-i',c.file(done.id),'-af','aresample=async=1:first_pts=0,silencedetect=n=-50dB:d=0.08','-f','null','-'],{captureStderr:true});assert.ok(!scan.includes('silence_start'),scan);
  await assert.rejects(c.save({...input,targetSeconds:20}),/Faltam/);await assert.rejects(c.save({...input,targetSeconds:2}),/última/);
  for(const [file,hash]of hashes)assert.equal(fileHash(file),hash);
  writeFileSync(join(dir,'RESULTADO.json'),JSON.stringify({done,info,originalsIntact:true,noSilenceAbove80ms:true},null,2));
 }finally{await app.close();}
});

test('concatenação mantém áudio até o fim com timestamps descontínuos',{timeout:120000},async()=>{
 const dir=resolve('.cache/correcoes-v214/timestamps-'+randomUUID());mkdirSync(dir,{recursive:true});
 const app=createApplication(configuration({GMM_DATA_DIR:join(dir,'db'),GMM_PORT:'0',GMM_MIN_FREE_MIB:'0'}));await app.listen();
 try{
  const items=[];
  for(let n=0;n<2;n++){
   const seed=join(dir,'seed'+n+'.mp4'),file=join(dir,'source'+n+'.mp4');
   await runProcess(app.assembler.tool('ffmpeg'),['-v','error','-f','lavfi','-i',`color=${n?'blue':'red'}:size=32x18:rate=30:duration=1`,'-f','lavfi','-i',`sine=frequency=${n?880:440}:sample_rate=48000:duration=1`,'-c:v','libx264','-c:a','aac','-t','1',seed]);
   await runProcess(app.assembler.tool('ffmpeg'),['-v','error','-stream_loop','-1','-i',seed,'-t','11','-c','copy',file]);
   const id='p'+n;app.store.put('production',id,{id,songId:'s'+n,title:'Timestamps '+n,artist:'Fixture'});
   const bytes=readFileSync(file),u=app.assembler.begin({productionId:id,purpose:'video',name:'fixture.mp4',size:bytes.length});app.assembler.append(u.id,0,bytes);await app.assembler.complete(u.id);items.push({productionId:id,sourceKind:'input',sourceId:u.id});
  }
  const c=await app.collections.save({title:'Relógio do áudio',destination:'youtube',fit:'original',openingMode:'once',durationMode:'exact',targetSeconds:20,items});
  for(const i of c.items){i.plan.width=32;i.plan.height=18;}app.store.put('collection',c.id,c);
  await app.collections.start(c.id,c.revision);await app.collections.running.get(c.id).promise;
  const done=app.collections.get(c.id);assert.equal(done.state,'completed',done.error);
  const info=await app.assembler.probe(app.collections.file(c.id));assert.equal(info.duration,20);assert.equal(info.videoStart,0);assert.ok(Math.abs(info.audioDuration-20)<.025,JSON.stringify(info));
 }finally{await app.close();}
});
