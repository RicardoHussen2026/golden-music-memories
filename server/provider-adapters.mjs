// Contratos e redutores puros. Não contêm fetch, transporte de rede ou ativação por ambiente.
export const YOUTUBE_SCOPES=Object.freeze({upload:'https://www.googleapis.com/auth/youtube.upload',read:'https://www.googleapis.com/auth/youtube.readonly'});
export function youtubeUploadPlan(task){
  const o=task.metadata?.options||{};
  if(!task.metadata?.title||task.metadata.title.length>100)throw Error('Título YouTube inválido.');
  if(!['private','unlisted','public'].includes(o.privacy||'private'))throw Error('Privacidade inválida.');
  const status={privacyStatus:o.privacy||'private',selfDeclaredMadeForKids:o.madeForKids===true,containsSyntheticMedia:o.containsSyntheticMedia===true};
  if(task.metadata.plannedAt){if(status.privacyStatus!=='private')throw Error('Agendamento exige privacidade privada.');const at=new Date(task.metadata.plannedAt);if(!Number.isFinite(at.getTime())||at<=new Date())throw Error('Agendamento exige data futura.');status.publishAt=at.toISOString();}
  return {disabled:true,method:'POST',endpoint:'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',scope:YOUTUBE_SCOPES.upload,headers:{'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Type':'video/mp4','X-Upload-Content-Length':String(task.fileSize)},body:{snippet:{title:task.metadata.title,description:task.metadata.description||'',tags:o.tags||[],categoryId:o.categoryId||'10'},status},requiresExplicitConsent:true};
}
export const youtubeChannelPlan=()=>({disabled:true,method:'GET',endpoint:'https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true',scope:YOUTUBE_SCOPES.read});
export const youtubeProcessingPlan=id=>({disabled:true,method:'GET',endpoint:'https://www.googleapis.com/youtube/v3/videos?part=status,processingDetails&id='+encodeURIComponent(id),scope:YOUTUBE_SCOPES.read});
export function resumeUpload(session,response){
  if(!session||!Number.isSafeInteger(session.total)||session.total<1)throw Error('Sessão retomável inválida.');
  if([200,201].includes(response.status))return {...session,offset:session.total,state:'uploaded',videoId:response.videoId||null};
  if(response.status===308){const match=/^bytes=0-(\d+)$/.exec(response.range||'');const offset=match?Number(match[1])+1:0;if(offset<session.offset||offset>session.total)throw Error('Faixa retomada inconsistente.');return {...session,offset,state:'uploading'};}
  if(response.status===404)return {...session,state:'expired',requiresReconciliation:true};
  if(response.status===401)return {...session,state:'reconnect',retryable:false};
  if(response.status>=500)return {...session,state:'interrupted',retryable:true};
  return {...session,state:'rejected',retryable:false};
}
export function processingResult(resource){const status=resource.status||{},process=resource.processingDetails||{};if(['failed','rejected','deleted'].includes(status.uploadStatus)||process.processingStatus==='failed')return {state:'rejected',reason:status.rejectionReason||status.failureReason||process.processingFailureReason||'unknown'};if(status.uploadStatus==='processed'||process.processingStatus==='succeeded')return {state:'processed',privacy:status.privacyStatus,publishAt:status.publishAt||null};return {state:'processing'};}
export const tiktokCapabilities=()=>({realEnabled:false,directPostPersonalUseAllowed:false,schedulingImplemented:false,uploadScope:'video.upload',directPostScope:'video.publish',requiresAudit:true,requiresCreatorInfo:true,requiresExplicitMusicConsent:true,message:'Ferramenta limitada à própria conta/equipe não se enquadra no uso aceito de Direct Post. Use exportação e publicação manual.'});
export const disabledProvider={connect(){throw Error('Conexões reais desabilitadas nesta etapa.');},publish(){throw Error('Publicação real desabilitada nesta etapa.');},schedule(){throw Error('Agendamento real desabilitado nesta etapa.');}};
