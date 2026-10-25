// Motor de preparação testável. Sem adaptador real, rotas ou ativação automática.
import {readFile,writeFile,rename,lstat,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {hashes,DRIVE_TARGET} from './plan.mjs';
const same=(remote,item,parent)=>remote&&!remote.trashed&&remote.id&&remote.parents?.includes(parent)&&Number(remote.size)===item.size&&remote.md5Checksum===item.md5&&remote.appProperties?.gmmSha256===item.sha256&&remote.public===false;
export class PreparedDriveQueue{
 constructor(plan,{stateFile,transport,folders}={}){if(!plan||!stateFile||!transport||!folders)throw Error('Plano, estado local e transporte explícitos são obrigatórios.');Object.assign(this,{plan,stateFile:resolve(stateFile),transport,folders});this.running=false;this.state={planId:plan.id,items:{},manifest:null};}
 async load(){try{const old=JSON.parse(await readFile(this.stateFile,'utf8'));if(old.planId!==this.plan.id)throw Error('Estado de outro plano; preserve-o e use outro arquivo.');this.state=old;}catch(e){if(e.code!=='ENOENT')throw e;}return this.state;}
 async save(){await mkdir(dirname(this.stateFile),{recursive:true});const temporary=this.stateFile+'.'+randomUUID()+'.part';await writeFile(temporary,JSON.stringify(this.state,null,2),{flag:'wx',mode:0o600});await rename(temporary,this.stateFile);}
 cancel(){this.controller?.abort();}
 async run(){if(this.running)throw Error('Fila já está em execução.');this.running=true;this.controller=new AbortController();const signal=this.controller.signal;
  try{await this.load();const identity=await this.transport.identity({signal});if(identity.email!==DRIVE_TARGET.email||identity.rootId!==DRIVE_TARGET.rootId)throw Error('Conta ou pasta não conferidas pelo transporte.');
   for(const item of this.plan.files){signal.throwIfAborted();const parent=this.folders[item.category];if(!parent)throw Error('Pasta não conferida.');let row=this.state.items[item.key]||{state:'not_sent'};
    try{const before=await lstat(item.file);if(!before.isFile()||before.isSymbolicLink()||before.size!==item.size||(await hashes(item.file)).sha256!==item.sha256)throw Error('Arquivo local mudou; prepare outra versão/plano.');
     // Resposta perdida exige reconciliação antes de criar qualquer cópia.
     const found=await this.transport.lookup({key:item.key,parent,id:row.remoteId||row.reservedId||null,signal});if(found.length>1)throw Error('Cópias remotas ambíguas; revisar sem excluir.');if(found[0]){if(!same(found[0],item,parent))throw Error('Cópia remota divergiu; não sobrescrever.');this.state.items[item.key]={state:'complete',remoteId:found[0].id,reused:true};await this.save();continue;}
     if(row.state==='complete'||row.remoteId)throw Error('ID remoto anterior não confirmado; conciliação necessária.');
     row={...row,state:'sending',offset:row.offset||0};this.state.items[item.key]=row;await this.save();
     // ID precisa ser reservado/persistido antes do início remoto. Nunca gravar tokens/session URLs no manifesto.
     if(!row.reservedId){row.reservedId=await this.transport.reserveId({key:item.key,signal});await this.save();}
     const receipt=await this.transport.send({id:row.reservedId,item,parent,offset:row.offset,signal,onProgress:async offset=>{signal.throwIfAborted();if(!Number.isSafeInteger(offset)||offset<row.offset||offset>item.size)throw Error('Progresso inválido.');row.offset=offset;await this.save();}});
     signal.throwIfAborted();if(receipt.id!==row.reservedId||!same(receipt,item,parent))throw Error('Envio sem confirmação de integridade/privacidade.');row={state:'complete',remoteId:receipt.id,offset:item.size};this.state.items[item.key]=row;await this.save();
    }catch(e){this.state.items[item.key]={...row,state:signal.aborted?'cancelled':'error',error:signal.aborted?'Cancelado; conciliar antes de retomar.':'Não concluído; origem preservada. Conferir arquivo, conta e recibo antes de repetir.'};await this.save();throw e;}
   }
   this.state.manifest={...this.plan.manifest,files:this.plan.manifest.files.map(f=>({...f,remoteId:this.state.items[f.key].remoteId})),state:'complete'};await this.save();return this.state;
  }finally{this.running=false;}
 }
}
