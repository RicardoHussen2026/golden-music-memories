import {resolve} from 'node:path';

export function configuration(env=process.env){
  const port=Number(env.GMM_PORT||8877),origin=env.GMM_PUBLIC_ORIGIN||`http://127.0.0.1:${port}`;
  const url=new URL(origin);
  if(!['https:','http:'].includes(url.protocol)||url.origin!==origin)throw Error('GMM_PUBLIC_ORIGIN deve conter somente a origem.');
  if(url.protocol==='http:'&&!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw Error('Use HTTPS fora do computador local.');
  const localAccess=env.GMM_LOCAL_ACCESS==='true';
  if(localAccess&&origin!==new URL(`http://127.0.0.1:${port}`).origin)throw Error('Acesso local exige origem HTTP 127.0.0.1 na porta do serviço.');
  const encryptionKey=env.GMM_ENCRYPTION_KEY||'';
  if(encryptionKey&&!/^[a-f\d]{64}$/i.test(encryptionKey))throw Error('Chave de cifragem: 64 caracteres hexadecimais.');
  return {port,host:'127.0.0.1',origin,localAccess,secure:url.protocol==='https:',directory:resolve(env.GMM_DATA_DIR||'.cache/publishing-private'),
    password:env.GMM_OPERATOR_PASSWORD||'',encryptionKey:encryptionKey?Buffer.from(encryptionKey,'hex'):null,
    network:env.GMM_ALLOW_NETWORK==='true',publishing:env.GMM_ALLOW_PUBLISH==='true',worker:env.GMM_WORKER_ENABLED==='true',
    maxBytes:bounded(env.GMM_MAX_FILE_MIB,10240,1,262144)*1024*1024,minFreeBytes:bounded(env.GMM_MIN_FREE_MIB,1024,0,1048576)*1024*1024,chunkBytes:4*1024*1024,maxAttempts:5,
    drive:{clientId:env.GOOGLE_DRIVE_CLIENT_ID||'',clientSecret:env.GOOGLE_DRIVE_CLIENT_SECRET||'',redirectUri:origin+'/api/oauth/drive/callback',email:env.GOOGLE_DRIVE_EMAIL||'ric.hussen@gmail.com'},
    youtube:{clientId:env.YOUTUBE_CLIENT_ID||'',clientSecret:env.YOUTUBE_CLIENT_SECRET||'',redirectUri:origin+'/api/oauth/youtube/callback',manageSchedules:env.YOUTUBE_MANAGE_SCHEDULES==='true',maxDurationSeconds:bounded(env.YOUTUBE_MAX_DURATION_SECONDS,900,1,43200)},
    tiktok:{clientId:env.TIKTOK_CLIENT_KEY||'',clientSecret:env.TIKTOK_CLIENT_SECRET||'',redirectUri:origin+'/api/oauth/tiktok/callback',uploadApproved:env.TIKTOK_UPLOAD_APPROVED==='true'}};
}
export function enabled(config,platform){const p=config[platform];return Boolean(config.network&&config.encryptionKey&&p?.clientId&&p?.clientSecret&&(platform!=='tiktok'||config.secure&&p.uploadApproved));}
function bounded(value,fallback,min,max){const n=value===undefined?fallback:Number(value);if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('Limite de armazenamento inválido.');return n;}
export function availability(config){return {localAccessEnabled:config.localAccess===true,networkEnabled:config.network,publishingEnabled:config.publishing,workerEnabled:config.worker,authenticationConfigured:config.password.length>=16,encryptionConfigured:!!config.encryptionKey,
  providers:['youtube','tiktok','drive'].map(platform=>({platform,configured:!!config[platform].clientId&&!!config[platform].clientSecret,oauthEnabled:enabled(config,platform),
    directPostEnabled:false,automaticScheduling:platform==='youtube',message:platform==='drive'?'Acervo privado no Drive; requer OAuth próprio e conta autorizada.':platform==='tiktok'?'Direct Post indisponível para este painel pessoal. Upload assistido depende de aprovação; finalização no aplicativo.':'Upload e agendamento disponíveis após configuração e autorização.'}))};}
