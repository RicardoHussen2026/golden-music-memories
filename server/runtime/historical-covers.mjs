import {readFile,realpath} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {check} from './store.mjs';

const webURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
// Read-only view of the existing, private manifest. Never creates songs/assets.
export class HistoricalCovers {
 constructor(directory){this.directory=resolve(directory);}
 async records(){
  let packet;try{packet=JSON.parse(await readFile(resolve(this.directory,'indice.json'),'utf8'));}catch(error){if(error.code==='ENOENT')return [];check(false,'Índice local de capas indisponível ou inválido.',409);}
  check(packet.schema===1&&packet.kind==='local_historical_cover_reference'&&Array.isArray(packet.records),'Índice local de capas incompatível.',409);
  const rows=packet.records.filter(r=>r?.association?.state==='recording_release_product_link_confirmed'&&typeof r.songId==='string'&&r.songId.length<=200&&/^[a-f\d]{64}$/.test(r.image?.sha256)&&r.image.path===`imagens/${r.image.sha256}.jpg`&&r.image.mime==='image/jpeg');
  check(new Set(rows.map(r=>r.id)).size===rows.length,'Índice local contém referências repetidas; revise o manifesto.',409);
  return rows;
 }
 async list(songId){
  check(typeof songId==='string'&&songId.length>0&&songId.length<=200,'Identificador da música inválido.');
  const rows=(await this.records()).filter(r=>r.songId===songId);
  const references=[];
  for(const r of rows){
   let available=true;try{await this.image(r.image.sha256);}catch{available=false;}
   references.push({id:r.id,songId:r.songId,title:r.title,artist:r.artist,release:{title:r.release?.title,date:r.release?.date},sha256:r.image.sha256,width:r.image.width,height:r.image.height,available,
    association:'recording_release_product_link_confirmed',checkedAt:r.association.checkedAt,publicationRights:'not_verified',use:'local_reference_only_not_published',
    productUrl:webURL(r.source?.productUrl),proofUrl:webURL(r.association.proofUrl),conditionsUrl:webURL(r.source?.conditionsUrl),
    imagePath:available?`/api/historical-covers/images/${r.image.sha256}`:null});
  }
  return {songId,references,readOnly:true};
 }
 async image(hash){
  check(/^[a-f\d]{64}$/.test(hash),'Imagem não encontrada.',404);
  const row=(await this.records()).find(r=>r.image.sha256===hash);check(row,'Imagem não encontrada.',404);
  const root=await realpath(this.directory),file=await realpath(resolve(this.directory,row.image.path));
  check(file.startsWith(root+sep),'Imagem fora da biblioteca local.',404);
  const bytes=await readFile(file);check(bytes.length===row.image.bytes&&createHash('sha256').update(bytes).digest('hex')===hash,'Imagem ausente ou diferente do manifesto; revise a biblioteca.',409);
  check(bytes[0]===255&&bytes[1]===216&&bytes[2]===255,'Imagem local inválida.',409);
  return bytes;
 }
}
