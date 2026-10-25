// Índice derivado: não altera metadados, IDs nem a identidade antirrepetição.
export function normalizeSearch(value) {
  return String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ').replace(/\ba ha\b/g,'aha');
}

const listText = value => (Array.isArray(value) ? value : [value])
  .map(v => typeof v === 'string' ? v : v?.name || v?.title || '').filter(Boolean);
const collator = new Intl.Collator('pt-BR', {sensitivity:'base', numeric:true});
const genres = {
  romantica:['romantica','romanticas','romantic','romantico','romanticos','balada','baladas','ballad','ballads'],
  eletronica:['eletronica','electronica','electronic'],
  classica:['classica','classico','classical'],
  dancante:['dancante','dance'],
};
const genreAliases = new Map(Object.values(genres).flatMap(group => group.map(word => [word, group])));
const knownGenreWords=new Set(['rock','pop','disco','jazz','funk','soul','country','reggae','synthwave','synthpop','blues','metal','punk','rap','hip','hop',...genreAliases.keys()]);

function field(values, weight, kind) {
  const phrases = [...new Set(listText(values).map(normalizeSearch).filter(Boolean))];
  return {phrases, words:[...new Set(phrases.flatMap(p=>p.split(' ')))], weight, kind};
}

export function createSearchIndex(songs) {
  return songs.map(song => {
    const artist = normalizeSearch(song.artist), title = normalizeSearch(song.title);
    const fields = [
      field(song.title,120,'title'), field(song.artist,105,'artist'),
      field([...listText(song.titleAliases),...listText(song.aliases)],85,'alias'),
      field([...listText(song.artistAliases),...listText(song.alternativeNames)],85,'alias'),
      field([...listText(song.album),...listText(song.albums),...listText(song.releaseTitles)],60,'album'),
      field([...listText(song.versionName),...listText(song.version),...listText(song.disambiguation)],50,'version'),
      field([...listText(song.genre),...listText(song.genres)],40,'genre'),
      // Aceita a-ha / a‐ha / a ha / aha sem fundir a identidade armazenada.
      field(artist.replaceAll(' ',''),75,'compactArtist'),
    ];
    return {song, fields, title, artist, year:Number(song.year), decade:Math.floor(Number(song.year)/10)*10};
  });
}

export function parseSearchQuery(query) {
  let text = normalizeSearch(query), decades=[];
  const decadeNumber = n => n === '00' || n === '2000' ? 2000 : Number(n)<100 ? 1900+Number(n) : Number(n);
  text = text.replace(/\b(?:anos|decada(?: de)?)\s*(1960|1970|1980|1990|2000|60|70|80|90|00)\b/g, (_,n) => {decades.push(decadeNumber(n));return ' ';});
  text = text.replace(/\b(1960|1970|1980|1990|2000|60|70|80|90|00)s\b/g, (_,n) => {decades.push(decadeNumber(n));return ' ';});
  const words=text.trim().split(/\s+/).filter(Boolean), years=words.filter(w=>/^(19|20)\d{2}$/.test(w)).map(Number);
  return {text:normalizeSearch(text), words:[...new Set(words.filter(w=>!/^(19|20)\d{2}$/.test(w)))],years:[...new Set(years)],decades:[...new Set(decades)]};
}

// Uma edição ou transposição adjacente. Sem aproximar anos ou termos curtos.
function oneEdit(a,b) {
  if(a===b)return true;
  if(Math.abs(a.length-b.length)>1)return false;
  let i=0;while(i<a.length&&a[i]===b[i])i++;
  if(a.length===b.length) return a.slice(i+1)===b.slice(i+1) ||
    (a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2));
  return a.length>b.length ? a.slice(i+1)===b.slice(i) : a.slice(i)===b.slice(i+1);
}

function exactWordScore(entry, token, genreOnly=false) {
  let best=0;
  for(const f of entry.fields) {
    if(genreOnly&&f.kind!=='genre')continue;
    if(f.words.includes(token))best=Math.max(best,f.weight);
    else if(token.length>=2&&f.words.some(w=>w.startsWith(token)))best=Math.max(best,f.weight*.7);
    else if(token.length>=4&&f.phrases.some(p=>p.includes(token)))best=Math.max(best,f.weight*.4);
    if(f.kind==='genre'&&genreAliases.has(token)&&f.words.some(w=>genreAliases.get(token).includes(w)))best=Math.max(best,f.weight);
  }
  return best;
}

export function searchSongs(index, query, {limit=Infinity, fuzzy=true}={}) {
  const parsed=parseSearchQuery(query), results=[];
  const genreOnly=(parsed.years.length||parsed.decades.length)&&parsed.words.length&&parsed.words.every(w=>knownGenreWords.has(w));
  if(!parsed.words.length&&!parsed.years.length&&!parsed.decades.length)
    return index.slice(0,limit).map(e=>({song:e.song,score:0,approximate:false}));
  for(const entry of index) {
    if(parsed.years.some(y=>entry.year!==y)||parsed.decades.some(d=>entry.decade!==d))continue;
    let score=0, approximate=false, misses=[];
    for(const token of parsed.words) {
      const hit=exactWordScore(entry,token,genreOnly);
      if(hit)score+=hit;else misses.push(token);
    }
    if(misses.length) {
      if(!fuzzy||genreOnly||misses.length>1)continue;
      const token=misses[0];
      if(token.length<4||/\d/.test(token))continue;
      // Uma palavra de quatro letras exige outra pista; cinco ou mais podem ser pesquisadas sozinhas.
      if(token.length===4&&parsed.words.length<2)continue;
      const candidates=entry.fields.filter(f=>['title','artist','alias'].includes(f.kind));
      if(!candidates.some(f=>f.words.some(w=>w.length>=4&&oneEdit(token,w))))continue;
      approximate=true;score+=20;
    }
    if(entry.title===parsed.text)score+=300;
    else if(parsed.text&&entry.title.startsWith(parsed.text))score+=150;
    if(entry.artist===parsed.text||entry.artist.replaceAll(' ','')===parsed.text.replaceAll(' ',''))score+=230;
    if(parsed.text===`${entry.title} ${entry.artist}`||parsed.text===`${entry.artist} ${entry.title}`)score+=250;
    if(approximate)score*=.55;
    results.push({song:entry.song,score,approximate});
  }
  results.sort((a,b)=>Number(a.approximate)-Number(b.approximate)||b.score-a.score||
    collator.compare(a.song.title,b.song.title)||collator.compare(a.song.artist,b.song.artist)||Number(a.song.year)-Number(b.song.year));
  return results.slice(0,limit);
}

export function suggestSongs(index, query, limit=6) {
  return normalizeSearch(query).length>=2 ? searchSongs(index,query,{limit}) : [];
}
