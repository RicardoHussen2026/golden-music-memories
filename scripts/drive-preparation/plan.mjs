// Preparação isolada: não importada pelo painel/servidor e não faz requisições.
import {stat,lstat} from 'node:fs/promises';
import {resolve,relative,isAbsolute,sep,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
export const DRIVE_TARGET=Object.freeze({rootId:'1GArPHKjcbMyfEyDi7l8gcaB07mIQtXoH',email:'ric.hussen@gmail.com'});
export const FOLDERS=Object.freeze({editing:'01_EM_EDICAO',ready:'02_VIDEOS_PRONTOS',covers:'03_CAPAS_E_CAPCUT',control:'04_CONTROLE_E_BACKUPS'});
const uuid=v=>typeof v==='string'&&/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(v);
function requireValue(v,message){if(!v)throw Error(message);}
const key=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export async function hashes(file){const sha=createHash('sha256'),md5=createHash('md5');for await(const chunk of createReadStream(file)){sha.update(chunk);md5.update(chunk);}return {sha256:sha.digest('hex'),md5:md5.digest('hex')};}
export async function prepareDrivePlan(entries,{allowedRoot,target=DRIVE_TARGET}={}){
 requireValue(allowedRoot&&Array.isArray(entries)&&entries.length>0&&entries.length<=1000,'Selecione de 1 a 1000 arquivos em uma raiz local explícita.');
 requireValue(target.rootId===DRIVE_TARGET.rootId&&target.email===DRIVE_TARGET.email,'Destino diferente exige decisão explícita, não inferência por nome.');
 const files=[],references=[],ids=new Set(),versions=new Map();
 for(const entry of entries){const {id,productionId,version,category}=entry;requireValue(typeof id==='string'&&id.length>0&&!ids.has(id),'ID lógico ausente ou repetido.');ids.add(id);requireValue(uuid(productionId)&&Number.isSafeInteger(version)&&version>0,'Produção/coletânea e versão explícitas são obrigatórias.');requireValue(Object.hasOwn(FOLDERS,category),'Categoria de pasta inválida.');
  const file=resolve(entry.file),rel=relative(resolve(allowedRoot),file);requireValue(rel&&!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel),'Arquivo fora da raiz permitida.');let part=resolve(allowedRoot);requireValue(!(await lstat(part)).isSymbolicLink(),'Raiz simbólica não permitida.');for(const name of rel.split(sep)){part=resolve(part,name);requireValue(!(await lstat(part)).isSymbolicLink(),'Link simbólico não permitido.');}
  const before=await stat(file);requireValue(before.isFile()&&before.size>0,'Arquivo local vazio ou inválido.');const extension=extname(file).toLowerCase();requireValue(['.mp4','.mkv','.mov','.webm','.m4a','.mp3','.wav','.png','.jpg','.jpeg','.webp','.zip','.json','.txt','.pdf'].includes(extension),'Tipo não preparado para envio.');requireValue(category!=='ready'||extension==='.mp4','Pasta de prontos exige MP4 finalizado.');requireValue(!/\.env|credential|secret|token|password/i.test(rel),'Configuração e segredos não entram no plano de envio.');
  const integrity=await hashes(file),after=await stat(file);requireValue(after.size===before.size&&after.mtimeMs===before.mtimeMs,'Arquivo mudou durante preparação.');
  const logical=productionId+':'+category+':'+String(entry.role||'material')+':'+version,old=versions.get(logical);requireValue(!old||old===integrity.sha256,'Conteúdo diferente exige nova versão explícita.');versions.set(logical,integrity.sha256);
  const fingerprint=key([target.email,target.rootId,category,integrity.sha256]);let item=files.find(f=>f.key===fingerprint);
  if(!item){item={key:fingerprint,file,category,size:before.size,...integrity,name:'GMM_'+productionId+'_V'+version+'_'+integrity.sha256.slice(0,12)+extension};files.push(item);}
  references.push({id,productionId,version,category,role:String(entry.role||'material'),title:String(entry.title||'').slice(0,180),artist:String(entry.artist||'').slice(0,180),destinations:[...new Set(entry.destinations||[])],fileKey:fingerprint});
 }
 const exported={schema:1,application:'GMM_DRIVE_PLAN',target:{...target},files:files.map(({file,...item})=>item),references};
 return {id:key(exported),...exported,files,manifest:exported,bytes:files.reduce((n,f)=>n+f.size,0),status:'not_sent',authorization:'not_granted',notes:['Plano local, sem upload ou configuração de conta.','Snapshot do serviço exige preservar a pasta completa; não envie só o manifesto como backup.']};
}
export function resolveFolders(children){const out={root:DRIVE_TARGET.rootId};for(const [kind,name]of Object.entries(FOLDERS)){const candidates=children.filter(f=>f.name===name&&!f.trashed&&f.mimeType==='application/vnd.google-apps.folder'&&f.parents?.includes(DRIVE_TARGET.rootId));requireValue(candidates.length===1,'Pasta ausente ou duplicada: '+name+'. Conferir antes de enviar.');out[kind]=candidates[0].id;}return out;}
