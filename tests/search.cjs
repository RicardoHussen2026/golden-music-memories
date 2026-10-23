const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
let count=0;
async function check(label,fn){await fn();count++;console.log(`OK ${label}`);}

(async()=>{
  const {createSearchIndex,searchSongs,suggestSongs,normalizeSearch}=await import(pathToFileURL(path.join(root,'app/search.js')));
  const {musicBrainzSearchURL,normalizeMusicBrainzRecording,createMetadataClient}=await import(pathToFileURL(path.join(root,'app/metadata.js')));
  const songs=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8')).songs;
  const realVersions=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/recording-versions.json'),'utf8'));
  const snapshot=JSON.stringify(songs),index=createSearchIndex(songs);
  const find=q=>searchSongs(index,q);
  await check('Todos os IDs e registros reais permanecem intactos',()=>{
    assert.equal(find('').length,songs.length);assert.equal(JSON.stringify(songs),snapshot);
    assert.equal(find('')[0].song,songs[0]);
  });
  await check('Título exato antes de versão estendida',()=>{
    const r=find('Take On Me');assert(r.length>0);assert.equal(normalizeSearch(r[0].song.title),'take on me');
    assert.equal(r[0].approximate,false);
  });
  await check('Pontuação, espaços e nomes a-ha/a‐ha/a ha/aha equivalentes',()=>{
    const ids=q=>find(q).map(x=>x.song.id).sort();
    for(const q of ['a-ha','a‐ha','a ha',' AHA '])assert.deepEqual(ids(q),ids('aha'));
    assert(find('aha').every(x=>normalizeSearch(x.song.artist)==='aha'));
    assert.deepEqual(ids('Take On Me'),ids('  TAKE   ON, ME! '));
  });
  await check('Combinações de artista, título e ano usam AND',()=>{
    const r=find('a-ha 1985');assert(r.length>0);
    assert(r.every(x=>x.song.year===1985&&normalizeSearch(x.song.artist)==='aha'));
    assert(find('Take On Me a-ha').every(x=>normalizeSearch(x.song.artist)==='aha'));
    const mj=find('Michael Jackson 1983');assert(mj.length);assert(mj.every(x=>x.song.year===1983&&x.song.artist==='Michael Jackson'));
  });
  await check('Anos 80 e formatos abreviados sem inferir data',()=>{
    for(const q of ['anos 80','anos80','80s','1980s','década de 80']) {
      const r=find(q);assert.equal(r.length,songs.filter(s=>s.year>=1980&&s.year<1990).length);
      assert(r.every(x=>x.song.year>=1980&&x.song.year<1990));
    }
    assert(find('anos 2000').every(x=>x.song.year>=2000&&x.song.year<=2009));
  });
  await check('Datas não têm aproximação nem conflitos silenciosos',()=>{
    assert(find('1985').every(x=>x.song.year===1985));assert.equal(find('1985 1986').length,0);
    assert.equal(find('1985 anos 90').length,0);assert.equal(find('Michael Jackson 1883').length,0);
  });
  await check('Transposição pequena identificada como aproximação',()=>{
    const r=find('Micheal Jackson');assert(r.length);assert(r.every(x=>x.approximate&&x.song.artist.includes('Michael Jackson')));
    const take=find('Tkae On Me');assert(take.length);assert(take.every(x=>x.approximate&&normalizeSearch(x.song.title).includes('take on me')));
  });
  await check('Não aproxima duas palavras erradas nem termo curto isolado',()=>{
    assert.equal(find('Micheal Jakcson').length,0);assert.equal(find('Tkae').length,0);
    assert.equal(searchSongs(index,'Micheal Jackson',{fuzzy:false}).length,0);
  });
  await check('Títulos parciais e sugestões limitadas',()=>{
    assert(find('Micha Jack').some(x=>x.song.artist==='Michael Jackson'));
    assert.equal(suggestSongs(index,'a').length,0);assert(suggestSongs(index,'Take',2).length<=2);
  });
  await check('Gênero ausente não vira classificação inventada',()=>{
    assert(songs.every(s=>!s.genre));assert.equal(find('Rock anos 80').length,0);assert.equal(find('Românticas anos 90').length,0);
  });
  // Fixtures abaixo são isoladas para exercitar campos opcionais; nunca são importadas no painel.
  const fixture=createSearchIndex([
    {id:'fixture-1',title:'Águas do Amanhã',artist:'Banda de Teste',year:1994,genre:'Balada',album:'Horizonte Azul',versionName:'acústica',artistAliases:['Grupo Exemplo']},
    {id:'fixture-2',title:'Rock na Janela',artist:'Nome de Teste',year:1985,genre:'Pop',album:'Exemplo'},
    {id:'fixture-3',title:'Canção de Teste',artist:'Outra Banda',year:1987,genre:'Rock',titleAliases:['Título Alternativo']},
    {id:'fixture-4',title:'夜曲',artist:'例子',year:2001,genre:''},
  ]);
  await check('Acentos, álbum, versão e alias apenas quando cadastrados',()=>{
    for(const q of ['aguas amanha','Horizonte Azul','acustica 1994','Grupo Exemplo','Românticas anos 90'])assert.equal(searchSongs(fixture,q)[0]?.song.id,'fixture-1');
    assert.equal(searchSongs(fixture,'Titulo Alternativo')[0]?.song.id,'fixture-3');
  });
  await check('Consulta de gênero com período não confunde palavra no título',()=>{
    assert.deepEqual(searchSongs(fixture,'Rock anos 80').map(x=>x.song.id),['fixture-3']);
    assert.deepEqual(searchSongs(fixture,'pop 1985').map(x=>x.song.id),['fixture-2']);
  });
  await check('Unicode não latino continua pesquisável',()=>assert.equal(searchSongs(fixture,'夜曲 例子')[0]?.song.id,'fixture-4'));
  await check('Gravações reais distintas continuam distintas',()=>{
    const r=searchSongs(createSearchIndex(realVersions),'Take On Me');assert.equal(r.length,2);assert.notEqual(r[0].song.sourceId,r[1].song.sourceId);
  });

  const raw=realVersions.map(v=>({id:v.sourceId,title:v.title,'artist-credit':[{name:v.artist}],'first-release-date':String(v.year)}));
  await check('Metadados conservam MBID, origem e data da gravação',()=>{
    const r=normalizeMusicBrainzRecording(raw[0],'2026-10-23');assert.equal(r.sourceId,realVersions[0].sourceId);
    assert.equal(r.year,realVersions[0].year);assert.equal(r.source,realVersions[0].source);assert.equal(r.rights,'pending');
    assert.equal(r.validation,'metadata_imported');assert.equal(r.importable,true);
  });
  await check('Não inventa ano a partir de relançamento nem usa tags suplementares',()=>{
    const r=normalizeMusicBrainzRecording({...raw[0],'first-release-date':undefined,releases:[{title:'Compilação de teste',date:'1985'}],tags:[{name:'rock'}]});
    assert.equal(r.year,null);assert.equal(r.importable,false);assert.equal(r.genre,'');assert.deepEqual(r.albums,['Compilação de teste']);
    const future=normalizeMusicBrainzRecording({...raw[0],'first-release-date':'2025'});assert.equal(future.importable,false);assert.equal(future.year,2025);
  });
  await check('Resposta incompleta e identificador inválido são recusados',()=>{
    assert.throws(()=>normalizeMusicBrainzRecording({...raw[0],id:'../bad'}));
    assert.throws(()=>normalizeMusicBrainzRecording({...raw[0],'artist-credit':[]}));
  });
  await check('Consulta manual mantém destino HTTPS fixo e codifica texto',()=>{
    const u=new URL(musicBrainzSearchURL('a-ha & "1985"'));assert.equal(u.origin,'https://musicbrainz.org');assert.equal(u.searchParams.get('query'),'a-ha & "1985"');
  });
  await check('Sem configuração e aprovação não há chamada externa',async()=>{
    let calls=0;const transport=async()=>{calls++;return {recordings:raw};};
    await assert.rejects(createMetadataClient({transport}).search('Take On Me'),/aguardando/);
    await assert.rejects(createMetadataClient({enabled:true,transport}).search('Take On Me'),/aguardando/);assert.equal(calls,0);
  });
  await check('Transporte simulado serial, intervalo e cache isolado',async()=>{
    let clock=0;const starts=[];
    const client=createMetadataClient({enabled:true,termsApproved:true,now:()=>clock,sleep:async ms=>{clock+=ms;},transport:async(q,opts)=>{
      starts.push(clock);assert.match(opts.userAgent,/GoldenMusicMemories/);return {recordings:raw};
    }});
    const [first]=await Promise.all([client.search('Take On Me'),client.search('a-ha 2001')]);
    assert(starts[1]-starts[0]>=1000);first[0].title='modificação isolada';
    assert.equal((await client.search('Take On Me'))[0].title,raw[0].title);assert.equal(starts.length,2);
  });
  await check('Cancelamento não chama transporte',async()=>{
    let calls=0;const controller=new AbortController();controller.abort();
    const client=createMetadataClient({enabled:true,termsApproved:true,transport:async()=>{calls++;return {recordings:raw};}});
    await assert.rejects(client.search('Take On Me',{signal:controller.signal}),{name:'AbortError'});assert.equal(calls,0);
  });
  await check('Falha não bloqueia consultas posteriores nem finge resultados',async()=>{
    let clock=0,calls=0;
    const client=createMetadataClient({enabled:true,termsApproved:true,now:()=>clock,sleep:async ms=>{clock+=ms;},transport:async()=>{
      calls++;if(calls===1)throw Error('Fonte indisponível');return {recordings:raw};
    }});
    await assert.rejects(client.search('Take On Me'),/indisponível/);assert.equal((await client.search('Take On Me')).length,2);
  });
  const started=performance.now();for(let i=0;i<20;i++)find(['Take On Me','Micheal Jackson','Rock anos 80','1985'][i%4]);
  console.log(`${count} verificações aprovadas; 20 pesquisas em ${Math.round(performance.now()-started)} ms sobre ${songs.length} registros. Nenhuma chamada de rede.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
