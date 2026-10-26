import test from 'node:test';
import assert from 'node:assert/strict';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Store} from '../server/runtime/store.mjs';
import {MediaDownloader} from '../server/runtime/media-downloader.mjs';
import {filterDownloads} from '../app/downloader-model.js';

const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function idle(md){for(let i=0;i<400&&md.running;i++)await pause(25);assert.equal(md.running,null);}
const python=resolve('.cache/media-downloader-env/Scripts/python.exe');

test('busca por número da faixa não encontra milissegundos de outro registro',()=>{
 const base={state:'queued',url:'https://vimeo.com/123',createdAt:'2026-10-26T04:00:00.500Z'};
 const items=[{...base,sourceTitle:'Faixa de teste 500'},{...base,sourceTitle:'Faixa de teste 371'}];
 assert.deepEqual(filterDownloads(items,{query:'Faixa de teste 500'}),[items[0]]);
 assert.equal(filterDownloads(items,{query:'26/10/2026'}).length,2);
});

test('playlist de 501: expansão persistente, deduplicação, retentativa e reinício sem perder destinos',async()=>{
 const root=resolve('.cache/baixador-v219/playlist-'+randomUUID());
 const store=new Store(join(root,'db'));
 const config={directory:join(root,'db'),minFreeBytes:0,maxBytes:1048576};
 let md,expansions=0;
 const runner=async(ex,args,opts)=>{
  assert.ok(args.includes('--expand'),'nenhum vídeo externo deve ser baixado neste ensaio');
  assert.match(args[args.indexOf('--archive')+1],/historico_downloads\.txt$/);
  expansions++;
  md.configure({paused:true});
  for(let i=0;i<501;i++)opts.onLine(JSON.stringify({type:'entry',url:'https://youtube.com/watch?v='+String(i).padStart(11,'0'),title:'Faixa '+i,playlistTitle:'Coleção de teste'}));
  opts.onLine(JSON.stringify({type:'complete',report:{playlist:true,count:501,files:[]}}));
 };
 md=new MediaDownloader(store,config,{toolsDirectory:''},{},{python,runner});
 try{
  const first=md.enqueue({urls:['https://youtube.com/playlist?list=PLTEST501']}).jobs[0];await idle(md);
  assert.equal(md.get(first.id).state,'completed');assert.equal(md.get(first.id).added,501);
  const children=md.jobs().filter(j=>j.parentPlaylistId===first.id);
  assert.equal(children.length,501);assert.ok(children.every(j=>j.state==='queued'&&j.outputRoot===md.directory));
  assert.equal(filterDownloads(children,{query:'Faixa 500'}).length,1);
  md.update(children[0],{state:'failed',error:'Falha sintética'});
  md.enqueue({urls:['https://youtube.com/playlist?list=PLTEST501']});md.configure({paused:false});await idle(md);
  assert.equal(expansions,2);assert.equal(md.jobs().length,503);
  assert.equal(md.get(children[0].id).state,'queued');
  assert.throws(()=>md.cancel(first.id));assert.equal(md.get(children[1].id).state,'queued','cancelamento inválido não altera filhos');
  await md.close();
  md=new MediaDownloader(store,config,{toolsDirectory:''},{},{python,runner});
  assert.equal(md.jobs().filter(j=>j.parentPlaylistId&&j.state==='paused').length,501);
  const result=md.batch({action:'resume',ids:children.map(j=>j.id)});
  assert.equal(result.changed,501);assert.equal(md.jobs().filter(j=>j.state==='queued').length,501);
 }finally{await md.close();store.close();}
});

test('progresso estruturado, histórico ignorado e erros não viram arquivos concluídos',async()=>{
 const root=resolve('.cache/baixador-v219/events-'+randomUUID()),store=new Store(join(root,'db'));
 const captured=[];
 const runner=async(ex,args,opts)=>{
  captured.push(args);
  opts.onLine(JSON.stringify({type:'progress',percent:42.5,speed:2500000,eta:30,title:'Banda — Música'}));
  opts.onLine(JSON.stringify({type:'complete',report:{skipped:true,files:[]}}));
 };
 const md=new MediaDownloader(store,{directory:join(root,'db'),minFreeBytes:0,maxBytes:100000},{toolsDirectory:''},{},{python,runner});
 try{
  const j=md.enqueue({urls:['https://youtube.com/watch?v=FixtureOne1']}).jobs[0];await idle(md);
  const done=md.get(j.id);assert.equal(done.currentTitle,'Banda — Música');assert.equal(done.speed,2500000);assert.equal(done.eta,30);assert.equal(done.skipped,true);assert.deepEqual(done.files,[]);assert.throws(()=>md.file(j.id,0));
  assert.equal(captured[0][captured[0].indexOf('--container')+1],'mp4');
  assert.equal(filterDownloads([done],{query:'musica'}).length,1);
  md.runner=async()=>{};
  const failed=md.enqueue({urls:['https://youtube.com/watch?v=FailedTest1']}).jobs[0];await idle(md);
  assert.equal(md.get(failed.id).state,'failed');
 }finally{await md.close();store.close();}
});
