import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash,randomUUID,timingSafeEqual} from 'node:crypto';

const hash=b=>createHash('sha256').update(b).digest('hex');
const stamp=()=>new Date().toISOString();
const assert=(v,m)=>{if(!v)throw Error(m);};

// Serviço embutível de homologação. Não abre porta e não faz requisições externas.
// Um único escritor por diretório. Para múltiplos workers, substituir por banco transacional.
export class SimulationService{
  constructor({directory,sessionToken,ownerId}){
    assert(directory&&sessionToken?.length>=32&&ownerId,'Diretório privado, sessão e proprietário obrigatórios.');
    this.directory=resolve(directory);this.sessionHash=hash(sessionToken);this.ownerId=ownerId;this.chain=Promise.resolve();
  }
  authenticate(auth){const incoming=Buffer.from(hash(String(auth?.token||'')));assert(auth?.ownerId===this.ownerId&&timingSafeEqual(incoming,Buffer.from(this.sessionHash)),'Sessão inválida.');}
  async serialized(fn){const work=this.chain.then(fn);this.chain=work.catch(()=>{});return work;}
  async read(){try{return JSON.parse(await readFile(join(this.directory,'tasks.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return {version:1,tasks:[]};throw e;}}
  async save(data){await mkdir(this.directory,{recursive:true,mode:0o700});const temp=join(this.directory,randomUUID()+'.tmp');await writeFile(temp,JSON.stringify(data),{mode:0o600});await rename(temp,join(this.directory,'tasks.json'));}
  view(task){return structuredClone(task);}
  async accept(auth,envelope,bytes){this.authenticate(auth);return this.serialized(async()=>{
    assert(envelope?.schemaVersion===1&&['youtube','tiktok'].includes(envelope.platform),'Manifesto inválido.');
    assert(envelope.mode==='simulation'&&envelope.account?.mode==='simulation','Somente tarefas de simulação são aceitas.');
    assert(envelope.account.platform===envelope.platform&&envelope.account.id,'Conta de teste incompatível.');
    assert(envelope.publicationId&&envelope.productionId&&envelope.idempotencyKey&&envelope.assetId,'Identificadores obrigatórios.');
    assert(envelope.metadata?.title&&envelope.approval?.at&&envelope.approval.files?.some(f=>f.id===envelope.assetId&&f.hash===envelope.fileHash),'Revisão do arquivo ausente.');
    assert(envelope.rightsConfirmed===true,'Comprovação de direitos não enviada.');
    assert(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=50*1024*1024,'Transferência simulada: arquivo obrigatório, até 50 MB.');
    assert(bytes.length===envelope.fileSize&&hash(bytes)===envelope.fileHash,'Integridade do arquivo inválida.');
    // whitelist para impedir persistência acidental de tokens, dados de sessão ou campos arbitrários.
    const accepted={schemaVersion:1,mode:'simulation',publicationId:envelope.publicationId,productionId:envelope.productionId,platform:envelope.platform,account:{id:envelope.account.id,platform:envelope.platform,mode:'simulation'},assetId:envelope.assetId,fileHash:envelope.fileHash,fileSize:envelope.fileSize,fileVersion:envelope.fileVersion,productionVersion:envelope.productionVersion,idempotencyKey:envelope.idempotencyKey,metadata:envelope.metadata,approval:envelope.approval,rightsConfirmed:true};
    const payloadHash=hash(JSON.stringify(accepted)),data=await this.read(),old=data.tasks.find(t=>t.ownerId===this.ownerId&&t.idempotencyKey===accepted.idempotencyKey);
    if(old){assert(old.payloadHash===payloadHash,'Chave reutilizada com conteúdo diferente.');return this.view(old);}
    const task={...accepted,id:randomUUID(),ownerId:this.ownerId,payloadHash,state:'received',revision:1,attempts:0,createdAt:stamp(),events:[{at:stamp(),state:'received'}]};
    await mkdir(join(this.directory,'media'),{recursive:true,mode:0o700});await writeFile(join(this.directory,'media',task.id+'.mp4'),bytes,{mode:0o600});data.tasks.push(task);await this.save(data);return this.view(task);
  });}
  async mutate(auth,id,expectedRevision,fn){this.authenticate(auth);return this.serialized(async()=>{const data=await this.read(),task=data.tasks.find(t=>t.id===id&&t.ownerId===this.ownerId);assert(task,'Tarefa não encontrada.');assert(task.revision===expectedRevision,'Conflito de revisão; consulte a tarefa atual.');await fn(task);task.revision++;task.updatedAt=stamp();task.events.push({at:stamp(),state:task.state});await this.save(data);return this.view(task);});}
  async get(auth,id){this.authenticate(auth);const task=(await this.read()).tasks.find(t=>t.id===id&&t.ownerId===this.ownerId);assert(task,'Tarefa não encontrada.');return this.view(task);}
  async authorize(auth,id,revision,consent){return this.mutate(auth,id,revision,t=>{assert(consent?.approved===true&&consent.idempotencyKey===t.idempotencyKey,'Aprovação explícita vinculada à tarefa é obrigatória.');assert(t.state==='received','A tarefa precisa ser recebida antes da autorização.');t.state='authorized';t.authorizedAt=stamp();});}
  async process(auth,id,revision,scenario='success'){return this.mutate(auth,id,revision,async t=>{
    assert(['success','network','rejected','revoked'].includes(scenario),'Cenário inválido.');
    assert(t.state==='authorized'||(t.state==='failed'&&t.error?.retryable),'Tarefa não autorizada ou não pode ser repetida.');
    const bytes=await readFile(join(this.directory,'media',t.id+'.mp4'));assert(hash(bytes)===t.fileHash,'Arquivo persistido foi alterado.');
    t.attempts++;t.events.push({at:stamp(),state:'processing'});
    t.state=scenario==='success'?'simulated_complete':'failed';
    t.error=scenario==='success'?null:{code:'SIMULATED_'+scenario.toUpperCase(),retryable:scenario==='network',message:'Falha controlada do provedor simulado.'};
    t.result=scenario==='success'?{simulated:true,externalId:null,url:null,simulationId:'sim-'+t.id}:null;
  });}
  async cancel(auth,id,revision){return this.mutate(auth,id,revision,t=>{assert(t.state!=='simulated_complete','Resultado concluído preservado.');t.state='cancelled';});}
}
