import {extname} from 'node:path';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {check} from './store.mjs';
import {readableName} from '../../app/media-names.js';

export async function sendPostingThumbnail(res,assembler,{coverId,productionId,title,artist,version=1}){
 check(coverId,'Este vídeo não tem capa vinculada. Use Escolher miniatura para selecionar uma imagem.',404);
 const image=assembler.image(coverId,productionId,'cover'),info=await stat(image.path),ext=extname(image.path).slice(1).toLowerCase();
 const mime={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'}[ext];check(mime,'Formato de capa indisponível.');
 const name=readableName(artist,title,'Miniatura',version,ext);
 res.writeHead(200,{'Content-Type':mime,'Content-Length':info.size,'Cache-Control':'no-store','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(name).replace(/'/g,'%27')});
 createReadStream(image.path).on('error',()=>res.destroy()).pipe(res);
}
