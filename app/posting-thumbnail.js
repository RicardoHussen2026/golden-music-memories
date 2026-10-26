import {download} from './backup.js';
import {safeName} from './media-names.js';

export function thumbnailControls(){return '<button type="button" id="post-thumbnail" class="secondary">Baixar miniatura</button><button type="button" id="post-thumbnail-choose" class="secondary">Escolher miniatura</button><input id="post-thumbnail-file" type="file" accept="image/png,image/jpeg,image/webp" hidden><span id="post-thumbnail-status" role="status"></span>';}
export function mountPostingThumbnail(root,getSource){
 const button=root.querySelector('#post-thumbnail'),file=root.querySelector('#post-thumbnail-file'),status=root.querySelector('#post-thumbnail-status');let custom=null;
 root.querySelector('#post-thumbnail-choose').onclick=()=>file.click();
 file.onchange=()=>{custom=file.files[0]||null;status.textContent=custom?'Miniatura selecionada: '+custom.name+'. Use Baixar miniatura.':'Será usada a capa vinculada ao vídeo.';};
 button.onclick=async()=>{button.disabled=true;status.textContent='Preparando miniatura…';try{
  const source=getSource();let blob=custom,extension=custom?.name.split('.').pop();
  if(!blob){if(!source?.url)throw Error('Este vídeo não tem capa vinculada. Use Escolher miniatura para selecionar uma imagem.');
   const response=await fetch(source.url,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(30000)});
   if(!response.ok){const error=await response.json().catch(()=>({}));throw Error(error.error||'Não foi possível baixar a capa. Confira o serviço local e tente novamente.');}
   blob=await response.blob();extension={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[blob.type];
  }
  if(!['image/png','image/jpeg','image/webp'].includes(blob.type))throw Error('Escolha uma imagem PNG, JPG ou WebP.');
  const bitmap=await createImageBitmap(blob);bitmap.close();
  download(blob,safeName(source?.title||'Vídeo')+' - Miniatura.'+(extension||'png'));status.textContent='Miniatura enviada para Downloads. Use a imagem no campo de miniatura da postagem.';
 }catch(error){status.textContent=error.message;}finally{button.disabled=false;}};
 return {reset(){custom=null;file.value='';status.textContent='';}};
}
