import {openDB,validateSong,canonicalKey,uid,now} from './db.js';
import {createCatalogReconciliation} from './catalog-reconciliation.js';

// Só acrescenta identidades conferidas. Recalcula dentro da mesma transação;
// nunca limpa a tabela, sobrescreve registros existentes ou muda produções.
export async function applyConfirmedCatalog(incoming,{expectedIds,queue}={}){
 const db=await openDB();return new Promise((resolve,reject)=>{
  const tx=db.transaction(['songs','history','settings'],'readwrite'),songs=tx.objectStore('songs'),read=songs.getAll();let result,failure;
  read.onsuccess=()=>{try{
   const plan=createCatalogReconciliation(read.result,incoming),ids=plan.additions.map(s=>s.id).sort();
   if(expectedIds&&ids.length&&JSON.stringify(ids)!==JSON.stringify([...expectedIds].sort()))throw Error('O catálogo mudou desde a simulação. Refaça a revisão antes de aplicar.');
   for(const source of plan.additions){const song=validateSong(source);song.createdAt=song.createdAt||now();song.canonicalKey=canonicalKey(song);song.recordingKey=song.sourceId;songs.add(song);}
   result={...plan.counts,added:plan.additions.length,addedIds:ids,final:read.result.length+plan.additions.length};
   if(queue){if(!/^[a-f\d]{64}$/.test(queue.hash||''))throw Error('Hash da fila de revisão inválido.');const pending=plan.entries.filter(e=>!['addable','duplicates'].includes(e.status));tx.objectStore('settings').put({id:'catalog-review-'+queue.hash,kind:'catalog_reconciliation_queue',sourceName:String(queue.name||'Pacote de pesquisa').slice(0,200),sourceHash:queue.hash,scope:queue.scope||null,updatedAt:now(),counts:result,items:pending.map(e=>({...e,sourceCandidate:incoming[e.inputIndex]}))});result.reviewQueueItems=pending.length;}
   if(result.added)tx.objectStore('history').add({id:uid(),action:'confirmed_catalog_import',at:now(),detail:JSON.stringify(result)});
  }catch(error){failure=error;tx.abort();}};
  tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(failure||tx.error||Error('Importação interrompida; registros anteriores preservados.'));
 });
}
