import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync,statfsSync} from 'node:fs';
import {join} from 'node:path';
import {check,stamp} from './store.mjs';

// Identidade pertence à instalação, nunca ao snapshot importado.
export class Continuity{
  constructor(store,config,scheduler){Object.assign(this,{store,config,scheduler});const file=join(config.directory,'installation.json');if(!existsSync(file))writeFileSync(file,JSON.stringify({id:randomUUID()}),{mode:0o600});this.id=JSON.parse(readFileSync(file,'utf8')).id;
    const previous=store.get('machine','local');if(!previous||previous.id!==this.id)store.put('machine','local',{id:this.id,active:false,label:'Este computador',createdAt:stamp()});
  }
  status(){return this.store.get('machine','local');}
  activate(input){const m=this.status();check(input.confirmSingleComputer===true,'Confirme que este é o único computador operando.');check(!m.releasedTo,'Esta instalação transferiu o controle. Receba uma devolução do computador de destino antes de reativar.',409);check(!m.needsReconciliation,'Conclua a conciliação antes de ativar.',409);const next={...m,active:true,label:String(input.label||m.label).slice(0,100),activatedAt:stamp()};this.store.put('machine','local',next);return next;}
  pause(){const m=this.status();this.store.put('machine','local',{...m,active:false,pausedAt:stamp()});this.scheduler.pause();return this.status();}
  export(input,{handoff=false}={}){
    check(this.config.encryptionKey,'Configure e guarde a chave de cifragem para criar o pacote.');
    if(handoff){check(/^[a-f\d-]{36}$/.test(input.target)&&input.target!==this.id,'Informe o identificador do computador de destino.');check(input.confirmSingleComputer===true,'Confirme o encerramento da operação nesta máquina.');}
    this.pause();check(!this.store.db.prepare('SELECT id FROM jobs WHERE lease_until>? LIMIT 1').get(Date.now()),'Aguarde a operação em andamento concluir e tente novamente.',409);
    const jobs=this.store.db.prepare('SELECT * FROM jobs').all();for(const row of jobs){const j=JSON.parse(row.data);if(!['published','completed','completed_private','completed_unlisted','simulated_complete','cancelled','rejected','failed'].includes(j.state)){const t=this.store.transfer(j.transferId,'operator');check(t.envelope.mediaId,'Existe tarefa antiga sem arquivo Drive. Conclua/cancele/concilie antes da transferência.');}}
    const media=this.store.list('media');if(handoff)check(media.every(m=>m.hash&&m.drive?.verified&&!['receiving','downloading'].includes(m.state)),'Conclua as transferências e envie ao Drive todos os vídeos antes de transferir o controle.');
    const kinds=['production','publication','media','schedule','slot','drive','ops_event'];const objects=kinds.flatMap(kind=>this.store.list(kind).map(data=>({kind,id:kind==='schedule'?'routine':kind==='drive'?this.store.db.prepare('SELECT id FROM objects WHERE kind=? AND data=?').get(kind,JSON.stringify(data))?.id:data.id,data})));
    const packet={schema:1,application:'GMM_CONTROL',id:randomUUID(),source:this.id,target:handoff?input.target:null,handoff,createdAt:stamp(),objects,jobs,transfers:this.store.db.prepare('SELECT * FROM transfers').all(),events:this.store.db.prepare('SELECT * FROM events').all()};
    const encrypted=this.store.seal(packet);this.store.put('continuity','lastExport',{id:packet.id,at:packet.createdAt,handoff,target:packet.target});if(handoff)this.store.put('machine','local',{...this.status(),active:false,releasedTo:input.target,releaseId:packet.id});return {schema:1,application:'GMM_ENCRYPTED_CONTROL',encrypted};
  }
  inspect(packet){check(packet?.application==='GMM_ENCRYPTED_CONTROL'&&packet.schema===1,'Pacote inválido.');let data;try{data=this.store.open(packet.encrypted);}catch{check(false,'Chave incorreta ou pacote corrompido.');}check(data.schema===1&&data.application==='GMM_CONTROL'&&Array.isArray(data.objects)&&Array.isArray(data.jobs)&&Array.isArray(data.transfers)&&Array.isArray(data.events),'Conteúdo de controle inválido.');check(!data.handoff||data.target===this.id,'Pacote destinado a outro computador.');return data;}
  import(packet,input){const data=this.inspect(packet);check(input.confirmSourceStopped===true,'Confirme que a origem está parada.');check(!this.store.get('continuity','import:'+data.id),'Este pacote já foi restaurado; não pode ser reaplicado.',409);
    check(this.status().active===false,'Pause este computador antes de restaurar.');check(!this.store.db.prepare('SELECT id FROM jobs WHERE lease_until>? LIMIT 1').get(Date.now()),'Execução em andamento.',409);
    // Recuperação preserva o estado anterior em pacote cifrado antes de substituir controles.
    this.store.db.prepare('VACUUM INTO ?').run(join(this.config.directory,'before-restore-'+randomUUID()+'.sqlite'));
    const allowed=new Set(['production','publication','media','schedule','slot','drive','ops_event']);
    for(const obj of data.objects)check(allowed.has(obj.kind)&&typeof obj.id==='string'&&obj.data,'Objeto inválido no pacote.');
    return this.store.transaction(()=>{for(const kind of allowed)this.store.db.prepare('DELETE FROM objects WHERE kind=?').run(kind);this.store.db.exec('DELETE FROM events; DELETE FROM jobs; DELETE FROM chunks; DELETE FROM transfers;');
      for(const t of data.transfers)this.store.db.prepare('INSERT INTO transfers VALUES(?,?,?,?,?)').run(t.id,t.owner,t.fingerprint,t.data,t.offset);
      for(const j of data.jobs){const value=JSON.parse(j.data);const active=!['published','completed','completed_private','completed_unlisted','simulated_complete','cancelled','rejected','failed'].includes(j.state);const state=active?'needs_reconciliation':j.state;this.store.db.prepare('INSERT INTO jobs VALUES(?,?,?,?,?,?,?,?,?)').run(j.id,j.owner,j.key,state,j.due,null,0,j.revision+1,JSON.stringify({...value,state,integrityValidated:false,lease:null,leaseUntil:0,revision:j.revision+1}));}
      for(const e of data.events)this.store.db.prepare('INSERT INTO events VALUES(?,?,?,?)').run(e.id,e.job_id,e.at,e.event);
      for(const obj of data.objects){let value=obj.data;if(obj.kind==='media')value={...value,cached:false,error:null};if(obj.kind==='schedule')value={...value,enabled:false,revision:value.revision+1};this.store.put(obj.kind,obj.id,value);}
      this.store.put('continuity','import:'+data.id,{id:data.id,at:stamp()});this.store.put('machine','local',{id:this.id,active:false,label:this.status().label,needsReconciliation:true,importedAt:stamp(),source:data.source});return {restored:true,paused:true,needsReconciliation:true};});
  }
  reconcile(input){check(input.confirmSourceStopped===true,'Confirme que a origem continua parada.');const unresolved=this.store.jobs('operator').filter(j=>['needs_reconciliation','awaiting_reconnect'].includes(j.state));check(!unresolved.length,'Concilie as tarefas anteriores no painel antes de liberar a máquina.',409);this.store.put('machine','local',{...this.status(),needsReconciliation:false,reconciledAt:stamp()});return this.status();}
  diagnostics(){const disk=statfsSync(this.config.directory),free=Number(disk.bavail)*Number(disk.bsize),machine=this.status(),schedule=this.scheduler.settings();return {machine,freeBytes:free,minFreeBytes:this.config.minFreeBytes,maxFileBytes:this.config.maxBytes,network:this.config.network,worker:this.config.worker,publishing:this.config.publishing,driveConfigured:!!this.config.drive.clientId&&!!this.config.drive.clientSecret,notes:[...free<this.config.minFreeBytes?['Espaço abaixo da reserva mínima.']:[],...!machine.active?['Computador pausado.']:[],...!schedule.enabled?['Rotina automática pausada.']:[],'TikTok Direct Post indisponível para este aplicativo pessoal.','O computador precisa permanecer ligado, conectado e sem suspensão.'],lastBackup:this.store.get('continuity','lastExport')};}
}
