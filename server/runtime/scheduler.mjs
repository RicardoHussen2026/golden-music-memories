import {randomUUID} from 'node:crypto';
import {existsSync} from 'node:fs';
import {check,sha,stamp,publicJob} from './store.mjs';
import {canonical,validateEnvelope,validZone} from './contracts.mjs';
import {mediaPath,fileHash} from './media.mjs';
import {enabled} from './config.mjs';

export const defaultSchedule=()=>({id:'routine',revision:0,enabled:false,mode:'simulation',timeZone:'America/Sao_Paulo',weekdays:[0,1,2,3,4,5,6],startDate:'',endDate:'',missed:'skip',missing:'next',leadMinutes:120,reuseDays:0,artistGap:1,decades:[],youtubeOptions:{categoryId:'10',madeForKids:false,containsSyntheticMedia:false},platforms:{youtube:{enabled:true,accountId:'',times:['09:00','12:00','15:00','18:00','21:00']},tiktok:{enabled:false,accountId:'',times:['09:00','12:00','15:00','18:00','21:00']}},createdAt:stamp()});
const localFormat=zone=>new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function zonedUTC(local,zone){const f=localFormat(zone),center=Date.parse(local+'Z'),matches=[];for(let minutes=-840;minutes<=840;minutes+=15){const t=center+minutes*60000;if(f.format(t).replace(' ','T')===local)matches.push(t);}return matches.length===1?matches[0]:null;}
export function slotsBetween(c,from,to){const rows=[],f=localFormat(c.timeZone);let day=f.format(from).slice(0,10),last=f.format(to).slice(0,10);for(let n=0;n<370&&day<=last;n++,day=new Date(Date.parse(day+'T12:00:00Z')+86400000).toISOString().slice(0,10)){
  if((c.startDate&&day<c.startDate)||(c.endDate&&day>c.endDate)||!c.weekdays.includes(new Date(day+'T12:00:00Z').getUTCDay()))continue;
  for(const [platform,p] of Object.entries(c.platforms)){if(!p.enabled)continue;for(const time of p.times){const at=zonedUTC(day+'T'+time,c.timeZone);if(at!==null&&at>=from&&at<=to)rows.push({id:sha(platform+':'+c.mode+':'+at),platform,at,local:day+'T'+time});}}
}return rows.sort((a,b)=>a.at-b.at||a.platform.localeCompare(b.platform));}

export class Scheduler{
  constructor(store,config,library){Object.assign(this,{store,config,library});}
  settings(){return this.store.get('schedule','routine')||defaultSchedule();}
  save(input){const old=this.settings();check(input.revision===old.revision,'A rotina mudou; atualize a tela.',409);const next={...defaultSchedule(),...input,id:'routine',revision:old.revision+1,createdAt:old.createdAt,updatedAt:stamp()};
    check(['simulation','real'].includes(next.mode)&&validZone(next.timeZone),'Modo ou fuso inválido.');check(Array.isArray(next.weekdays)&&next.weekdays.length&&next.weekdays.every(n=>Number.isInteger(n)&&n>=0&&n<=6),'Escolha os dias da semana.');check(['skip','catch_up'].includes(next.missed)&&['next','empty'].includes(next.missing),'Política inválida.');
    for(const date of [next.startDate,next.endDate])check(!date||/^\d{4}-\d\d-\d\d$/.test(date)&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date,'Data inválida.');check(!next.startDate||!next.endDate||next.endDate>=next.startDate,'Período inválido.');
    for(const [key,min,max] of [['leadMinutes',5,1440],['reuseDays',0,3650],['artistGap',0,100]])check(Number.isInteger(next[key])&&next[key]>=min&&next[key]<=max,'Valor inválido: '+key);
    check(next.youtubeOptions&&/^\d{1,3}$/.test(next.youtubeOptions.categoryId)&&typeof next.youtubeOptions.madeForKids==='boolean'&&typeof next.youtubeOptions.containsSyntheticMedia==='boolean','Opções YouTube inválidas.');
    check(Array.isArray(next.decades)&&next.decades.every(n=>[1970,1980,1990,2000].includes(n)),'Décadas inválidas.');
    for(const platform of ['youtube','tiktok']){const p=next.platforms[platform];check(p&&Array.isArray(p.times)&&p.times.length<=24&&p.times.length>0&&p.times.every(t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t))&&new Set(p.times).size===p.times.length,'Horários inválidos ou repetidos.');check(typeof p.accountId==='string'&&p.accountId.length<=180,'Conta inválida.');
      if(next.enabled&&next.mode==='real'&&p.enabled){check(platform==='youtube','TikTok automático indisponível neste aplicativo pessoal. Use o fluxo assistido.',409);check(this.config.publishing&&this.config.worker&&enabled(this.config,platform),'Configure rede, publicação e processador antes de ativar.',409);const c=this.store.get('connection',p.accountId);check(c?.platform===platform&&c.state==='connected','Conecte a conta de destino.',409);}}
    if(next.enabled)check(input.consent===true,'Confirme a rotina automática e suas opções.');
    next.enabled=next.enabled===true;next.consentAt=next.enabled?stamp():old.consentAt;next.lastScan=old.lastScan||Date.now();delete next.consent;this.store.put('schedule','routine',next);return next;
  }
  pause(){const c=this.settings();this.store.put('schedule','routine',{...c,enabled:false,revision:c.revision+1});return this.settings();}
  history(platform){const manual=this.store.list('publication').filter(p=>p.platform===platform),api=this.store.list('slot').filter(s=>s.platform===platform&&s.jobId).map(s=>{try{const j=this.store.job(s.jobId,'operator');return j.mode==='real'&&['published','completed','completed_private','completed_unlisted','scheduled','processing','uploading','needs_reconciliation','awaiting_reconnect'].includes(j.state)?{...this.library.get(s.mediaId),publishedAt:j.result?.publishAt||j.createdAt,mediaId:s.mediaId}:null;}catch{return null;}}).filter(Boolean);return [...manual,...api].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));}
  candidates(platform,at,c=this.settings()){
    const history=this.history(platform),reserved=this.store.list('slot').filter(s=>s.platform===platform&&s.mode===c.mode&&['reserved','queued','simulated'].includes(s.state)),recent=[...reserved.sort((a,b)=>b.at-a.at).map(s=>this.store.get('media',s.mediaId)).filter(Boolean),...history].slice(0,c.artistGap),lastDecade=recent[0]?.decade;
    return this.library.list().filter(m=>{const p=this.store.get('production',m.productionId);if(m.state!=='ready'||!m.hash||!m.audio||!m.audioReady||!m.rightsConfirmed||!m.platforms.includes(platform)||!p||p.cancelled||m.productionVersion!==p.version)return false;
      if(c.decades.length&&!c.decades.includes(m.decade)||m.licenseUntil&&m.licenseUntil<localFormat(c.timeZone).format(at).slice(0,10))return false;
      if(reserved.some(s=>s.mediaId===m.id||s.songId===m.songId)||recent.some(p=>p.artist===m.artist))return false;
      const previous=history.find(p=>p.songId===m.songId||p.hash===m.hash||p.productionId===m.productionId);return !previous||c.reuseDays>0&&at-Date.parse(previous.publishedAt)>=c.reuseDays*86400000;
    }).sort((a,b)=>(a.decade===lastDecade)-(b.decade===lastDecade)||a.createdAt.localeCompare(b.createdAt));
  }
  queue(slot,m,c,now,{manual=false}={}){
    const path=mediaPath(this.config.directory,m.id);check(existsSync(path)&&fileHash(path)===m.hash,'Cache ausente ou corrompido; baixe novamente do Drive.');
    if(slot.platform==='youtube')check(m.duration<=(this.config.youtube.maxDurationSeconds||900),'A duração excede o limite configurado para esta conta YouTube. Confirme a verificação da conta; o vídeo não será cortado.');
    if(c.mode==='real'&&!manual)check(m.drive?.verified,'Automação real exige cópia confirmada no Drive.');
    const planned=slot.at>now+120000?new Date(slot.at).toISOString():'';
    const bound={publicationId:'routine:'+slot.id,productionId:m.productionId,productionVersion:m.productionVersion,assetId:m.id,fileHash:m.hash,fileVersion:1,platform:slot.platform,accountId:c.mode==='simulation'?'simulation:'+slot.platform:c.platforms[slot.platform].accountId,mode:c.mode,audioReady:true,rights:{confirmed:true,productionUntil:m.licenseUntil||'',assetUntil:''},metadata:{title:m.title,description:m.description||'',hashtags:m.hashtags||'',plannedAt:slot.platform==='youtube'?planned:'',timeZone:c.timeZone,options:slot.platform==='youtube'?{privacy:planned?'private':'public',categoryId:c.youtubeOptions?.categoryId||'10',tags:[],madeForKids:c.youtubeOptions?.madeForKids===true,containsSyntheticMedia:c.youtubeOptions?.containsSyntheticMedia===true}:{musicUsageConsent:true}}};
    const envelope=validateEnvelope({schemaVersion:2,...bound,fileSize:m.size,approval:{at:c.consentAt||stamp(),assetId:m.id,fileHash:m.hash,binding:sha(canonical(bound))}},this.config);
    return this.store.transaction(()=>{const key='routine:'+slot.id;const old=this.store.db.prepare('SELECT id FROM jobs WHERE key=?').get(key);if(old)return this.store.job(old.id,'operator');const transferId=randomUUID(),id=randomUUID();this.store.db.prepare('INSERT INTO transfers(id,owner,fingerprint,data,offset) VALUES(?,?,?,?,?)').run(transferId,'operator',key,JSON.stringify({...envelope,mediaId:m.id}),m.size);
      const job={id,owner:'operator',key,transferId,envelope,mode:c.mode,publicationId:bound.publicationId,platform:slot.platform,state:manual?'received':'authorized',revision:1,due:now,attempts:0,createdAt:stamp(),authorizedAt:manual?null:stamp(),...(manual?{}:{authorization:'routine'}),scheduleRevision:c.revision,result:null,error:null,remote:{}};
      this.store.db.prepare('INSERT INTO jobs(id,owner,key,state,due,revision,data) VALUES(?,?,?,?,?,?,?)').run(id,'operator',key,job.state,now,1,JSON.stringify(job));this.store.db.prepare('INSERT INTO events(job_id,at,event) VALUES(?,?,?)').run(id,stamp(),manual?'manual_received':'routine_authorized');this.store.put('slot',slot.id,{...slot,mode:c.mode,state:'queued',jobId:id,mediaId:m.id,songId:m.songId,createdAt:stamp()});return job;});
  }
  prepareManual(id,input){const m=this.library.get(id);check(m.state==='ready'&&m.platforms.includes(input.platform),'Selecione um vídeo pronto para o destino.');check(input.confirm===true&&['simulation','real'].includes(input.mode),'Confirme o modo e o envio.');check(input.fileHash===m.hash&&input.updatedAt===m.updatedAt,'O vídeo ou seus textos mudaram; atualize a tela.',409);if(input.mode==='real'){check(this.config.publishing&&enabled(this.config,input.platform),'Configure e habilite o provedor antes de enviar.');const account=this.store.get('connection',input.accountId);check(account?.platform===input.platform&&account.state==='connected','Conecte a conta de destino.');if(input.platform==='tiktok')check(input.assistedUpload===true,'Este envio exige finalização no aplicativo TikTok.');}
    check(!this.store.list('slot').some(s=>s.mediaId===id&&s.platform===input.platform&&s.mode===input.mode&&['queued','reserved','published','reconcile','reconnect'].includes(s.state)),'Já existe envio deste vídeo para o destino. Consulte a tarefa anterior.',409);
    const c={...this.settings(),mode:input.mode,consentAt:stamp(),platforms:{...this.settings().platforms,[input.platform]:{accountId:input.accountId}}};return this.queue({id:'manual-'+randomUUID(),platform:input.platform,at:Date.now()},m,c,Date.now(),{manual:true});}
  async tick(now=Date.now()){
    this.reconcile();const c=this.settings(),machine=this.store.get('machine','local');if(!c.enabled||machine?.active===false)return;
    const from=Math.max(c.lastScan||now,now-7*86400000),to=now+c.leadMinutes*60000,slots=slotsBetween(c,from,to);
    // Um horário perdido por plataforma é recuperado por rodada; os demais são registrados, sem rajada.
    const caught=new Set();for(const slot of slots){const old=this.store.get('slot',slot.id);if(old&&!(old.state==='empty'&&slot.at>now&&now-(old.attemptedAt||0)>=60000))continue;
      if(slot.at<now-60000&&(c.missed==='skip'||caught.has(slot.platform))){this.store.put('slot',slot.id,{...slot,state:'missed',reason:'Horário perdido; política da rotina.'});continue;}if(slot.at<now)caught.add(slot.platform);
      const choices=this.candidates(slot.platform,slot.at,c);let queued=false,lastError='Sem vídeo inédito elegível para este destino.';for(const m of choices){try{this.queue(slot,m,c,now);queued=true;break;}catch(e){lastError=e.message;if(c.missing==='empty')break;}}
      if(!queued)this.store.put('slot',slot.id,{...slot,state:'empty',reason:lastError,attemptedAt:now});
    }
    this.store.put('schedule','routine',{...c,lastScan:now});
  }
  reconcile(){for(const s of this.store.list('slot').filter(s=>s.jobId&&s.state==='queued')){const j=this.store.job(s.jobId,'operator');const state={published:'published',completed:'published',completed_private:'completed_private',completed_unlisted:'completed_unlisted',simulated_complete:'simulated',cancelled:'cancelled',failed:'failed',rejected:'failed',needs_reconciliation:'reconcile',awaiting_reconnect:'reconnect'}[j.state];if(state)this.store.put('slot',s.id,{...s,state,result:j.result,error:j.error});}}
  dashboard(){this.reconcile();const c=this.settings(),slots=this.store.list('slot').sort((a,b)=>b.at-a.at),media=this.library.list();return {schedule:c,slots:slots.slice(0,300),preview:slotsBetween(c,Date.now(),Date.now()+7*86400000).slice(0,70),stock:Object.fromEntries(['youtube','tiktok'].map(p=>{const eligible=this.candidates(p,Date.now(),c).length,daily=c.platforms[p].times.length;return [p,{eligible,daily,days:daily?Math.floor(eligible/daily):null}];})),mediaCount:media.length,ready:media.filter(m=>m.state==='ready').length};}
}
