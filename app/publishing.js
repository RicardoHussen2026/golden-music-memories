import {openDB,all,now,uid,digest} from './db.js';

// A tarefa complementa a publicação existente; nunca modifica o registro manual.
export const DELIVERY_STATES={local_draft:'Rascunho local',awaiting_review:'Aguardando revisão',awaiting_connection:'Aguardando configuração',simulation_ready:'Pronta para simular',transferring:'Simulação: transferindo',received:'Simulação: recebida',authorized:'Simulação: autorizada',processing:'Simulação: processando',simulated_complete:'Simulação concluída',failed:'Simulação com falha',cancelled:'Simulação cancelada',conflict:'Alteração local: revise novamente'};
export const deliveryLabel=pub=>DELIVERY_STATES[pub.delivery?.state]||'Rascunho local';
export const connectionSummary=platform=>({platform,serverAvailable:false,configured:false,connected:false,permissions:[],externalApprovalPending:platform==='tiktok',realPublishingEnabled:false,message:'Publicação real desabilitada. Preparação local e simulação disponíveis.'});
export function metadataFor(pub){const o=pub.options||{};let plannedAt=pub.plannedAt||'';if(plannedAt&&Number.isFinite(Date.parse(plannedAt)))plannedAt=new Date(plannedAt).toISOString();return {title:String(pub.title||'').trim(),description:String(pub.description||''),hashtags:String(pub.hashtags||''),plannedAt,options:pub.platform==='youtube'?{privacy:o.privacy||'private',categoryId:String(o.categoryId||'10'),madeForKids:o.madeForKids===true,containsSyntheticMedia:o.containsSyntheticMedia===true,tags:Array.isArray(o.tags)?o.tags:[]}:{privacy:o.privacy||'',allowComment:o.allowComment===true,allowDuet:o.allowDuet===true,allowStitch:o.allowStitch===true,commercialContent:o.commercialContent===true,musicUsageConsent:o.musicUsageConsent===true}};}
const revisionOf=pub=>JSON.stringify([pub.id,pub.productionId,pub.platform,pub.finalAssetId,metadataFor(pub)]);
const finalOf=(pub,assets)=>assets.find(a=>a.id===pub.finalAssetId&&a.productionId===pub.productionId&&a.role===pub.platform);
export function deliveryIssues(pub,p,assets,account){
  const issues=[];const file=finalOf(pub,assets),m=metadataFor(pub);
  if(!['youtube','tiktok'].includes(pub.platform))issues.push('Escolha TikTok ou YouTube.');
  if(!p||p.id!==pub.productionId||p.cancelled)issues.push('A produção precisa estar ativa.');
  if(!m.title)issues.push('Preencha o título.');
  if(pub.platform==='youtube'&&(m.title.length>100||m.description.length>5000))issues.push('YouTube: título até 100 e descrição até 5.000 caracteres.');
  if(!file||file.type!=='video/mp4'||!file.blob||!file.hash)issues.push('Selecione o MP4 final desta plataforma.');
  if(!p?.approval?.at||!p.approval.files?.some(a=>a.id===file?.id&&a.hash===file?.hash))issues.push('Revise e aprove o vídeo final atual.');
  for(const [key,label] of [['recording','gravação'],['composition','composição'],['visual','imagens'],[pub.platform,pub.platform]])if(p?.rights?.[key]!=='confirmed')issues.push(`Confirme a licença de ${label} para envio do arquivo. Biblioteca da plataforma exige fluxo manual.`);
  if(file&&file.rights!=='confirmed')issues.push('Confirme os direitos do arquivo final.');
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if(p?.licenseUntil&&p.licenseUntil<date)issues.push('A licença da produção está vencida.');
  if(file?.until&&file.until<date)issues.push('A licença do arquivo final está vencida.');
  if(m.plannedAt&&!Number.isFinite(Date.parse(m.plannedAt)))issues.push('Informe uma data planejada válida.');
  if(m.plannedAt&&Number.isFinite(Date.parse(m.plannedAt))&&Date.parse(m.plannedAt)<=Date.now())issues.push('O horário de envio precisa estar no futuro.');
  if(pub.platform==='youtube'&&m.plannedAt&&m.options.privacy!=='private')issues.push('Agendamento YouTube requer privacidade privada.');
  if(account&&(account.platform!==pub.platform||!account.id||account.mode!=='simulation'))issues.push('Use somente a conta identificada como simulação desta plataforma.');
  return issues;
}
async function snapshot(pub){const [pubs,productions,assets]=await Promise.all([all('publications'),all('productions'),all('assets')]);const fresh=pubs.find(x=>x.id===pub.id);if(!fresh)throw Error('Salve o rascunho da publicação antes de preparar.');if(revisionOf(fresh)!==revisionOf(pub))throw Error('A publicação mudou em outra aba. Abra a versão atual.');return {pub:fresh,p:productions.find(x=>x.id===fresh.productionId),assets};}
async function persist(expected,delivery,event){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(['publications','history'],'readwrite'),store=tx.objectStore('publications'),q=store.get(expected.id);let result;let reason='Outra aba alterou a publicação. Abra a versão atual.';q.onsuccess=()=>{const current=q.result;if(!current||revisionOf(current)!==revisionOf(expected)||(current.delivery?.revision||0)!==(expected.delivery?.revision||0)){tx.abort();return;}result={...current,delivery:{...delivery,revision:(current.delivery?.revision||0)+1,updatedAt:now()}};store.put(result);tx.objectStore('history').put({id:uid(),entityId:current.id,action:event,at:now(),detail:'Simulação/local: '+delivery.state});};tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(Error(reason));});}
export async function prepareDelivery(pub,production,assets,account=null){
  const fresh=await snapshot(pub);pub=fresh.pub;production=fresh.p;assets=fresh.assets;
  const issues=deliveryIssues(pub,production,assets,account);const file=finalOf(pub,assets);
  const envelope={schemaVersion:1,publicationId:pub.id,productionId:pub.productionId,platform:pub.platform,account:account?{id:account.id,platform:account.platform,label:account.label||'Conta de teste local',mode:account.mode}:null,assetId:file?.id||'',fileHash:file?.hash||'',fileSize:file?.size||file?.blob?.size||0,fileVersion:file?.version||0,productionVersion:production?.version||0,metadata:metadataFor(pub),approval:production?.approval?{at:production.approval.at,files:production.approval.files}:null};
  const fingerprint=await digest(new Blob([JSON.stringify(envelope)]));
  const state=issues.length?'awaiting_review':account?'simulation_ready':'awaiting_connection';
  if(pub.delivery?.fingerprint===fingerprint&&pub.delivery.state!=='cancelled'&&JSON.stringify(pub.delivery.issues||[])===JSON.stringify(issues))return pub;
  return persist(pub,{state,mode:'simulation',realPublishingEnabled:false,issues,fingerprint,idempotencyKey:`gmm:${pub.id}:${fingerprint}`,sourceRevision:revisionOf(pub),envelope,attempts:0,progress:0,createdAt:now(),previous:pub.delivery?{key:pub.delivery.idempotencyKey,state:pub.delivery.state,at:pub.delivery.updatedAt}:null},'delivery_prepared');
}
async function validateCurrent(pub){const data=await snapshot(pub),d=data.pub.delivery;if(!d||d.mode!=='simulation'||!d.envelope?.account)throw Error('Prepare a publicação com uma conta de simulação.');if(d.sourceRevision!==revisionOf(data.pub))throw Error('Textos ou arquivo mudaram. Prepare e revise novamente.');const issues=deliveryIssues(data.pub,data.p,data.assets,d.envelope.account);if(issues.length)throw Error(issues.join(' '));if(data.p.approval.at!==d.envelope.approval.at)throw Error('A revisão mudou. Prepare novamente.');const file=finalOf(data.pub,data.assets);if(await digest(file.blob)!==d.envelope.fileHash)throw Error('O arquivo mudou ou está corrompido. Importe e revise novamente.');return data.pub;}
export async function runSimulation(pub,scenario='success'){
  if(!['success','network','rejected','revoked'].includes(scenario))throw Error('Cenário de teste inválido.');
  pub=await validateCurrent(pub);if(pub.delivery.state==='simulated_complete')return pub;
  if(!['simulation_ready','failed'].includes(pub.delivery.state))throw Error('Esta tarefa já está em andamento ou foi cancelada.');
  const failure={network:{code:'SIMULATED_NETWORK',message:'Falha de rede simulada. Tente novamente.',retryable:true},rejected:{code:'SIMULATED_REJECTION',message:'Rejeição simulada. Revise o arquivo e prepare uma nova tarefa.',retryable:false},revoked:{code:'SIMULATED_REVOKED',message:'Consentimento revogado no teste. Nenhuma conta real foi acessada.',retryable:false}};
  if(pub.delivery.state==='failed'&&!pub.delivery.error?.retryable)throw Error('Cancele esta simulação e prepare novamente após revisar as pendências.');
  pub=await persist(pub,{...pub.delivery,state:'transferring',attempts:pub.delivery.attempts+1,progress:10,error:null},'simulation_started');
  for(const [state,progress] of [['received',35],['authorized',45],['processing',80]])pub=await persist(pub,{...pub.delivery,state,progress},'simulation_'+state);
  if(scenario!=='success')return persist(pub,{...pub.delivery,state:'failed',error:failure[scenario],progress:80},'simulation_failed');
  return persist(pub,{...pub.delivery,state:'simulated_complete',progress:100,result:{simulated:true,externalId:null,url:null,simulationId:'sim-'+pub.delivery.fingerprint.slice(0,16),completedAt:now()}},'simulation_completed');
}
export async function cancelDelivery(pub){const fresh=(await snapshot(pub)).pub;if(!fresh.delivery)throw Error('Nenhuma preparação para cancelar.');if(fresh.delivery.state==='simulated_complete')throw Error('A simulação já foi concluída. Seu resultado foi preservado.');return persist(fresh,{...fresh.delivery,state:'cancelled',cancelledAt:now()},'simulation_cancelled');}
// Constrói o contrato explícito; nenhuma transferência ou autenticação remota é executada aqui.
export async function transferManifest(pub){pub=await validateCurrent(pub);return {...pub.delivery.envelope,mode:'simulation',idempotencyKey:pub.delivery.idempotencyKey,rightsConfirmed:true};}
export async function reconcileDelivery(pub,result){const fresh=(await snapshot(pub)).pub,d=fresh.delivery;if(!d||result.mode!=='simulation'||result.publicationId!==pub.id||result.idempotencyKey!==d.idempotencyKey)throw Error('Resultado não corresponde à tarefa simulada.');if(result.serverRevision<=Number(d.serverRevision||0))return fresh;if(d.sourceRevision!==revisionOf(fresh))return persist(fresh,{...d,state:'conflict',conflict:{receivedAt:now(),serverRevision:result.serverRevision,message:'Alterações locais preservadas; revise antes de aceitar o resultado.'}},'simulation_conflict');if(d.state==='cancelled')return fresh;if(!['simulated_complete','failed','processing'].includes(result.state))throw Error('Estado externo inválido.');return persist(fresh,{...d,state:result.state,serverRevision:result.serverRevision,result:result.state==='simulated_complete'?{simulated:true,externalId:null,url:null,completedAt:now()}:null,error:result.state==='failed'?{code:'SIMULATED_FAILURE',message:'O provedor simulado falhou.',retryable:true}:null},'simulation_reconciled');}
