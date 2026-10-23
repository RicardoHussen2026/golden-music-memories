const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
let count=0;
function check(label,fn){fn();count++;console.log('OK',label);}
(async()=>{
 const {filteredCatalog}=await import(pathToFileURL(path.join(root,'app/catalog.js')));
 const {createSearchIndex,searchSongs}=await import(pathToFileURL(path.join(root,'app/search.js')));
 const {normalizeMusicBrainzRecording}=await import(pathToFileURL(path.join(root,'app/metadata.js')));
 const {canonicalKey}=await import(pathToFileURL(path.join(root,'app/db.js')));
 const reference=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/recording-versions.json'),'utf8'))[0];
 // Somente fixtures descartáveis: nomes complementares abaixo não são dados de catálogo publicados.
 const source=normalizeMusicBrainzRecording({id:reference.sourceId,title:reference.title,'artist-credit':[{name:reference.artist}],'first-release-date':String(reference.year),releases:[{title:'Álbum da fixture'},{title:'Segunda coletânea da fixture'}],disambiguation:'Identificador de versão da fixture'});
 function make(songs=[source],productions=[],assets=[],publications=[]){
  const canonIndex=new Map();
  for(const p of productions){const song=songs.find(s=>s.id===p.songId),key=canonicalKey(song);canonIndex.set(key,[...(canonIndex.get(key)||[]),p]);}
  const state={songs,searchIndex:createSearchIndex(songs),search:'',canonIndex,reservations:[],filters:{},sort:'relevance'};
  const helpers={canonicalKey,usageOf:()=> 'available',assetsOf:id=>assets.filter(a=>a.productionId===id),pubsOf:id=>publications.filter(p=>p.productionId===id)};
  return {state,helpers,run:()=>filteredCatalog(state,helpers)};
 }
 check('Álbuns da resposta normalizada têm mesma cobertura em busca e filtro',()=>{
  const t=make();t.state.search='album da fixture';assert.equal(searchSongs(t.state.searchIndex,t.state.search).length,1);
  t.state.filters.album='ALBUM DA FIXTURE';assert.equal(t.run().length,1);
  t.state.search='';t.state.filters.album='Segunda coletânea';assert.equal(t.run().length,1);
 });
 check('Álbum singular não esconde listas ou títulos de lançamento',()=>{
  const t=make([{...source,album:'Primeiro',albums:[{title:'Segundo'}],releaseTitles:[{name:'Terceiro'}],release:'Legado'}]);
  for(const q of ['Primeiro','Segundo','Terceiro','Legado']){t.state.filters.album=q;assert.equal(t.run().length,1,q);}
 });
 check('Objetos desconhecidos não viram metadados object Object',()=>{
  const t=make([{...source,albums:[{unknown:'Objeto'}],album:null,releaseTitles:[]}]);
  for(const q of ['object','Objeto']){t.state.filters.album=q;assert.equal(t.run().length,0);}
 });
 check('Versão nomeada não esconde versão no título ou campos complementares',()=>{
  const t=make([{...source,title:'Música de teste (extended version)',versionName:'Acústica',version:[{name:'Rádio edit'}],disambiguation:'Ao vivo'}]);
  for(const q of ['extended','acustica','radio edit','ao vivo']){t.state.filters.version=q;assert.equal(t.run().length,1,q);}
 });
 check('Artistas alternativos e gêneros importados em listas são filtráveis',()=>{
  const t=make([{...source,artistAliases:[{name:'Nome alternativo'}],alternativeNames:['Outra grafia'],genres:[{name:'Balada'}]}]);
  t.state.filters={artist:'Nome alternativo',genre:'balada'};assert.equal(t.run().length,1);
  t.state.filters.artist='Outra grafia';assert.equal(t.run().length,1);
  t.state.filters.genre='Jazz';assert.equal(t.run().length,0);
 });
 const p={id:'production',songId:source.id,status:7},video={id:'video',productionId:p.id,role:'youtube'},pub={id:'pub',productionId:p.id,status:'published',platform:'youtube'};
 check('Arquivada publicada e produzida aparece em cada filtro independente',()=>{
  const t=make([source],[p],[video],[pub]);t.helpers.usageOf=()=> 'published';
  for(const status of ['archived','published','produced']){t.state.repertoire=status;assert.equal(t.run().length,1,status);}
  t.state.repertoire='archived';t.state.filters.platform='youtube';assert.equal(t.run().length,1);
  t.state.filters.platform='tiktok';assert.equal(t.run().length,0);
 });
 check('Versão anterior publicada não esconde outra em preparação',()=>{
  const t=make([source],[p,{id:'new',songId:source.id,status:2}],[video],[pub]);t.helpers.usageOf=()=> 'published';
  t.state.repertoire='inproduction';assert.equal(t.run().length,1);
  t.state.repertoire='archived';assert.equal(t.run().length,1);
 });
 check('Versões canceladas não contam como arquivadas ou em produção',()=>{
  const t=make([source],[{...p,cancelled:true}],[],[]);
  for(const status of ['archived','published','produced','inproduction']){t.state.repertoire=status;assert.equal(t.run().length,0,status);}
 });
 check('Produzida sem arquivo histórico continua válida sem fingir mídia',()=>{
  const t=make([source],[{...p,status:4,historical:true}],[],[]);t.state.repertoire='produced';assert.equal(t.run().length,1);
  t.state.filters.asset='final';assert.equal(t.run().length,0);
 });
 check('Reserva e filtro nunca utilizadas mantêm antirrepetição',()=>{
  const t=make();t.state.reservations=[{id:canonicalKey(source),songId:source.id,status:'reserved'}];
  t.state.repertoire='reserved';assert.equal(t.run().length,1);
  t.state.repertoire='';t.state.unused=true;assert.equal(t.run().length,0);
  t.state.reservations[0].status='cancelled';assert.equal(t.run().length,1);
 });
 check('Data de inclusão ordena datas reais e deixa desconhecidas ao final',()=>{
  const songs=[{...source,id:'old',createdAt:'2026-10-22T10:00:00Z'},{...source,id:'unknown',title:'A desconhecida',createdAt:undefined,updatedAt:'2026-10-24T10:00:00Z'},{...source,id:'new',createdAt:'2026-10-23T10:00:00Z'},{...source,id:'invalid',title:'Z inválida',createdAt:'inválida'}];
  const before=JSON.stringify(songs),t=make(songs);t.state.sort='added';assert.deepEqual(t.run().map(s=>s.id),['new','old','unknown','invalid']);assert.equal(JSON.stringify(songs),before);
 });
 check('Empates de inclusão têm desempate estável independente da entrada',()=>{
  const songs=[{...source,id:'b',title:'Mesmo título',artist:'Mesmo artista'},{...source,id:'a',title:'Mesmo título',artist:'Mesmo artista'}];
  const a=make(songs),b=make([...songs].reverse());a.state.sort=b.state.sort='added';
  assert.deepEqual(a.run().map(s=>s.id),['a','b']);assert.deepEqual(a.run().map(s=>s.id),b.run().map(s=>s.id));
 });
 console.log(`${count} verificações de catálogo aprovadas; fixtures isoladas, sem rede e sem gravar no banco.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
