import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {HistoricalCovers} from '../server/runtime/historical-covers.mjs';
import {configuration} from '../server/runtime/config.mjs';
import {createApplication} from '../server/runtime/http.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
async function fixture(run){
 const directory=await mkdtemp(join(tmpdir(),'gmm-historical-')),images=join(directory,'covers','imagens');await mkdir(images,{recursive:true});
 const bytes=Buffer.from([255,216,255,218,1,2,3,255,217]),hash=sha(bytes),file=join(images,hash+'.jpg');await writeFile(file,bytes);
 const record={id:'confirmed-1',songId:'song-a',title:'Título',artist:'Artista',release:{title:'Álbum',date:'1979'},image:{path:'imagens/'+hash+'.jpg',sha256:hash,bytes:bytes.length,mime:'image/jpeg',width:600,height:600},association:{state:'recording_release_product_link_confirmed'},source:{productUrl:'https://example.org/product',conditionsUrl:'javascript:alert(1)'},publicationRights:'confirmed'};
 const packet={schema:1,kind:'local_historical_cover_reference',records:[record,{...record,id:'uncertain',songId:'song-b',association:{state:'needs_review'}}]},manifest=join(directory,'covers','indice.json');await writeFile(manifest,JSON.stringify(packet));
 try{await run({directory,file,bytes,hash,packet,manifest,covers:new HistoricalCovers(join(directory,'covers'))});}finally{assert.ok(resolve(directory).startsWith(resolve(tmpdir(),'gmm-historical-')));await rm(directory,{recursive:true,force:true});}
}
test('consulta usa ID exato e vínculo confirmado; não promove direitos ou associações incertas',()=>fixture(async({covers,hash})=>{
 const a=await covers.list('song-a');assert.equal(a.references.length,1);assert.equal(a.references[0].sha256,hash);assert.equal(a.references[0].publicationRights,'not_verified');assert.equal(a.references[0].conditionsUrl,'');assert.equal(a.readOnly,true);
 assert.equal((await covers.list('song-b')).references.length,0);assert.equal((await covers.list('Song-A')).references.length,0);assert.equal((await covers.list('other')).references.length,0);
}));
test('hash/tamanho são conferidos antes de servir; arquivo alterado não perde referência',()=>fixture(async({covers,file,bytes,hash})=>{
 assert.deepEqual(await covers.image(hash),bytes);await writeFile(file,Buffer.from('corrompido'));await assert.rejects(covers.image(hash),/manifesto/);const view=await covers.list('song-a');assert.equal(view.references.length,1);assert.equal(view.references[0].available,false);assert.equal(view.references[0].imagePath,null);
}));
test('caminho não pode ser fornecido pelo cliente ou escapar do manifesto',()=>fixture(async({covers,packet,manifest,hash})=>{
 await assert.rejects(covers.image('../indice.json'),/não encontrada/);await assert.rejects(covers.image('0'.repeat(64)),/não encontrada/);packet.records[0].image.path='../fora.jpg';await writeFile(manifest,JSON.stringify(packet));assert.equal((await covers.list('song-a')).references.length,0);await assert.rejects(covers.image(hash),/não encontrada/);
}));
test('índice ausente é vazio; inválido ou duplicado tem erro explícito',()=>fixture(async({covers,packet,manifest,directory})=>{
 assert.deepEqual(await new HistoricalCovers(join(directory,'ausente')).list('song-a'),{songId:'song-a',references:[],readOnly:true});packet.records.push({...packet.records[0]});await writeFile(manifest,JSON.stringify(packet));await assert.rejects(covers.list('song-a'),/repetidas/);await writeFile(manifest,'{');await assert.rejects(covers.list('song-a'),/inválido/);
}));
test('rotas são autenticadas, locais e somente leitura; imagens nunca são estáticas públicas',()=>fixture(async({directory,hash,bytes,manifest})=>{
 const config=configuration({GMM_PORT:'0',GMM_DATA_DIR:join(directory,'service'),GMM_LOCAL_ACCESS:'true'}),app=createApplication(config,{historicalCoversDirectory:join(directory,'covers')});const address=await app.listen();config.origin='http://127.0.0.1:'+address.port;const base=config.origin,endpoint='/api/historical-covers?songId=song-a',before=await readFile(manifest);
 try{
  assert.equal((await fetch(base+endpoint)).status,401);const login=await fetch(base+'/api/session/local',{method:'POST',headers:{Origin:base,'X-GMM-Request':'1','Content-Type':'application/json'},body:'{}'}),cookie=login.headers.get('set-cookie').split(';')[0],headers={Cookie:cookie};
  assert.equal((await fetch(base+endpoint,{headers:{...headers,'X-Forwarded-For':'127.0.0.1'}})).status,403);
  assert.equal((await fetch(base+endpoint,{method:'POST',headers:{...headers,Origin:base,'X-GMM-Request':'1'}})).status,405);
  const response=await fetch(base+endpoint,{headers}),data=await response.json();assert.equal(response.status,200);assert.equal(data.references.length,1);assert.equal(JSON.stringify(data).includes('imagens/'),false);
  const image=await fetch(base+data.references[0].imagePath,{headers});assert.equal(image.status,200);assert.equal(image.headers.get('cache-control'),'no-store');assert.deepEqual(Buffer.from(await image.arrayBuffer()),bytes);
  assert.equal((await fetch(base+'/acervo/capas-historicas/indice.json')).status,404);assert.equal((await fetch(base+'/api/historical-covers/images/'+hash)).status,401);
  assert.equal(app.store.list('production').length,0);assert.equal(app.store.list('media').length,0);assert.deepEqual(await readFile(manifest),before);
 }finally{await app.close();}
}));
