// Similaridade sugere revisão. Somente identidade comprovada autoriza ignorar
// como repetido; versões e gravações diferentes nunca são fundidas aqui.
const MBID=/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
export const normalizeCredit=value=>String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR').replace(/&/g,' and ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const compact=value=>normalizeCredit(value).replaceAll(' ','');
const weakArtist=value=>normalizeCredit(value).replace(/^(?:the|os|as) /,'').replaceAll(' ','');
export function recordingIdentity(row){const id=row?.sourceId;if(row?.sourceName==='MusicBrainz'&&MBID.test(id||''))return 'mb:'+id.toLowerCase();return null;}
export function versionSignature(row){const text=normalizeCredit([row.title,row.versionName,row.version,row.disambiguation].filter(Boolean).join(' '));return [...new Set(text.match(/\b(?:live|ao vivo|remix|remaster(?:ed)?|mono|stereo|demo|karaoke|instrumental|acoustic|acustic[ao]|extended|radio edit|rerecording|re recording)\b/g)||[])].sort().join('|');}
const baseTitle=value=>normalizeCredit(String(value||'').replace(/[([][^)\]]*(?:live|remix|remaster|version|edit|demo|mono|stereo)[^)\]]*[)\]]/gi,''));
function dice(a,b){if(a===b)return 1;if(a.length<3||b.length<3)return 0;const x=new Set(Array.from({length:a.length-1},(_,i)=>a.slice(i,i+2))),y=new Set(Array.from({length:b.length-1},(_,i)=>b.slice(i,i+2)));let n=0;for(const token of x)if(y.has(token))n++;return 2*n/(x.size+y.size);}
function indexed(value){const row=value&&typeof value==='object'?value:{};return {row,id:recordingIdentity(row),artist:compact(row.artist),weakArtist:weakArtist(row.artist),title:compact(row.title),baseTitle:compact(baseTitle(row.title)),version:versionSignature(row)};}
export function verifiedRecording(row){const v=row?.recordingVerification,id=recordingIdentity(row)?.slice(3);return !!(id&&v?.type==='direct_musicbrainz_lookup'&&v.recordingId===id&&v.sourceUrl==='https://musicbrainz.org/recording/'+id&&/^[a-f\d]{64}$/.test(v.responseSha256||'')&&Number.isFinite(Date.parse(v.checkedAt))&&Number(row.year)===v.releaseYear&&normalizeCredit(row.title)===normalizeCredit(v.sourceCredit?.title)&&normalizeCredit(row.artist)===normalizeCredit(v.sourceCredit?.artist)&&v.releaseEvidence?.recordingId===id&&v.releaseEvidence.status==='Official'&&MBID.test(v.releaseEvidence.releaseId||'')&&v.releaseEvidence.sourceUrl==='https://musicbrainz.org/release/'+v.releaseEvidence.releaseId&&String(v.releaseEvidence.date||'').slice(0,4)===String(row.year));}
export function adaptResearchRows(rows){if(!Array.isArray(rows))throw Error('Pacote sem lista de registros.');return rows.map(r=>{const id=r.proveniencia?.musicbrainz_recording_id;return {id:r.id,title:r.musica,artist:r.artista,year:r.ano_lancamento??null,versionName:r.versao_gravacao||'',sourceId:MBID.test(id||'')?id.toLowerCase():null,sourceName:MBID.test(id||'')?'MusicBrainz':'Pesquisa editorial',source:MBID.test(id||'')?'https://musicbrainz.org/recording/'+id.toLowerCase():'',researchCandidateId:r.id,research:{status:r.proveniencia?.estado||'preliminar',confidence:r.confianca?.nivel||'não informada',chartYear:r.ano_ranking,annualPosition:r.posicao_ano,genreLabels:Array.isArray(r.generos_adicionais)?r.generos_adicionais:[],sourceUrls:(r.fontes||[]).map(f=>f.url).filter(u=>typeof u==='string'&&u.startsWith('https://'))}};});}
export function createCatalogReconciliation(existing,incoming){
 if(!Array.isArray(existing)||!Array.isArray(incoming)||incoming.length>10000)throw Error('Lista de conciliação inválida.');
 const index=existing.map(indexed),byId=new Map(),byRecordId=new Map(index.filter(x=>x.row.id).map(x=>[x.row.id,x])),entries=[],seenInput=new Set();for(const r of index)if(r.id)byId.set(r.id,[...(byId.get(r.id)||[]),r]);
 const counts={before:existing.length,read:incoming.length,addable:0,duplicates:0,conflicts:0,needsEvidence:0,outOfScope:0,invalid:0};
 for(let inputIndex=0;inputIndex<incoming.length;inputIndex++){
  const row=incoming[inputIndex]&&typeof incoming[inputIndex]==='object'?incoming[inputIndex]:{},x=indexed(row),result={inputIndex,sourceId:row.sourceId||null,id:row.id||null,title:row.title||'',artist:row.artist||'',status:'',reason:'',candidateIds:[]};
  const finish=(status,reason,candidates=[])=>{result.status=status;result.reason=reason;result.candidateIds=[...new Set(candidates.map(c=>c.row?.id||c.id).filter(Boolean))];entries.push(result);counts[status]++;};
  if(typeof row.title!=='string'||!row.title.trim()||row.title.length>180||typeof row.artist!=='string'||!row.artist.trim()||row.artist.length>180){finish('invalid','Título e artista obrigatórios, com até180 caracteres.');continue;}
  const recordCollision=byRecordId.get(row.id);if(recordCollision&&recordCollision.id!==x.id){finish('conflicts','ID de cadastro já pertence a outra identidade; não sobrescrever.',[recordCollision]);continue;}
  const identityMatches=x.id?byId.get(x.id)||[]:[];
  if(identityMatches.length){const conflict=identityMatches.length>1||identityMatches.some(old=>old.artist!==x.artist||old.title!==x.title);finish(conflict?'conflicts':'duplicates',conflict?'Mesmo identificador com crédito divergente ou múltiplos destinos; revisar sem sobrescrever.':'Identificador da gravação já presente; nenhum registro ou campo substituído.',identityMatches);continue;}
  const inputKey=x.id||row.researchCandidateId||row.id;
  if(inputKey&&seenInput.has(inputKey)){finish('duplicates','Registro/identificador repetido dentro do próprio lote.');continue;}if(inputKey)seenInput.add(inputKey);
  const related=index.filter(old=>{
   if(old.weakArtist===x.weakArtist)return old.baseTitle===x.baseTitle||dice(old.title,x.title)>=.88;
   return old.artist.slice(0,2)===x.artist.slice(0,2)&&Math.abs(old.artist.length-x.artist.length)<=3&&dice(old.artist,x.artist)>=.9&&dice(old.title,x.title)>=.9;
  });
  const explicitOtherVersion=related.length&&x.version&&related.every(old=>old.version&&old.version!==x.version&&old.id&&old.id!==x.id);
  if(related.length&&!explicitOtherVersion){finish('conflicts','Crédito semelhante ou outra gravação da mesma música; sem fusão por nome/ano/fuzzy.',related);continue;}
  if(row.year!==null&&row.year!==undefined&&Number.isInteger(Number(row.year))&&(Number(row.year)<1960||Number(row.year)>2009)){finish('outOfScope','Ano da gravação fora de1960–2009; ano editorial não o substitui.');continue;}
  if(!Number.isInteger(Number(row.year))||row.year===null||row.year===undefined||!verifiedRecording(row)){finish('needsEvidence','Gravação/ano ainda sem conferência direta suficiente; permanece em revisão.');continue;}
  finish('addable',explicitOtherVersion?'Outra versão explicitamente identificada: cadastrar separada, preservando anteriores.':'Nova identidade e ano conferidos, sem correspondência conflitante.');
  const newIndex=indexed(row);index.push(newIndex);if(row.id)byRecordId.set(row.id,newIndex);if(x.id)byId.set(x.id,[newIndex]);
 }
 counts.final=counts.before+counts.addable;
 return {schema:1,scope:'records_not_unique_compositions',counts,entries,additions:entries.filter(e=>e.status==='addable').map(e=>structuredClone(incoming[e.inputIndex]))};
}
export function mergeConfirmedRecords(existing,incoming){const plan=createCatalogReconciliation(existing,incoming);return {records:[...structuredClone(existing),...plan.additions],plan};}
