import {mkdirSync,existsSync,statSync,writeFileSync,renameSync,rmSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {check,stamp} from './store.mjs';
import {fileHash} from './media.mjs';
import {runProcess} from './source-import.mjs';
import {planVideo,videoArguments,artNames} from './video-assembly.mjs';
import {POST_DESTINATIONS,destinationIssues} from '../../app/destinations.js';
export function concatArguments(list,output,segments){
 const args=['-hide_banner','-v','error','-y','-filter_complex_threads','1','-protocol_whitelist','file,pipe','-f','concat','-safe','1','-i',list];
 for(const segment of segments)args.push('-i',segment.file);
 const streams=segments.map((segment,i)=>`[${i+1}:a]atrim=duration=${segment.duration},asetpts=PTS-STARTPTS[a${i}]`);
 streams.push(segments.map((_,i)=>'[a'+i+']').join('')+'concat=n='+segments.length+':v=0:a=1[audio]');
 args.push('-filter_complex',streams.join(';'),'-map','0:v:0','-map','[audio]','-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-movflags','+faststart','-progress','pipe:1','-nostats',output);return args;
}
export class Collections{
 constructor(store,config,assembler,{runner=runProcess}={}){Object.assign(this,{store,config,assembler,runner});this.directory=join(config.directory,'collections');mkdirSync(this.directory,{recursive:true});this.running=new Map();this.preparing=false;for(const c of store.list('collection'))if(['rendering','cancelling'].includes(c.state))this.update(c,{state:'interrupted',error:'Serviço reiniciado. A seleção foi preservada; gere novamente.'});}
 update(c,patch){Object.assign(c,patch,{updatedAt:stamp()});this.store.put('collection',c.id,c);return c;}
 get(id){const c=this.store.get('collection',id);check(c,'Coletânea não encontrada.',404);return c;}
 list(){return this.store.list('collection');}
 async catalog(){
  const rows=[],seenSongs=new Set(),seenHashes=new Set(),unavailable=[];
  for(const p of this.store.list('production')){
   if(p.cancelled||seenSongs.has(p.songId))continue;
   const derived=new Set(this.store.list('render_asset').map(a=>a.mediaId));
   const candidates=this.assembler.sources(p.id).sort((a,b)=>({source:0,input:1,media:2}[a.kind]-{source:0,input:1,media:2}[b.kind]));
   // A finalized derivative is a fallback for the same song, never another song.
   candidates.sort((a,b)=>Number(derived.has(a.id))-Number(derived.has(b.id)));
   for(const ref of candidates)try{const source=this.assembler.source(ref.kind,ref.id,p.id);if(seenHashes.has(source.hash))continue;const m=await this.assembler.probe(source.path);if(!m.audioCodec){unavailable.push({productionId:p.id,reason:'Fonte sem áudio'});continue;}rows.push({productionId:p.id,songId:p.songId,title:p.title,artist:p.artist,sourceKind:ref.kind,sourceId:ref.id,hash:source.hash,duration:m.duration,derived:derived.has(ref.id),preset:this.store.get('render_preset',p.id)||null});seenSongs.add(p.songId);seenHashes.add(source.hash);break;}catch{unavailable.push({productionId:p.id,reason:'Arquivo local indisponível ou incompatível'});}
  }return {candidates:rows,unavailable};
 }
 async save(input){
  check(!this.preparing,'Aguarde a conferência atual.',409);this.preparing=true;
  try{
   check(typeof input.title==='string'&&input.title.trim()&&input.title.length<=160,'Informe título até 160 caracteres.');
   check(Number.isFinite(input.targetSeconds)&&input.targetSeconds>=1&&input.targetSeconds<=43200,'Meta entre 1 segundo e 12 horas.');
   check(['varied','year','genre','manual'].includes(input.mode||'varied'),'Tema inválido.');
   check(Object.hasOwn(POST_DESTINATIONS,input.destination),'Escolha plataforma/formato.');
   check(Array.isArray(input.items)&&input.items.length<=100,'Selecione até 100 faixas.');
   const old=input.id?this.get(input.id):null;if(old){check(!['rendering','cancelling'].includes(old.state),'Montagem em andamento.',409);check(old.revision===input.revision,'Seleção mudou. Reabra antes de salvar.',409);check(old.state!=='completed','Resultado concluído é imutável. Salve uma nova seleção.',409);}
   const items=[],issues=[],seenSongs=new Set(),seenHashes=new Set();let total=0;
   for(const [index,item] of input.items.entries()){
    const p=this.store.get('production',item.productionId);check(p&&!p.cancelled,'Produção ausente ou cancelada.');
    const source=this.assembler.source(item.sourceKind,item.sourceId,p.id),measured=await this.assembler.probe(source.path);
    check(!seenSongs.has(p.songId)&&!seenHashes.has(source.hash),'A seleção repete uma música ou o mesmo arquivo.');seenSongs.add(p.songId);seenHashes.add(source.hash);
    const cover=this.assembler.image(item.coverId,p.id,'cover');if(!cover)issues.push(`Faixa ${index+1}: associe a capa correspondente antes de renderizar.`);if(!measured.audioCodec)issues.push(`Faixa ${index+1}: fonte sem áudio.`);
    const base=POST_DESTINATIONS[input.destination].base;if(cover&&measured.duration<3)issues.push(`Faixa ${index+1}: menor que 3 s, não comporta a abertura padrão.`);
    // Target-duration eligibility is checked on the full collection, not on each segment.
    const plan=planVideo({destination:base==='shorts'?'tiktok':base,coverSeconds:cover&&measured.duration>=3?3:0,calls:item.calls||[],timing:item.timing||'relative',animated:item.animated!==false,fit:item.fit||'contain',cropX:item.cropX,cropY:item.cropY},measured.duration);
    plan.audioCopy=false;plan.audioPresent=!!measured.audioCodec;
    const arts={};for(const c of plan.calls){const file=join(this.assembler.artDirectory,artNames[c.key]);check(existsSync(file),'Arte de chamada indisponível.');arts[c.key]=fileHash(file);}
    items.push({productionId:p.id,songId:p.songId,title:p.title,artist:p.artist,sourceKind:item.sourceKind,sourceId:item.sourceId,sourceHash:source.hash,coverId:item.coverId||null,coverHash:cover?.hash||null,arts,plan,settings:{calls:item.calls||[],timing:item.timing||'relative',animated:item.animated!==false,fit:plan.fit,cropX:plan.cropX,cropY:plan.cropY},start:total,year:item.year||null,genre:String(item.genre||'').slice(0,100)});total+=measured.duration;
   }
   check(total<=43200,'Total acima do limite local de 12 horas.');issues.push(...destinationIssues(input.destination,{duration:total}));if(!items.length)issues.push('Seleção sem mídia real.');
   const c={id:old?.id||randomUUID(),revision:(old?.revision||0)+1,title:input.title.trim(),destination:input.destination,targetSeconds:input.targetSeconds,mode:input.mode||'varied',theme:String(input.theme||'').slice(0,100),items,total,difference:total-input.targetSeconds,wholeTracks:true,issues,state:'draft',createdAt:old?.createdAt||stamp(),updatedAt:stamp()};this.store.put('collection',c.id,c);return c;
  }finally{this.preparing=false;}
 }
 async start(id,revision){
  check(!this.closed&&!this.preparing&&!this.running.size&&!this.assembler.preparing&&!this.assembler.running.size,'Aguarde a montagem/conferência ativa.',409);
  const c=this.get(id);check(c.revision===revision,'Seleção mudou; confira antes de iniciar.',409);check(['draft','failed','cancelled','interrupted'].includes(c.state),'Coletânea indisponível para nova execução.',409);check(!c.issues.length,c.issues.join(' '));
  this.assembler.space(64*1048576);const controller=new AbortController(),work=join(this.directory,'job-'+c.id);mkdirSync(work,{recursive:true});this.update(c,{state:'rendering',progress:0,error:null});
  const promise=Promise.resolve().then(async()=>{let watch,storageError;
   try{
    watch=setInterval(()=>{try{this.assembler.space();}catch(error){storageError=error;controller.abort();}},1000);
    for(const [i,item] of c.items.entries()){
     check(!controller.signal.aborted,'Montagem cancelada.');this.assembler.space(64*1048576);
     const source=this.assembler.source(item.sourceKind,item.sourceId,item.productionId);check(fileHash(source.path)===item.sourceHash,'Fonte mudou; confira e salve a seleção novamente.');
     const cover=this.assembler.image(item.coverId,item.productionId,'cover');check(cover&&fileHash(cover.path)===item.coverHash,'Capa mudou ou não está disponível.');
     const arts={};for(const key of Object.keys(item.arts)){arts[key]=join(this.assembler.artDirectory,artNames[key]);check(fileHash(arts[key])===item.arts[key],'Arte de chamada mudou; salve novamente.');}
     const segment=join(work,i+'.mp4'),args=videoArguments({input:source.path,cover:cover.path,arts,output:segment,plan:item.plan});
     // Consistent AAC sample rate/channel layout for the concatenated stream.
     args.splice(args.indexOf('-t'),0,'-ar','48000','-ac','2');
     await this.runner(this.assembler.tool('ffmpeg'),args,{cwd:work,signal:controller.signal,timeout:2*3600000,onLine:line=>{const m=/^out_time_us=(\d+)/.exec(line);if(m)this.update(c,{track:i+1,progress:Math.min(94,Math.round((item.start+Number(m[1])/1e6)/c.total*94))});}});
     check(statSync(segment).size<=this.config.maxBytes,'Segmento acima do limite de arquivo configurado.');
    }
    writeFileSync(join(work,'list.txt'),c.items.map((item,i)=>`file '${i}.mp4'\nduration ${item.plan.duration}`).join('\n'));const output=join(work,'collection.mp4');this.update(c,{progress:95});
    await this.runner(this.assembler.tool('ffmpeg'),concatArguments('list.txt',output,c.items.map((item,i)=>({file:i+'.mp4',duration:item.plan.duration}))),{cwd:work,signal:controller.signal,timeout:2*3600000});
    check(!controller.signal.aborted,'Montagem cancelada.');const measured=await this.assembler.probe(output),expected=c.items[0].plan;
    check(measured.width===expected.width&&measured.height===expected.height&&measured.audioCodec==='aac'&&Math.abs(measured.duration-c.total)<Math.max(.3,c.items.length*.06),'Coletânea fora da duração, resolução ou áudio previstos.');
    check(statSync(output).size<=this.config.maxBytes,'Coletânea acima do limite de arquivo configurado.');
    renameSync(output,this.file(c.id));this.update(c,{state:'completed',progress:100,actualDuration:measured.duration,size:statSync(this.file(c.id)).size,hash:fileHash(this.file(c.id))});
   }catch(error){this.update(c,{state:storageError?'failed':controller.signal.aborted?'cancelled':'failed',error:storageError?.message||(controller.signal.aborted?'Montagem cancelada; seleção preservada.':error.message)});}
   finally{clearInterval(watch);const target=resolve(work);if(target===resolve(this.directory,'job-'+c.id)&&target.startsWith(resolve(this.directory)+sep))rmSync(target,{recursive:true,force:true});this.running.delete(c.id);}
  });this.running.set(c.id,{controller,promise});return c;
 }
 file(id){check(/^[a-f\d-]{36}$/.test(id),'Identificador inválido.');return join(this.directory,id+'.mp4');}
 cancel(id){const r=this.running.get(id);check(r,'Não há montagem ativa.',409);this.update(this.get(id),{state:'cancelling'});r.controller.abort();return this.get(id);}
 async close(){this.closed=true;for(const r of this.running.values())r.controller.abort();await Promise.allSettled([...this.running.values()].map(r=>r.promise));}
}
