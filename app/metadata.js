// Metadados somente. Nenhum download de áudio, segredo ou chamada externa automática.
const MBID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean=value=>typeof value==='string'?value.trim().slice(0,180):'';
const abortError=()=>new DOMException('Consulta cancelada.','AbortError');
function checkAbort(signal){if(signal?.aborted)throw abortError();}

export const METADATA_CONFIGURATION={
  enabled:false,
  provider:'MusicBrainz',
  reason:'Consulta automática aguardando avaliação de uso comercial e transporte identificado no servidor.',
  documentation:'https://musicbrainz.org/doc/MusicBrainz_API',
};

export function musicBrainzSearchURL(query) {
  const url=new URL('https://musicbrainz.org/search');
  url.searchParams.set('query',String(query||'').trim().slice(0,200));
  url.searchParams.set('type','recording');url.searchParams.set('method','indexed');
  return url.href;
}

export function normalizeMusicBrainzRecording(recording, checkedAt=new Date().toISOString()) {
  if(!recording||!MBID.test(recording.id))throw Error('Resposta sem identificador válido de gravação.');
  const title=clean(recording.title);
  const credits=Array.isArray(recording['artist-credit'])?recording['artist-credit']:[];
  const artist=credits.map(c=>clean(c.name||c.artist?.name)+(typeof c.joinphrase==='string'?c.joinphrase.slice(0,30):'')).join('').trim();
  if(!title||!artist)throw Error('Resposta incompleta: título ou artista ausente.');
  const firstReleaseDate=clean(recording['first-release-date']);
  const year=/^(19|20)\d{2}(?:-\d{2})?(?:-\d{2})?$/.test(firstReleaseDate)?Number(firstReleaseDate.slice(0,4)):null;
  const albums=[...new Set((Array.isArray(recording.releases)?recording.releases:[]).map(r=>clean(r.title)).filter(Boolean))];
  const sourceId=recording.id.toLowerCase();
  return {
    id:`mb-${sourceId}`,sourceId,sourceName:'MusicBrainz',source:`https://musicbrainz.org/recording/${sourceId}`,
    title,artist,year,decade:year===null?null:Math.floor(year/10)*10,
    versionName:clean(recording.disambiguation),albums,
    artistIds:credits.map(c=>c.artist?.id).filter(id=>MBID.test(id||'')),
    firstReleaseDate,sourceCheckedAt:String(checkedAt),
    yearMeaning:'Primeiro lançamento conhecido desta gravação no MusicBrainz; não é confirmação da composição original.',
    validation:'metadata_imported',rights:'pending',favorite:false,genre:'',country:'',
    importable:year!==null&&year>=1960&&year<=2009,
    reviewNote:year===null?'Ano não informado pela fonte: revisar antes de cadastrar.':
      year<1960||year>2009?'Gravação fora do período do catálogo (1970–2009).':'Confira artista, gravação e versão na fonte antes de importar.',
  };
}

function pause(ms,signal) {
  return new Promise((resolve,reject)=>{
    checkAbort(signal);
    const onAbort=()=>{clearTimeout(timer);reject(abortError());};
    const timer=setTimeout(()=>{signal?.removeEventListener('abort',onAbort);resolve();},ms);
    signal?.addEventListener('abort',onAbort,{once:true});
  });
}

/** Transporte futuro é injetado e deve ser autenticado/identificado no servidor.
 * transport(query,{signal,userAgent}) retorna {recordings:[...]}.
 * Nenhum fetch é criado aqui. Variáveis de ambiente não habilitam esta conexão.
 */
export function createMetadataClient({enabled=false,termsApproved=false,transport,now=Date.now,sleep=pause}={}) {
  let queue=Promise.resolve(),lastRequest=-Infinity;
  const cache=new Map();
  return {
    enabled:enabled===true&&termsApproved===true&&typeof transport==='function',
    async search(query,{signal}={}) {
      checkAbort(signal);
      if(!this.enabled)throw Error(METADATA_CONFIGURATION.reason);
      const q=String(query||'').trim().replace(/\s+/g,' ').slice(0,200);
      if(q.length<3)throw Error('Informe pelo menos três caracteres para consultar a fonte.');
      const task=queue.catch(()=>{}).then(async()=>{
        checkAbort(signal);
        const cached=cache.get(q.toLocaleLowerCase());
        if(cached&&now()-cached.at<600000)return structuredClone(cached.rows);
        const wait=1100-(now()-lastRequest);
        if(wait>0)await sleep(wait,signal);
        checkAbort(signal);lastRequest=now();
        const data=await transport(q,{signal,userAgent:'GoldenMusicMemories/2.1 (https://github.com/RicardoHussen2026/golden-music-memories)'});
        checkAbort(signal);
        if(!Array.isArray(data?.recordings))throw Error('A fonte não retornou uma lista válida de gravações.');
        const rows=data.recordings.slice(0,25).map(r=>normalizeMusicBrainzRecording(r,new Date(now()).toISOString()));
        cache.set(q.toLocaleLowerCase(),{at:now(),rows});
        return structuredClone(rows);
      });
      queue=task.catch(()=>{});return task;
    },
  };
}
