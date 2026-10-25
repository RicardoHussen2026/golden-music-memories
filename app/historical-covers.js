import {api} from './service.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
const link=(value,label)=>url(value)?`<a href="${esc(url(value))}" target="_blank" rel="noopener noreferrer">${label}</a>`:'';
export async function openHistoricalCovers({song,showDialog}){
 if(!song)throw Error('Música não encontrada.');
 showDialog(`<h2>Capas históricas da música</h2><p>${esc(song.title)} — ${esc(song.artist)}</p><p class="muted">Referências locais de álbum ou edição, separadas das artes Golden e dos anexos de produção. Consultar não altera a montagem nem autoriza publicação.</p><div id="historical-cover-results" role="status">Consultando biblioteca local…</div>`);
 const target=document.querySelector('#historical-cover-results');
 try{
  const data=await api('/historical-covers?songId='+encodeURIComponent(song.id));
  if(!target.isConnected)return;
  target.innerHTML=data.references.length?data.references.map(r=>`<article class="historical-cover-reference"><h3>${esc(r.release?.title||'Álbum/edição não informado')}</h3><p>${esc(r.release?.date||'Data não informada')} · Vínculo por gravação e edição confirmado</p>${r.available&&/^\/api\/historical-covers\/images\/[a-f\d]{64}$/.test(r.imagePath)?`<img src="${esc(r.imagePath)}" alt="Referência histórica: ${esc(r.release?.title)}" style="display:block;max-width:100%;width:320px;max-height:360px;object-fit:contain"><p data-image-feedback></p>`:'<p>Imagem indisponível ou diferente do manifesto. O vínculo foi preservado; confira os arquivos locais.</p>'}<p>Uso: referência local. <strong>Direitos de publicação não verificados.</strong> Não comprova o master/áudio disponível.</p><div class="actions">${link(r.productUrl,'Origem da capa')}${link(r.proofUrl,'Evidência do vínculo')}${link(r.conditionsUrl,'Condições da fonte')}</div></article>`).join(''):'<p>Nenhuma capa histórica confirmada para este ID de música. Isso não significa que não exista uma capa. Referências incertas ou ainda não recebidas ficam fora desta consulta.</p>';
  target.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;img.nextElementSibling.textContent='Não foi possível abrir a imagem local. Confira o serviço e os arquivos; o vínculo foi preservado.';}));
 }catch{if(target.isConnected)target.textContent='Biblioteca histórica local indisponível. Abra o painel com serviço local atualizado e acesso ativo. Esta consulta não existe na hospedagem estática; nenhum cadastro foi alterado.';}
}
