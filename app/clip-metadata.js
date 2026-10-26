// Research supplies editable catalog references; manual choices remain authoritative.
export const CLIP_METADATA_FIELDS=['title','artist','year','genre'];
const empty=v=>v===null||v===undefined||v==='';
const same=(a,b)=>(empty(a)&&empty(b))||a===b;
export function mergeClipMetadata(previous,row){
 const research=row.metadataResearch;
 const next={title:previous?.title||row.title,artist:previous?.artist||row.artist,year:previous?(previous.year??null):(row.year??null),genre:previous?.genre??row.genre??''};
 if(research){
  const overrides={...previous?.metadataOverrides},imported={...previous?.metadataImportedValues};
  for(const field of CLIP_METADATA_FIELDS){
   const proposal=research.proposed[field];if(empty(proposal))continue;
   const old=previous?.[field],hasPrior=Object.hasOwn(previous?.metadataImportedValues||{},field);
   const baseline=hasPrior?previous.metadataImportedValues[field]:research.original[field];
   const edited=!!overrides[field]||(!!previous&&!same(old,baseline)&&(hasPrior||!empty(old)));
   if(edited){overrides[field]=true;next[field]=old;}else next[field]=proposal;
   imported[field]=proposal;
  }
  next.metadataResearch=research;next.metadataOverrides=overrides;next.metadataImportedValues=imported;
  next.metadataConflicts=CLIP_METADATA_FIELDS.filter(f=>overrides[f]&&!empty(research.proposed[f])&&!same(next[f],research.proposed[f]));
 }
 next.decade=Number.isInteger(next.year)?Math.floor(next.year/10)*10:null;
 return next;
}
export function editClipMetadata(song,values){
 const overrides={...song.metadataOverrides};
 for(const field of CLIP_METADATA_FIELDS)if(!same(values[field],song[field]))overrides[field]=true;
 return {...song,...values,decade:Number.isInteger(values.year)?Math.floor(values.year/10)*10:null,metadataOverrides:overrides,
  metadataConflicts:CLIP_METADATA_FIELDS.filter(f=>overrides[f]&&!empty(song.metadataResearch?.proposed[f])&&!same(values[f],song.metadataResearch.proposed[f]))};
}
