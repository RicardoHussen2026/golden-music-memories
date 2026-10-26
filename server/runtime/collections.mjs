import {splitCommercials,commercialAudioInSample,measureCommercials} from './commercial-inserts.mjs';
import {addBumpers,bumperSeconds,silentBumperSample} from './bumper-library.mjs';
import {trimRange} from '../../app/quality.js';
import {alignContainer,verifyEncodedAudio} from './render-quality.mjs';
import {measureAudio} from './audio-quality.mjs';
import {readableName} from '../../app/media-names.js';
import {mkdirSync,existsSync,statSync,writeFileSync,renameSync,rmSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {check,stamp} from './store.mjs';
import {fileHash} from './media.mjs';
import {runProcess} from './source-import.mjs';
import {planVideo,videoArguments,artNames} from './video-assembly.mjs';
import {POST_DESTINATIONS,destinationIssues} from '../../app/destinations.js';
import {selectRenderCpu,runRenderCpu} from './render-cpu.mjs';
export function concatArguments(list,output,segments){
 const args=['-hide_banner','-v','error','-y','-filter_complex_threads','1','-protocol_whitelist','file,pipe','-f','concat','-safe','1','-i',list];
 for(const segment of segments)args.push('-i',segment.file);
 const streams=segments.map((segment,i)=>`[${i+1}:a]asetpts=PTS-STARTPTS,aresample=async=1:first_pts=0,apad=whole_dur=${segment.duration},atrim=duration=${segment.duration}[a${i}]`);
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
   check(Array.isArray(input.items)&&input.items.length>0,'Selecione clipes para a sequência.');
   const once=input.openingMode==='once',bumperSelection=this.assembler.bumpers.selection(input,POST_DESTINATIONS[input.destination].format==='16:9'?'horizontal':'vertical');
   const old=input.id?this.get(input.id):null;if(old){check(!['rendering','cancelling'].includes(old.state),'Montagem em andamento.',409);check(old.revision===input.revision,'Seleção mudou. Reabra antes de salvar.',409);check(old.state!=='completed','Resultado concluído é imutável. Salve uma nova seleção.',409);}
   const items=[],issues=[],seenSongs=new Set(),seenHashes=new Set();let total=0;
   for(const [index,item] of input.items.entries()){
    const p=this.store.get('production',item.productionId);check(p&&!p.cancelled,'Produção ausente ou cancelada.');
    const source=this.assembler.source(item.sourceKind,item.sourceId,p.id),measured=await this.assembler.probe(source.path);
    check(!seenSongs.has(p.songId)&&!seenHashes.has(source.hash),'A seleção repete uma música ou o mesmo arquivo.');seenSongs.add(p.songId);seenHashes.add(source.hash);
    const trim=trimRange(item,measured.duration);
    const cover=this.assembler.image(once?(index===0?input.coverId:null):item.coverId,p.id,'cover');if(!cover&&!once)issues.push(`Faixa ${index+1}: associe a capa correspondente antes de renderizar.`);if(!measured.audioCodec)issues.push(`Faixa ${index+1}: fonte sem áudio.`);
    const base=POST_DESTINATIONS[input.destination].base;if(!once&&cover&&measured.duration<3)issues.push(`Faixa ${index+1}: menor que 3 s, não comporta a abertura padrão.`);
    // Target-duration eligibility is checked on the full collection, not on each segment.
    const intro=once&&index===0&&input.introId?this.assembler.intros.get(input.introId):null;
    const coverSeconds=cover?(once?Number(input.coverSeconds??3):3):0;
    const musicFromStart=once&&index===0&&input.musicFromStart===true;
    const prefix=once&&index===0&&!musicFromStart?coverSeconds+(intro?.duration||0):0;
    const plan=planVideo({destination:base==='shorts'?'tiktok':base,coverSeconds,calls:once?[]:item.calls||[],timing:item.timing||'relative',animated:item.animated!==false,fit:once?input.fit:item.fit||'contain',cropX:once?input.cropX:item.cropX,cropY:once?input.cropY:item.cropY},Math.round((trim.duration+prefix)*30)/30);
    if(once){plan.sourceDuration=trim.duration;plan.musicStart=prefix;plan.prefixCover=!musicFromStart;plan.musicFromStart=musicFromStart;if(intro){const info=await this.assembler.probe(intro.path);check(info.width===plan.width&&info.height===plan.height&&Math.abs(info.videoDuration-intro.duration)<.08,'Abertura incompatível ou alterada.');plan.intro={id:intro.id,hash:intro.sha256,duration:intro.duration,label:intro.label};plan.prefixIntro=!musicFromStart;if(musicFromStart)check(coverSeconds+intro.duration<=trim.duration,'A faixa inicial é menor que a capa e a intro.');}if(cover){const image=this.store.get('render_input',input.coverId);check(Math.abs(image.width/image.height-plan.width/plan.height)<=.06||input.coverAspectAcknowledged===true,'Confirme a capa inteira com faixas ou escolha o formato correto.');}}

    plan.trimStart=trim.start;plan.sourceDuration=trim.duration;plan.normalizeAudio=input.normalizeAudio===true;plan.audioCopy=false;plan.audioPresent=!!measured.audioCodec;
    const slots={...(index===0&&bumperSelection.bumperStart?{bumperStart:bumperSelection.bumperStart}:{}),...(index===input.items.length-1&&bumperSelection.bumperEnd?{bumperEnd:bumperSelection.bumperEnd}:{})};if(bumperSeconds(slots)){plan.sourceAudioPresent=!!measured.audioCodec;addBumpers(plan,slots);plan.audioPresent=plan.audioPresent||!!slots.bumperStart?.audio||!!slots.bumperEnd?.audio;}
    const arts={};for(const c of plan.calls){const file=join(this.assembler.artDirectory,artNames[c.key]);check(existsSync(file),'Arte de chamada indisponível.');arts[c.key]=fileHash(file);}
    items.push({productionId:p.id,songId:p.songId,title:p.title,artist:p.artist,sourceKind:item.sourceKind,sourceId:item.sourceId,sourceHash:source.hash,sourceDuration:measured.duration,trimStart:trim.start,trimEnd:trim.end,coverId:cover?(once?input.coverId:item.coverId):null,coverHash:cover?.hash||null,arts,plan,settings:{calls:item.calls||[],timing:item.timing||'relative',animated:item.animated!==false,fit:plan.fit,cropX:plan.cropX,cropY:plan.cropY},start:total,year:item.year||null,genre:String(item.genre||'').slice(0,100)});total+=plan.duration;
   }
   check(['whole','exact'].includes(input.durationMode||'whole'),'Modo de duração inválido.');
   if(input.durationMode==='exact'){
    const target=Math.round(input.targetSeconds*30)/30,last=items.at(-1),delta=total-target;
    check(delta>=-.001,'Faltam músicas para a meta exata. Adicione clipes; não será acrescentado silêncio.');
    check(last.plan.sourceDuration-delta>=1,'A meta termina antes da última faixa. Retire faixas do fim ou aumente a meta.');
    last.plan.duration-=delta;if(last.plan.bodyDuration!==undefined)last.plan.bodyDuration-=delta;last.plan.sourceDuration-=delta;last.trimEnd-=delta;total=target;
    if(last.plan.musicFromStart&&last.plan.intro)check(last.plan.sourceDuration>=last.plan.coverSeconds+last.plan.intro.duration,'A meta corta a abertura. Aumente a duração.');
   }
   check(total<=43200,'Total acima do limite local de 12 horas. Divida em mais de uma produção.');
   if(once){const base=POST_DESTINATIONS[input.destination].base,global=planVideo({destination:base==='shorts'?'tiktok':base,coverSeconds:0,calls:input.calls||[],timing:input.timing||'relative',animated:input.animated!==false},total,43200);
    for(const item of items){item.plan.calls=global.calls.filter(c=>c.start<item.start+item.plan.duration&&c.start+c.duration>item.start).map(c=>{const start=Math.max(0,c.start-item.start),end=Math.min(item.plan.duration,c.start+c.duration-item.start),split=c.start<item.start||c.start+c.duration>item.start+item.plan.duration;return {...c,start,duration:end-start,fade:split?0:c.fade};});for(const c of item.plan.calls){const customId=input[c.key+'Id'],custom=customId?this.assembler.image(customId,items[0].productionId,c.key):null,file=custom?.path||join(this.assembler.artDirectory,artNames[c.key]);check(existsSync(file),'Arte de chamada indisponível.');if(customId)item.artInputs={...item.artInputs,[c.key]:customId};item.arts[c.key]=fileHash(file);}}
   }
const commercialSelection=this.assembler.commercials.selection(input.commercials,total);for(const item of items){const rows=splitCommercials(commercialSelection,item.start,item.plan.duration);if(rows.length){item.plan.commercials=rows;item.plan.audioCopy=false;}}
issues.push(...destinationIssues(input.destination,{duration:total}));if(!items.length)issues.push('Seleção sem mídia real.');
   const c={id:old?.id||randomUUID(),revision:(old?.revision||0)+1,title:input.title.trim(),destination:input.destination,targetSeconds:input.targetSeconds,mode:input.mode||'varied',theme:String(input.theme||'').slice(0,100),items,total,difference:total-input.targetSeconds,wholeTracks:items.every(i=>!i.trimStart&&Math.abs(i.trimEnd-i.sourceDuration)<.02),durationMode:input.durationMode||'whole',preview:input.preview===true,openingMode:once?'once':'per-track',openingSettings:once?{commercials:input.commercials||[],bumperStartId:input.bumperStartId||null,bumperEndId:input.bumperEndId||null,bumperStartAudio:input.bumperStartAudio!==false,bumperEndAudio:input.bumperEndAudio!==false,coverId:input.coverId||null,introId:input.introId||null,coverSeconds:input.coverSeconds||0,musicFromStart:input.musicFromStart===true,calls:input.calls||[],timing:input.timing||'relative'}:null,issues,state:'draft',createdAt:old?.createdAt||stamp(),updatedAt:stamp()};this.store.put('collection',c.id,c);return c;
  }finally{this.preparing=false;}
 }
 sample(id,start=0){const original=this.get(id);start=Number(start);check(Number.isFinite(start)&&start>=0&&start<original.total,'Início da amostra fora da sequência.');const end=Math.min(original.total,start+8),items=original.items.filter(i=>i.start<end&&i.start+i.plan.duration>start).map(i=>({...i,plan:{...i.plan,sample:{start:Math.max(0,start-i.start),duration:Math.min(end,i.start+i.plan.duration)-Math.max(start,i.start)}},start:Math.max(0,i.start-start)}));const c={...original,id:randomUUID(),sample:true,parentCollectionId:id,title:original.title+' · amostra',items,total:end-start,state:'draft',issues:[],revision:1,createdAt:stamp(),updatedAt:stamp()};this.store.put('collection',c.id,c);return c;}

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
     const cover=this.assembler.image(item.coverId,item.productionId,'cover');check(!item.coverHash||cover&&fileHash(cover.path)===item.coverHash,'Capa mudou ou não está disponível.');const intro=item.plan.intro?this.assembler.intros.get(item.plan.intro.id):null;check(!intro||intro.sha256===item.plan.intro.hash,'Abertura mudou; confira novamente.');
     const bumperPaths=this.assembler.bumpers.paths(item.plan),commercialFiles=this.assembler.commercials.paths(item.plan.commercials),arts={};for(const key of Object.keys(item.arts)){arts[key]=item.artInputs?.[key]?this.assembler.image(item.artInputs[key],(c.parentCollectionId?this.get(c.parentCollectionId):c).items[0].productionId,key).path:join(this.assembler.artDirectory,artNames[key]);check(fileHash(arts[key])===item.arts[key],'Arte de chamada mudou; salve novamente.');}
     if(item.plan.normalizeAudio){this.update(c,{phase:'measuring_audio',track:i+1});item.plan.audioNormalization=await measureAudio(this.assembler,source,{start:item.plan.trimStart||0,duration:item.plan.sourceDuration||item.plan.duration,signal:controller.signal});for(const key of ['bumperStart','bumperEnd'])if(item.plan[key]?.audio)item.plan[key].audioNormalization=await measureAudio(this.assembler,{path:bumperPaths[key],hash:item.plan[key].hash},{duration:item.plan[key].duration,signal:controller.signal});await measureCommercials(this.assembler,item.plan,commercialFiles,controller.signal);this.update(c,{items:c.items,phase:'rendering'});}
     const cpuProfile=selectRenderCpu(this.config.renderCpuProfile),segment=join(work,i+'.mp4'),buildArgs=cpu=>{const args=videoArguments({input:source.path,cover:cover?.path,intro:intro?.path,bumpers:bumperPaths,commercialFiles,arts,output:segment,plan:{...item.plan,cpuProfile:cpu}});
     // Consistent AAC sample rate/channel layout for the concatenated stream.
     args.splice(args.indexOf('-t'),0,'-ar','48000','-ac','2');return args;};
     const effectiveCpu=await runRenderCpu(this.runner,this.assembler.tool('ffmpeg'),buildArgs,{cwd:work,signal:controller.signal,timeout:2*3600000,onLine:line=>{const m=/^out_time_us=(\d+)/.exec(line);if(m)this.update(c,{track:i+1,progress:Math.min(94,Math.round((item.start+Number(m[1])/1e6)/c.total*94))});}},cpuProfile,cpu=>this.update(c,{effectiveCpuProfile:cpu}));this.update(c,{effectiveCpuProfile:effectiveCpu});
     check(statSync(segment).size<=this.config.maxBytes,'Segmento acima do limite de arquivo configurado.');
    }
    let segments=c.items.map((item,i)=>({file:i+'.mp4',duration:item.plan.sample?.duration||item.plan.duration})),level=0;this.update(c,{progress:95});
    while(segments.length>24){const grouped=[];for(let i=0;i<segments.length;i+=24){const group=segments.slice(i,i+24),file='merge-'+level+'-'+i+'.mp4',list='merge-'+level+'-'+i+'.txt';writeFileSync(join(work,list),group.map(s=>`file '${s.file}'\nduration ${s.duration}`).join('\n'));await this.runner(this.assembler.tool('ffmpeg'),concatArguments(list,join(work,file),group),{cwd:work,signal:controller.signal,timeout:2*3600000});grouped.push({file,duration:group.reduce((n,s)=>n+s.duration,0)});}segments=grouped;level++;}
    writeFileSync(join(work,'list.txt'),segments.map(s=>`file '${s.file}'\nduration ${s.duration}`).join('\n'));const output=join(work,'collection.mp4');
    await this.runner(this.assembler.tool('ffmpeg'),concatArguments('list.txt',output,segments),{cwd:work,signal:controller.signal,timeout:2*3600000});
    check(!controller.signal.aborted,'Montagem cancelada.');this.update(c,{phase:'validating',progress:98});const aligned=join(work,'aligned.mp4'),measured=await alignContainer(this.assembler,output,aligned,Math.round(c.total*30)/30,controller.signal),expected=c.items[0].plan;
    const audioVerification=c.items.every(i=>i.plan.normalizeAudio)?await verifyEncodedAudio(this.assembler,aligned,controller.signal,{expectedSilence:c.items.every(i=>silentBumperSample(i.plan)&&!commercialAudioInSample(i.plan))}):null;
    check(measured.width===expected.width&&measured.height===expected.height&&measured.audioCodec==='aac'&&Math.abs(measured.duration-c.total)<Math.max(.3,c.items.length*.06),'Coletânea fora da duração, resolução ou áudio previstos.');
    check(statSync(output).size<=this.config.maxBytes,'Coletânea acima do limite de arquivo configurado.');
    renameSync(aligned,this.file(c.id));this.update(c,{audioVerification,state:'completed',progress:100,actualDuration:measured.duration,size:statSync(this.file(c.id)).size,hash:fileHash(this.file(c.id))});
   }catch(error){this.update(c,{state:storageError?'failed':controller.signal.aborted?'cancelled':'failed',error:storageError?.message||(controller.signal.aborted?'Montagem cancelada; seleção preservada.':error.message)});}
   finally{clearInterval(watch);const target=resolve(work);if(target===resolve(this.directory,'job-'+c.id)&&target.startsWith(resolve(this.directory)+sep))rmSync(target,{recursive:true,force:true});this.running.delete(c.id);}
  });this.running.set(c.id,{controller,promise});return c;
 }
 approve(id,revision){const c=this.get(id);check(c.state==='completed'&&!c.sample,'Gere o vídeo completo antes de aprovar.',409);check(c.revision===revision,'A sequência mudou; reabra antes de aprovar.',409);return c.preview?this.update(c,{preview:false,revision:c.revision+1}):c;}
 downloadName(c){return readableName('Golden Music Memories',c.title,POST_DESTINATIONS[c.destination].label+' - '+c.items.length+' faixas',1,'mp4');}
 file(id){check(/^[a-f\d-]{36}$/.test(id),'Identificador inválido.');return join(this.directory,id+'.mp4');}
 cancel(id){const r=this.running.get(id);check(r,'Não há montagem ativa.',409);this.update(this.get(id),{state:'cancelling'});r.controller.abort();return this.get(id);}
 async close(){this.closed=true;for(const r of this.running.values())r.controller.abort();await Promise.allSettled([...this.running.values()].map(r=>r.promise));}
}
