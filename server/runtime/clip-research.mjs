import {check,sha,stamp} from './store.mjs';

// All matching and validation precede the transaction. Media and production records are untouched.
export function importClipResearch(store,library,input){
 const {research,sources,archiveSha256}=input;
 check(research?.schema==='golden-pesquisa-clipes/1.0'&&Array.isArray(research.clipes)&&research.clipes.length>0&&research.clipes.length<=5000,'Pacote de pesquisa inválido.');
 check(Array.isArray(sources)&&sources.length<=15000,'Lista de fontes inválida.');
 check(/^[a-f0-9]{64}$/.test(archiveSha256||''),'Informe o SHA-256 do pacote recebido.');
 const sourceMap=new Map();for(const s of sources){check(s&&typeof s.id==='string'&&!sourceMap.has(s.id),'Fonte repetida ou inválida.');let url;try{url=new URL(s.url);}catch{}check(url&&['https:','http:'].includes(url.protocol),'URL de fonte inválida.');sourceMap.set(s.id,s);}
 const entries=new Map(library.entries().map(r=>[r.id,r])),seen=new Set(),digest=sha(JSON.stringify({research,sources,archiveSha256})),at=stamp();
 const records=research.clipes.map(c=>{
  check(/^clip-[a-f0-9]{64}$/.test(c.clip_id||'')&&c.clip_id==='clip-'+c.sha256&&!seen.has(c.clip_id),'Identidade repetida ou inválida.');seen.add(c.clip_id);
  const row=entries.get(c.clip_id);check(row&&row.hash===c.sha256,'Pesquisa sem clipe correspondente no acervo.');
  const p=c.proposta;check(p&&c.original,'Ficha incompleta.');
  for(const [field,max]of [['artista',180],['titulo',180],['genero_principal',100]])check(p[field]===null||(typeof p[field]==='string'&&p[field].trim().length>0&&p[field].length<=max),'Texto de metadado inválido.');
  for(const year of [p.ano_referencia,p.ano_single])check(year===null||(Number.isInteger(year)&&year>=1900&&year<=2100),'Ano inválido.');
  check(p.decada===(p.ano_referencia===null?null:Math.floor(p.ano_referencia/10)*10),'Década incompatível com ano de referência.');
  check(Array.isArray(c.fontes)&&c.fontes.every(id=>sourceMap.has(id)),'Ficha com fonte ausente.');
  return {id:c.clip_id,hash:c.sha256,packageDigest:digest,archiveSha256,importedAt:at,researchDate:research.data,number:c.numero,
   original:{title:c.original.titulo,artist:c.original.artista,year:null,genre:''},
   proposed:{title:p.titulo,artist:p.artista,year:p.ano_referencia,genre:p.genero_principal},
   singleYear:p.ano_single,styles:p.estilos,genreEvidence:c.genero,identity:c.identidade,performance:c.apresentacao,
   albumsContext:c.albuns_contexto,status:c.status,reviews:c.revisoes,notes:c.observacoes,hypotheses:c.hipoteses,
   localEvidence:c.evidencias_locais||null,sourceOriginal:c.original,sources:c.fontes.map(id=>sourceMap.get(id)),criteria:research.criterios,
   policy:'flexible_reference'};
 });
 const previous=store.get('clip_research_import',digest);
 if(previous&&records.every(r=>store.get('clip_research',r.id)?.packageDigest===digest))return {...previous,unchanged:true};
 const receipt={id:digest,archiveSha256,importedAt:at,count:records.length,withYear:records.filter(r=>r.proposed.year!==null).length,withGenre:records.filter(r=>r.proposed.genre).length,policy:'flexible_reference'};
 store.transaction(()=>{for(const r of records)store.put('clip_research',r.id,r);store.put('clip_research_import',digest,receipt);});
 return {...receipt,unchanged:false};
}
