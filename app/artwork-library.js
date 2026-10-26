import {api} from './service.js';
import {all,put,uid,now,digest} from './db.js';
import {readableName} from './media-names.js';
import {escapeHTML as e} from './quality.js';

export async function uploadArtwork(file,notify=()=>{}){
 const image=/^image\/(png|jpeg|webp)$/.test(file.type);
 if(!image&&!/\.(mp4|mkv|mov|webm|mp3|m4a|wav|flac|ogg)$/i.test(file.name||''))throw Error('Escolha imagem, vídeo ou áudio MP3/M4A/WAV/FLAC/OGG.');
 let row=await api('/artworks/inputs',{method:'POST',data:{kind:image?'image':'video',name:file.name||'arte.png',size:file.size}});
 try{while(row.offset<file.size){notify('Carregando arquivo: '+Math.floor(row.offset/file.size*100)+'%');row=await api('/assembly/inputs/'+row.id,{method:'PUT',bytes:file.slice(row.offset,row.offset+4*1048576),offset:row.offset});}return await api('/assembly/inputs/'+row.id+'/complete',{method:'POST',data:{}});}
 catch(error){try{await api('/assembly/inputs/'+row.id+'/cancel',{method:'POST',data:{}});}catch{}throw error;}
}
export async function createArtwork(input,{notify=()=>{},onStart=()=>{}}={}){
 let item=await api('/artworks',{method:'POST',data:input});onStart(item);
 while(item.state==='rendering'){
  notify('Preparando '+(item.kind==='intro'?'abertura':item.kind==='bumper'?'vinheta':item.kind.endsWith('-call')?'chamada/comercial':'capa')+': '+(item.progress||0)+'%');
  await new Promise(r=>setTimeout(r,600));item=(await api('/artworks')).items.find(a=>a.id===item.id);
  if(!item)throw Error('Registro da arte indisponível. Atualize a biblioteca.');
 }
 if(item.state!=='completed')throw Error(item.error||'Geração não concluída. O original foi preservado.');
 return item;
}
export async function artworkBlob(item){const r=await fetch('/api/artworks/'+encodeURIComponent(item.id)+'/file',{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('Não foi possível abrir a arte. Atualize a biblioteca.');return r.blob();}
export async function attachLibraryCover(item,pid){
 const [productions,songs,assets]=await Promise.all(['productions','songs','assets'].map(all));
 const p=productions.find(p=>p.id===pid),song=songs.find(s=>s.id===p?.songId);if(!p||!song)throw Error('Escolha uma produção para usar a capa.');
 const prior=assets.find(a=>a.productionId===pid&&a.libraryArtworkId===item.id&&!a.trashedAt);if(prior)return prior;
 const blob=await artworkBlob(item),version=Math.max(0,...assets.filter(a=>a.productionId===pid&&a.role==='cover').map(a=>a.version||0))+1;
 const ext=blob.type==='image/jpeg'?'jpg':blob.type==='image/webp'?'webp':'png';
 const asset={id:uid(),productionId:pid,songId:p.songId,role:'cover',version,name:readableName(song.artist,song.title,'cover',version,ext),originalName:item.label+'.'+ext,type:blob.type,size:blob.size,blob,hash:await digest(blob),createdAt:now(),rights:'pending',libraryArtworkId:item.id,...(item.editorConfig?{coverConfig:item.editorConfig}:{})};
 await put('assets',asset);return asset;
}
export async function chooseOpening(pid,item){if(!pid)throw Error('Escolha uma produção para usar a abertura.');await put('settings',{id:'openingChoice:'+pid,introId:item.id,updatedAt:now()});}

export function coverLibraryView(){return `<section class="panel" id="own-covers"><h2>Minhas capas</h2><p>Carregue uma capa pronta, guarde no painel e reutilize nas produções. A imagem é preservada; o editor acima continua disponível.</p><label class="field">Nome da capa<input id="own-cover-label" maxlength="180" placeholder="Ex.: Flashback dourado"></label><label class="field">Carregar capa pronta<input type="file" id="own-cover-file" accept="image/png,image/jpeg,image/webp"></label><div class="actions"><button id="own-cover-save" type="button">Guardar capa pronta</button><button id="own-cover-current" type="button" class="secondary">Guardar arte do editor na biblioteca</button></div><p id="own-cover-status" role="status"></p><label class="field">Buscar capas<input type="search" id="own-cover-search" placeholder="Nome ou formato"></label><div id="own-cover-list" class="artwork-grid"></div><div id="own-cover-pages" class="actions"></div></section>`;}
export async function mountCoverLibrary({getProductionId,editorBlob,editorConfig,onUsed,onEdit}){
 const root=document.querySelector('#own-covers');if(!root)return;const $=s=>root.querySelector(s),notify=s=>$('#own-cover-status').textContent=s;let items=[],page=0,busy=false;
 function render(){const query=$('#own-cover-search').value.toLocaleLowerCase('pt-BR'),filtered=items.filter(a=>(a.label+' '+a.format).toLocaleLowerCase('pt-BR').includes(query));page=Math.min(page,Math.max(0,Math.ceil(filtered.length/8)-1));$('#own-cover-list').innerHTML=filtered.slice(page*8,page*8+8).map(a=>`<article class="artwork-card"><img src="/api/artworks/${e(a.id)}/thumbnail" alt="${e(a.label)}" loading="lazy"><strong>${e(a.label)}</strong><small>${a.width}×${a.height}</small><div class="actions"><a class="button secondary small" href="/api/artworks/${e(a.id)}/file?download=1" download>Baixar capa</a><button type="button" data-art-cover="${e(a.id)}">Usar na produção</button>${a.editorConfig?'<button type="button" class="secondary" data-art-edit="'+e(a.id)+'">Editar nova versão</button>':''}</div></article>`).join('')||'<p>Nenhuma capa guardada com esse filtro.</p>';$('#own-cover-pages').innerHTML=`<button type="button" class="secondary" data-cover-page="-1" ${page===0?'disabled':''}>Anterior</button><span>${filtered.length} capas · ${page+1}/${Math.max(1,Math.ceil(filtered.length/8))}</span><button type="button" class="secondary" data-cover-page="1" ${(page+1)*8>=filtered.length?'disabled':''}>Próxima</button>`;}
 async function refresh(){items=(await api('/artworks')).items.filter(a=>a.kind==='cover'&&a.state==='completed');if(root.isConnected)render();}
 async function save(fromEditor){if(busy)return;busy=true;$('#own-cover-save').disabled=$('#own-cover-current').disabled=true;try{const file=fromEditor?new File([await editorBlob()],'capa.png',{type:'image/png'}):$('#own-cover-file').files[0];if(!file)throw Error('Escolha uma capa pronta.');const input=await uploadArtwork(file,notify);await createArtwork({kind:'cover',label:$('#own-cover-label').value.trim()||file.name,inputId:input.id,...(fromEditor?{editorConfig:editorConfig()}: {})},{notify});notify('Capa guardada na biblioteca. Use na produção escolhida acima quando desejar.');await refresh();}catch(error){notify(error.message);}finally{busy=false;$('#own-cover-save').disabled=$('#own-cover-current').disabled=false;}}
 $('#own-cover-save').onclick=()=>save(false);$('#own-cover-current').onclick=()=>save(true);$('#own-cover-search').oninput=()=>{page=0;render();};$('#own-cover-pages').onclick=event=>{const delta=event.target.closest('[data-cover-page]')?.dataset.coverPage;if(delta){page+=Number(delta);render();}};
 $('#own-cover-list').onclick=async event=>{const button=event.target.closest('[data-art-cover],[data-art-edit]');if(!button||busy)return;busy=true;button.disabled=true;try{const item=items.find(a=>a.id===(button.dataset.artCover||button.dataset.artEdit));if(button.dataset.artEdit){await onEdit(item);notify('Configurações abertas no editor. Guardar cria uma nova arte.');}else{const asset=await attachLibraryCover(item,getProductionId());await onUsed(asset);notify('Capa pronta na produção selecionada. Ela aparecerá em Montar vídeo.');}}catch(error){notify(error.message);}finally{busy=false;button.disabled=false;}};
 try{await refresh();}catch(error){notify('Biblioteca local indisponível. '+error.message);}
}
