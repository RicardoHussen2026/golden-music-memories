import {readFileSync,existsSync,statSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {check} from './store.mjs';
import {fileHash} from './media.mjs';
// Local private media. IDs map to manifest entries; callers never supply paths.
export class IntroLibrary {
 constructor(directory){this.directory=resolve(directory);this.verified=new Map();}
 entries(){if(!existsSync(resolve(this.directory,'manifest.json')))return [];const data=JSON.parse(readFileSync(resolve(this.directory,'manifest.json'),'utf8'));check(data.schema===1&&Array.isArray(data.entries),'Manifesto de intros inválido.');return data.entries;}
 list(){return this.entries().map(({id,label,format,width,height,duration,sha256})=>({id,label,format,width,height,duration,sha256}));}
 safeFile(name,extension){check(typeof name==='string'&&new RegExp('^[a-z0-9-]+\\.'+extension+'$').test(name),'Arquivo de intro inválido.');const file=resolve(this.directory,name);check(existsSync(file)&&realpathSync(file).startsWith(realpathSync(this.directory)+sep),'Arquivo de intro indisponível.',404);return file;}
 get(id){check(/^[a-z0-9-]{1,100}$/.test(String(id)),'Intro inválida.');const row=this.entries().find(i=>i.id===id);check(row,'Intro não encontrada.',404);check(Number.isFinite(row.duration)&&row.duration>0&&row.duration<=30&&/^[a-f0-9]{64}$/.test(row.sha256),'Metadados de intro inválidos.');const path=this.safeFile(row.file,'mp4'),thumbnailPath=this.safeFile(row.thumbnail,'png'),stat=statSync(path),key=stat.size+':'+stat.mtimeMs+':'+row.sha256;if(this.verified.get(path)!==key){check(fileHash(path)===row.sha256,'Intro modificada; confira a origem antes de montar.');this.verified.set(path,key);}return {...row,path,thumbnailPath};}
}
