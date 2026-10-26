import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {publishedEvents,assessRepost} from '../app/repost-policy.js';
import {trimRange,collectionChapters,validateMetrics,sourceQuality} from '../app/quality.js';
import {configuration} from '../server/runtime/config.mjs';
import {Store} from '../server/runtime/store.mjs';
import {MediaLibrary,fileHash} from '../server/runtime/media.mjs';
import {SourceImporter,runProcess} from '../server/runtime/source-import.mjs';
import {VideoAssembler} from '../server/runtime/video-assembly.mjs';
import {Collections} from '../server/runtime/collections.mjs';
import {ClipLibrary} from '../server/runtime/clip-library.mjs';
import {measureAudio} from '../server/runtime/audio-quality.mjs';
import {saveCollectionPosting} from '../server/runtime/collection-posting.mjs';
import {RenderQueue} from '../server/runtime/render-queue.mjs';
test('qualidade, cortes intencionais, capítulos e métricas desconhecidas',()=>{
 assert.equal(sourceQuality({width:1280,height:720}).upscaled,true);
 assert.deepEqual(trimRange({trimStart:5,trimEnd:10},20),{start:5,end:10,duration:5});assert.throws(()=>trimRange({trimEnd:21},20));
 const c={total:46.9,items:[{start:0,plan:{musicStart:6.9},title:'A',artist:'X'},{start:20,plan:{},title:'B',artist:'Y'},{start:31,plan:{},title:'C',artist:'Z'}]};
 assert.equal(collectionChapters(c).valid,true);assert.ok(collectionChapters(c).text.startsWith('00:00'));
 c.items[1].start=8;assert.equal(collectionChapters(c).valid,false);
 assert.equal(validateMetrics({views:'0',retention:''}).retention,null);assert.equal(validateMetrics({views:'0'}).views,0);assert.throws(()=>validateMetrics({retention:101}));assert.throws(()=>validateMetrics({revenue:-1}));
});
test('montagem real: corte, amostra não aprovável, reuso por destino, volume medido, miniatura e fila',{timeout:240000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gmm-quality-')),config=configuration({GMM_DATA_DIR:dir,GMM_MIN_FREE_MIB:'0'}),store=new Store(dir),library=new MediaLibrary(store,config),importer=new SourceImporter(store,config),assembler=new VideoAssembler(store,config,library,importer),collections=new Collections(store,config,assembler),queue=new RenderQueue(store,assembler,collections),clipLibrary=new ClipLibrary(store,join(dir,'clips'),assembler.directory);assembler.clipLibrary=clipLibrary;
 try{store.put('production','p',{id:'p',songId:'s',title:'Teste',artist:'Sintético'});const file=join(dir,'tone.mp4');await runProcess(assembler.tool('ffmpeg'),['-v','error','-f','lavfi','-i','testsrc2=size=320x180:rate=30:duration=12','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=12','-c:v','libx264','-preset','ultrafast','-c:a','aac','-shortest',file]);const original=fileHash(file),bytes=readFileSync(file),u=assembler.begin({productionId:'p',purpose:'video',name:'tone.mp4',size:bytes.length});assembler.append(u.id,0,bytes);await assembler.complete(u.id);
 const base={productionId:'p',sourceKind:'input',sourceId:u.id,destination:'youtube',requestedDestination:'youtube',fit:'original',coverSeconds:0,calls:[],preview:true,trimStart:2,trimEnd:5};
 let job=await assembler.start(base);await assembler.running.get(job.id)?.promise;job=assembler.get(job.id);assert.equal(job.state,'completed',job.error);assert.ok(Math.abs((await assembler.probe(assembler.outputPath(job))).duration-3)<.15);
 const reused=await assembler.start({...base,requestedDestination:'facebook'});assert.equal(reused.id,job.id);assert.equal(reused.requestedDestination,'facebook');assert.equal(store.get('render_preset','p').requestedDestination,'facebook');
 const sample=await assembler.start({...base,trimStart:0,trimEnd:12,sample:true,sampleStart:9});await assembler.running.get(sample.id)?.promise;assert.equal(assembler.get(sample.id).state,'completed');assert.throws(()=>assembler.savePreview(sample.id),/Amostra/);assert.ok(Math.abs((await assembler.probe(assembler.outputPath(assembler.get(sample.id)))).duration-3)<.15);
 const normalized=await assembler.start({...base,normalizeAudio:true});await assembler.running.get(normalized.id)?.promise;const n=assembler.get(normalized.id);assert.equal(n.state,'completed',n.error);assert.ok(n.plan.audioNormalization);assert.equal(n.plan.audioCopy,false);const m=await measureAudio(assembler,{path:assembler.outputPath(n),hash:fileHash(assembler.outputPath(n))});assert.ok(Math.abs(m.integrated+16)<1.2,JSON.stringify(m));assert.ok(m.truePeak<=-.8,JSON.stringify(m));
 const r=clipLibrary.register({inputId:u.id,title:'Teste',artist:'Sintético',collection:'Teste'});await clipLibrary.makeThumbnail(r.id,assembler);assert.ok(readFileSync(clipLibrary.get(r.id,{thumbnail:true}).path).length>100);assert.equal(fileHash(file),original);
 const q=queue.add({kind:'assembly',label:'Fixture em fila',input:{...base,preview:false}});await queue.tick();const done=store.get('render_queue',q.id);assert.ok(['running','completed'].includes(done.state));if(done.jobId)await assembler.running.get(done.jobId)?.promise;await queue.tick();assert.equal(store.get('render_queue',q.id).state,'completed');
 // Sample starts after the first song; its custom CTA still belongs to that first production.
 store.put('production','p2',{id:'p2',songId:'s2',title:'Segunda faixa',artist:'Sintético'});
 const file2=join(dir,'tone2.mp4');await runProcess(assembler.tool('ffmpeg'),['-v','error','-f','lavfi','-i','color=blue:size=320x180:rate=30:duration=12','-f','lavfi','-i','sine=frequency=880:sample_rate=48000:duration=12','-c:v','libx264','-preset','ultrafast','-c:a','aac','-shortest',file2]);
 const b2=readFileSync(file2),u2=assembler.begin({productionId:'p2',purpose:'video',name:'tone2.mp4',size:b2.length});assembler.append(u2.id,0,b2);await assembler.complete(u2.id);
 const artBytes=readFileSync(clipLibrary.get(r.id,{thumbnail:true}).path),art=assembler.begin({productionId:'p',purpose:'like',name:'like.jpg',size:artBytes.length});assembler.append(art.id,0,artBytes);await assembler.complete(art.id);
 const long=await collections.save({title:'Amostra posterior',destination:'youtube',targetSeconds:24,openingMode:'once',mode:'manual',fit:'original',likeId:art.id,timing:'manual',calls:[{key:'like',order:1,start:14,duration:3}],items:[{productionId:'p',sourceKind:'input',sourceId:u.id},{productionId:'p2',sourceKind:'input',sourceId:u2.id}]});
 for(const item of long.items){item.plan.width=320;item.plan.height=180;}store.put('collection',long.id,long);
 const cross=collections.sample(long.id,10);assert.equal(cross.items.length,2);assert.equal(cross.total,8);assert.equal(cross.items[0].plan.sample.duration,2);assert.equal(cross.items[1].plan.sample.duration,6);
 const late=collections.sample(long.id,13);await collections.start(late.id,late.revision);await collections.running.get(late.id)?.promise;assert.equal(collections.get(late.id).state,'completed',collections.get(late.id).error);assert.ok(Math.abs(collections.get(late.id).actualDuration-8)<.15);
 }finally{await queue.close();await collections.close();await assembler.close();await importer.close();store.close();assert.ok(resolve(dir).startsWith(join(tmpdir(),'gmm-quality-')));rmSync(dir,{recursive:true,force:true});}
});
test('postagem longa: conta, URL, métricas, histórico, destinos e concorrência',()=>{
 const dir=mkdtempSync(join(tmpdir(),'gmm-posting-')),store=new Store(dir),c={id:'c',revision:1,state:'completed',destination:'youtube',total:40,hash:'fixture',items:[{songId:'s1',productionId:'p1'},{songId:'s2',productionId:'p2'}]},collections={store,get:()=>store.get('collection','c'),update:(v,p)=>store.put('collection','c',{...v,...p})};store.put('collection','c',c);
 try{const input={revision:1,title:'Teste',description:'',hashtags:'',destination:'facebook',metrics:{retention:50,revenue:3},businessGoal:'ads'};const first=saveCollectionPosting(collections,'c',input),p=first.posting;assert.equal(p.destination,'facebook');assert.deepEqual(p.songIds,['s1','s2']);assert.equal(p.status,'draft');assert.throws(()=>saveCollectionPosting(collections,'c',{...input,status:'published'}),/conta/);
 const published=saveCollectionPosting(collections,'c',{...input,publicationId:p.id,postingRevision:1,status:'published',postingAccountLabel:'Canal fixture',url:'https://example.com/test',publishedAt:'2026-10-25T12:00',reviewed:true});assert.equal(published.posting.status,'published');assert.equal(store.list('ops_event').length,2);assert.throws(()=>saveCollectionPosting(collections,'c',{...input,publicationId:p.id,postingRevision:1}),/mudou/);assert.throws(()=>saveCollectionPosting(collections,'c',{...input,destination:'tiktok'}),/formato/);
 }finally{store.close();assert.ok(resolve(dir).startsWith(join(tmpdir(),'gmm-posting-')));rmSync(dir,{recursive:true,force:true});}
});

test('publicação de coletânea também aparece no histórico das músicas participantes',()=>{const publications=[{id:'long',collectionId:'c',songIds:['a','b'],productionIds:['pa','pb'],platform:'youtube',status:'published',url:'https://example.com/long',publishedAt:'2026-10-25T12:00:00Z'}],productions=[{id:'pa',songId:'a'},{id:'pb',songId:'b'}],songs=[{id:'a',title:'A',artist:'X'},{id:'b',title:'B',artist:'Y'}];const events=publishedEvents({publications,productions,songs});assert.equal(events.length,2);assert.equal(assessRepost({events,song:songs[1],production:productions[1],platform:'youtube',now:Date.parse('2026-10-25T15:00:00Z')}).recent,true);});

test('fila pausa ao reiniciar e exige retomada explícita, sem perder a solicitação',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gmm-queue-')),store=new Store(dir),engine={running:new Map(),preparing:false};
 store.put('production','p',{id:'p'});let queue=new RenderQueue(store,engine,engine);
 try{const input={kind:'assembly',label:'Pendente',input:{productionId:'p'}};const q=queue.add(input);assert.equal(queue.add(input).id,q.id);await queue.close();queue=new RenderQueue(store,engine,engine);assert.equal(queue.list()[0].state,'paused');assert.deepEqual(queue.list()[0].request,input);assert.equal(queue.action(q.id,'resume').state,'queued');assert.equal(queue.action(q.id,'cancel').state,'cancelled');}
 finally{await queue.close();store.close();assert.ok(resolve(dir).startsWith(join(tmpdir(),'gmm-queue-')));rmSync(dir,{recursive:true,force:true});}
});
