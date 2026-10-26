import {existsSync,renameSync,writeFileSync,mkdirSync,realpathSync,copyFileSync,constants} from 'node:fs';
import {join,basename,extname,resolve,relative,isAbsolute} from 'node:path';
import {randomUUID} from 'node:crypto';
import {check} from './store.mjs';
import {fileHash} from './media.mjs';

const text=(value,max=240)=>typeof value==='string'?value.trim().slice(0,max):'';
export function musicMetadata(raw={},fallback='',url=''){
 const originalTitle=text(raw.title)||text(fallback.replace(/\.[^.]+$/,'')),track=text(raw.track),artist=text(raw.artist)||text(Array.isArray(raw.artists)?raw.artists.join(', '):'');
 const split=!track&&!artist?originalTitle.match(/^(.{2,90}?)\s+[—–-]\s+(.{2,160})$/):null;
 return {originalTitle,musicTitle:track||split?.[2]||originalTitle,artist:artist||split?.[1]||'',album:text(raw.album),releaseYear:Number.isInteger(raw.release_year)&&raw.release_year>=1900&&raw.release_year<=2100?raw.release_year:null,uploadDate:/^\d{8}$/.test(raw.upload_date||'')?raw.upload_date.slice(0,4)+'-'+raw.upload_date.slice(4,6)+'-'+raw.upload_date.slice(6):'',uploader:text(raw.uploader)||text(raw.channel),sourceId:text(raw.id,100),sourceUrl:url,provenance:track?'Metadados musicais informados pela fonte':split?'Sugestão extraída do título do vídeo':'Título do vídeo na fonte',needsReview:true};
}
function safeName(value){return String(value).normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g,' ').replace(/\s+/g,' ').trim().replace(/[. ]+$/,'').slice(0,140).trim()||'Vídeo';}
export function deliverFiles(j,files,root){
 const m=j.metadata,prefix=safeName((m.artist?m.artist+' — ':'')+m.musicTitle),source=m.sourceId?' ['+safeName(m.sourceId).slice(0,24)+']':'';
 const plans=[];for(const f of files){const original=f.path,suffix=f.kind==='subtitle'?'.'+safeName(basename(original,extname(original)).split('.').pop()):'';let n=1,name=prefix+source+suffix+extname(original);while(existsSync(join(root,name))||plans.some(p=>p.name===name)){n++;name=prefix+source+suffix+' ('+n+')'+extname(original);}plans.push({...f,name,file:name,path:join(root,name),original});}
 // Independent copies keep processing originals intact if the delivered media is edited.
 // Request copy-on-write when supported; otherwise Node performs an exclusive full copy.
 for(const p of plans){copyFileSync(p.original,p.path,constants.COPYFILE_EXCL|constants.COPYFILE_FICLONE);check(fileHash(p.path)===p.hash,'Não foi possível verificar a entrega. O original foi preservado.');}
 return plans.map(({path,original,...f})=>f);
}
export function directDeliveryPath(root,target){const rel=relative(root,target);return !!rel&&!isAbsolute(rel)&&basename(rel)===rel&&rel!=='.'&&rel!=='..';}
export function deliveryFile(root,file){const base=realpathSync.native(root),target=realpathSync.native(join(root,file));check(basename(file)===file&&directDeliveryPath(base,target),'Arquivo fora da pasta de entrega.',403);return target;}
export function writeDeliveryIndex(root,jobs){
 const entries=jobs.filter(j=>j.layout==='flat'&&j.state==='completed'&&resolve(j.outputRoot)===resolve(root)).map(j=>({id:j.id,...j.metadata,downloadedAt:j.completedAt||j.createdAt,files:j.files.map(f=>({name:f.name,kind:f.kind,bytes:f.size,sha256:f.hash,duration:f.duration,streams:f.streams})),clipId:j.clipId||null}));
 const folder=join(root,'_Golden Informações');mkdirSync(folder,{recursive:true});
 const headings=['arquivo','musica','artista','album','ano_informado_pela_fonte','data_publicacao_video','canal_origem','link','origem_dos_metadados','conferir','duracao_segundos','bytes','sha256'];
 const rows=entries.flatMap(j=>j.files.filter(f=>f.kind!=='subtitle').map(f=>[f.name,j.musicTitle,j.artist,j.album,j.releaseYear||'',j.uploadDate,j.uploader,j.sourceUrl,j.provenance,'Sim',f.duration||'',f.bytes,f.sha256]));const cell=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
 const outputs={'INDICE_DOWNLOADS.csv':'\uFEFF'+[headings,...rows].map(row=>row.map(cell).join(';')).join('\r\n'),'INDICE_DOWNLOADS.json':JSON.stringify({schema:'golden-downloads/1',note:'Metadados da fonte e sugestões de título precisam de conferência. Data de publicação não é o ano da música.',entries},null,2)};
 for(const [name,contents]of Object.entries(outputs)){const temp=join(folder,'.tmp-'+randomUUID());writeFileSync(temp,contents,'utf8');renameSync(temp,join(folder,name));}
 return {folder,count:entries.length};
}
