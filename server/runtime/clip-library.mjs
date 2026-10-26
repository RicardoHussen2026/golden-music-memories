import {readFileSync,existsSync,readdirSync,realpathSync,statSync,mkdirSync} from 'node:fs';
import {resolve,sep,join} from 'node:path';
import {check,stamp} from './store.mjs';
import {fileHash} from './media.mjs';
import {mergeClipMetadata} from '../../app/clip-metadata.js';

// Private originals remain on disk. Only IDs and descriptive metadata leave this boundary.
export class ClipLibrary {
 constructor(store,directory,assemblyDirectory){Object.assign(this,{store,directory:resolve(directory),assemblyDirectory});this.cache=new Map();this.hashes=new Map();}
 safe(base,name){check(typeof name==='string'&&!name.includes('\0'),'Arquivo inválido.');const root=realpathSync(base),file=resolve(base,name);check(file.startsWith(resolve(base)+sep)&&existsSync(file),'Clipe indisponível neste PC.',404);check(realpathSync(file).startsWith(root+sep),'Arquivo fora da biblioteca.',403);return file;}
 entries(){
  const rows=new Map();
  if(existsSync(this.directory))for(const dir of readdirSync(this.directory,{withFileTypes:true}).filter(d=>d.isDirectory())){
   const base=this.safe(this.directory,dir.name),manifest=join(base,'MANIFESTO.json');if(!existsSync(manifest))continue;
   const st=statSync(manifest),key=st.mtimeMs+':'+st.size;let data=this.cache.get(manifest);if(data?.key!==key){const value=JSON.parse(readFileSync(manifest,'utf8'));check(value.schema==='gmm-flashback-handoff/1.0'&&Array.isArray(value.videos),'Manifesto de clipes inválido.');data={key,value};this.cache.set(manifest,data);}
   for(const v of data.value.videos){check(/^[a-f0-9]{64}$/.test(v.sha256),'Hash de clipe inválido.');const id='clip-'+v.sha256,old=rows.get(id),collection=dir.name.startsWith('FLASHBACK_')?'Flashback 70, 80 e 90':dir.name;
    rows.set(id,{id,songId:id,hash:v.sha256,size:v.size,title:v.metadata?.titulo_informado||'Título a conferir',artist:v.metadata?.artista_informado||'Artista a conferir',genre:'',year:null,decade:null,versionName:v.metadata?.versao_declarada||'',duration:v.technical?.duration_seconds,width:v.technical?.width,height:v.technical?.height,collections:[...new Set([...(old?.collections||[]),collection])],origins:v.origins||[],review:v.metadata?.alertas||[],base,file:v.path,thumbnail:v.technical?.thumbnail,technicalStatus:v.technical?.status});
   }
  }
  for(const row of this.store.list('clip_library')){const old=rows.get(row.id);rows.set(row.id,{...old,...row,collections:[...new Set([...(old?.collections||[]),...(row.collections||[])])]});}
  const research=new Map(this.store.list('clip_research').map(r=>[r.id,r]));
  return [...rows.values()].map(row=>{const metadataResearch=research.get(row.id);return metadataResearch?.hash===row.hash?{...row,...mergeClipMetadata(row,{...row,metadataResearch})}:row;});
 }
 list(){return {schema:1,entries:this.entries().map(({base,file,thumbnail,inputId,...row})=>({...row,thumbnail:thumbnail?'/api/clips/'+row.id+'/thumbnail':null,mediaURL:'/api/clips/'+row.id+'/video'}))};}
 get(id,{thumbnail=false}={}){check(/^clip-[a-f0-9]{64}$/.test(String(id)),'Identificador de clipe inválido.');const row=this.entries().find(r=>r.id===id);check(row,'Clipe não encontrado.',404);let path;
  if(row.inputId){if(thumbnail){path=this.safe(this.assemblyDirectory,row.thumbnail);return {...row,path};}const input=this.store.get('render_input',row.inputId);check(input?.state==='complete'&&input.purpose==='video','Fonte recebida indisponível.',404);path=this.safe(this.assemblyDirectory,input.file);}
  else path=this.safe(row.base,thumbnail?row.thumbnail:row.file);
  if(!thumbnail){const s=statSync(path),key=s.size+':'+s.mtimeMs+':'+row.hash;if(this.hashes.get(path)!==key){check(fileHash(path)===row.hash,'Original alterado: confira a biblioteca antes de montar.');this.hashes.set(path,key);}}
  return {...row,path};
 }
 async makeThumbnail(id,assembler){const row=this.get(id);if(row.thumbnail)return;const file='thumbnails/'+row.id+'.jpg';mkdirSync(join(this.assemblyDirectory,'thumbnails'),{recursive:true});await assembler.runner(assembler.tool('ffmpeg'),['-v','error','-y','-ss',String(Math.min(5,row.duration/3)),'-i',row.path,'-frames:v','1','-vf','scale=480:-2','-update','1',join(this.assemblyDirectory,file)],{timeout:60000});const saved=this.store.get('clip_library',id);this.store.put('clip_library',id,{...saved,thumbnail:file});}

 register(input){const source=this.store.get('render_input',input.inputId);check(source?.state==='complete'&&source.purpose==='video'&&source.width>0,'Receba um clipe de vídeo antes de catalogar.');const id='clip-'+source.hash,existing=this.entries().find(r=>r.id===id);const title=String(input.title||'').trim(),artist=String(input.artist||'Artista a conferir').trim(),collection=String(input.collection||'Meus clipes').trim();check(title&&title.length<=180&&artist&&artist.length<=180&&collection.length<=100,'Confira título, artista e coleção.');
  const row={...existing,id,songId:id,hash:source.hash,size:source.size,title:existing?.title||title,artist:existing?.artist||artist,genre:String(input.genre||existing?.genre||'').slice(0,100),year:existing?.year??null,decade:existing?.decade??null,duration:source.duration,width:source.width,height:source.height,collections:[...new Set([...(existing?.collections||[]),collection])],inputId:existing?.file?undefined:existing?.inputId||source.id,createdAt:existing?.createdAt||stamp()};this.store.put('clip_library',id,row);return {id,duplicate:!!existing};}
}
