import {readFileSync,existsSync,statSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {check} from './store.mjs';
import {fileHash} from './media.mjs';
// Local private media. IDs map to manifest entries; callers never supply paths.
export class IntroLibrary {
 constructor(directory,{store,customDirectory}={}){this.directory=resolve(directory);this.store=store;this.customDirectory=customDirectory?resolve(customDirectory):null;this.verified=new Map();}
 entries(){let original=[];if(existsSync(resolve(this.directory,'manifest.json'))){const data=JSON.parse(readFileSync(resolve(this.directory,'manifest.json'),'utf8'));check(data.schema===1&&Array.isArray(data.entries),'Manifesto de intros inválido.');original=data.entries;}return [...original,...(this.store?.list('artwork')||[]).filter(a=>a.kind==='intro'&&a.state==='completed').map(a=>({...a,custom:true}))];}
 list(){return this.entries().map(({id,label,format,width,height,duration,sha256})=>({id,label,format,width,height,duration,sha256}));}
 safeFile(name,extension,directory=this.directory){check(directory&&typeof name==='string'&&new RegExp('^[a-z0-9-]+\\.'+extension+'$').test(name),'Arquivo de intro inválido.');const file=resolve(directory,name);check(existsSync(file)&&realpathSync(file).startsWith(realpathSync(directory)+sep),'Arquivo de intro indisponível.',404);return file;}
 get(id){check(/^[a-z0-9-]{1,100}$/.test(String(id)),'Intro inválida.');const row=this.entries().find(i=>i.id===id);check(row,'Intro não encontrada.',404);check(Number.isFinite(row.duration)&&row.duration>0&&row.duration<=30&&/^[a-f0-9]{64}$/.test(row.sha256),'Metadados de intro inválidos.');const directory=row.custom?this.customDirectory:this.directory,path=this.safeFile(row.file,'mp4',directory),thumbnailPath=this.safeFile(row.thumbnail,'png',directory),stat=statSync(path),key=stat.size+':'+stat.mtimeMs+':'+row.sha256;if(this.verified.get(path)!==key){check(fileHash(path)===row.sha256,'Intro modificada; confira a origem antes de montar.');this.verified.set(path,key);}return {...row,path,thumbnailPath};}
}
