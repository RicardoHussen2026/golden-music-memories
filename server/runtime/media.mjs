import {openSync,closeSync,readSync,statSync,existsSync,mkdirSync,writeSync,truncateSync,unlinkSync,statfsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {check,stamp,sha} from './store.mjs';

export function mediaPath(directory,id){check(/^[a-f\d-]{36}$/.test(id),'Identificador de mídia inválido.');return join(directory,'media',id+'.mp4');}
export function readRange(path,start,length){const fd=openSync(path,'r');try{const b=Buffer.alloc(length);return b.subarray(0,readSync(fd,b,0,length,start));}finally{closeSync(fd);}}
export function fileHash(path,algorithm='sha256'){const hash=createHash(algorithm),fd=openSync(path,'r'),buffer=Buffer.alloc(4*1024*1024);try{let n;while((n=readSync(fd,buffer,0,buffer.length,null)))hash.update(buffer.subarray(0,n));return hash.digest('hex');}finally{closeSync(fd);}}
export function probeMP4(path){
  const size=statSync(path).size;let duration=0,width=0,height=0,audio=false,video=false,boxes=0,ftyp=false;
  const walk=(start,end,depth=0)=>{check(depth<8,'Estrutura MP4 excessivamente aninhada.');for(let pos=start;pos<end;){check(++boxes<100000,'Estrutura MP4 inválida.');const h=readRange(path,pos,Math.min(32,end-pos));check(h.length>=8,'MP4 incompleto.');let length=h.readUInt32BE(0),head=8;const type=h.toString('ascii',4,8);if(length===1){check(h.length>=16,'Cabeçalho incompleto.');length=Number(h.readBigUInt64BE(8));head=16;}if(length===0)length=end-pos;check(Number.isSafeInteger(length)&&length>=head&&pos+length<=end,'Tamanho de bloco MP4 inválido.');
    if(type==='ftyp')ftyp=true;
    if(['moov','trak','mdia'].includes(type))walk(pos+head,pos+length,depth+1);
    if(type==='mvhd'){const b=readRange(path,pos+head,Math.min(40,length-head));const v=b[0];check(b.length>=(v===1?32:20),'Duração MP4 incompleta.');const scale=b.readUInt32BE(v===1?20:12);duration=scale?(v===1?Number(b.readBigUInt64BE(24)):b.readUInt32BE(16))/scale:0;}
    if(type==='hdlr'){const b=readRange(path,pos+head,Math.min(12,length-head));const kind=b.toString('ascii',8,12);audio ||= kind==='soun';video ||= kind==='vide';}
    if(type==='tkhd'&&length>=head+84){const b=readRange(path,pos+length-8,8);width=Math.max(width,b.readUInt32BE(0)/65536);height=Math.max(height,b.readUInt32BE(4)/65536);}
    pos+=length;
  }};
  walk(0,size);check(ftyp&&video&&Number.isFinite(duration)&&duration>0,'MP4 precisa ter vídeo e duração identificáveis.');return {duration,width,height,audio,size};
}

export class MediaLibrary{
  constructor(store,config){Object.assign(this,{store,config});mkdirSync(join(config.directory,'media'),{recursive:true,mode:0o700});}
  list({includeTrashed=false}={}){return this.store.list('media').filter(m=>includeTrashed||!m.trashedAt).map(({uploadKey,...m})=>m);}
  get(id){const m=this.store.get('media',id);check(m,'Vídeo não encontrado.',404);return m;}
  begin(input){
    const size=Number(input.size);check(Number.isSafeInteger(size)&&size>0&&size<=this.config.maxBytes,'Tamanho acima do limite configurado.');check(typeof input.name==='string'&&/\.mp4$/i.test(input.name),'Escolha um MP4 final.');
    check(typeof input.uploadKey==='string'&&input.uploadKey.length<=180,'Identificador de retomada inválido.');
    const existing=this.store.list('media').find(m=>m.uploadKey===input.uploadKey);if(existing){check(!existing.trashedAt,'Arquivo na lixeira recuperável; restaure antes de reaproveitar.',409);check(existing.size===size&&existing.name===input.name,'Retomada incompatível.');return existing;}
    this.space(size);const id=randomUUID(),m={id,name:input.name.slice(0,240),size,offset:0,state:'receiving',uploadKey:input.uploadKey,createdAt:stamp(),platforms:[]};this.store.put('media',id,m);return m;
  }
  space(required=0){const s=statfsSync(this.config.directory),free=Number(s.bavail)*Number(s.bsize);check(free-required>=this.config.minFreeBytes,'Espaço insuficiente para transferir mantendo a reserva configurada.',507);return free;}
  append(id,offset,bytes){const m=this.get(id);check(m.state==='receiving','Recebimento encerrado.',409);check(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=this.config.chunkBytes,'Bloco inválido.');const path=mediaPath(this.config.directory,id);
    if(offset<m.offset){check(offset+bytes.length<=m.offset&&sha(readRange(path,offset,bytes.length))===sha(bytes),'Bloco de retomada divergente.',409);return m;}
    check(offset===m.offset&&offset+bytes.length<=m.size,'Retome a posição confirmada.',409);this.space(bytes.length);const fd=openSync(path,existsSync(path)?'r+':'w',0o600);try{check(writeSync(fd,bytes,0,bytes.length,offset)===bytes.length,'Gravação incompleta.');}finally{closeSync(fd);}const next={...m,offset:offset+bytes.length};this.store.put('media',id,next);return next;
  }
  complete(id){const m=this.get(id);if(m.hash)return m;check(m.offset===m.size,'Transferência incompleta.');const path=mediaPath(this.config.directory,id);truncateSync(path,m.size);const measured=probeMP4(path),hash=fileHash(path),md5=fileHash(path,'md5');
    const duplicate=this.store.list('media').find(x=>x.id!==id&&!x.trashedAt&&x.hash===hash&&existsSync(mediaPath(this.config.directory,x.id)));
    if(duplicate){unlinkSync(path);this.store.delete('media',id);return {...duplicate,duplicateOf:duplicate.id};}
    const next={...m,...measured,hash,md5,state:'editing',verifiedAt:stamp()};this.store.put('media',id,next);return next;
  }
  describe(id,input){const m=this.get(id);check(m.hash,'Finalize a transferência primeiro.');const platforms=[...new Set(input.platforms||[])];check(platforms.length&&platforms.every(p=>['youtube','tiktok'].includes(p)),'Selecione ao menos uma plataforma.');
    const production=this.store.get('production',input.productionId);check(production,'Sincronize e selecione a produção correspondente.');
    check(typeof input.title==='string'&&input.title.trim().length>0&&input.title.length<=100,'Título precisa ter entre 1 e 100 caracteres.');check(String(input.description||'').length+String(input.hashtags||'').length<=4900,'Descrição muito longa.');
    check(['editing','ready'].includes(input.state),'Estado inválido.');const until=input.licenseUntil===undefined?(m.licenseUntil||''):(input.licenseUntil||'');const rightsConfirmed=input.rightsConfirmed===undefined?m.rightsConfirmed===true:input.rightsConfirmed===true;check(input.licenseUntil===undefined||!until||/^\d{4}-\d\d-\d\d$/.test(until)&&new Date(until+'T00:00:00Z').toISOString().slice(0,10)===until,'Validade inválida.');
    if(input.state==='ready')check(input.audioReady===true&&m.audio&&rightsConfirmed,'Vídeo pronto exige faixa de áudio e declaração de direitos.');
    check(!this.store.list('slot').some(s=>s.mediaId===id&&['reserved','queued','reconcile','reconnect'].includes(s.state)),'Vídeo reservado na agenda. Pause e cancele a tarefa antes de alterar.',409);
    const next={...m,productionId:production.id,productionVersion:production.version,songId:production.songId,artist:production.artist,decade:production.decade,platforms,title:input.title.trim(),description:String(input.description||''),hashtags:String(input.hashtags||''),state:input.state,localFinished:input.localFinished===undefined?m.localFinished===true:input.localFinished===true,rightsConfirmed,audioReady:input.audioReady===true,licenseUntil:until,updatedAt:stamp()};this.store.put('media',id,next);return next;
  }
  records(input){check(Array.isArray(input.productions)&&input.productions.length<=10000,'Produções inválidas.');check(Array.isArray(input.publications)&&input.publications.length<=20000,'Publicações inválidas.');
    return this.store.transaction(()=>{check(!input.accounts||Array.isArray(input.accounts)&&input.accounts.length<=5000,'Contas locais inválidas.');for(const a of input.accounts||[]){check(typeof a.id==='string'&&a.id.length>0&&a.id.length<=180&&['youtube','tiktok','facebook','instagram','rumble','odysee'].includes(a.platform)&&typeof a.label==='string'&&a.label.trim()&&a.label.length<=120,'Identificação de conta inválida.');const old=this.store.get('posting_account',a.id);check(!old||old.platform===a.platform,'Conta não pode trocar de plataforma.',409);this.store.put('posting_account',a.id,{id:a.id,platform:a.platform,label:a.label});}for(const p of input.productions){check(p.id&&p.songId&&Number.isInteger(p.version)&&p.version>0,'Produção inválida.');this.store.put('production',p.id,{id:String(p.id),songId:String(p.songId),version:p.version,title:String(p.title||''),artist:String(p.artist||''),decade:Number(p.decade)||0,cancelled:p.cancelled===true});}for(const p of input.publications){if(p.status==='published'||p.status==='archived'&&p.publishedAt&&p.url)this.record({...p,source:'browser'});}return {productions:input.productions.length,publications:input.publications.length};});
  }
  record(input){check(['youtube','tiktok'].includes(input.platform),'Plataforma inválida.');const p=this.store.get('production',input.productionId);check(p,'Produção não encontrada.');const u=new URL(input.url);check(u.protocol==='https:'&&(['youtube.com','www.youtube.com','youtu.be','m.youtube.com','www.tiktok.com','tiktok.com'].includes(u.hostname)),'Use o endereço HTTPS da publicação.');check(input.platform==='youtube'?['youtube.com','www.youtube.com','youtu.be','m.youtube.com'].includes(u.hostname):['www.tiktok.com','tiktok.com'].includes(u.hostname),'O link não corresponde à plataforma.');const at=new Date(input.publishedAt).toISOString();check(Date.parse(at)<=Date.now()+60000,'Data efetiva não pode estar no futuro.');const previous=input.browserPublicationId?this.store.list('publication').find(x=>x.browserPublicationId===input.browserPublicationId):input.id?this.store.list('publication').find(x=>x.browserPublicationId===input.id):null;
    const linked=previous||(input.servicePublicationId?this.store.get('publication',input.servicePublicationId):null);const id=linked?.id||sha(input.platform+':'+u.href),old=this.store.get('publication',id),collision=this.store.list('publication').find(x=>x.url===u.href&&x.id!==id);check(!collision,'Link já registrado; confira a postagem antes de corrigir.',409);if(old)check(old.productionId===p.id&&old.platform===input.platform,'Link já associado a outra produção.',409);
    const mid=input.mediaId||input.serviceMediaId||(input.localRenderAssetId?this.store.get('render_asset',input.localRenderAssetId)?.mediaId:null)||old?.mediaId,m=mid?this.get(mid):null;check(!m||m.productionId===p.id&&m.platforms.includes(input.platform),'Vídeo incompatível com a produção/destino.');
    const account=input.postingAccountId===undefined?old?.postingAccountId||null:input.postingAccountId;check(!account||typeof account==='string'&&account.length<=180,'Conta inválida.');if(account){const known=this.store.get('posting_account',account)||this.store.get('connection',account);check(known&&known.platform===input.platform,'Conta não pertence à plataforma; sincronize sua identificação.',409);}const label=input.postingAccountLabel===undefined?old?.postingAccountLabel||null:String(input.postingAccountLabel||'').slice(0,120)||null;
    const row={...old,id,productionId:p.id,productionVersion:p.version,songId:p.songId,artist:p.artist,title:p.title,mediaId:m?.id||null,hash:m?.hash||input.finalFileHash||input.hash||old?.hash||null,platform:input.platform,publishedAt:at,url:u.href,postingAccountId:account,postingAccountLabel:label,...(input.id?{browserPublicationId:input.id}:{}),source:input.source==='browser'?'browser':old?.source||'manual',createdAt:old?.createdAt||stamp()};
    if(old&&JSON.stringify(row)===JSON.stringify(old))return old;
    if(old)this.store.put('ops_event','correction:'+randomUUID(),{id:'correction:'+randomUUID(),at:stamp(),message:'Correção de registro de postagem preservada.',publicationId:id,before:old,after:row});this.store.put('publication',id,row);return row;
  }

  evict(id){const m=this.get(id);check(m.drive?.verified===true,'Só é permitido remover cache com cópia confirmada no Drive.');check(!this.store.list('slot').some(s=>s.mediaId===id&&['reserved','queued','reconcile','reconnect'].includes(s.state)),'Vídeo está reservado na fila.');const path=mediaPath(this.config.directory,id);if(existsSync(path))unlinkSync(path);this.store.put('media',id,{...m,cached:false});return {removed:true};}
}
