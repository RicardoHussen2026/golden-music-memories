// Presentation groups are not recording identity merges. Original IDs survive.
export const norm=value=>String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const versionWords=/\b(live|ao vivo|remix|remaster(?:ed)?|extended|version|vers[aã]o|edit|demo|mono|stereo|instrumental|acoustic|ac[uú]stic[ao]|karaoke|spot xbox)\b/i;
export function titleParts(song){
 const original=String(song.title||'').trim();let base=original,version=[];
 base=base.replace(/\([^)]*\)|\[[^\]]*\]/g,part=>{if(!versionWords.test(norm(part)))return part;version.push(part.slice(1,-1));return ' ';});
 base=base.replace(/\s[-–—]\s(.+)$/, (all,tail)=>{if(!versionWords.test(norm(tail)))return all;version.push(tail);return '';}).trim().replace(/\s+/g,' ');
 const track=/^(\d{1,2})[.)-]?\s+(.+)$/.exec(base);
 return {original,base,key:norm(base),possibleTrackPrefix:track?{number:track[1],base:track[2],key:norm(track[2])}:null,version:version.join('; ')||String(song.versionName||song.disambiguation||'')};
}
function artistKey(song){const ids=[...new Set((song.artistIds||[]).filter(x=>typeof x==='string'&&x))].sort();return ids.length?'artist-id:'+ids.join(','):'artist-name:'+norm(song.artist);}
export function referenceCount(song,tables={}){return ['productions','assets','publications','reservations'].reduce((n,kind)=>n+(tables[kind]||[]).filter(r=>r.songId===song.id).length,0);}
export function canonicalCandidate(rows,tables={}){
 const quality=s=>referenceCount(s,tables)*1000+(s.validation==='curated'?100:0)+(s.recordingVerification?40:0)+(s.genreEvidence?5:0)+(s.sourceId?10:0)-(titleParts(s).version?4:0)-(titleParts(s).possibleTrackPrefix?8:0);
 return [...rows].sort((a,b)=>quality(b)-quality(a)||Number(a.year||9999)-Number(b.year||9999)||String(a.id).localeCompare(String(b.id)))[0];
}
export function catalogFamilies(songs,{tables={},evidence={}}={}){
 const clean=new Map();for(const s of songs){const p=titleParts(s),key=artistKey(s)+'|'+p.key;if(!p.possibleTrackPrefix)clean.set(key,true);}
 const groups=new Map();
 for(const s of songs){const p=titleParts(s),artist=artistKey(s),prefixAccepted=p.possibleTrackPrefix&&clean.has(artist+'|'+p.possibleTrackPrefix.key),base=prefixAccepted?p.possibleTrackPrefix.base:p.base,key=artist+'|'+norm(base),list=groups.get(key)||[];list.push({song:s,parts:p,prefixAccepted,base,workIds:[...new Set(evidence[s.id]?.workIds||s.workIds||(s.workId?[s.workId]:[]))]});groups.set(key,list);}
 const result=[];
 for(const [key,members]of groups){
  const works=[...new Set(members.flatMap(m=>m.workIds))];
  const partitions=works.length>1?members.map(m=>[key+'|work-conflict:'+m.song.id,[m]]):[[key,members]];
  for(const [familyKey,list]of partitions){const rows=list.map(m=>m.song),canonical=canonicalCandidate(rows,tables),label=list.find(m=>!m.parts.version&&!m.parts.possibleTrackPrefix)?.base||list[0].base;
   result.push({id:'credit-family:'+familyKey,title:label,artist:canonical.artist,canonicalId:canonical.id,members:rows,proposedCanonicalOnly:true,identityMerged:false,workConflict:works.length>1,reviewRequired:rows.length>1,memberEvidence:list.map(m=>({id:m.song.id,title:m.song.title,artist:m.song.artist,year:m.song.year,version:m.parts.version,trackPrefixCandidate:m.prefixAccepted,workIds:m.workIds,referenceCount:referenceCount(m.song,tables)}))});}
 }
 return result;
}
export function exactIdentityGroups(songs){const map=new Map();for(const s of songs){if(!s.sourceId||!s.sourceName)continue;const key=norm(s.sourceName)+':'+String(s.sourceId).toLowerCase(),rows=map.get(key)||[];rows.push(s);map.set(key,rows);}return [...map].filter(([,rows])=>rows.length>1).map(([identity,rows])=>({identity,ids:rows.map(s=>s.id),conflictingCredits:new Set(rows.map(s=>norm(s.artist)+'|'+norm(s.title))).size>1}));}
export function groupCatalogMatches(songs,matching,options={}){
 const families=organizedCatalogFamilies(songs,options),byId=new Map(families.flatMap(f=>f.members.map(s=>[s.id,f]))),visible=new Map();
 for(const song of matching){const f=byId.get(song.id);if(!f)continue;let row=visible.get(f.id);if(!row){row={...f,matches:[],totalMembers:f.members.length};visible.set(f.id,row);}row.matches.push(song);}
 return [...visible.values()];
}
export const TAKE_ON_ME_FAMILY=Object.freeze({id:'reviewed:take-on-me:a-ha:v1',title:'Take On Me',artistId:'7364dea6-ca9a-48e3-be01-b44ad0d19897',workId:'3ea9248d-d6dd-3dfa-b498-b9b2444bf3e2',members:['0da3b5e8-f6ea-485e-b7e6-35dc51b8bd77','cefbb28e-55a7-49a0-90e7-6f6448c9095f','2ff061d7-a1eb-4210-9c53-9758a1a6418c','14cfc9f6-e79f-4795-a63b-27cb9f9ce901','804a2835-2296-41d1-9d78-1078f125bc7e'],source:'https://musicbrainz.org/work/3ea9248d-d6dd-3dfa-b498-b9b2444bf3e2',review:'Relação de canção por crédito e identidade do artista revisada; não equivale a identidade de gravação. A obra vincula diretamente1984/extended/SPOT;2004 e o prefixo1 requerem revisão da edição. Datas originais não inferidas.'});
export function reviewedFamilyKey(song){
 if(!song||song.sourceName!=='MusicBrainz'||!TAKE_ON_ME_FAMILY.members.includes(song.sourceId)||!song.artistIds?.includes(TAKE_ON_ME_FAMILY.artistId)||norm(song.artist).replaceAll(' ','')!=='aha')return null;
 if((song.workIds||[]).some(w=>w!==TAKE_ON_ME_FAMILY.workId))return null;
 return TAKE_ON_ME_FAMILY.id;
}
export const FAMILY_SETTING_ID='catalog-family-presentation';
export function organizedCatalogFamilies(songs,{tables={},evidence={},settings=[]}={}){
 const candidates=catalogFamilies(songs,{tables,evidence}),modes=settings.find(s=>s.id===FAMILY_SETTING_ID&&s.schema===1)?.modes||{},result=[];
 for(const f of candidates){
  const reviewed=f.members.filter(s=>reviewedFamilyKey(s)),knownWorks=f.members.every(s=>s.workIds?.length===1&&s.workEvidence?.verified===true&&s.workEvidence?.source==='https://musicbrainz.org/work/'+s.workIds[0]);
  const approved=reviewed.length>1?reviewed:knownWorks&&f.members.length>1&&!f.workConflict?f.members:[],id=reviewed.length>1?TAKE_ON_ME_FAMILY.id:'verified-work:'+f.id;
  if(approved.length>1){const group={...f,id,title:reviewed.length?TAKE_ON_ME_FAMILY.title:f.title,members:approved,canonicalId:canonicalCandidate(approved,tables).id,reviewRequired:false,relationshipReviewed:true,reviewNote:reviewed.length?TAKE_ON_ME_FAMILY.review:'Vínculo de obra documentado; gravações e datas permanecem distintas.'};
   if(modes[id]==='separate')for(const s of approved)result.push({...group,id:'record:'+s.id,members:[s],canonicalId:s.id,separatePresentation:true,restoreFamilyId:group.id,restoreControl:s.id===group.canonicalId,relatedGroup:group});else result.push(group);
  }
  for(const s of f.members.filter(s=>!approved.includes(s))){result.push({...f,id:'record:'+s.id,members:[s],canonicalId:s.id,reviewRequired:f.members.length>1||f.workConflict,pendingRelated:f.members.length>1||f.workConflict?f:null});}
 }
 return result;
}
