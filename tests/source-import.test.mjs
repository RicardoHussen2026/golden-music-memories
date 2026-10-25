import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,copyFileSync,readFileSync,readdirSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {Store} from '../server/runtime/store.mjs';
import {configuration} from '../server/runtime/config.mjs';
import {SourceImporter,youtubeURL,formatChoices,baseArguments,runProcess} from '../server/runtime/source-import.mjs';
import {createApplication} from '../server/runtime/http.mjs';
import {readableName} from '../app/media-names.js';
import {request} from 'node:http';
const info={id:'abcdefghijk',title:'Faixa própria',artist:'Artista teste',duration:1,availability:'public',formats:[{format_id:'137',ext:'mp4',protocol:'https',vcodec:'h264',acodec:'none',height:1080,fps:30},{format_id:'140',ext:'m4a',protocol:'https',vcodec:'none',acodec:'aac',abr:128}]};
const tools=resolve('.cache/import-tools'),binary=n=>join(tools,n+(process.platform==='win32'?'.exe':''));
const pause=()=>new Promise(r=>setTimeout(r,10));
async function finish(importer){while(importer.running.size)await pause();}
function cleanup(dir){assert.ok(resolve(dir).startsWith(resolve(tmpdir(),'gmm-source-')));rmSync(dir,{recursive:true,force:true});}
test('URLs individuais estritas; formatos sem DRM; nomes seguros e parâmetros fixos',()=>{
 for(const host of ['www.youtube.com','music.youtube.com'])assert.equal(youtubeURL('https://'+host+'/watch?v=abcdefghijk&t=3').id,'abcdefghijk');
 assert.equal(youtubeURL('https://youtu.be/abcdefghijk').id,'abcdefghijk');
 for(const u of ['http://youtube.com/watch?v=abcdefghijk','https://youtube.com.evil.test/watch?v=abcdefghijk','https://127.0.0.1/watch?v=abcdefghijk','https://u:p@youtube.com/watch?v=abcdefghijk','https://youtube.com:444/watch?v=abcdefghijk','https://youtube.com/playlist?list=x','https://youtube.com/watch?v=abcdefghijk&list=x','file:///tmp/test','https://youtu.be/../abc'])assert.throws(()=>youtubeURL(u));
 assert.equal(formatChoices(info)[0].id,'137+140');assert.equal(formatChoices(info)[1].role,'audio');
 for(const patch of [{has_drm:true},{age_limit:18},{availability:'premium_only'},{is_live:true},{_type:'playlist'},{formats:[{...info.formats[0],has_drm:true}]}])assert.throws(()=>formatChoices({...info,...patch}));
 assert.equal(readableName('Artista','Música','audio',2,'m4a'),'Artista - Música - Áudio - V2.m4a');assert.doesNotMatch(readableName('../A|x','x:/y','clip',1,'exe;bad'),/[/:|\\]/);
 const args=baseArguments();for(const flag of ['--ignore-config','--no-plugin-dirs','--no-cookies','--no-cookies-from-browser','--no-remote-components'])assert.ok(args.includes(flag));assert.ok(!args.includes('--no-check-certificates'));
});
test('remux real preserva hashes dos fluxos; download simulado associa, deduplica, persiste e cancela',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gmm-source-')),config=configuration({GMM_DATA_DIR:dir,GMM_MIN_FREE_MIB:'0',GMM_MAX_FILE_MIB:'20'});let store=new Store(dir);let importer;
 try{
  const input=join(dir,'sample.mp4'),muxed=join(dir,'sample.mkv');
  await runProcess(binary('ffmpeg'),['-v','error','-f','lavfi','-i','color=c=blue:s=160x90:r=10:d=1','-f','lavfi','-i','sine=frequency=440:duration=1','-c:v','libx264','-c:a','aac','-shortest',input]);
  await runProcess(binary('ffmpeg'),['-v','error','-i',input,'-map','0','-c','copy',muxed]);
  const hashes=async p=>(await runProcess(binary('ffmpeg'),['-v','error','-i',p,'-map','0','-c','copy','-f','streamhash','-hash','sha256','-'])).trim();assert.equal(await hashes(input),await hashes(muxed));
  let downloads=0,hold=false,denied=false;
  const runner=async(exe,args,opts)=>{if(args.includes('--dump-single-json')){if(denied)throw Error('Fonte recusou o acesso.');if(hold)return new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true}));return JSON.stringify(info);}if(args.includes('--format')){downloads++;assert.equal(args.at(-2),'--');assert.ok(!args.includes('--recode-video'));copyFileSync(muxed,args[args.indexOf('--output')+1].replace('%(ext)s','mkv'));opts.onLine('GMM_PROGRESS: 53%');return '';}return runProcess(exe,args,opts);};
  importer=new SourceImporter(store,config,{runner,toolsDirectory:tools});store.put('production','p1',{id:'p1',songId:'s1',version:1});store.put('production','p2',{id:'p2',songId:'s2',version:1});
  assert.throws(()=>importer.inspect({url:'https://youtu.be/abcdefghijk'}),/autorização/);
  const j=importer.inspect({url:'https://music.youtube.com/watch?v=abcdefghijk',inspectOnly:true});await finish(importer);assert.equal(importer.get(j.id).state,'inspected');
  assert.equal(downloads,0);assert.equal(importer.get(j.id).authorizedAt,undefined);assert.throws(()=>importer.start(j.id,{choiceId:'137+140',productionId:'missing'}),/produção/);
  assert.throws(()=>importer.start(j.id,{choiceId:'137;evil',productionId:'p1'}),/Formato/);
  const inputMeta={productionId:'p1',artist:'Artista',title:'Faixa',choiceId:'137+140'};importer.start(j.id,inputMeta);await finish(importer);assert.equal(importer.get(j.id).state,'completed');assert.equal(importer.list().length,1);assert.equal(downloads,1);assert.equal(store.list('media').length,0);const firstAsset=importer.list()[0];assert.equal(firstAsset.authorizedAt,undefined);assert.equal(firstAsset.rights,'pending');assert.ok(firstAsset.downloadRequestedAt);store.put('source_asset',firstAsset.id,{...firstAsset,authorizedAt:'2020-01-01T00:00:00.000Z'});
  const again=async pid=>{const task=importer.inspect({url:'https://youtu.be/abcdefghijk',authorized:true});await finish(importer);importer.start(task.id,{...inputMeta,productionId:pid});await finish(importer);};
  await again('p1');assert.equal(importer.list().length,1);assert.equal(importer.list()[0].authorizedAt,'2020-01-01T00:00:00.000Z');await again('p2');assert.equal(importer.list().length,2);assert.equal(downloads,1);assert.equal(store.list('source_blob').length,1);assert.equal(readdirSync(importer.directory).filter(f=>f.endsWith('.mkv')).length,1);
  const asset=importer.list()[0];assert.equal(asset.name,'Artista - Faixa - Vídeo fonte - V1.mkv');assert.ok(existsSync(importer.file(asset.id).path));assert.equal(asset.rights,'pending');
  hold=true;const waiting=importer.inspect({url:'https://youtu.be/abcdefghijk',authorized:true});await pause();assert.throws(()=>importer.inspect({url:'https://youtu.be/abcdefghijk',authorized:true}),/Aguarde/);importer.cancel(waiting.id);await finish(importer);assert.equal(importer.get(waiting.id).state,'cancelled');hold=false;denied=true;
  const failed=importer.inspect({url:'https://youtu.be/abcdefghijk',authorized:true});await finish(importer);assert.equal(importer.get(failed.id).state,'failed');
  await importer.close();store.close();store=new Store(dir);importer=new SourceImporter(store,config,{runner,toolsDirectory:tools});assert.equal(importer.list().length,2);assert.ok(existsSync(importer.file(asset.id).path));
 }finally{await importer?.close();store.close();cleanup(dir);}
});
test('processo local: saída limitada e cancelamento encerram execução sem shell',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gmm-source-'));try{const file=join(dir,'child.cjs');writeFileSync(file,'setInterval(()=>process.stdout.write("test\\n"),10)');const controller=new AbortController();const p=runProcess(process.execPath,[file],{signal:controller.signal,timeout:5000});setTimeout(()=>controller.abort(),150);await assert.rejects(p,/cancelada/);await assert.rejects(runProcess(process.execPath,['-e','console.log("x".repeat(10000))'],{maxOutput:100}),/limite/);}finally{cleanup(dir);}
});
test('fonte somente áudio mantém AAC e cancelamento de download remove apenas seus temporários',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gmm-source-')),config=configuration({GMM_DATA_DIR:dir,GMM_MIN_FREE_MIB:'0',GMM_MAX_FILE_MIB:'20'}),store=new Store(dir);let importer;
 try{const audio=join(dir,'original.m4a');await runProcess(binary('ffmpeg'),['-v','error','-f','lavfi','-i','sine=frequency=500:duration=1','-c:a','aac',audio]);let hold=true;
 const runner=async(exe,args,opts)=>{if(args.includes('--dump-single-json'))return JSON.stringify({...info,formats:[info.formats[1]]});if(args.includes('--format')){copyFileSync(audio,args[args.indexOf('--output')+1].replace('%(ext)s',hold?'part':'m4a'));if(hold)return new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('cancel')),{once:true}));return '';}return runProcess(exe,args,opts);};
 importer=new SourceImporter(store,config,{runner,toolsDirectory:tools});store.put('production','p',{id:'p',songId:'s',version:1});const params={productionId:'p',artist:'Teste',title:'Tom próprio',choiceId:'140'};
 const first=importer.inspect({url:'https://music.youtube.com/watch?v=abcdefghijk',authorized:true});await finish(importer);assert.equal(importer.get(first.id).choices.length,1);importer.start(first.id,params);await pause();importer.cancel(first.id);await finish(importer);assert.equal(importer.get(first.id).state,'cancelled');assert.equal(importer.list().length,0);assert.equal(readdirSync(importer.directory).length,0);assert.ok(existsSync(audio));
 hold=false;const next=importer.inspect({url:'https://music.youtube.com/watch?v=abcdefghijk',authorized:true});await finish(importer);importer.start(next.id,params);await finish(importer);const asset=importer.list()[0];assert.equal(asset.role,'audio');assert.equal(asset.extension,'m4a');assert.equal(asset.streams[0].codec,'aac');assert.ok(!asset.streams.some(s=>s.type==='video'));assert.deepEqual(readFileSync(importer.file(asset.id).path),readFileSync(audio));
 }finally{await importer?.close();store.close();cleanup(dir);}
});
test('API de importação mantém autenticação, Host, origem, CSRF e proteção de arquivos',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gmm-source-')),config=configuration({GMM_PORT:'0',GMM_LOCAL_ACCESS:'true',GMM_DATA_DIR:dir});const app=createApplication(config,{sourceImporter:{toolsDirectory:tools,runner:async()=>JSON.stringify(info)}});const address=await app.listen();config.origin='http://127.0.0.1:'+address.port;
 try{const url=config.origin+'/api/source-import';assert.equal((await fetch(url)).status,401);const headers={'Origin':config.origin,'X-GMM-Request':'1','Content-Type':'application/json'};const session=await fetch(config.origin+'/api/session/local',{method:'POST',headers,body:'{}'});headers.Cookie=session.headers.get('set-cookie').split(';')[0];
  for(const patch of [{Origin:'https://evil.example'},{'X-GMM-Request':''},{'X-Forwarded-For':'127.0.0.1'}])assert.equal((await fetch(url,{method:'POST',headers:{...headers,...patch},body:JSON.stringify({url:'https://youtu.be/abcdefghijk',authorized:true})})).status,403,JSON.stringify(patch));
  const hostStatus=await new Promise((resolve,reject)=>{const req=request(url,{method:'POST',headers:{...headers,Host:'evil.example'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);req.end('{}');});assert.equal(hostStatus,403);
  const response=await fetch(url,{method:'POST',headers,body:JSON.stringify({url:'https://youtu.be/abcdefghijk',authorized:true})});assert.equal(response.status,202);await finish(app.sourceImporter);const result=await (await fetch(url,{headers})).json();assert.equal(result.jobs[0].state,'inspected');assert.equal((await fetch(config.origin+'/.cache/publishing-private/sources/anything')).status,404);assert.equal((await fetch(url+'/files/'+crypto.randomUUID(),{headers})).status,404);
 }finally{await app.close();cleanup(dir);}
});
