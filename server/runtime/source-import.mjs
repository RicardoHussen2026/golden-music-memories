import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,readdirSync,statSync,statfsSync,renameSync,unlinkSync,rmSync} from 'node:fs';
import {join,resolve,extname,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {check,stamp} from './store.mjs';
import {fileHash} from './media.mjs';
import {readableName} from '../../app/media-names.js';

const activeStates=new Set(['inspecting','downloading']);
const extensions=new Set(['mp4','m4a','webm','mkv','opus','ogg','aac','mp3','flac','wav']);
export function youtubeURL(input){
 check(typeof input==='string'&&input.length<=2048,'Cole um link de um único vídeo do YouTube ou YouTube Music.');
 let u;try{u=new URL(input);}catch{check(false,'Link inválido.');}
 check(u.protocol==='https:'&&!u.username&&!u.password&&!u.port,'Use HTTPS, sem credenciais ou porta personalizada.');
 check(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be'].includes(u.hostname),'Somente links YouTube e YouTube Music são aceitos.');
 check(!u.searchParams.has('list'),'Listas não são importadas. Cole o link individual sem o parâmetro list.');
 const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.pathname==='/watch'?u.searchParams.get('v'):/^\/(shorts|embed)\//.test(u.pathname)?u.pathname.split('/')[2]:null;
 check(/^[\w-]{11}$/.test(id||''),'O link precisa identificar um vídeo individual.');
 return {id,url:`https://${u.hostname==='music.youtube.com'?'music.youtube.com':'www.youtube.com'}/watch?v=${id}`};
}
export function formatChoices(info){
 check(info._type!=='playlist'&&!info.entries&&!info.is_live&&!['is_live','is_upcoming','post_live'].includes(info.live_status),'Playlists e transmissões ainda em andamento não são aceitas.');
 check(!info.has_drm&&Number(info.age_limit||0)<18&&(!info.availability||['public','unlisted'].includes(info.availability)),'Fonte protegida, restrita ou com acesso condicionado. Não serão usados cookies nem contornos.');
 const formats=(info.formats||[]).filter(f=>/^[a-zA-Z0-9_-]{1,40}$/.test(f.format_id||'')&&!f.has_drm&&extensions.has(f.ext)&&['https','http_dash_segments','m3u8_native'].includes(f.protocol));
 const hasAudio=f=>f.acodec&&f.acodec!=='none',hasVideo=f=>f.vcodec&&f.vcodec!=='none';
 const audio=formats.filter(f=>hasAudio(f)&&!hasVideo(f)).sort((a,b)=>(b.abr||b.tbr||0)-(a.abr||a.tbr||0)||(b.asr||0)-(a.asr||0));
 const videos=formats.filter(hasVideo).sort((a,b)=>(b.height||0)-(a.height||0)||(b.fps||0)-(a.fps||0)||(b.tbr||0)-(a.tbr||0));
 const choices=[];
 for(const v of videos){const a=hasAudio(v)?null:audio[0];if(!hasAudio(v)&&!a)continue;const selector=v.format_id+(a?'+'+a.format_id:'');choices.push({id:selector,role:'clip',extension:a?'mkv':v.ext,label:`Vídeo + áudio · ${v.height||'?'}p · ${v.fps||'?'} fps · ${v.vcodec} / ${a?.acodec||v.acodec} · ${a?'MKV (remux)':v.ext.toUpperCase()}`,estimatedBytes:(v.filesize||v.filesize_approx||0)+(a?.filesize||a?.filesize_approx||0)});}
 for(const a of audio)choices.push({id:a.format_id,role:'audio',extension:a.ext,label:`Áudio · ${a.acodec} · ${Math.round(a.abr||a.tbr||0)||'?'} kb/s · ${a.ext.toUpperCase()}`,estimatedBytes:a.filesize||a.filesize_approx||0});
 check(choices.length,'Nenhum fluxo acessível sem proteção foi encontrado.');return choices.slice(0,100);
}
export function baseArguments(){return ['--ignore-config','--no-plugin-dirs','--no-cache-dir','--no-cookies','--no-cookies-from-browser','--no-playlist','--no-remote-components','--no-js-runtimes','--js-runtimes','node:'+process.execPath,'--socket-timeout','20','--retries','1','--fragment-retries','1','--extractor-retries','1','--no-warnings','--color','never'];}
// No shell, inherited credentials, user-provided flags, plugins or config files.
export function runProcess(executable,args,{signal,onLine,cwd,timeout=120000,maxOutput=16*1024*1024}={}){return new Promise((resolvePromise,reject)=>{
 const env=Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP','PATH','PATHEXT','LANG'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
 const child=spawn(executable,args,{shell:false,windowsHide:true,cwd,env,stdio:['ignore','pipe','pipe']});let output='',pending='',errorText='',failure=null,settled=false;
 const stop=reason=>{if(failure)return;failure=new Error(reason);if(process.platform==='win32'&&child.pid){const killer=spawn(join(process.env.SystemRoot||'C:\\Windows','System32','taskkill.exe'),['/PID',String(child.pid),'/T','/F'],{shell:false,windowsHide:true,stdio:'ignore'});killer.on('error',()=>child.kill());}else child.kill('SIGKILL');};
 const abort=()=>stop('Operação cancelada.');signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 const timer=setTimeout(()=>stop('Tempo limite atingido. Tente novamente mais tarde.'),timeout);
 const done=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):resolvePromise(value);};
 child.stdout.on('data',b=>{if(output.length+b.length>maxOutput){stop('Resposta excedeu o limite seguro.');return;}output+=b.toString();pending+=b.toString();const lines=pending.split(/\r?\n/);pending=lines.pop();for(const l of lines)onLine?.(l);});
 child.stderr.on('data',b=>{errorText=(errorText+b.toString()).slice(-8192);});
 child.on('error',()=>done(new Error('Ferramenta local indisponível. Confira a instalação de yt-dlp e FFmpeg.')));
 child.on('close',code=>{if(pending)onLine?.(pending);if(failure)return done(failure);if(code!==0){const denied=/sign in|login|cookies|private|members|premium|drm|403|429|blocked|not available|unavailable|age.restrict/i.test(errorText);const error=new Error(denied?'A fonte recusou o acesso ou exige autenticação/proteção. O painel não contorna esse bloqueio.':'Não foi possível concluir com os formatos escolhidos. Inspecione novamente; confira conexão e ferramentas locais.');if(/pthread_create|thread creation failed|failed to create thread/i.test(errorText))error.code='RENDER_THREAD_RESOURCE';return done(error);}done(null,output);});
 });}
export class SourceImporter{
 constructor(store,config,{runner=runProcess,toolsDirectory=resolve('.cache/import-tools')}={}){
  Object.assign(this,{store,config,runner,toolsDirectory});this.running=new Map();this.closed=false;this.directory=join(config.directory,'sources');mkdirSync(this.directory,{recursive:true});
  for(const j of store.list('source_job'))if(activeStates.has(j.state)||j.state==='cancelling')store.put('source_job',j.id,{...j,state:'interrupted',error:'Serviço reiniciado. Inspecione novamente; não há retomada automática.',updatedAt:stamp()});
 }
 tool(name){return join(this.toolsDirectory,name+(process.platform==='win32'?'.exe':''));}
 availability(){return {ready:['yt-dlp','ffmpeg','ffprobe'].every(n=>existsSync(this.tool(n))),message:'Requer yt-dlp, FFmpeg e ffprobe locais. Sem cookies, login ou DRM.'};}
 list(productionId){return this.store.list('source_asset').filter(a=>!productionId||a.productionId===productionId);}
 status(){return {tools:this.availability(),jobs:this.store.list('source_job').slice(-30),assets:this.list()};}
 update(job,patch){Object.assign(job,patch,{updatedAt:stamp()});this.store.put('source_job',job.id,job);}
 get(id){const j=this.store.get('source_job',id);check(j,'Importação não encontrada.',404);return j;}
 space(bytes=0){const s=statfsSync(this.directory);check(Number(s.bavail)*Number(s.bsize)>bytes+this.config.minFreeBytes,'Espaço livre insuficiente.');}
 launch(job,work){check(!this.closed,'Serviço encerrando.',503);check(this.running.size===0,'Aguarde ou cancele a importação atual.',409);const controller=new AbortController();const promise=Promise.resolve().then(()=>work(controller.signal)).catch(e=>this.update(job,{state:controller.signal.aborted?'cancelled':'failed',error:e.message})).finally(()=>this.running.delete(job.id));this.running.set(job.id,{controller,promise});return job;}
 inspect(input){
  check(this.availability().ready,'Instale as ferramentas locais indicadas no guia do importador.',503);check(input.inspectOnly===true||input.authorized===true,'Solicite uma consulta de metadados ou confirme a autorização.');
  const source=youtubeURL(input.url);const job={id:randomUUID(),state:'inspecting',source,createdAt:stamp(),inspectedAt:stamp()};
  return this.launch(job,async signal=>{this.update(job,{});const output=await this.runner(this.tool('yt-dlp'),[...baseArguments(),'--skip-download','--dump-single-json','--',source.url],{signal,cwd:this.directory});const info=JSON.parse(output);check(info.id===source.id,'A fonte retornou outro vídeo.');const choices=formatChoices(info);this.update(job,{state:'inspected',title:String(info.track||info.title||'').slice(0,180),artist:String(info.artist||info.uploader||'').slice(0,180),duration:info.duration||null,license:String(info.license||'Não informada pela fonte').slice(0,300),choices});});
 }
 start(id,input){
  const job=this.get(id);check(job.state==='inspected','Inspecione o link antes de baixar.');
  const production=this.store.get('production',input.productionId);check(production&&!production.cancelled,'Escolha uma produção existente.');const choice=job.choices.find(c=>c.id===input.choiceId);check(choice,'Formato não oferecido nesta inspeção.');
  check(typeof input.artist==='string'&&input.artist.trim()&&typeof input.title==='string'&&input.title.trim(),'Confira artista e música para identificar o arquivo.');
  const identity={productionId:production.id,songId:production.songId,artist:input.artist.slice(0,180),title:input.title.slice(0,180),source:job.source,choice,downloadRequestedAt:stamp()};
  const known=this.store.list('source_blob').find(b=>b.sourceId===job.source.id&&b.choiceId===choice.id&&existsSync(join(this.directory,b.file)));
  if(known){const asset=this.associate(known,identity);this.update(job,{state:'completed',assetId:asset.id,reused:true,progress:100});return job;}
  check(!choice.estimatedBytes||choice.estimatedBytes<=this.config.maxBytes,'Formato excede o limite de tamanho configurado.');this.space((choice.estimatedBytes||this.config.maxBytes)*2);
  return this.launch(job,async signal=>{
   this.update(job,{state:'downloading',progress:0});const work=join(this.directory,'job-'+job.id);mkdirSync(work,{recursive:true});let watchdog;
   try{
    watchdog=setInterval(()=>{try{let bytes=0;for(const file of readdirSync(work)){const stat=statSync(join(work,file));if(stat.isFile())bytes+=stat.size;}if(bytes>this.config.maxBytes*2)throw Error('Limite de tamanho atingido.');this.space();}catch{this.running.get(job.id)?.controller.abort();}},1000);
    await this.runner(this.tool('yt-dlp'),[...baseArguments(),'--no-simulate','--no-overwrites','--max-filesize',String(this.config.maxBytes),'--format',choice.id,'--merge-output-format','mkv','--ffmpeg-location',this.toolsDirectory,'--fixup','never','--newline','--progress','--progress-delta','1','--progress-template','download:GMM_PROGRESS:%(progress._percent_str)s','--output',join(work,'source.%(ext)s'),'--',job.source.url],{signal,cwd:work,timeout:3600000,maxOutput:4*1024*1024,onLine:line=>{const m=/^GMM_PROGRESS:\s*([\d.]+)%/.exec(line);if(m)this.update(job,{progress:Math.min(99,Number(m[1])),progressNote:'Progresso do fluxo atual; junção ocorre ao final.'});}});
    check(!signal.aborted,'Operação cancelada.');const files=readdirSync(work).filter(n=>/^source\.[a-z0-9]+$/.test(n)&&extensions.has(extname(n).slice(1)));check(files.length===1,'Download não gerou um único arquivo completo.');const path=join(work,files[0]),size=statSync(path).size;check(size>0&&size<=this.config.maxBytes,'Arquivo vazio ou acima do limite.');
    const probe=JSON.parse(await this.runner(this.tool('ffprobe'),['-v','error','-show_streams','-show_format','-of','json',path],{signal,timeout:60000}));const streams=(probe.streams||[]).map(s=>({type:s.codec_type,codec:s.codec_name,width:s.width,height:s.height,sampleRate:s.sample_rate}));check(streams.some(s=>s.type==='audio')&&(choice.role!=='clip'||streams.some(s=>s.type==='video')),'Arquivo final não contém os fluxos esperados.');
    const hash=fileHash(path),extension=extname(path).slice(1),previous=this.store.get('source_blob',hash);let blob=previous;
    if(!blob||!existsSync(join(this.directory,blob.file))){const file=hash+'.'+extension;renameSync(path,join(this.directory,file));blob={id:hash,hash,file,size,extension,streams,duration:Number(probe.format?.duration)||job.duration,sourceId:job.source.id,choiceId:choice.id,createdAt:stamp()};this.store.put('source_blob',hash,blob);}
    const asset=this.associate(blob,identity);this.update(job,{state:'completed',assetId:asset.id,reused:!!previous,progress:100});
   }finally{clearInterval(watchdog);const target=resolve(work);if(target.startsWith(resolve(this.directory)+sep)&&target===resolve(this.directory,'job-'+job.id))rmSync(target,{recursive:true,force:true});}
  });
 }
 associate(blob,input){const existing=this.list(input.productionId).find(a=>a.hash===blob.hash&&a.role===input.choice.role);if(existing)return existing;const version=Math.max(0,...this.list(input.productionId).filter(a=>a.role===input.choice.role).map(a=>a.version))+1;
  const asset={id:randomUUID(),productionId:input.productionId,songId:input.songId,hash:blob.hash,size:blob.size,extension:blob.extension,streams:blob.streams,role:input.choice.role,version,name:readableName(input.artist,input.title,input.choice.role,version,blob.extension),artist:input.artist,title:input.title,source:input.source,quality:input.choice.label,downloadRequestedAt:input.downloadRequestedAt,rights:'pending',createdAt:stamp()};this.store.put('source_asset',asset.id,asset);return asset;
 }
 file(id){const asset=this.store.get('source_asset',id);check(asset,'Material não encontrado.',404);const blob=this.store.get('source_blob',asset.hash);check(blob&&/^[a-f0-9]{64}\.[a-z0-9]+$/.test(blob.file),'Arquivo não encontrado.',404);const path=join(this.directory,blob.file);check(existsSync(path),'Material indisponível neste computador.',404);return {asset,path};}
 cancel(id){const running=this.running.get(id);check(running,'Não há processo ativo para cancelar.',409);const job=this.get(id);this.update(job,{state:'cancelling'});running.controller.abort();return job;}
 async close(){this.closed=true;for(const r of this.running.values())r.controller.abort();await Promise.allSettled([...this.running.values()].map(r=>r.promise));}
}
