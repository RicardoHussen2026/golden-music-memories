import {existsSync,readFileSync,copyFileSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileHash} from './media.mjs';
import {check,stamp} from './store.mjs';

// Stable IDs make installation idempotent; a user removal is never undone on startup.
export function installBundledBranding(artworks,directory=resolve('media-branding')){
 const manifest=join(directory,'manifest.json');if(!existsSync(manifest))return 0;
 const rows=JSON.parse(readFileSync(manifest,'utf8')).items;let added=0;
 for(const row of rows){const existing=artworks.store.get('artwork',row.id);if(existing&&(!existing.bundled||existing.audioFile))continue;
  check(/^art-[a-f\d-]{36}$/.test(row.id)&&/^[a-z0-9-]+\.mp4$/.test(row.asset)&&/^[a-z0-9-]+\.png$/.test(row.thumbnailAsset),'Manifesto de vinhetas inválido.');
  const source=join(directory,row.asset),thumb=join(directory,row.thumbnailAsset);check(fileHash(source)===row.sha256&&fileHash(thumb)===row.thumbnailHash,'Vinheta incluída no projeto foi alterada.');
  const file=row.id+'.mp4',thumbnail=row.id+'-thumb.png',audioFile=row.id+'-source.mp3';check(/^[a-z0-9-]+\.mp3$/.test(row.audioAsset),'Áudio de vinheta inválido.');check(fileHash(join(directory,row.audioAsset))===row.sourceHash,'Áudio original da vinheta foi alterado.');
  for(const [src,target,hash]of [[source,join(artworks.directory,file),row.sha256],[thumb,join(artworks.directory,thumbnail),row.thumbnailHash],[join(directory,row.audioAsset),join(artworks.directory,audioFile),row.sourceHash]]){if(existsSync(target))check(fileHash(target)===hash,'Existe um arquivo diferente no destino da vinheta.');else copyFileSync(src,target);}
  if(existing){artworks.store.put('artwork',row.id,{...existing,audioFile,audioHash:row.sourceHash});continue;}const {asset,thumbnailAsset,audioAsset,...metadata}=row;artworks.store.put('artwork',row.id,{...metadata,file,thumbnail,audioFile,audioHash:row.sourceHash,size:statSync(source).size,bundled:true,audioAsset,state:'completed',progress:100,useAudio:true,inputId:null,createdAt:stamp(),completedAt:stamp()});added++;
 }
 return added;
}
