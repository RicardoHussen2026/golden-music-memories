import {openDB,uid,now} from './db.js';
export async function changeCoverTrash(id,{productionId,hash,restore=false}){
 const db=await openDB();return new Promise((resolve,reject)=>{
  const tx=db.transaction(['assets','history'],'readwrite'),assets=tx.objectStore('assets');let result,reason='Não foi possível atualizar a capa.';
  const read=assets.get(id);read.onsuccess=()=>{const a=read.result;if(!a||a.role!=='cover'||a.productionId!==productionId||a.hash!==hash){reason='Capa ou vínculo mudou. Confira novamente o alvo.';tx.abort();return;}
   if(!!a.trashedAt===!restore){result=a;return;}
   result={...a,trashedAt:restore?null:now()};assets.put(result);tx.objectStore('history').put({id:uid(),at:now(),entityId:a.productionId,action:restore?'cover_restored':'cover_trashed',detail:a.id,assetId:a.id,hash:a.hash,retainedBytes:true});
  };tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(Error(reason));
 });
}
