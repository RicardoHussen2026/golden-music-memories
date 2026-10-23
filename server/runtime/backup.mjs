import {DatabaseSync,backup} from 'node:sqlite';
import {resolve,dirname,sep} from 'node:path';
import {mkdir,chmod,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {configuration} from './config.mjs';
import {check} from './store.mjs';

export async function backupService(directory,destination){
  const root=resolve(fileURLToPath(new URL('../../',import.meta.url))),target=resolve(destination);
  check(!target.toLowerCase().startsWith((root+sep).toLowerCase()),'Guarde o backup privado fora da pasta pública do projeto.');
  check(target.endsWith('.sqlite'),'Use extensão .sqlite.');
  let exists=false;try{await access(target);exists=true;}catch{}
  check(!exists,'Destino já existe; escolha outro arquivo para preservar o backup anterior.');
  await mkdir(dirname(target),{recursive:true,mode:0o700});
  const db=new DatabaseSync(resolve(directory,'publishing.sqlite'),{readOnly:true});
  try{await backup(db,target);await chmod(target,0o600);}finally{db.close();}
  return target;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  check(process.argv[2],'Informe um caminho privado de destino fora do projeto.');
  await backupService(configuration().directory,process.argv[2]);console.log('Backup consistente do serviço criado. Guarde a chave de cifragem separadamente.');
}
