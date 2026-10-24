import {check,sha,stamp,publicJob} from './store.mjs';
import {randomUUID} from 'node:crypto';

export const canonical=value=>JSON.stringify(value===null||typeof value!=='object'?value:Array.isArray(value)?value.map(v=>JSON.parse(canonical(v))):Object.fromEntries(Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>[k,JSON.parse(canonical(value[k]))])));
export function validateEnvelope(input,config){
  check(input?.schemaVersion===2&&['simulation','real'].includes(input.mode),'Manifesto incompatível.');
  const e=structuredClone(input);
  for(const field of ['publicationId','productionId','assetId','accountId'])check(typeof e[field]==='string'&&e[field].length>0&&e[field].length<=180,'Identificador inválido: '+field);
  check(['youtube','tiktok'].includes(e.platform),'Plataforma inválida.');
  check(Number.isSafeInteger(e.fileSize)&&e.fileSize>0&&e.fileSize<=config.maxBytes,'Arquivo vazio ou acima do limite configurado.');
  check(/^[a-f\d]{64}$/.test(e.fileHash),'Hash SHA-256 inválido.');
  check(Number.isSafeInteger(e.fileVersion)&&e.fileVersion>0&&Number.isSafeInteger(e.productionVersion)&&e.productionVersion>0,'Versão inválida.');
  check(e.audioReady===true,'O vídeo ainda depende de áudio no aplicativo. Use o pacote manual.');
  check(e.metadata&&typeof e.metadata.title==='string'&&e.metadata.title.trim()&&e.metadata.title.length<=(e.platform==='youtube'?100:2200),'Título inválido.');
  check(typeof e.metadata.description==='string'&&typeof e.metadata.hashtags==='string'&&e.metadata.description.length+e.metadata.hashtags.length+1<=5000&&e.metadata.hashtags.length<=2200,'Descrição e hashtags acima do limite.');
  check(Object.keys(e.metadata).every(k=>['title','description','hashtags','plannedAt','timeZone','options'].includes(k)),'Campo de metadados não permitido.');
  check(Object.keys(e.rights||{}).every(k=>['confirmed','productionUntil','assetUntil'].includes(k)),'Campo de direitos não permitido.');
  const o=e.metadata.options||{},allowed=e.platform==='youtube'?['privacy','categoryId','tags','madeForKids','containsSyntheticMedia']:['musicUsageConsent'];
  check(Object.keys(o).every(k=>allowed.includes(k)),'Opção não permitida para esta plataforma.');
  if(e.platform==='youtube'){check(['private','public','unlisted'].includes(o.privacy),'Escolha a visibilidade.');check(!o.categoryId||/^\d{1,3}$/.test(o.categoryId),'Categoria inválida.');check(!o.tags||Array.isArray(o.tags)&&o.tags.every(v=>typeof v==='string')&&o.tags.join(',').length<=500,'Tags inválidas ou acima de 500 caracteres.');}
  if(e.platform==='tiktok'&&e.mode==='real')check(o.musicUsageConsent===true,'Confirme o uso autorizado da música.');
  check(e.metadata.timeZone&&validZone(e.metadata.timeZone),'Fuso horário inválido.');
  if(e.metadata.plannedAt){check(/^\d{4}-\d\d-\d\dT.*Z$/.test(e.metadata.plannedAt)&&Date.parse(e.metadata.plannedAt)>Date.now()+60000,'Agendamento exige data UTC futura, com pelo menos um minuto.');check(e.platform==='youtube'&&o.privacy==='private','Agendamento automático disponível somente para YouTube privado.');}
  check(e.rights?.confirmed===true,'Direitos precisam estar confirmados.');
  for(const field of ['productionUntil','assetUntil']){const until=e.rights[field]||'';check(!until||/^\d{4}-\d\d-\d\d$/.test(until)&&Number.isFinite(Date.parse(until+'T00:00:00Z'))&&new Date(until+'T00:00:00Z').toISOString().slice(0,10)===until,'Validade inválida.');if(until){const target=e.metadata.plannedAt||stamp();check(until>=new Intl.DateTimeFormat('en-CA',{timeZone:e.metadata.timeZone}).format(new Date(target)),'A licença não cobre a data de publicação.');}}
  const approval=e.approval;
  check(approval&&Number.isFinite(Date.parse(approval.at))&&approval.fileHash===e.fileHash&&approval.assetId===e.assetId,'Aprovação não corresponde ao vídeo.');
  const binding=sha(canonical({publicationId:e.publicationId,productionId:e.productionId,productionVersion:e.productionVersion,assetId:e.assetId,fileHash:e.fileHash,fileVersion:e.fileVersion,platform:e.platform,accountId:e.accountId,mode:e.mode,metadata:e.metadata,rights:e.rights,audioReady:e.audioReady}));
  check(approval.binding===binding,'Texto, destino ou direitos mudaram após a aprovação.');
  // Persistir somente os campos do contrato; nunca campos arbitrários como tokens.
  return {schemaVersion:2,mode:e.mode,publicationId:e.publicationId,productionId:e.productionId,productionVersion:e.productionVersion,assetId:e.assetId,fileHash:e.fileHash,fileSize:e.fileSize,fileVersion:e.fileVersion,platform:e.platform,accountId:e.accountId,metadata:{title:e.metadata.title,description:e.metadata.description,hashtags:e.metadata.hashtags,plannedAt:e.metadata.plannedAt||'',timeZone:e.metadata.timeZone,options:o},rights:{confirmed:true,productionUntil:e.rights.productionUntil||'',assetUntil:e.rights.assetUntil||''},audioReady:true,approval:{at:approval.at,fileHash:e.fileHash,assetId:e.assetId,binding}};
}
export function validZone(zone){try{new Intl.DateTimeFormat('en',{timeZone:zone});return true;}catch{return false;}}
export class Transfers{
  constructor(store,config){this.store=store;this.config=config;}
  begin(owner,input){const envelope=validateEnvelope(input,this.config),fingerprint=sha(canonical({owner,envelope}));return this.store.transaction(()=>{const old=this.store.db.prepare('SELECT id,offset FROM transfers WHERE fingerprint=?').get(fingerprint);if(old)return {...old,fileSize:envelope.fileSize};
    const existing=this.store.db.prepare("SELECT id FROM jobs WHERE owner=? AND json_extract(data,'$.publicationId')=? AND json_extract(data,'$.mode')=? AND (state NOT IN ('cancelled','failed','rejected','simulated_complete') OR (json_extract(data,'$.mode')='real' AND state<>'cancelled' AND (json_extract(data,'$.remote.session') IS NOT NULL OR json_extract(data,'$.remote.videoId') IS NOT NULL OR json_extract(data,'$.remote.publishId') IS NOT NULL OR json_extract(data,'$.remote.phase')='initializing'))) LIMIT 1").get(owner,envelope.publicationId,envelope.mode);
    check(!existing,'Já existe tarefa desta publicação. Consulte ou cancele a anterior antes de criar outra.',409);
    const id=randomUUID();this.store.db.prepare('INSERT INTO transfers(id,owner,fingerprint,data) VALUES(?,?,?,?)').run(id,owner,fingerprint,JSON.stringify(envelope));return {id,offset:0,fileSize:envelope.fileSize};});}
  append(owner,id,offset,bytes){check(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=this.config.chunkBytes,'Bloco inválido.');return this.store.transaction(()=>{const t=this.store.transfer(id,owner);check(Number.isSafeInteger(offset)&&offset>=0,'Posição inválida.');check(!this.store.db.prepare('SELECT id FROM jobs WHERE key=?').get(t.fingerprint),'Transferência já concluída.',409);
      const old=this.store.db.prepare('SELECT bytes FROM chunks WHERE transfer_id=? AND offset=?').get(id,offset);
      if(old){check(sha(old.bytes)===sha(bytes),'Bloco repetido com bytes diferentes.',409);return {offset:t.offset};}
      check(offset===t.offset&&offset+bytes.length<=t.envelope.fileSize,'Posição divergente; retome a posição confirmada.',409);
      this.store.db.prepare('INSERT INTO chunks VALUES(?,?,?)').run(id,offset,bytes);this.store.db.prepare('UPDATE transfers SET offset=? WHERE id=?').run(offset+bytes.length,id);return {offset:offset+bytes.length};});}
  complete(owner,id){return this.store.transaction(()=>{const t=this.store.transfer(id,owner),existing=this.store.db.prepare('SELECT id FROM jobs WHERE key=?').get(t.fingerprint);if(existing)return publicJob(this.store.job(existing.id,owner));
      const concurrent=this.store.db.prepare("SELECT id FROM jobs WHERE owner=? AND json_extract(data,'$.publicationId')=? AND json_extract(data,'$.mode')=? AND (state NOT IN ('cancelled','failed','rejected','simulated_complete') OR (json_extract(data,'$.mode')='real' AND state<>'cancelled' AND (json_extract(data,'$.remote.session') IS NOT NULL OR json_extract(data,'$.remote.videoId') IS NOT NULL OR json_extract(data,'$.remote.publishId') IS NOT NULL OR json_extract(data,'$.remote.phase')='initializing'))) LIMIT 1").get(owner,t.envelope.publicationId,t.envelope.mode);
      check(!concurrent,'Outra transferência desta publicação já foi recebida. Consulte ou cancele a anterior.',409);
      validateEnvelope(t.envelope,this.config);check(t.offset===t.envelope.fileSize&&this.store.hashTransfer(id)===t.envelope.fileHash,'Transferência incompleta ou corrompida.');
      const head=this.store.range(id,0,32);check(head.length>=12&&head.subarray(4,8).toString()==='ftyp','O arquivo não possui cabeçalho MP4 válido.');
      const job={id:randomUUID(),owner,key:t.fingerprint,transferId:id,envelope:t.envelope,mode:t.envelope.mode,publicationId:t.envelope.publicationId,platform:t.envelope.platform,state:'received',revision:1,due:Date.now(),attempts:0,createdAt:stamp(),result:null,error:null,remote:{}};
      this.store.db.prepare('INSERT INTO jobs(id,owner,key,state,due,revision,data) VALUES(?,?,?,?,?,?,?)').run(job.id,owner,job.key,job.state,job.due,1,JSON.stringify(job));this.store.db.prepare('INSERT INTO events(job_id,at,event) VALUES(?,?,?)').run(job.id,stamp(),'received');return publicJob(job);});}
}
