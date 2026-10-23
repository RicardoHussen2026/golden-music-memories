import {randomBytes} from 'node:crypto';
import {sha,check,stamp} from './store.mjs';
import {enabled} from './config.mjs';
import {youtubeUploadPlan,processingResult} from '../provider-adapters.mjs';
import {validateEnvelope,canonical} from './contracts.mjs';

const scopes={youtube:['https://www.googleapis.com/auth/youtube.upload','https://www.googleapis.com/auth/youtube.readonly'],tiktok:['user.info.basic','video.upload']};
const MANAGE='https://www.googleapis.com/auth/youtube.force-ssl';
const endpoints={youtube:{auth:'https://accounts.google.com/o/oauth2/v2/auth',token:'https://oauth2.googleapis.com/token',revoke:'https://oauth2.googleapis.com/revoke'},tiktok:{auth:'https://www.tiktok.com/v2/auth/authorize/',token:'https://open.tiktokapis.com/v2/oauth/token/',revoke:'https://open.tiktokapis.com/v2/oauth/revoke/'}};
export class ProviderError extends Error{constructor(code,{retryable=false,reconnect=false,ambiguous=false,delay=0}={}){super(code);Object.assign(this,{code,retryable,reconnect,ambiguous,delay,status:502});}}
export class Providers{
  constructor(store,config,transport=globalThis.fetch){this.store=store;this.config=config;this.transport=transport;}
  async request(url,options={}){
    check(this.config.network,'Acesso externo desativado.',503);
    const u=new URL(url);check(u.protocol==='https:'&&['www.googleapis.com','oauth2.googleapis.com','open.tiktokapis.com','open-upload.tiktokapis.com'].includes(u.hostname)&&!u.username&&!u.password&&!u.port,'Destino externo não permitido.');
    try{return await this.transport(u.href,{...options,redirect:'manual',signal:AbortSignal.timeout(25000)});}catch{throw new ProviderError('NETWORK_INTERRUPTED',{retryable:true,ambiguous:true});}
  }
  async json(url,options={}){
    const response=await this.request(url,options);let data;try{data=await response.json();}catch{throw new ProviderError('INVALID_PROVIDER_RESPONSE',{ambiguous:response.ok});}
    if(!response.ok||data.error&&data.error.code&&data.error.code!=='ok'){
      const raw=typeof data.error==='string'?data.error:data.error?.code||data.error?.errors?.[0]?.reason||'HTTP_'+response.status;
      const code=String(raw).replace(/[^A-Za-z0-9_]/g,'').slice(0,60)||'PROVIDER_ERROR';
      throw new ProviderError(code,{retryable:response.status===429||response.status>=500||code==='rate_limit_exceeded',reconnect:response.status===401||/^(invalid_grant|access_token_invalid|access_token_expired|token_expired|scope_not_authorized)$/.test(code),delay:Math.min(3600000,Number(response.headers.get('retry-after')||0)*1000)});
    }return data;
  }
  begin(owner,sessionId,platform){
    check(enabled(this.config,platform),'Configure o aplicativo, a cifragem e a permissão de rede antes de conectar.',503);
    const p=this.config[platform],state=randomBytes(32).toString('base64url');
    this.store.put('oauth',sha(state),{owner,sessionId,platform,expires:Date.now()+600000});
    const requested=platform==='youtube'&&p.manageSchedules?[MANAGE]:scopes[platform];
    const url=new URL(endpoints[platform].auth);url.search=new URLSearchParams({[platform==='youtube'?'client_id':'client_key']:p.clientId,response_type:'code',redirect_uri:p.redirectUri,scope:requested.join(platform==='youtube'?' ':','),state,...(platform==='youtube'?{access_type:'offline',prompt:'consent'}:{})}).toString();return {url:url.href};
  }
  async callback(owner,sessionId,platform,{state,code,error}){
    const entry=this.store.transaction(()=>{check(typeof state==='string'&&state.length>=32,'State ausente.');const k=sha(state),v=this.store.get('oauth',k);check(v&&v.owner===owner&&v.sessionId===sessionId&&v.platform===platform&&v.expires>Date.now(),'State inválido, expirado ou reutilizado.');this.store.delete('oauth',k);return v;});
    check(!error,'Autorização recusada. Nenhuma conta foi conectada.');check(code&&code.length<4096,'Código OAuth ausente.');check(enabled(this.config,platform),'Conexão desabilitada.',503);
    const p=this.config[platform],form=new URLSearchParams({[platform==='youtube'?'client_id':'client_key']:p.clientId,client_secret:p.clientSecret,grant_type:'authorization_code',code,redirect_uri:p.redirectUri});
    const tokens=await this.json(endpoints[platform].token,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form.toString()});
    check(tokens.access_token&&Number.isFinite(Number(tokens.expires_in))&&Number(tokens.expires_in)>0,'Token ou validade não recebidos.');const granted=String(tokens.scope||'').split(/[ ,]+/).filter(Boolean);const required=platform==='youtube'&&p.manageSchedules?[MANAGE]:scopes[platform];check(required.every(s=>granted.includes(s)),'Permissões obrigatórias não concedidas.');
    let identity,label;
    if(platform==='youtube'){const data=await this.json('https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true',{headers:{Authorization:'Bearer '+tokens.access_token}});check(data.items?.length===1,'É necessário autorizar exatamente um canal do YouTube.');identity=data.items[0].id;label=data.items[0].snippet.title;}
    else{const data=await this.json('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name',{headers:{Authorization:'Bearer '+tokens.access_token}});identity=data.data?.user?.open_id;label=data.data?.user?.display_name;check(identity&&identity===tokens.open_id,'Conta TikTok não confirmada.');}
    const id=platform+':'+identity,old=this.store.get('connection',id),oldTokens=old?.encrypted?this.store.open(old.encrypted):{};
    const refresh=tokens.refresh_token||oldTokens.refresh_token;check(refresh,'Acesso offline ausente; autorize novamente.');
    this.store.put('connection',id,{id,owner:entry.owner,platform,label:String(label).slice(0,160),identity,scopes:granted,state:'connected',connectedAt:stamp(),encrypted:this.store.seal({...tokens,refresh_token:refresh,expiresAt:Date.now()+Number(tokens.expires_in)*1000})});return {connected:true,platform};
  }
  connections(owner){return this.store.list('connection').filter(c=>c.owner===owner).map(({encrypted,...c})=>({...c,mode:'real'}));}
  async token(id){
    let c=this.store.get('connection',id);check(c?.state==='connected','Reconecte a conta antes de executar.',409);check(enabled(this.config,c.platform),'Integração desabilitada.',503);
    let tokens=this.store.open(c.encrypted);if(tokens.expiresAt>Date.now()+90000)return tokens.access_token;
    const lock='refresh:'+id;this.store.transaction(()=>{const old=this.store.get('lock',lock);if(old?.until>Date.now())throw new ProviderError('REFRESH_BUSY',{retryable:true});this.store.put('lock',lock,{until:Date.now()+40000});});
    try{c=this.store.get('connection',id);tokens=this.store.open(c.encrypted);if(tokens.expiresAt>Date.now()+90000)return tokens.access_token;
      check(tokens.refresh_token,'Reconexão necessária.',409);const p=this.config[c.platform],form=new URLSearchParams({[c.platform==='youtube'?'client_id':'client_key']:p.clientId,client_secret:p.clientSecret,grant_type:'refresh_token',refresh_token:tokens.refresh_token});
      const updated=await this.json(endpoints[c.platform].token,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form.toString()});check(updated.access_token,'Renovação não retornou token.');
      if(updated.scope&&!c.scopes.every(s=>String(updated.scope).split(/[ ,]+/).includes(s))||updated.open_id&&updated.open_id!==c.identity)throw new ProviderError('PERMISSIONS_CHANGED',{reconnect:true});
      check(Number.isFinite(Number(updated.expires_in))&&Number(updated.expires_in)>0,'Renovação sem validade.');
      if(this.store.get('connection',id)?.state!=='connected')throw new ProviderError('DISCONNECTED',{reconnect:true});
      this.store.put('connection',id,{...c,encrypted:this.store.seal({...tokens,...updated,refresh_token:updated.refresh_token||tokens.refresh_token,expiresAt:Date.now()+Number(updated.expires_in)*1000})});return updated.access_token;
    }catch(error){if(error.reconnect)this.store.put('connection',id,{...c,state:'reconnect_required'});throw error;}finally{this.store.delete('lock',lock);}
  }
  async disconnect(owner,id){const c=this.store.get('connection',id);check(c?.owner===owner,'Conta não encontrada.',404);let revoked=false;
    try{if(c.encrypted&&enabled(this.config,c.platform)){const tokens=this.store.open(c.encrypted),p=this.config[c.platform];const form=new URLSearchParams(c.platform==='youtube'?{token:tokens.refresh_token||tokens.access_token}:{client_key:p.clientId,client_secret:p.clientSecret,token:tokens.access_token});await this.json(endpoints[c.platform].revoke,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form.toString()});revoked=true;}}catch{}
    this.store.put('connection',id,{id:c.id,owner,identity:c.identity,platform:c.platform,label:c.label,scopes:[],state:'disconnected',disconnectedAt:stamp()});
    return {disconnected:true,remoteRevocationConfirmed:revoked,message:revoked?'Desconectada.':'Acesso local removido. Confira também as permissões na plataforma.'};
  }
  async changeSchedule(owner,job,revision,input){
    check(job.revision===revision&&!(job.leaseUntil>Date.now()),'Atualize a tarefa; execução em andamento.',409);
    check(job.mode==='real'&&job.platform==='youtube'&&job.remote?.videoId&&job.state==='scheduled','Somente agendamentos aceitos pelo YouTube podem ser alterados por este fluxo.',409);
    check(this.config.publishing,'Publicação real desativada.',409);const c=this.store.get('connection',job.envelope.accountId);check(c?.owner===owner&&c.scopes.includes(MANAGE),'Reconecte com a permissão de gerenciar agendamentos.',409);
    check(input.confirm===true,'Confirme a alteração do agendamento.');const token=await this.token(c.id),headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
    const observed=await this.json('https://www.googleapis.com/youtube/v3/videos?part=status&id='+encodeURIComponent(job.remote.videoId),{headers});const status=observed.items?.[0]?.status;
    check(status?.privacyStatus==='private'&&status.publishAt,'O vídeo deixou de estar privado/agendado. Confira o YouTube Studio.',409);
    let envelope=job.envelope;if(!input.cancel){envelope=validateEnvelope(input.envelope,this.config);check(envelope.fileHash===job.envelope.fileHash&&envelope.assetId===job.envelope.assetId&&envelope.productionVersion===job.envelope.productionVersion&&envelope.productionId===job.envelope.productionId&&envelope.publicationId===job.publicationId&&envelope.accountId===c.id&&envelope.platform==='youtube'&&envelope.metadata.plannedAt,'A nova aprovação deve preservar vídeo, conta e publicação.');check(canonical({...envelope.metadata,plannedAt:''})===canonical({...job.envelope.metadata,plannedAt:''}),'Este fluxo altera somente a data; preserve os demais metadados.');}
    // Reservar a revisão antes da chamada não idempotente; falha ambígua não repete sozinha.
    job=this.store.update(job,{state:'needs_reconciliation',error:{code:'SCHEDULE_UPDATE_PENDING',message:'Alteração solicitada. Confira o resultado antes de repetir.',retryable:false}},'schedule_change_requested');
    const nextStatus={...Object.fromEntries(['embeddable','license','publicStatsViewable','selfDeclaredMadeForKids','containsSyntheticMedia'].filter(k=>status[k]!==undefined).map(k=>[k,status[k]])),privacyStatus:'private',...(!input.cancel?{publishAt:envelope.metadata.plannedAt}:{})};
    const response=await this.json('https://www.googleapis.com/youtube/v3/videos?part=status',{method:'PUT',headers,body:JSON.stringify({id:job.remote.videoId,status:nextStatus})});
    return this.store.update(job,{state:input.cancel?'completed_private':'scheduled',envelope,due:Date.now()+60000,error:null,result:{...job.result,visibility:response.status?.privacyStatus||'private',publishAt:response.status?.publishAt||null}},input.cancel?'youtube_schedule_cancelled':'youtube_rescheduled');
  }
  async youtubeStep(job,checkpoint){
    const token=await this.token(job.envelope.accountId),auth={Authorization:'Bearer '+token},e=job.envelope,r=job.remote||{};
    if(r.videoId){
      const data=await this.json('https://www.googleapis.com/youtube/v3/videos?part=status,processingDetails&id='+encodeURIComponent(r.videoId),{headers:auth});check(data.items?.length===1,'Vídeo não encontrado; conciliação necessária.',409);const video=data.items[0],status=processingResult(video);
      if(status.state==='rejected')return {state:'rejected',error:{code:'VIDEO_REJECTED',message:'O YouTube rejeitou o vídeo. Confira o Studio.',retryable:false}};
      let state='processing';if(status.state==='processed'){if(status.privacy==='public')state='published';else if(status.publishAt)state='scheduled';else state=status.privacy==='unlisted'?'completed_unlisted':'completed_private';}
      return {state,due:state==='scheduled'?Math.max(Date.now()+60000,Date.parse(status.publishAt)+1000):Date.now()+60000,result:{externalId:r.videoId,url:'https://www.youtube.com/watch?v='+encodeURIComponent(r.videoId),visibility:status.privacy||'unknown',publishAt:status.publishAt||null,simulated:false}};
    }
    if(!r.session){
      if(r.phase==='initializing')throw new ProviderError('UPLOAD_INIT_UNKNOWN',{ambiguous:true});
      job=checkpoint({remote:{phase:'initializing'}});const plan=youtubeUploadPlan({...e,fileSize:e.fileSize});plan.body.snippet.description=[e.metadata.description,e.metadata.hashtags].filter(Boolean).join('\n');
      const response=await this.request(plan.endpoint,{method:'POST',headers:{...auth,...plan.headers},body:JSON.stringify(plan.body)});
      if(!response.ok){if(response.status>=400&&response.status<500)checkpoint({remote:{}});throw new ProviderError('UPLOAD_INIT_'+response.status,{ambiguous:response.status>=500,reconnect:response.status===401,retryable:response.status===429,delay:Math.min(3600000,Number(response.headers.get('retry-after')||0)*1000)});}
      const session=response.headers.get('location');check(session&&new URL(session).origin==='https://www.googleapis.com','Sessão de upload inválida.');return {state:'uploading',remote:{session,offset:0,probe:true},due:Date.now()};
    }
    if(r.probe){const response=await this.request(r.session,{method:'PUT',headers:{...auth,'Content-Length':'0','Content-Range':'bytes */'+e.fileSize}});return this.youtubeResponse(response,job);}
    const bytes=this.store.range(job.transferId,r.offset,Math.min(this.config.chunkBytes,e.fileSize-r.offset));check(bytes.length,'Não há bytes restantes; consulte a sessão.',409);
    job=checkpoint({remote:{...r,probe:true}});const response=await this.request(r.session,{method:'PUT',headers:{...auth,'Content-Type':'video/mp4','Content-Range':`bytes ${r.offset}-${r.offset+bytes.length-1}/${e.fileSize}`},body:bytes});return this.youtubeResponse(response,job);
  }
  async youtubeResponse(response,job){const r=job.remote;
    if(response.status===308){const range=response.headers.get('range'),match=range&&/^bytes=0-(\d+)$/.exec(range);const offset=match?Number(match[1])+1:0;check(offset>=(r.offset||0)&&offset<=job.envelope.fileSize,'Posição externa inconsistente.',409);if(offset===job.envelope.fileSize)throw new ProviderError('UPLOAD_FINAL_RESPONSE_UNKNOWN',{ambiguous:true});return {state:'uploading',remote:{...r,offset,probe:false},due:Date.now()};}
    if(response.ok){let data;try{data=await response.json();}catch{throw new ProviderError('UPLOAD_RESPONSE_UNKNOWN',{ambiguous:true});}check(typeof data.id==='string'&&/^[\w-]{6,80}$/.test(data.id),'Resposta de upload sem identificador.',409);return {state:'processing',remote:{videoId:data.id},due:Date.now()+1000};}
    if(response.status===404||response.status===410)throw new ProviderError('UPLOAD_SESSION_EXPIRED',{ambiguous:true});
    throw new ProviderError('UPLOAD_'+response.status,{retryable:response.status===429||response.status>=500,reconnect:response.status===401,delay:Math.min(3600000,Number(response.headers.get('retry-after')||0)*1000)});
  }
  async tiktokStep(job,checkpoint){
    // Direct Post deliberadamente indisponível para este aplicativo pessoal.
    check(this.config.tiktok.uploadApproved,'Upload assistido não aprovado.',409);const token=await this.token(job.envelope.accountId),auth={Authorization:'Bearer '+token,'Content-Type':'application/json'},e=job.envelope,r=job.remote||{};
    check(!e.metadata.plannedAt,'TikTok: use envio assistido sem agendamento.',409);
    if(r.publishId&&r.uploadComplete){const body=await this.json('https://open.tiktokapis.com/v2/post/publish/status/fetch/',{method:'POST',headers:auth,body:JSON.stringify({publish_id:r.publishId})});const d=body.data||{};
      if(d.status==='FAILED')return {state:'rejected',error:{code:'TIKTOK_REJECTED',message:'TikTok rejeitou o envio; confira os detalhes no aplicativo.',retryable:false}};
      const candidate=d.publicaly_available_post_id?.[0],postId=typeof candidate==='string'?candidate:Number.isSafeInteger(candidate)?String(candidate):null;return {state:d.status==='PUBLISH_COMPLETE'?'completed':d.status==='SEND_TO_USER_INBOX'?'awaiting_user':'processing',due:Date.now()+60000,result:{simulated:false,externalId:postId||null,publishId:r.publishId,url:null,visibility:'unknown',requiresUserAction:d.status==='SEND_TO_USER_INBOX'}};
    }
    if(!r.publishId){if(r.phase==='initializing')throw new ProviderError('TIKTOK_INIT_UNKNOWN',{ambiguous:true});job=checkpoint({remote:{phase:'initializing'}});
      const chunk=e.fileSize<5*1024*1024?e.fileSize:10*1024*1024,total=Math.max(1,Math.floor(e.fileSize/chunk));
      const body=await this.json('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/',{method:'POST',headers:auth,body:JSON.stringify({source_info:{source:'FILE_UPLOAD',video_size:e.fileSize,chunk_size:chunk,total_chunk_count:total}})});
      check(body.data?.publish_id&&body.data?.upload_url&&new URL(body.data.upload_url).origin==='https://open-upload.tiktokapis.com','Sessão TikTok inválida.');return {state:'uploading',remote:{publishId:body.data.publish_id,url:body.data.upload_url,offset:0,chunk,total},due:Date.now()};
    }
    // TikTok não oferece retomada arbitrária documentada: resultado desconhecido exige conciliação.
    if(r.chunkPending)throw new ProviderError('TIKTOK_CHUNK_UNKNOWN',{ambiguous:true});
    const remaining=e.fileSize-r.offset,length=remaining<r.chunk*2?remaining:r.chunk,bytes=this.store.range(job.transferId,r.offset,length);
    job=checkpoint({remote:{...r,chunkPending:true}});const response=await this.request(r.url,{method:'PUT',headers:{'Content-Type':'video/mp4','Content-Range':`bytes ${r.offset}-${r.offset+bytes.length-1}/${e.fileSize}`},body:bytes});
    if(!response.ok)throw new ProviderError('TIKTOK_UPLOAD_'+response.status,{ambiguous:true});const offset=r.offset+bytes.length;return {state:offset===e.fileSize?'processing':'uploading',remote:{...r,offset,chunkPending:false,uploadComplete:offset===e.fileSize},due:Date.now()+1000};
  }
}
