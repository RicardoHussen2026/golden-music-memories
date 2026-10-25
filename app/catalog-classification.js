import {normalizeSearch} from './search.js';
import {openDB,uid,now} from './db.js';

export function metadataLabels(...values){
 const labels=values.flatMap(v=>Array.isArray(v)?metadataLabels(...v):typeof v==='string'?[v.trim()]:v&&typeof v==='object'?metadataLabels(v.name,v.title):[]).filter(Boolean);
 return [...new Map(labels.map(v=>[normalizeSearch(v),v])).values()];
}
export const genresOf=s=>metadataLabels(s.genre,s.genres);
export function romanticStatus(s){
 if(Object.hasOwn(s.classification||{},'romantic'))return s.classification.romantic===true?'romantic':s.classification.romantic===false?'not-romantic':'unknown';
 return metadataLabels(s.moods,s.themes).some(v=>['romantic','romantica','romanticas','romance'].includes(normalizeSearch(v)))?'romantic':'unknown';
}
export function classificationPatch({genres,romantic,note=''}){
 if(typeof genres!=='string'||genres.length>500||typeof note!=='string'||note.length>500||!['romantic','not-romantic','unknown'].includes(romantic))throw Error('Classificação inválida. Use até500 caracteres e selecione o tema.');
 const labels=metadataLabels(...genres.split(',').filter(Boolean));if(labels.length>15||labels.some(v=>v.length>80))throw Error('Use até15 gêneros, com até80 caracteres cada.');
 return {genre:labels[0]||'',genres:labels,classification:{romantic:romantic==='unknown'?null:romantic==='romantic',note:note.trim(),origin:'manual',updatedAt:now()}};
}
export async function saveClassification(songId,fields){
 const patch=classificationPatch(fields),db=await openDB();return new Promise((resolve,reject)=>{
  const tx=db.transaction(['songs','history'],'readwrite'),store=tx.objectStore('songs'),read=store.get(songId);let failure;
  read.onsuccess=()=>{try{const song=read.result;if(!song)throw Error('Música não encontrada.');const before={genre:song.genre||'',genres:song.genres||[],classification:song.classification||null};store.put({...song,...patch,classification:{...song.classification,...patch.classification}});tx.objectStore('history').add({id:uid(),entityId:songId,action:'song_classification_changed',at:now(),detail:JSON.stringify({before,after:patch})});}catch(e){failure=e;tx.abort();}};
  tx.oncomplete=()=>resolve(patch);tx.onabort=tx.onerror=()=>reject(failure||tx.error||Error('Classificação não salva; dados anteriores preservados.'));
 });
}
const filterKeys=['year','yearFrom','yearTo','artist','genre','mood','album','version','asset','platform','publication','rankingList','rankingLimit','rankingYear'];
export function catalogFilterSnapshot(state){
 const filters={};for(const key of filterKeys)if(typeof state.filters?.[key]==='string')filters[key]=state.filters[key].slice(0,300);
 return {id:'catalogRankingFilter',schema:2,filters,rankingList:filters.rankingList||'',rankingLimit:filters.rankingLimit||'30',search:String(state.search||'').slice(0,500),decade:String(state.decade||''),sort:String(state.sort||'relevance'),repertoire:String(state.repertoire||''),favorites:!!state.favorites,unused:!!state.unused,advanced:!!state.advanced,rankingOpen:!!state.rankingOpen};
}
export function restoreCatalogFilterState(state,saved){
 if(!saved)return;const source=saved.schema===2&&saved.filters?saved.filters:saved;
 state.filters={};for(const key of filterKeys)if(typeof source[key]==='string')state.filters[key]=source[key].slice(0,300);
 state.filters.rankingLimit=state.filters.rankingLimit||'30';state.decade=String(saved.decade||'');state.sort=String(saved.sort||'relevance');
 if(saved.schema===2){for(const key of ['search','repertoire'])state[key]=String(saved[key]||'');for(const key of ['favorites','unused','advanced','rankingOpen'])state[key]=!!saved[key];}state.page=0;
}
