// Serializes inspection creation and cleanup. The short POST acknowledgment is
// deliberately retained so a cancelled UI never loses the server's job ID.
export function normalizedSourceURL(value){
 try{const u=new URL(String(value).trim());if(u.protocol!=='https:'||u.username||u.password||u.port||u.searchParams.has('list')||!['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be'].includes(u.hostname))return null;
 const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.pathname==='/watch'?u.searchParams.get('v'):/^\/(shorts|embed)\//.test(u.pathname)?u.pathname.split('/')[2]:null;
 return /^[\w-]{11}$/.test(id||'')?`https://${u.hostname==='music.youtube.com'?'music.youtube.com':'www.youtube.com'}/watch?v=${id}`:null;}catch{return null;}
}
export function autoInspection({start,status,cancel,onState,onResult,delay=650,pollDelay=500}){
 let generation=0,timer,controller,chain=Promise.resolve(),closed=false,lastURL=null,phase='idle',currentId=null;
 const state=(value,message)=>{phase=value;if(!closed)onState(value,message);};
 const wait=signal=>new Promise((resolve,reject)=>{if(signal.aborted)return reject(signal.reason);const done=()=>{signal.removeEventListener('abort',abort);resolve();},t=setTimeout(done,pollDelay),abort=()=>{clearTimeout(t);signal.removeEventListener('abort',abort);reject(signal.reason);};signal.addEventListener('abort',abort,{once:true});});
 function change(value,{force=false}={}){
  if(closed)return;const url=normalizedSourceURL(value);
  if(!force&&url&&url===lastURL&&['waiting','inspecting','ready'].includes(phase))return;
  const ticket=++generation;clearTimeout(timer);controller?.abort();lastURL=url;onResult(null);
  if(!url){state('invalid',String(value).trim()?'Cole o endereço completo de um vídeo individual do YouTube ou YouTube Music.':'Cole um link para consultar os formatos automaticamente.');return;}
  state('waiting','Preparando consulta…');
  timer=setTimeout(()=>{chain=chain.then(async()=>{
   if(closed||ticket!==generation)return;controller=new AbortController();const signal=controller.signal;let id=null,finished=false;
   state('inspecting','Consultando formatos…');
   try{const job=await start(url);id=job.id;currentId=id;
    if(closed||ticket!==generation)return;
    while(!signal.aborted){const result=await status(id,signal);if(closed||ticket!==generation)return;
     if(result.state==='inspected'){finished=true;state('ready','Escolha a qualidade e clique em Baixar quando quiser.');onResult(result);return;}
     if(['failed','cancelled','interrupted'].includes(result.state)){finished=true;state('failed',result.error||'Consulta não concluída. Corrija ou cole o link novamente para tentar.');return;}
     await wait(signal);
    }
   }catch(error){if(ticket===generation&&!closed&&!signal.aborted)state('failed',error.message||'Não foi possível consultar. Cole o link novamente para tentar.');}
   finally{if(id&&!finished){try{await cancel(id);}catch{if(!closed)state('failed','Não foi possível confirmar o cancelamento. Aguarde a tarefa terminar antes de tentar novamente.');}}if(currentId===id)currentId=null;}
  }).catch(error=>{if(!closed)state('failed',error.message);});},delay);
 }
 function stop(){generation++;clearTimeout(timer);controller?.abort();lastURL=null;onResult(null);state('cancelled','Consulta cancelada. Cole o link novamente para repetir.');}
 return {change,cancel:stop,get currentId(){return currentId;},async close(){closed=true;generation++;clearTimeout(timer);controller?.abort();await chain;}};
}
