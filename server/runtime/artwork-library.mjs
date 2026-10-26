import {mkdirSync,copyFileSync,statSync,existsSync} from 'node:fs';
import {join,extname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {check,stamp} from './store.mjs';
import {fileHash} from './media.mjs';
import {selectRenderCpu,runRenderCpu} from './render-cpu.mjs';

// Reusable visual assets share the local service, uploader and FFmpeg already in use.
export class ArtworkLibrary {
 constructor(store,config,assembler){
  Object.assign(this,{store,config,assembler});this.directory=join(config.directory,'artworks');mkdirSync(this.directory,{recursive:true});this.running=new Map();this.closed=false;
  for(const item of this.list())if(item.state==='rendering')this.update(item,{state:'interrupted',error:'Serviço reiniciado. O original foi preservado; gere uma nova variante.'});
 }
 list(){return this.store.list('artwork').sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 get(id){const item=this.store.get('artwork',id);check(item,'Arte não encontrada.',404);return item;}
 update(item,patch){Object.assign(item,patch,{updatedAt:stamp()});return this.store.put('artwork',item.id,item);}
 begin(input){check(!this.closed,'Serviço encerrando.',503);check(['image','video'].includes(input.kind),'Escolha imagem ou vídeo.');check(Number(input.size)<=(input.kind==='image'?20:500)*1048576,'Imagem até 20 MB; vídeo até 500 MB.');return this.assembler.begin({...input,productionId:'artwork-library',purpose:input.kind==='image'?'cover':'video'},{libraryIngest:true});}
 file(id,thumbnail=false){const item=this.get(id);check(item.state==='completed','Arte ainda não concluída.',409);const name=thumbnail?item.thumbnail:item.file;check(/^[a-z0-9-]+\.(mp4|png|jpg|jpeg|webp)$/.test(name),'Arquivo de arte inválido.');const path=join(this.directory,name);check(existsSync(path),'Arquivo indisponível.',404);return {path,item};}
 source(input){
  if(input.introId){const intro=this.assembler.intros.get(input.introId);return {path:intro.path,image:false,duration:intro.duration,sourceIntroId:intro.id,sourceHash:intro.sha256};}
  const asset=this.store.get('render_input',input.inputId);check(asset?.productionId==='artwork-library'&&asset.state==='complete','Carregue a imagem ou abertura primeiro.');
  check(['cover','video'].includes(asset.purpose),'Tipo de arte incompatível.');const path=join(this.assembler.directory,asset.file);check(existsSync(path)&&fileHash(path)===asset.hash,'Original indisponível ou alterado.');
  return {path,image:asset.purpose==='cover',duration:asset.duration,inputId:asset.id,sourceHash:asset.hash};
 }
 async start(input){
  check(!this.closed,'Serviço encerrando.',503);check(['cover','intro'].includes(input.kind),'Tipo de arte inválido.');
  const label=String(input.label||'').trim();check(label.length>0&&label.length<=180,'Dê um nome à arte (até 180 caracteres).');
  const source=this.source(input);check(input.kind!=='cover'||source.image,'Capa pronta precisa ser uma imagem.');
  const format=input.format||'horizontal';check(['horizontal','vertical'].includes(format),'Formato inválido.');
  const duration=Number(input.duration??3),start=Number(input.start??0),fade=Number(input.fade??.35),motion=input.motion||'none',fit=input.fit||'contain';
  if(input.kind==='intro'){
   check(Number.isFinite(duration)&&duration>=1&&duration<=30,'Abertura entre 1 e 30 segundos.');
   check(Number.isFinite(start)&&start>=0&&(source.image?start===0:start+duration<=source.duration+.04),'O trecho ultrapassa a duração do vídeo.');
   check(Number.isFinite(fade)&&fade>=0&&fade<=Math.min(1,duration/2),'Fade entre zero e um segundo, sem ultrapassar metade da abertura.');
   check(['none','gentle'].includes(motion)&&['contain','crop'].includes(fit),'Movimento ou enquadramento inválido.');
  }
  check(this.running.size===0,'Uma abertura está sendo preparada. Aguarde ou cancele antes de gerar outra.',409);
  this.assembler.space(source.image?50*1048576:Math.min(this.config.maxBytes,statSync(source.path).size*2));
  const id='art-'+randomUUID(),item={id,kind:input.kind,label,format,width:format==='horizontal'?1920:1080,height:format==='horizontal'?1080:1920,duration:input.kind==='intro'?duration:0,start,fade,motion,fit,inputId:source.inputId||null,sourceIntroId:source.sourceIntroId||null,sourceHash:source.sourceHash,editorConfig:input.editorConfig||null,state:'rendering',progress:0,createdAt:stamp()};
  this.update(item,{});const controller=new AbortController(),task={controller,promise:null};this.running.set(id,task);
  task.promise=this.render(item,source,controller).finally(()=>this.running.delete(id));return item;
 }
 async render(item,source,controller){
  const path=join(this.directory,item.id+(item.kind==='cover'?extname(source.path):'.mp4'));
  try{
   if(item.kind==='cover')copyFileSync(source.path,path);
   else{
    const {width:w,height:h,duration:d}=item;
    const size=item.fit==='crop'?`scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`:`scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`;
    const filters=[size,'setsar=1','fps=30'];
    if(source.image&&item.motion==='gentle')filters.push(`zoompan=z='1+0.025*sin(on/${Math.max(1,Math.round(d*30)-1)}*PI)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${w}x${h}:fps=30`);
    if(item.fade>0)filters.push(`fade=t=in:d=${item.fade}`,`fade=t=out:st=${d-item.fade}:d=${item.fade}`);
    filters.push('format=yuv420p');let last=0;
    await runRenderCpu(this.assembler.runner,this.assembler.tool('ffmpeg'),cpu=>['-hide_banner','-v','error','-y','-threads',String(cpu.threads),'-filter_threads',String(cpu.filterThreads),...(source.image?['-loop','1']:['-ss',String(item.start)]),'-i',source.path,'-t',String(d),'-vf',filters.join(','),'-an','-c:v','libx264','-preset','veryfast','-crf','18','-threads',String(cpu.threads),'-movflags','+faststart','-progress','pipe:1',path],{signal:controller.signal,timeout:600000,onLine:line=>{const m=/^out_time_us=(\d+)/.exec(line);if(m&&Date.now()-last>500){last=Date.now();this.update(item,{progress:Math.min(99,Math.round(Number(m[1])/1000000/d*100))});}}},selectRenderCpu(this.config.renderCpuProfile));
   }
   controller.signal.throwIfAborted();const media=await this.assembler.probe(path);
   if(item.kind==='intro')check(media.width===item.width&&media.height===item.height&&Math.abs(media.videoDuration-item.duration)<.1&&!media.audioCodec,'Abertura gerada não passou na conferência.');
   // A JPG/WebP cover and the preview PNG have distinct names; PNG cover needs a separate thumbnail.
   const thumbnail=item.id+'-thumb.png',thumbnailPath=join(this.directory,thumbnail);
   await this.assembler.runner(this.assembler.tool('ffmpeg'),['-v','error','-y',...(item.kind==='intro'?['-ss',String(Math.min(item.duration/2,1))]:[]),'-i',path,'-frames:v','1','-vf','scale=360:360:force_original_aspect_ratio=decrease','-threads','1',thumbnailPath],{signal:controller.signal,timeout:60000});
   this.update(item,{state:'completed',progress:100,file:item.id+extname(path),thumbnail,thumbnailHash:fileHash(thumbnailPath),sha256:fileHash(path),size:statSync(path).size,width:media.width,height:media.height,duration:item.kind==='intro'?media.videoDuration:0,format:media.width>=media.height?'horizontal':'vertical',completedAt:stamp()});
  }catch(error){this.update(item,{state:this.closed?'interrupted':controller.signal.aborted?'cancelled':'failed',error:error.message});}
 }
 cancel(id){const item=this.get(id);check(this.running.has(id),'Nenhuma geração em andamento.',409);this.running.get(id).controller.abort();return item;}
 async close(){this.closed=true;for(const task of this.running.values())task.controller.abort();await Promise.allSettled([...this.running.values()].map(t=>t.promise));}
}
