import {readFileSync,statSync,realpathSync,writeFileSync,unlinkSync,readdirSync,existsSync} from 'node:fs';
import {isAbsolute,join,resolve,dirname,parse} from 'node:path';
import {randomUUID} from 'node:crypto';
import {check} from './store.mjs';
import {homedir} from 'node:os';

export const sources=JSON.parse(readFileSync(new URL('../media-downloader/sources.json',import.meta.url),'utf8'));
export function downloaderURL(value){
 check(typeof value==='string'&&value.length<=2048,'Cole um link individual de uma fonte compatível.');let u;try{u=new URL(value.trim());}catch{check(false,'Link inválido. Cole o endereço completo do vídeo.');}
 const source=sources.find(s=>s.hosts.includes(u.hostname));
 check(u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&source,'Use HTTPS de uma das fontes compatíveis.');
 if(source.youtube){const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.pathname==='/watch'?u.searchParams.get('v'):/^\/(shorts|embed)\//.test(u.pathname)?u.pathname.split('/')[2]:null;
  check(/^[\w-]{11}$/.test(id||''),'Cole um vídeo individual; playlists e canais não são aceitos.');return `https://${u.hostname==='music.youtube.com'?'music.youtube.com':'www.youtube.com'}/watch?v=${id}`;}
 check(new RegExp('^(?:'+source.path+')$').test(u.pathname),'Cole o link direto de um vídeo. Perfis, playlists e publicações com vários arquivos não são aceitos.');
 if(source.watchQuery&&/^\/watch\/?$/.test(u.pathname))check(/^\d+$/.test(u.searchParams.get('v')||''),'Use o link direto do vídeo do Facebook.');
 u.hash='';for(const key of [...u.searchParams.keys()])if(!source.query?.includes(key))u.searchParams.delete(key);return u.href;
}
export function sourceName(url){try{return sources.find(s=>s.hosts.includes(new URL(url).hostname))?.label||'Fonte';}catch{return 'Fonte';}}
export function failureInfo(raw=''){
 const detail=String(raw),message=detail.replace(/Download não concluído\. Se houve incompatibilidade de MP4, tente MKV\./g,'');
 if(/sign in|log.?in|cookies|not a bot|confirm.*bot|authentication|verify.*human|verifica.{0,12}humana/i.test(message))return {code:'verification',title:'A plataforma exige login ou verificação',hint:'Confira o link no navegador. O baixador não acessa sua sessão; tentar outro formato não resolve essa exigência.'};
 if(/requested format.*not available|audio.only|faixas de áudio/i.test(message))return {code:'stream',title:'A fonte não disponibilizou a faixa solicitada',hint:'Algumas fontes não oferecem áudio separado. Experimente vídeo com áudio; nenhuma conversão com perda será feita.'};
 if(/private|unavailable|not available|removed|deleted|copyright|age.restricted|404|not found|indisponível/i.test(message))return {code:'unavailable',title:'Vídeo indisponível para download público',hint:'Confira se o link abre e se o conteúdo continua público na plataforma.'};
 if(/espaço|space|disk|tamanho|filesize|limite|ENOENT|EACCES|pasta|directory/i.test(message))return {code:'storage',title:'Confira a pasta e o espaço disponível',hint:'O destino precisa estar conectado, acessível e ter espaço suficiente. A tentativa mantém a pasta originalmente escolhida.'};
 if(/network|conexão|timed? ?out|timeout|resolve|connection|HTTP Error (429|5\d\d)/i.test(message))return {code:'connection',title:'A conexão com a fonte não foi concluída',hint:'Aguarde e tente novamente quando a conexão estiver disponível.'};
 if(/codec|mux|container|contêiner|not supported.*mp4|incompatible/i.test(message))return {code:'format',title:'O formato não comportou os codecs da fonte',hint:'Adicione o link novamente com MKV para preservar os codecs originais.'};
 if(/requested format.*not available|audio.only|faixas de áudio/i.test(message))return {code:'stream',title:'A fonte não disponibilizou a faixa solicitada',hint:'Algumas fontes não oferecem áudio separado. Experimente vídeo com áudio; nenhuma conversão com perda será feita.'};
 return {code:'other',title:'Não foi possível concluir este download',hint:'Confira os detalhes, o link e a disponibilidade da fonte antes de tentar novamente.'};
}
export function writableFolder(folder){
 check(typeof folder==='string'&&folder.trim().length>0&&folder.length<3000&&isAbsolute(folder.trim()),'Informe o caminho completo de uma pasta existente.');
 let target;try{target=realpathSync.native(folder.trim());check(statSync(target).isDirectory(),'Escolha uma pasta.');const probe=join(target,'.golden-write-check-'+randomUUID());writeFileSync(probe,'',{flag:'wx'});unlinkSync(probe);}catch{check(false,'Não foi possível acessar ou gravar nessa pasta. Escolha uma pasta existente com permissão de escrita.');}return target;
}
export async function pickFolder(initial){
 check(typeof initial==='string'&&isAbsolute(initial),'Informe um caminho completo.');
 let current,folders;try{current=realpathSync.native(initial);check(statSync(current).isDirectory(),'Escolha uma pasta.');folders=readdirSync(current,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.isSymbolicLink()).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(e=>({name:e.name,path:join(current,e.name)}));}catch{check(false,'Não foi possível abrir essa pasta. Confira o caminho ou escolha outra.');}
 const roots=[homedir(),join(homedir(),'Downloads'),join(homedir(),'Desktop'),parse(current).root,...(process.platform==='win32'?['C','D','E','F'].map(d=>d+':\\'):[])].map(p=>resolve(p)).filter((p,i,a)=>a.indexOf(p)===i&&existsSync(p));
 return {current,parent:dirname(current)!==current?dirname(current):null,folders,roots};
}
