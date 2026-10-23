import {check,stamp,publicJob} from './store.mjs';
import {validateEnvelope} from './contracts.mjs';
import {enabled} from './config.mjs';

const terminal=new Set(['published','completed','completed_private','completed_unlisted','simulated_complete','cancelled','rejected','failed','needs_reconciliation','awaiting_reconnect']);
export class Worker{
  constructor(store,config,providers){Object.assign(this,{store,config,providers});}
  authorize(owner,id,revision,consent){const job=this.store.job(id,owner);check(job.revision===revision,'Atualize a tarefa.',409);check(consent?.confirm===true&&consent.binding===job.envelope.approval.binding,'Aprovação explícita da tarefa é obrigatória.');check(['received','awaiting_reconnect'].includes(job.state),'Tarefa já autorizada ou concluída.',409);validateEnvelope(job.envelope,this.config);
    if(job.mode==='real'){check(this.config.publishing&&enabled(this.config,job.platform),'Publicação real desativada.',409);const connection=this.store.get('connection',job.envelope.accountId);check(connection?.owner===owner&&connection.platform===job.platform&&connection.state==='connected','Conecte a conta de destino.',409);if(job.platform==='tiktok')check(consent.assistedUpload===true&&consent.musicUsage===true,'Confirme o envio assistido e o uso autorizado da música.');}
    return publicJob(this.store.update(job,{state:'authorized',due:Date.now(),authorizedAt:stamp(),scenario:job.mode==='simulation'&&['network','revoked','rejected'].includes(consent.scenario)?consent.scenario:'success',error:null},'authorized'));
  }
  cancel(owner,id,revision){const job=this.store.job(id,owner);check(job.revision===revision,'Atualize a tarefa.',409);check(!(job.leaseUntil>Date.now()),'Uma execução está em andamento; consulte novamente antes de cancelar.',409);check(!terminal.has(job.state),'Resultado terminal preservado.',409);
    check(!job.remote?.videoId&&!job.remote?.publishId&&job.remote?.phase!=='initializing'&&!job.remote?.probe&&!(job.remote?.offset>0),'O provedor já pode ter recebido o vídeo. Use conciliação; cancelar localmente não desfaz a operação externa.',409);
    return publicJob(this.store.update(job,{state:'cancelled',cancelledAt:stamp(),lease:null,leaseUntil:0},'cancelled'));
  }
  async tick(owner='operator',onlyId=null){
    let job=this.store.claim(owner,onlyId);if(!job)return null;
    const save=(patch,event='worker_step')=>{job=this.store.update(job,patch,event,{leased:true});return job;};
    try{
      const e=job.envelope;
      // A tarefa aceita é imutável; licenças precisam cobrir também o dia da execução.
      const today=new Intl.DateTimeFormat('en-CA',{timeZone:e.metadata.timeZone}).format(new Date());
      check([e.rights.productionUntil,e.rights.assetUntil].every(v=>!v||v>=today),'A licença venceu antes da execução.',409);
      if(!job.remote?.videoId&&!job.remote?.uploadComplete)check(this.store.hashTransfer(job.transferId)===e.fileHash,'Integridade do vídeo persistido inválida.',409);
      if(job.mode==='simulation'){
        if(job.scenario==='network'&&job.attempts===0)return publicJob(save({state:'retry_wait',attempts:1,error:{code:'SIMULATED_NETWORK',message:'Falha simulada; repetição automática limitada.',retryable:true},due:Date.now()+1000,lease:null,leaseUntil:0},'simulation_retry'));
        const failed=['rejected','revoked'].includes(job.scenario);return publicJob(save({state:failed?'failed':'simulated_complete',attempts:job.attempts+1,result:failed?null:{simulated:true,externalId:null,url:null,completedAt:stamp()},error:failed?{code:'SIMULATED_'+job.scenario.toUpperCase(),message:'Falha de teste. Nenhuma plataforma foi acessada.',retryable:false}:null,lease:null,leaseUntil:0},'simulation_result'));
      }
      check(this.config.publishing&&enabled(this.config,job.platform),'Execução real desativada.',409);
      save({attempts:job.attempts+1},'provider_attempt');
      const result=await this.providers[job.platform+'Step'](job,patch=>save(patch,'provider_checkpoint'));
      // Polling pendente não conta como falha, mas tem limite de 24 horas por rodada.
      if(!terminal.has(result.state)&&Date.now()-Date.parse(job.authorizedAt)>86400000&&result.state!=='scheduled')result.state='needs_reconciliation';
      return publicJob(save({...result,failures:0,error:result.error||null,lease:null,leaseUntil:0},'provider_result'));
    }catch(error){
      const safeCode=error.code&&/^[A-Za-z0-9_]+$/.test(error.code)?error.code:'VALIDATION_FAILED';
      const failures=(job.failures||0)+1,retry=error.retryable&&failures<this.config.maxAttempts;
      // Upload retomável usa a mesma sessão. Uma inicialização ambígua nunca cria outro upload.
      const recoverableSession=job.platform==='youtube'&&job.remote?.session;
      const uncertain=(error.ambiguous&&!(recoverableSession&&retry))||(!recoverableSession&&(job.remote?.phase==='initializing'||job.remote?.chunkPending));
      const state=error.reconnect?'awaiting_reconnect':uncertain?'needs_reconciliation':retry?'retry_wait':'failed';
      return publicJob(save({state,failures,error:{code:safeCode,message:state==='needs_reconciliation'?'Resultado externo desconhecido. Confira a plataforma antes de qualquer novo envio.':state==='awaiting_reconnect'?'Reconecte a conta e aprove a continuidade.':'Não foi possível concluir. Consulte o código e revise a tarefa.',retryable:state==='retry_wait'},due:Date.now()+Math.max(error.delay||0,Math.min(3600000,1000*2**Math.min(failures,10))),lease:null,leaseUntil:0},'worker_error'));
    }
  }
  reconcile(owner,id,revision){const job=this.store.job(id,owner);check(job.revision===revision,'Atualize a tarefa.',409);check(job.mode==='real'&&this.config.publishing&&enabled(this.config,job.platform),'Conciliação real desabilitada.',409);check(!(job.leaseUntil>Date.now()),'Execução em andamento.',409);check(job.remote?.videoId||job.remote?.session||job.remote?.publishId,'Não há identificador remoto recuperável. Confira manualmente a plataforma.',409);
    return publicJob(this.store.update(job,{state:job.remote.videoId||job.remote.publishId?'processing':'uploading',remote:{...job.remote,...(job.platform==='youtube'&&job.remote.session?{probe:true}:{})},due:Date.now(),error:null},'reconciliation_requested'));
  }
}
