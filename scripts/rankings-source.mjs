import {createHash} from 'node:crypto';
export const hash=text=>createHash('sha256').update(text).digest('hex');
export function officialAnnual(html,url){
 const year=Number(/End of Year Singles Chart on \d{1,2}(?:&#x2F;|\/)\d{1,2}(?:&#x2F;|\/)(\d{4})/.exec(html)?.[1]);
 if(!Number.isInteger(year))throw Error('Ano do cabeçalho anual não identificado.');
 const raw=/<script[^>]+id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1];if(!raw)throw Error('JSON público SSR ausente.');const d=JSON.parse(raw);
 const rows=d.filter(v=>v&&typeof v==='object'&&!Array.isArray(v)&&'position'in v&&'title'in v&&'artist'in v&&'artistUrl'in v).map(v=>({position:Number(d[v.position]),title:d[v.title],artist:d[v.artist],singleUrl:new URL(d[v.url],url).href,releaseYear:null,recordingId:null})).filter(v=>v.position>=1&&v.position<=30).sort((a,b)=>a.position-b.position);
 if(rows.length!==30||rows.some((r,i)=>r.position!==i+1||typeof r.title!=='string'||!r.title.trim()||typeof r.artist!=='string'||!r.artist.trim()))throw Error('Top 30 incompleto, repetido ou estrutura inesperada.');
 const previous=/<a href="([^"]+)" class="btn chevron chevron-centre[^\"]*rotate-180[^\"]*"><span class="sr-only">Previous<\/span>/.exec(html)?.[1];
 return {year,rows,previous:previous?new URL(previous,url).href:null};
}
export function plain(html){return html.replace(/<[^>]*>/g,' ').replace(/&#(?:x([a-f\d]+)|(\d+));/gi,(_,hex,dec)=>String.fromCodePoint(parseInt(hex||dec,hex?16:10))).replace(/&(amp|apos|quot|nbsp|lt|gt);/g,(_,s)=>({amp:'&',apos:"'",quot:'"',nbsp:' ',lt:'<',gt:'>'}[s])).replace(/\s+/g,' ').trim();}
export function officialAllTime(html){
 const tables=[...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map(m=>m[0]);
 const table=tables.find(t=>/ARTIST/.test(plain(t))&&/TITLE/.test(plain(t))&&/YEAR/.test(plain(t)));if(!table)throw Error('Tabela de vendas históricas ausente.');
 const rows=[...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c=>plain(c[1]))).filter(c=>/^\d+$/.test(c[0]||'')).map(c=>({position:Number(c[0]),title:c[1],artist:c[2],releaseYear:null,chartEntryYear:Number(c[3]),recordingId:null,singleUrl:null})).filter(c=>c.position<=100);
 if(rows.length!==100||rows.some((r,i)=>r.position!==i+1||!r.title||!r.artist||!Number.isInteger(r.chartEntryYear)))throw Error('Top 100 histórico incompleto ou inesperado.');return rows;
}
export function officialAnnualArticle(html,year){
 const heading=plain(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]||'');
 if(!heading.includes(String(year))||!/best-selling/i.test(heading))throw Error('Cabeçalho da retrospectiva não corresponde ao ano.');
 const table=[...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map(m=>m[0]).find(t=>/\b(?:TITLE|SONG)\b/i.test(plain(t))&&/ARTIST/i.test(plain(t)));
 if(!table)throw Error('Tabela anual ausente.');
 const rows=[...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>[...m[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c=>plain(c[1]))).filter(c=>/^\d+$/.test(c[0]||'')).map(c=>({position:Number(c[0]),title:c[1],artist:c[2],releaseYear:null,recordingId:null,singleUrl:null})).filter(c=>c.position<=30);
 if(rows.length!==30||rows.some((r,i)=>r.position!==i+1||!r.title||!r.artist))throw Error('Retrospectiva Top 30 incompleta.');return rows;
}
