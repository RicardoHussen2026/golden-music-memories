import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {Store} from '../server/runtime/store.mjs';
import {MediaDownloader} from '../server/runtime/media-downloader.mjs';
const python=resolve('.cache/media-downloader-env/Scripts/python.exe');
const urls=Array.from({length:501},(_,i)=>'https://youtube.com/watch?v='+String(i).padStart(11,'0'));
function fixture(runner){const root=resolve('.cache/baixador-720-test/'+randomUUID()),store=new Store(join(root,'db'));return {root,store,md:new MediaDownloader(store,{directory:join(root,'db'),minFreeBytes:0,maxBytes:10000},{toolsDirectory:''},{},{python,runner})};}
test('500 links: qualidade e destino por lote persistem; 501 é rejeitado antes de gravar',async()=>{
 const {root,store,md}=fixture(async()=>{});try{md.configure({paused:true});const folder=join(root,'1970');mkdirSync(folder);const result=md.enqueue({urls:urls.slice(0,500),maxHeight:720,destination:folder});assert.equal(result.added,500);assert.ok(result.jobs.every(j=>j.maxHeight===720&&j.outputRoot===folder));assert.equal(md.settings().folder,md.directory);assert.throws(()=>md.enqueue({urls}),/500/);assert.equal(md.jobs().length,500);assert.equal(md.enqueue({urls:[urls[0]],maxHeight:720}).duplicates,1);assert.throws(()=>md.enqueue({urls:[urls[500]],maxHeight:480}),/qualidade/);}finally{await md.close();store.close();}
});
test('duas recusas de verificação pausam a fila sem perder as demais entradas',async()=>{
 let calls=0;const captured=[];const {store,md}=fixture(async(ex,args)=>{calls++;captured.push(args);throw Error('Sign in to confirm you are not a bot');});try{md.configure({paused:true});md.enqueue({urls:urls.slice(0,5),maxHeight:720});md.configure({paused:false});for(let n=0;n<100&&(!md.settings().paused||md.running);n++)await new Promise(r=>setTimeout(r,10));assert.equal(calls,2);assert.equal(md.jobs().filter(j=>j.state==='queued').length,3);assert.equal(md.jobs().filter(j=>j.state==='failed').length,2);assert.equal(md.settings().paused,true);assert.match(md.settings().pauseReason,/duas recusas/);assert.equal(captured[0][captured[0].indexOf('--max-height')+1],'720');assert.match(captured[0][captured[0].indexOf('--archive')+1],/historico_downloads_720p.txt$/);}finally{await md.close();store.close();}
});
