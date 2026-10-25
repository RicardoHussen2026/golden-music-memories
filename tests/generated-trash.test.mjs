import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Store,sha} from '../server/runtime/store.mjs';
import {MediaLibrary} from '../server/runtime/media.mjs';
import {VideoAssembler} from '../server/runtime/video-assembly.mjs';
import {configuration} from '../server/runtime/config.mjs';
import {createServiceSnapshot,restoreServiceSnapshot} from '../server/runtime/storage-backup.mjs';

async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'gmm-generated-trash-')),directory=join(root,'source');await mkdir(directory);
 const config=configuration({GMM_DATA_DIR:directory}),store=new Store(directory),library=new MediaLibrary(store,config),assembler=new VideoAssembler(store,config,library,{list:()=>[]});
 const mid=randomUUID(),jid=randomUUID(),aid=randomUUID(),bytes=Buffer.from('synthetic bytes retained for recovery'),hash=sha(bytes),p={id:'p',songId:'s',artist:'Artista',title:'Música',version:1};
 store.put('production','p',p);store.put('media',mid,{id:mid,name:'Artista - Música.mp4',hash,size:bytes.length,state:'ready',productionId:'p'});await writeFile(join(directory,'media',mid+'.mp4'),bytes);
 store.put('render_asset',aid,{id:aid,productionId:'p',mediaId:mid,jobId:jid,name:'Artista - Música.mp4'});
 store.put('render_job',jid,{id:jid,productionId:'p',mediaId:mid,assetId:aid,preview:false,state:'completed',plan:{destination:'youtube'},createdAt:new Date().toISOString()});
 store.put('render_preset','p',{productionId:'p',sourceKind:'input',sourceId:'source',coverSeconds:3,calls:[{key:'like',start:30}]});
 const source=Buffer.from('source original');await writeFile(join(assembler.directory,'source.mp4'),source);store.put('render_input','source',{id:'source',productionId:'p',purpose:'video',state:'complete',file:'source.mp4',hash:sha(source)});
 return {root,directory,store,library,assembler,mid,jid,aid,bytes};
}
async function close(f){await f.assembler.close();f.store.close();assert.ok(resolve(f.root).startsWith(resolve(tmpdir(),'gmm-generated-trash-')));await rm(f.root,{recursive:true,force:true});}
const consent=i=>({confirm:true,mediaId:i.mediaId,revision:i.revision});

test('vídeo publicado vai à lixeira sem apagar bytes, origem, IDs, recibo ou preset; restaurar é idempotente',async()=>{const f=await fixture();try{
 const publication={id:'pub',mediaId:f.mid,hash:sha(f.bytes),productionId:'p',url:'https://youtu.be/posted',publishedAt:new Date().toISOString()};f.store.put('publication','pub',publication);
 const before=f.store.get('render_preset','p'),impact=f.assembler.generatedImpact(f.jid);assert.equal(impact.publicationCount,1);
 f.assembler.trashGenerated(f.jid,consent(impact));assert.equal(f.library.list().length,0);assert.equal(f.library.list({includeTrashed:true}).length,1);assert.equal(f.assembler.status('p').outputs.length,0);assert.equal(f.assembler.status('p').trashedOutputs.length,1);
 assert.deepEqual(f.store.get('publication','pub'),publication);assert.deepEqual(f.store.get('render_preset','p'),before);assert.equal((await readFile(join(f.assembler.directory,'source.mp4'))).toString(),'source original');assert.deepEqual(await readFile(join(f.directory,'media',f.mid+'.mp4')),f.bytes);
 f.assembler.trashGenerated(f.jid,consent(impact));assert.equal(f.store.list('ops_event').length,1);f.assembler.restoreGenerated(f.jid);f.assembler.restoreGenerated(f.jid);assert.equal(f.library.list()[0].id,f.mid);assert.equal(f.assembler.status('p').outputs[0].id,f.aid);assert.equal(f.store.list('ops_event').length,2);
 }finally{await close(f);}});

test('alvo incorreto, impacto desatualizado, vínculo compartilhado e tarefa reservada exigem proteção',async()=>{const f=await fixture();try{
 const impact=f.assembler.generatedImpact(f.jid);assert.throws(()=>f.assembler.trashGenerated(f.jid,{...consent(impact),mediaId:randomUUID()}));
 f.store.put('render_asset','shared',{id:'shared',productionId:'other',mediaId:f.mid});assert.throws(()=>f.assembler.trashGenerated(f.jid,consent(impact)),/novamente/);
 const shared=f.assembler.generatedImpact(f.jid);assert.deepEqual(shared.sharedProductions,['other']);assert.throws(()=>f.assembler.trashGenerated(f.jid,consent(shared)),/outras produções/);
 f.store.put('slot','active',{id:'active',mediaId:f.mid,state:'reserved'});const reserved=f.assembler.generatedImpact(f.jid);assert.throws(()=>f.assembler.trashGenerated(f.jid,{...consent(reserved),acknowledgeShared:true}),/ativo/);assert.ok(!f.library.get(f.mid).trashedAt);
 f.store.put('slot','active',{id:'active',mediaId:f.mid,state:'published'});const done=f.assembler.generatedImpact(f.jid);f.assembler.trashGenerated(f.jid,{...consent(done),acknowledgeShared:true});assert.ok(f.store.get('render_asset','shared').trashedAt);
 }finally{await close(f);}});

test('descartar prévia não é excluir final; prévia descartada e final na lixeira não podem ser aprovados',async()=>{const f=await fixture();try{
 assert.throws(()=>f.assembler.discardPreview(f.jid),/Somente prévia/);const id=randomUUID();f.store.put('render_job',id,{id,productionId:'p',preview:true,state:'completed'});
 f.assembler.discardPreview(id);assert.throws(()=>f.assembler.savePreview(id),/restaure/);f.assembler.restorePreview(id);assert.ok(!f.assembler.get(id).discardedAt);
 const impact=f.assembler.generatedImpact(f.jid);f.assembler.trashGenerated(f.jid,consent(impact));assert.throws(()=>f.assembler.savePreview(f.jid),/disponível/);assert.throws(()=>f.assembler.source('media',f.mid,'p'),/lixeira/);
 }finally{await close(f);}});

test('backup e restauração isolados mantêm lixeira, publicação e arquivo recuperável',async()=>{const f=await fixture();let recovered;try{
 f.store.put('publication','posted',{id:'posted',productionId:'p',mediaId:f.mid,url:'https://youtu.be/posted',publishedAt:new Date().toISOString()});const impact=f.assembler.generatedImpact(f.jid);f.assembler.trashGenerated(f.jid,consent(impact));
 const snapshot=join(f.root,'snapshot'),restored=join(f.root,'restored');await createServiceSnapshot(f.store,snapshot,{version:'2.9.0'});await restoreServiceSnapshot(snapshot,restored);
 recovered=new Store(restored);assert.ok(recovered.get('media',f.mid).trashedAt);assert.equal(recovered.get('publication','posted').mediaId,f.mid);assert.deepEqual(await readFile(join(restored,'media',f.mid+'.mp4')),f.bytes);
 const library=new MediaLibrary(recovered,{...f.assembler.config,directory:restored}),assembler=new VideoAssembler(recovered,{...f.assembler.config,directory:restored},library,{list:()=>[]});assembler.restoreGenerated(f.jid);assert.equal(library.list()[0].id,f.mid);await assembler.close();
 }finally{recovered?.close();await close(f);}});
