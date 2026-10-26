import {validatePublishedEntry} from './repost-policy.js';
import {openDB,uid,now} from './db.js';
import {destinationOf,finalRoleAllowed} from './destinations.js';
const fields=['businessGoal','editorialFormat','editorialValue','monetization','currency','measuredAt','destination','title','description','hashtags','finalAssetId','localRenderAssetId','localRenderJobId','options','status','plannedAt','publishedAt','url','metrics','editorial','postingAccountId','postingAccountLabel','finalFileHash','repostDecision','serviceMediaId','servicePublicationId'];
const editable=p=>JSON.stringify(fields.map(key=>p[key]));
export async function saveEditorialPublication(next,baseline,facts,productionBaseline){
 const db=await openDB();return new Promise((resolve,reject)=>{
  const tx=db.transaction(['publications','productions','assets','history','settings'],'readwrite'),pubs=tx.objectStore('publications');let reason='Não foi possível salvar o registro.',saved;
  const fail=text=>{reason=text;tx.abort();};
  const read=pubs.getAll();read.onsuccess=()=>{
   const current=read.result.find(p=>p.id===next.id);
   if(current&&(current.productionId!==next.productionId||current.platform!==next.platform))return fail('Vínculo da publicação inválido. Reabra a produção.');
   if(current&&(!baseline||editable(current)!==editable(baseline)))return fail('Este registro mudou em outra aba. Reabra para não sobrescrever a edição.');
   if(!current&&baseline)return fail('O registro foi removido em outra aba. Reabra a produção.');
   if(!current&&read.result.some(p=>p.productionId===next.productionId&&p.platform===next.platform&&destinationOf(p)===destinationOf(next)&&['draft','planned'].includes(p.status)))return fail('Já existe um rascunho desta produção e plataforma. Feche e reabra Preparar para continuar nele.');
   if(next.url&&read.result.some(p=>p.id!==next.id&&p.url===next.url))return fail('Este link já está registrado em outra publicação.');
   const request=tx.objectStore('productions').get(next.productionId);request.onsuccess=()=>{
    const production=request.result;if(!production)return fail('Produção indisponível. Reabra a ficha.');
    if(productionBaseline&&JSON.stringify(production.editorialFacts)!==JSON.stringify(productionBaseline.editorialFacts))return fail('Os dados confirmados desta produção mudaram em outra aba. Reabra para conferir.');
    const persist=()=>{const settings=tx.objectStore('settings').get('postingAccounts');settings.onsuccess=()=>{let checked;try{checked=validatePublishedEntry(next,{accounts:settings.result?.accounts||[],legacy:!!current?.url&&!!current?.publishedAt,legacyAccountId:current?.postingAccountId});}catch(e){fail(e.message);return;}
     // Preserve service receipts and concurrent delivery updates outside this form.
     saved=current?{...current,...Object.fromEntries(fields.map(key=>[key,checked[key]])),updatedAt:checked.updatedAt}:checked;
     pubs.put(saved);tx.objectStore('productions').put({...production,editorialFacts:facts});
     tx.objectStore('history').put({id:uid(),entityId:next.id,action:'publication_saved',at:now(),detail:next.status});if(current&&current.url&&current.publishedAt&&editable(current)!==editable(saved)){const pick=v=>Object.fromEntries(['status','url','publishedAt','postingAccountId','postingAccountLabel','finalAssetId','localRenderAssetId','finalFileHash','title'].map(k=>[k,v[k]??null]));tx.objectStore('history').put({id:uid(),entityId:next.id,action:'publication_corrected',at:now(),detail:'Correção de registro preservada',correction:{before:pick(current),after:pick(saved),reason:String(next.correctionReason||'Correção pelo proprietário').slice(0,300)}});}
    };};
    if(!next.finalAssetId){persist();return;}
    const asset=tx.objectStore('assets').get(next.finalAssetId);asset.onsuccess=()=>{
     if(!asset.result||asset.result.productionId!==next.productionId||!finalRoleAllowed(asset.result.role,next.platform))return fail('O vídeo final não pertence a esta produção e plataforma. Confira o arquivo.');
     persist();
    };
   };
  };
  tx.oncomplete=()=>resolve(saved);tx.onerror=tx.onabort=()=>reject(Error(reason));
 });
}
