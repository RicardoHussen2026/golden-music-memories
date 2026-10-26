import test from 'node:test';
import assert from 'node:assert/strict';
import {archiveItems,selectFinals,finalArchive,finalPublished,finalDuration} from '../app/final-library.js';

const fixture=()=>({assets:[{id:'browser',productionId:'p',role:'tiktok',name:'Vídeo final.mp4',version:2,createdAt:'2026-10-24T12:00:00Z'},{id:'trash',role:'youtube',trashedAt:'date'}],productions:[{id:'p',songId:'s'}],songIndex:new Map([['s',{title:'Canção do verão',artist:'João Silva',decade:1980}]]),publications:[{id:'unrelated',status:'published',productionId:'other'}],serviceFinals:[{id:'service',jobId:'job',mediaId:'media',storage:'service',productionId:'p',title:'Canção do verão',artist:'João Silva',destination:'shorts',width:1080,height:1920,decade:1980,duration:60,size:1000,createdAt:'2026-10-25T12:00:00Z',url:'/api/assembly/files/job'},{id:'long',collectionId:'long',storage:'service',title:'Uma hora de clássicos',artist:'Golden',destination:'youtube',width:1920,height:1080,decades:[1970,1980],duration:3600,size:2000,createdAt:'2026-10-26T12:00:00Z',url:'/api/collections/long/file'}]});
test('publicação exige referência do arquivo; campos ausentes não vinculam finais',()=>{
 const state=fixture(),items=archiveItems(state);assert.equal(items.length,3);assert.ok(items.every(a=>!a.published));
 assert.equal(finalPublished(items[1],[{status:'published',serviceMediaId:'media'}]),true);
 assert.equal(finalPublished(items[1],[{status:'draft',serviceMediaId:'media'}]),false);
 assert.equal(finalPublished(items[0],[{status:'published',finalAssetId:'browser'}]),true);
 assert.equal(finalPublished(items[1],[{status:'published',localRenderAssetId:'service'}]),true);
 assert.equal(finalPublished(items[2],[{status:'published',collectionId:'different',serviceMediaId:undefined}]),false);
 assert.equal(finalPublished(items[2],[{status:'published',collectionId:'long'}]),true);
});
test('busca por palavras sem acento, formato, década, tipo e situação combinam sem perder versões',()=>{
 const s=fixture(),items=archiveItems(s);assert.deepEqual(selectFinals(items,{archiveQuery:'joao cancao'}).map(a=>a.id),['service','browser']);
 assert.deepEqual(selectFinals(items,{archivePlatform:'youtube',archiveFormat:'vertical',archiveDecade:'1980'}).map(a=>a.id),['service']);
 assert.deepEqual(selectFinals(items,{archiveKind:'collection',archiveDecade:'1970'}).map(a=>a.id),['long']);
 assert.equal(selectFinals(items,{archiveStatus:'published'}).length,0);assert.equal(selectFinals(items,{archiveStatus:'unpublished'}).length,3);
 assert.deepEqual(selectFinals(items,{archiveQuery:'25/10/2026'}).map(a=>a.id),['service']);assert.equal(selectFinals(items,{archiveQuery:'não existe'}).length,0);
 assert.equal(s.assets.length,2);assert.equal(s.serviceFinals.length,2);
});
test('ordenação, década desconhecida e duração não inventam metadados',()=>{
 const s=fixture();s.serviceFinals.push({id:'unknown',storage:'service',title:'Água',url:'/file'});const items=archiveItems(s);
 assert.deepEqual(selectFinals(items,{archiveSort:'newest'}).map(a=>a.id),['long','service','browser','unknown']);
 assert.equal(selectFinals(items,{archiveSort:'duration'})[0].id,'long');assert.equal(selectFinals(items,{archiveSort:'title'})[0].id,'unknown');
 assert.deepEqual(selectFinals(items,{archiveDecade:'unknown'}).map(a=>a.id),['unknown']);
 assert.equal(finalDuration(3600),'1:00:00');assert.equal(finalDuration(239.5),'3:59');assert.equal(finalDuration(undefined),'');
});
test('listagem limita oito itens, mantém ações e não carrega players ou blobs',()=>{
 const s=fixture();s.serviceFinals.push(...Array.from({length:20},(_,i)=>({id:'extra'+i,storage:'service',title:'Extra '+i,url:'/files/'+i,createdAt:'2026-10-26T13:00:00Z'})));
 const helpers={btn:(a,t,x='')=>'<button data-action="'+a+'" '+x+'>'+t+'</button>',mediaURL:()=>{throw Error('Blob não deve ser aberto na listagem');}};
 const html=finalArchive(s,helpers);assert.equal((html.match(/<article /g)||[]).length,8);assert.ok(!html.includes('<video'));assert.ok(html.includes('Página 1 de 3'));
 s.archivePage=99;const last=finalArchive(s,helpers);assert.equal(s.archivePage,2);assert.equal((last.match(/<article /g)||[]).length,7);assert.ok(last.includes('download-asset'));assert.ok(last.includes('prepare-final'));assert.ok(last.includes('open-production'));assert.ok(last.includes('open-long-final'));
 s.archiveQuery='<img src=x onerror=alert(1)>';const empty=finalArchive(s,helpers);assert.equal(s.archivePage,0);assert.ok(empty.includes('Nenhum vídeo com esses filtros'));assert.ok(!empty.includes('<img src=x'));
});
test('serviço indisponível mantém os arquivos do navegador e oferece nova consulta',()=>{
 const s=fixture();s.serviceFinals=[];s.finalLibraryError='Serviço local indisponível para consultar os finais.';
 const html=finalArchive(s,{btn:(a,t)=>'<button data-action="'+a+'">'+t+'</button>'});
 assert.ok(html.includes('Serviço local indisponível'));assert.ok(html.includes('Atualizar lista'));assert.ok(html.includes('Canção do verão'));assert.ok(html.includes('download-asset'));assert.equal((html.match(/<article /g)||[]).length,1);
});
