import {openDB,uid,now} from './db.js';
const identity=s=>s.sourceName==='MusicBrainz'&&s.sourceId?s.sourceId.toLowerCase():null;
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(s,m){
 const id=identity(s),proof=m?.identityEvidence;
 if(!id||!m.id||!m.listId||!Number.isInteger(m.position)||m.position<1||m.position>100||!/^[A-Z]{2}$/.test(m.market)||!/^https:\/\//.test(m.sourceUrl)||!/^[a-f\d]{64}$/.test(m.sourceSha256)||proof?.type!=='musicbrainz_recording'||proof.sourceUrl!=='https://musicbrainz.org/recording/'+id||proof.confirmedSingle!==true||proof.releaseEvidence?.recordingId!==id||!/^https:\/\/musicbrainz.org\/release\/[a-f\d-]{36}$/.test(proof.releaseEvidence?.sourceUrl||''))throw Error('Vínculo de ranking sem evidência válida. Nenhuma alteração aplicada.');
}
export async function mergeVerifiedRankings(incoming){
 if(!Array.isArray(incoming))throw Error('Lista de músicas inválida.');
 const candidates=incoming.filter(s=>s.rankingMemberships?.length);for(const s of candidates)for(const m of s.rankingMemberships)validate(s,m);
 const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(['songs','history'],'readwrite'),store=tx.objectStore('songs'),query=store.getAll(),result={updatedSongs:0,addedMemberships:0,missing:0,conflicts:0};
 query.onsuccess=()=>{try{const records=query.result;for(const source of candidates){const matches=records.filter(s=>identity(s)===identity(source));if(matches.length!==1){matches.length?result.conflicts++:result.missing++;continue;}const target=matches[0];let changed=false;for(const member of source.rankingMemberships){const old=target.rankingMemberships?.find(m=>m.id===member.id);if(old){if(JSON.stringify(old)!==JSON.stringify(member))result.conflicts++;continue;}(target.rankingMemberships??=[]).push(structuredClone(member));result.addedMemberships++;changed=true;}if(changed){store.put(target);result.updatedSongs++;}}if(result.updatedSongs)tx.objectStore('history').put({id:uid(),action:'rankings_merged',at:now(),detail:JSON.stringify(result)});}catch(error){tx.abort();reject(error);}};
 tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(tx.error||Error('Atualização interrompida; dados preservados.'));
 });
}
export function rankingDetails(song){
 const rows=(song.rankingMemberships||[]).filter(m=>{try{validate(song,m);return true;}catch{return false;}});if(!rows.length)return '';
 return `<h3>Rankings verificados por metadados</h3><p>O ano abaixo pertence à lista. A gravação e o áudio do seu arquivo continuam sujeitos à conferência.</p><ul>${rows.map(m=>`<li>${e(m.market==='GB'?'Reino Unido':m.market)} · ${e(m.chartYear??'lista histórica de vendas')} · posição ${m.position} · <a href="${e(m.sourceUrl)}" target="_blank" rel="noopener noreferrer">${e(m.publisher)}</a></li>`).join('')}</ul>`;
}
