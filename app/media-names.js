// IDs stay internal; readable download names never rename the user's originals.
const roles={audio:'Áudio',clip:'Vídeo fonte',image:'Imagem',cover:'Capa',background:'Fundo',project:'Projeto',tiktok:'Vídeo TikTok',youtube:'Vídeo YouTube',text:'Texto',license:'Comprovante'};
export function safeName(value){return String(value||'Sem identificação').normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().replace(/[. ]+$/g,'').slice(0,65)||'Arquivo';}
export function readableName(artist,title,role,version,extension){const ext=String(extension||'bin').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,10)||'bin';return `${safeName(artist)} - ${safeName(title)} - ${roles[role]||safeName(role)} - V${Number(version)||1}.${ext}`;}
