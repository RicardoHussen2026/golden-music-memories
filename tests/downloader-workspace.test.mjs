import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve,join,parse} from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {Store} from '../server/runtime/store.mjs';
import {MediaDownloader} from '../server/runtime/media-downloader.mjs';
import {downloaderURL,failureInfo,writableFolder,pickFolder} from '../server/runtime/downloader-options.mjs';
import {filterDownloads} from '../app/downloader-model.js';
import {musicMetadata,directDeliveryPath,deliverFiles,writeDeliveryIndex} from '../server/runtime/downloader-delivery.mjs';
import {fileHash} from '../server/runtime/media.mjs';

const python=resolve('.cache/media-downloader-env/Scripts/python.exe');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
test('editar uma entrega não altera o original e ações posteriores não mudam a data de download',()=>{
 const root=resolve('.cache/baixador-v217/independencia-'+randomUUID());mkdirSync(root,{recursive:true});const source=join(root,'source.mp4');writeFileSync(source,'ORIGINAL SINTETICO');const j={id:randomUUID(),layout:'flat',state:'completed',outputRoot:root,metadata:musicMetadata({track:'Canção',artist:'Banda'}),completedAt:'2026-10-25T12:00:00Z',updatedAt:'2026-10-26T16:00:00Z'};j.files=deliverFiles(j,[{path:source,kind:'video',hash:fileHash(source),size:18}],root);writeFileSync(join(root,j.files[0].file),'ENTREGA EDITADA');assert.equal(readFileSync(source,'utf8'),'ORIGINAL SINTETICO');writeDeliveryIndex(root,[j]);const index=JSON.parse(readFileSync(join(root,'_Golden Informações','INDICE_DOWNLOADS.json')));assert.equal(index.entries[0].downloadedAt,j.completedAt);
});
test('seleção de pasta lista subpastas e valida entrega em raiz de unidade',async()=>{
 const root=resolve('.cache/baixador-v217/browser-'+randomUUID());mkdirSync(join(root,'Músicas'),{recursive:true});writeFileSync(join(root,'arquivo.txt'),'fixture');const listing=await pickFolder(root);assert.deepEqual(listing.folders.map(f=>f.name),['Músicas']);assert.equal(listing.current,root);await assert.rejects(()=>pickFolder(join(root,'ausente')));const drive=parse(root).root;assert.equal(directDeliveryPath(drive,join(drive,'video.mp4')),true);assert.equal(directDeliveryPath(root,join(root,'video.mp4')),true);assert.equal(directDeliveryPath(root,join(root,'..','video.mp4')),false);assert.equal(directDeliveryPath(root,join(root,'sub','video.mp4')),false);
});
async function idle(md){for(let n=0;n<100&&md.running;n++)await pause(30);assert.equal(md.running,null);}
const urls=['https://youtu.be/FixtureOne1','https://music.youtube.com/watch?v=FixtureOne1','https://vimeo.com/12345678','https://player.vimeo.com/video/12345678?h=abc','https://www.dailymotion.com/video/x123456','https://dai.ly/x123456','https://www.tiktok.com/@fixture/video/1234567890123456789','https://vm.tiktok.com/ZMTest123/','https://www.instagram.com/reel/AbC_123/','https://www.facebook.com/watch/?v=123456789','https://www.facebook.com/fixture/videos/123456789','https://x.com/fixture/status/123456789'];
const invalid=['https://youtube.com/watch?v=bad','https://vimeo.com/channels','https://tiktok.com/@fixture','https://instagram.com/p/abc/','https://facebook.com/share/v/abc','https://facebook.com/watch/','https://x.com/fixture','https://example.com/123','http://vimeo.com/123','https://user:pass@vimeo.com/123'];
test('metadados distinguem informação musical, sugestão de título e data de publicação',()=>{
 const m=musicMetadata({title:'Artista — Música (Official)',upload_date:'20261025',uploader:'Canal de fãs'},'',urls[0]);assert.equal(m.artist,'Artista');assert.equal(m.musicTitle,'Música (Official)');assert.equal(m.releaseYear,null);assert.equal(m.uploadDate,'2026-10-25');assert.match(m.provenance,/Sugestão/);assert.equal(m.needsReview,true);
 const exact=musicMetadata({title:'vídeo',track:'Música',artist:'Banda',album:'Álbum',release_year:1985});assert.equal(exact.musicTitle,'Música');assert.equal(exact.releaseYear,1985);assert.equal(exact.artist,'Banda');
});
test('lote de 50: entrega plana com nomes únicos, originais preservados e índice completo',async()=>{
 const root=resolve('.cache/baixador-v217/lote50-'+randomUUID()),store=new Store(join(root,'db'));let calls=0;
 const runner=async(ex,args,opts)=>{calls++;const path=join(args[args.indexOf('--output')+1],'original.mp4');writeFileSync(path,'CONTEUDO SINTETICO '+calls);opts.onLine(JSON.stringify({type:'complete',report:{files:[{path}],metadata:{title:'Banda - Canção',track:'Canção',artist:'Banda',release_year:1984,upload_date:'20260101'},reencoded:false}}));};
 const md=new MediaDownloader(store,{directory:join(root,'db'),minFreeBytes:0,maxBytes:10000},{toolsDirectory:''},{},{python,runner});try{md.configure({folder:root,paused:true});const result=md.enqueue({urls:Array.from({length:50},(_,n)=>'https://vimeo.com/'+(12345678+n)),container:'mp4'});assert.equal(result.added,50);md.configure({paused:false});await idle(md);assert.equal(calls,50);const jobs=md.jobs();assert.equal(new Set(jobs.map(j=>j.files[0].name)).size,50);for(const j of jobs){const f=md.file(j.id,0);assert.equal(resolve(f.path,'..'),root);assert.match(f.file.name,/Banda — Canção/);assert.equal(readFileSync(join(md.workFolder(j),'original.mp4'),'utf8'),readFileSync(f.path,'utf8'));}const index=JSON.parse(readFileSync(join(root,'_Golden Informações','INDICE_DOWNLOADS.json'),'utf8'));assert.equal(index.entries.length,50);assert.equal(index.entries[0].releaseYear,1984);assert.equal(readFileSync(md.index(),'utf8').split('\r\n').length,51);writeFileSync(join(root,'RESULTADO.json'),JSON.stringify({count:50,flatDelivery:true,uniqueNames:true,sourceBytesPreserved:true,metadataIndex:50}));}finally{await md.close();store.close();}
});
test('fontes individuais: paridade Node/Python sem downloads externos',()=>{
 for(const url of urls)assert.ok(downloaderURL(url));for(const url of invalid)assert.throws(()=>downloaderURL(url));
 assert.equal(downloaderURL('https://x.com/fixture/status/123?s=20#top'),'https://x.com/fixture/status/123');
 const script="import sys,json\nsys.path.insert(0,sys.argv[1])\nfrom bridge import PanelRequest\nresult=[]\nfor url in json.loads(sys.stdin.read()):\n try:\n  PanelRequest(url,'destination').validate();result.append(True)\n except Exception: result.append(False)\nprint(json.dumps(result))";
 const results=JSON.parse(execFileSync(python,['-X','utf8','-c',script,resolve('server/media-downloader')],{input:JSON.stringify([...urls,...invalid]),encoding:'utf8'}));assert.deepEqual(results,[...urls.map(()=>true),...invalid.map(()=>false)]);
});
test('mensagens de erro identificam a causa mesmo com sugestão genérica antiga de MKV',()=>{
 const prefix='Download não concluído. Se houve incompatibilidade de MP4, tente MKV. ';
 for(const [raw,code]of [['Sign in to confirm you are not a bot','verification'],['Private video','unavailable'],['Connection timed out','connection'],['No space left on disk','storage'],['codec not supported in container','format'],['Requested format is not available','stream']])assert.equal(failureInfo(prefix+raw).code,code);
});
test('busca combinada sem acento, filtros de situação/fonte e registros limpos',()=>{
 const base={url:'https://vimeo.com/123',source:'Vimeo',createdAt:'2026-10-25T12:00:00Z',files:[{name:'Canção de teste.mp4'}]},items=[{...base,id:'1',state:'completed'},{...base,id:'2',state:'failed',clearedAt:'now'},{...base,id:'3',state:'queued'}];
 assert.deepEqual(filterDownloads(items,{query:'cancao vimeo',state:'completed'}).map(j=>j.id),['1']);assert.deepEqual(filterDownloads(items,{state:'cleared'}).map(j=>j.id),['2']);assert.deepEqual(filterDownloads(items,{state:'active'}).map(j=>j.id),['3']);assert.equal(filterDownloads(items,{source:'YouTube / Music'}).length,0);
});
test('pasta por job, fila pausada, limpeza/restauração em lote e reinício preservam bytes e vínculos',async()=>{
 const root=resolve('.cache/baixador-v217/test-'+randomUUID()),a=join(root,'Pasta A com acentuação'),b=join(root,'Pasta B');mkdirSync(a,{recursive:true});mkdirSync(b,{recursive:true});let store=new Store(join(root,'db')),calls=0;
 const config={directory:join(root,'db'),minFreeBytes:0,maxBytes:1048576};const runner=async(ex,args,opts)=>{if(args.includes('--check'))return JSON.stringify({ready:true,engine:'fixture'});calls++;const output=args[args.indexOf('--output')+1],path=join(output,'arquivo.mp4');writeFileSync(path,'BYTES DE TESTE ISOLADOS');opts.onLine(JSON.stringify({type:'complete',report:{files:[{path,media:{format:{duration:3},streams:[{codec_type:'video',codec_name:'h264'},{codec_type:'audio',codec_name:'aac'}]}}],reencoded:false}}));};
 const options={python,runner,folderPicker:async()=>({cancelled:true})};let md=new MediaDownloader(store,config,{toolsDirectory:''},{},options);
 try{
 assert.equal(md.settings().folder,md.directory);assert.throws(()=>writableFolder(join(root,'inexistente')));assert.throws(()=>writableFolder('relative'));
 md.configure({paused:true,folder:a});const first=md.enqueue({urls:[urls[0]],container:'mp4'}).jobs[0];assert.equal(calls,0);assert.equal(first.outputRoot,a);assert.throws(()=>md.clear(first.id));md.configure({folder:b});const second=md.enqueue({urls:[urls[2]]}).jobs[0];assert.equal(second.outputRoot,b);assert.equal((await md.chooseFolder()).cancelled,true);assert.equal(md.settings().folder,b);
 md.configure({paused:false});await idle(md);for(const j of [first,second])assert.equal(md.get(j.id).state,'completed');const firstFile=md.file(first.id,0),bytes=readFileSync(firstFile.path);assert.ok(firstFile.path.startsWith(a));assert.ok(md.file(second.id,0).path.startsWith(b));md.update(md.get(first.id),{clipId:'clip-test-preserved'});
 const mixed=md.batch({action:'clear',ids:[first.id,second.id,'unknown']});assert.equal(mixed.changed,2);assert.equal(mixed.results[2].ok,false);assert.deepEqual(readFileSync(md.file(first.id,0).path),bytes);assert.equal(md.get(first.id).clipId,'clip-test-preserved');md.configure({paused:true});await md.close();store.close();store=new Store(config.directory);md=new MediaDownloader(store,config,{toolsDirectory:''},{},options);assert.equal(md.settings().paused,true);assert.equal(md.settings().folder,b);assert.ok(md.get(first.id).clearedAt);assert.equal(md.batch({action:'restore',ids:[first.id,second.id]}).changed,2);assert.equal(md.get(first.id).clearedAt,null);assert.deepEqual(readFileSync(md.file(first.id,0).path),bytes);
 const legacyId=randomUUID(),legacyPath=join(md.directory,legacyId);mkdirSync(legacyPath);writeFileSync(join(legacyPath,'old.mp4'),'old');md.update({id:legacyId,createdAt:new Date().toISOString(),state:'completed',files:[{name:'old.mp4',file:join(legacyId,'old.mp4'),size:3}]},{});assert.equal(readFileSync(md.file(legacyId,0).path,'utf8'),'old');md.configure({folder:''});assert.equal(md.settings().folder,md.directory);
 writeFileSync(join(root,'RESULTADO.json'),JSON.stringify({customFolders:true,oldFolderFallback:true,bytesPreserved:true,clipIdPreserved:true,persistentSettings:true,clearRestore:true}));
 }finally{await md.close();store.close();}
});
test('deduplicação precede o limite; opções irrelevantes do áudio não criam outra tarefa',async()=>{
 const root=resolve('.cache/baixador-v217/test-'+randomUUID()),store=new Store(root),md=new MediaDownloader(store,{directory:root,minFreeBytes:0,maxBytes:100},{},{},{python});try{md.configure({paused:true});const job=md.enqueue({urls:[urls[0]],mode:'audio',container:'mp4',subtitles:true}).jobs[0];for(let i=0;i<499;i++)md.update({id:randomUUID(),createdAt:new Date().toISOString(),url:'https://vimeo.com/'+(100+i),state:'queued'},{});const same=md.enqueue({urls:[urls[0],urls[0]],mode:'audio',container:'mkv',subtitles:false});assert.equal(same.jobs[0].id,job.id);assert.equal(same.added,0);assert.equal(same.duplicates,2);assert.throws(()=>md.enqueue({urls:[urls[2]]}),/fila/);assert.equal(md.batch({action:'cancel',ids:[job.id]}).changed,1);}finally{await md.close();store.close();}
});
test('interrupção por limite de espaço termina como falha, não como cancelamento',async()=>{
 const root=resolve('.cache/baixador-v217/test-'+randomUUID()),store=new Store(root),runner=async(ex,args,{signal})=>new Promise((ok,reject)=>signal.addEventListener('abort',()=>reject(Error('abort')),{once:true}));const md=new MediaDownloader(store,{directory:root,minFreeBytes:0,maxBytes:100},{toolsDirectory:''},{},{python,runner});let checks=0;md.space=()=>{if(checks++)throw Error('Espaço livre insuficiente.');};try{const job=md.enqueue({urls:[urls[0]]}).jobs[0];await idle(md);assert.equal(md.get(job.id).state,'failed');assert.match(md.get(job.id).error,/Espaço/);}finally{await md.close();store.close();}
});
