import {openDB,all,uid,now} from './db.js';
import {FINANCE_PREFIX,FINANCE_SCOPE,validateEntry} from './finance-model.js';
export const financeEntries=async()=>(await all('settings')).filter(r=>r.id.startsWith(FINANCE_PREFIX)&&r.scope===FINANCE_SCOPE);
// Read and compare the revision within the same transaction: concurrent tabs cannot silently overwrite an entry.
export async function saveFinance(input,expectedRevision=0){
 const value=validateEntry(input),db=await openDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['settings','history'],'readwrite'),store=tx.objectStore('settings'),read=store.get(value.id);let saved,message='Não foi possível salvar o lançamento.';
  read.onsuccess=()=>{const previous=read.result;if((previous?.revision||0)!==expectedRevision){message='Este lançamento foi alterado em outra aba. Feche e abra novamente para conferir os valores.';tx.abort();return;}
   saved={...value,createdAt:previous?.createdAt||now(),updatedAt:now(),revision:expectedRevision+1};store.put(saved);tx.objectStore('history').put({id:uid(),action:previous?'finance_updated':'finance_created',entityId:saved.id,at:now(),detail:'Lançamento financeiro Golden; revisão '+saved.revision});};
  tx.oncomplete=()=>resolve(saved);tx.onerror=tx.onabort=()=>reject(new Error(message));
 });
}
