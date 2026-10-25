import {all,digest} from './db.js';
import {exportBackup,download} from './backup.js';
import {adaptResearchRows,normalizeCredit,createCatalogReconciliation} from './catalog-reconciliation.js';
import {applyConfirmedCatalog} from './catalog-reconciliation-store.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={addable:'Novo confirmado',duplicates:'Identificador já presente',conflicts:'Conflito / semelhança',needsEvidence:'Evidência pendente',outOfScope:'Fora do período',invalid:'Registro inválido'};

export async function readResearchPackage(file){
 if(file.size>30000000)throw Error('Pacote acima de30MB. Divida a pesquisa antes de conciliar.');
 let data,scope=null;
 if(/\.zip$/i.test(file.name)){
  const zip=await JSZip.loadAsync(file,{checkCRC32:true}),files=Object.values(zip.files).filter(f=>!f.dir);
  if(files.length>500)throw Error('Pacote com arquivos demais para esta conciliação.');
  const entry=files.find(f=>/(^|\/)CATALOGO_GERAL\.json$/i.test(f.name));if(!entry)throw Error('ZIP sem CATALOGO_GERAL.json; capas e backups usam outros fluxos.');
  const text=await entry.async('string');if(text.length>25000000)throw Error('Catálogo expandido acima do limite.');data=JSON.parse(text);
  const catalogIds=new Set((data.musicas||[]).map(r=>r.id)),annual=[],general=[];let years=0;
  for(const f of files.filter(f=>/\/\d{4}_TOP30\.json$/i.test(f.name))){const d=JSON.parse(await f.async('string'));if(!Array.isArray(d.musicas)||d.musicas.length!==30||new Set(d.musicas.map(r=>r.posicao_ano)).size!==30||d.musicas.some(r=>!Number.isInteger(r.posicao_ano)||r.posicao_ano<1||r.posicao_ano>30||!catalogIds.has(r.id)))throw Error('Lista anual incompleta ou divergente do catálogo.');annual.push(...d.musicas.map(r=>r.id));years++;}
  const generalFile=files.find(f=>/TOP20_TODOS_OS_TEMPOS\.json$/i.test(f.name));if(generalFile){const d=JSON.parse(await generalFile.async('string'));if(!Array.isArray(d.musicas)||d.musicas.some(r=>!catalogIds.has(r.id)))throw Error('Lista geral divergente do catálogo.');general.push(...d.musicas.map(r=>r.id));}
  if(catalogIds.size!==(data.musicas||[]).length)throw Error('IDs de pesquisa repetidos no catálogo consolidado.');
  const a=new Set(annual),g=new Set(general);scope={annualLists:years,annualPositions:annual.length,generalPositions:general.length,sharedRecords:[...a].filter(id=>g.has(id)).length,uniqueResearchRecords:catalogIds.size,status:data.estado||'não informado',rankingUnit:'annual_not_decade'};
 }else data=JSON.parse(await file.text());
 const raw=Array.isArray(data)?data:data.musicas||data.songs;if(!Array.isArray(raw))throw Error('Arquivo sem lista de registros.');
 let rows=raw.some(r=>r&&Object.hasOwn(r,'musica'))?adaptResearchRows(raw):raw;
 const response=await fetch('data/catalog-confirmed-update.json',{cache:'no-store'});if(response.ok){const confirmed=await response.json(),byId=new Map((confirmed.songs||[]).map(s=>[s.sourceId,s]));rows=rows.map(r=>{const s=byId.get(r?.sourceId);return s&&normalizeCredit(r.title)===normalizeCredit(s.title)&&normalizeCredit(r.artist)===normalizeCredit(s.artist)&&Number(r.year)===Number(s.year)?structuredClone(s):r;});}
 return {rows,scope:scope||data.scope||null,hash:await digest(file),name:file.name};
}

export async function openCatalogReconciliation({showDialog,onChanged}){
 showDialog('<h2>Conciliar pacote de pesquisa</h2><p>Simule antes de adicionar. Identificadores prevalecem; grafias parecidas e versões ficam separadas para revisão. Nenhum cadastro antigo será substituído.</p><label class="field">Arquivo do pacote de pesquisa<input id="research-import-file" type="file" accept=".zip,.json"></label><p id="research-import-status" role="status"></p><div id="research-import-preview"></div><details id="saved-research-queues"><summary>Filas de revisão salvas</summary><div id="saved-research-list"></div></details>');
 const root=document.querySelector('#dialog-body'),status=root.querySelector('#research-import-status'),preview=root.querySelector('#research-import-preview');let pack,plan,filter='all',page=0;
 async function loadSavedQueues(){const queues=(await all('settings')).filter(s=>s.kind==='catalog_reconciliation_queue');root.querySelector('#saved-research-list').innerHTML=queues.length?queues.map((q,i)=>`<p>${esc(q.sourceName)} · ${q.items.length} pendências <button type="button" class="secondary small" data-queue-download="${i}">Baixar fila para revisão</button></p>`).join(''):'<p class="muted">Nenhuma fila salva neste perfil.</p>';for(const button of root.querySelectorAll('[data-queue-download]'))button.onclick=()=>download(new Blob([JSON.stringify(queues[Number(button.dataset.queueDownload)],null,2)],{type:'application/json'}),'GMM-fila-revisao.json');}
 function draw(){
  const c=plan.counts,filtered=plan.entries.filter(e=>filter==='all'||e.status===filter),rows=filtered.slice(page*30,(page+1)*30),scope=pack.scope;
  preview.innerHTML=`${scope?.annualPositions?`<p class="muted" id="research-scope">${scope.annualPositions} posições anuais + ${scope.generalPositions} gerais; ${scope.sharedRecords} registros aparecem em ambas = ${scope.uniqueResearchRecords} entidades de pesquisa. Seleção preliminar por ano, não ranking de década.</p>`:''}<p id="reconciliation-counts"><strong>${c.before} atuais · ${c.read} lidos · ${c.addable} novos confirmados · total previsto ${c.final}</strong><br>${c.duplicates} identificadores repetidos · ${c.conflicts} conflitos · ${c.needsEvidence} sem evidência suficiente · ${c.outOfScope} fora do período · ${c.invalid} inválidos.</p><p class="muted">Cada cadastro representa uma gravação/versão. Isso não certifica a quantidade de composições únicas ou a ordem editorial do pacote.</p><div class="actions"><button type="button" id="apply-research" class="primary">${c.addable?'Backup e adicionar '+c.addable+' confirmados':'Backup e salvar fila, sem novos registros'}</button><button type="button" id="download-research-report" class="secondary">Baixar simulação</button></div><label class="field">Mostrar registros<select id="research-status-filter"><option value="all">Todos (${plan.entries.length})</option>${Object.entries(names).map(([key,name])=>`<option value="${key}" ${filter===key?'selected':''}>${name}</option>`).join('')}</select></label><div class="table-wrap"><table><thead><tr><th>Música / artista</th><th>Estado</th><th>Motivo</th></tr></thead><tbody>${rows.map(e=>`<tr><td>${esc(e.title)}<br><small>${esc(e.artist)}</small></td><td>${esc(names[e.status])}</td><td>${esc(e.reason)}${e.candidateIds.length?'<br><small>'+esc(e.candidateIds.join(', '))+'</small>':''}</td></tr>`).join('')}</tbody></table></div><div class="actions"><button type="button" id="research-previous" class="secondary small" ${page?'':'disabled'}>Anterior</button><span>${filtered.length?Math.min(page*30+1,filtered.length):0}–${Math.min((page+1)*30,filtered.length)} de ${filtered.length}</span><button type="button" id="research-next" class="secondary small" ${(page+1)*30<filtered.length?'':'disabled'}>Próxima</button></div>`;
  preview.querySelector('#research-status-filter').onchange=e=>{filter=e.target.value;page=0;draw();};preview.querySelector('#research-previous').onclick=()=>{page--;draw();};preview.querySelector('#research-next').onclick=()=>{page++;draw();};
  preview.querySelector('#download-research-report').onclick=()=>download(new Blob([JSON.stringify({source:pack.name,sourceHash:pack.hash,scope:pack.scope,plan},null,2)],{type:'application/json'}),'GMM-simulacao-acervo.json');
  preview.querySelector('#apply-research').onclick=async e=>{e.target.disabled=true;status.textContent='Gerando backup deste navegador antes da atualização…';try{
   const {blob}=await exportBackup();download(blob,'GMM-backup-antes-conciliacao-'+new Date().toISOString().replaceAll(':','-')+'.zip');
   const result=await applyConfirmedCatalog(pack.rows,{expectedIds:plan.additions.map(s=>s.id),queue:pack});
   plan=createCatalogReconciliation(await all('songs'),pack.rows);draw();await onChanged?.();await loadSavedQueues();
   status.textContent=`${result.added} registros adicionados; total real ${result.final}. ${result.reviewQueueItems||0} pendências preservadas na fila. Backup ZIP gerado; guarde o arquivo baixado. Nenhum registro anterior foi substituído.`;
  }catch(error){status.textContent=error.message;e.target.disabled=false;}};
 }
 root.querySelector('#research-import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;status.textContent='Lendo e simulando, sem alterar o catálogo…';preview.innerHTML='';try{pack=await readResearchPackage(file);plan=createCatalogReconciliation(await all('songs'),pack.rows);filter='all';page=0;draw();status.textContent='Simulação concluída. Apenas os novos com evidência direta poderão ser adicionados; os demais ficarão na fila.';}catch(error){status.textContent=error.message;}};
 await loadSavedQueues();
}
