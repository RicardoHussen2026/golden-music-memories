import {openDB,uid,now} from './db.js';
import {organizedCatalogFamilies,FAMILY_SETTING_ID} from './catalog-families.js';
export async function changeFamilyPresentation(familyId,mode){
 if(!['grouped','separate'].includes(mode))throw Error('Modo de agrupamento inválido.');const db=await openDB();
 return new Promise((resolve,reject)=>{const tx=db.transaction(['songs','settings','history'],'readwrite'),songs=tx.objectStore('songs').getAll(),setting=tx.objectStore('settings').get(FAMILY_SETTING_ID);let values,prefs,ready=0,result,failure;
 const apply=()=>{if(++ready!==2)return;try{const groups=organizedCatalogFamilies(values,{settings:[]}),group=groups.find(g=>g.id===familyId&&g.relationshipReviewed&&g.members.length>1);if(!group)throw Error('Relação não confirmada ou catálogo alterado; agrupar automaticamente não é seguro.');const before=prefs?.modes?.[familyId]||'grouped';if(before===mode){result={changed:false};return;}const after={...(prefs||{}),id:FAMILY_SETTING_ID,schema:1,modes:{...(prefs?.modes||{}),[familyId]:mode},updatedAt:now()};tx.objectStore('settings').put(after);tx.objectStore('history').add({id:uid(),action:'catalog_family_view_changed',entityId:familyId,at:now(),detail:JSON.stringify({before,after:mode,memberIds:group.members.map(s=>s.id),recordsMerged:0,reversible:true})});result={changed:true};}catch(e){failure=e;tx.abort();}};
 songs.onsuccess=()=>{values=songs.result;apply();};setting.onsuccess=()=>{prefs=setting.result;apply();};tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(failure||tx.error||Error('Alteração de apresentação não salva; dados preservados.'));
 });
}
