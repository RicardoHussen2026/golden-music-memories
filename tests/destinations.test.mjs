import test from 'node:test';import assert from 'node:assert/strict';
import {POST_DESTINATIONS,destinationIssues,destinationOf,renderCompatible,finalRoleAllowed} from '../app/destinations.js';
import {planVideo} from '../server/runtime/video-assembly.mjs';
import {generatePost} from '../app/editorial.js';
test('destinos separam plataforma/formato e preservam registros legados',()=>{
 assert.equal(destinationOf({platform:'youtube'}),'youtube');assert.equal(POST_DESTINATIONS.shorts.platform,'youtube');
 for(const [id,d]of Object.entries(POST_DESTINATIONS)){assert.ok(['youtube','tiktok','shorts'].includes(d.base));const p=planVideo({destination:d.base,requestedDestination:id,calls:[],coverSeconds:0},4);assert.equal(p.width>p.height,d.format==='16:9');}
 assert.ok(finalRoleAllowed('youtube','facebook'));assert.ok(!finalRoleAllowed('tiktok','youtube'));assert.ok(!finalRoleAllowed('youtube','desconhecido'));
});
test('Shorts e preset Instagram recusam excesso sem cortar, preservam duração e requerem formato explícito',()=>{
 for(const id of ['shorts','instagram']){const d=POST_DESTINATIONS[id];assert.throws(()=>planVideo({destination:d.base,requestedDestination:id,calls:[]},181),/não será cortada/);assert.equal(planVideo({destination:d.base,requestedDestination:id,calls:[]},180).duration,180);assert.ok(destinationIssues(id,{duration:181}).length);assert.ok(destinationIssues(id,{duration:30,width:1920,height:1080}).length);}
 assert.throws(()=>planVideo({destination:'shorts',calls:[]},181),/não será cortada/);
 assert.throws(()=>planVideo({destination:'youtube',requestedDestination:'instagram',calls:[]},10),/incompatíveis/);
 assert.ok(!renderCompatible({destination:'youtube'},'shorts'));assert.ok(renderCompatible({destination:'youtube'},'rumble'));assert.ok(renderCompatible({destination:'tiktok'},'instagram'));
});
test('modelos específicos e hashtag Shorts somente no formato Shorts',()=>{
 const song={title:'Música',artist:'Artista'};
 for(const id of ['facebook','instagram','rumble','odysee']){const p=generatePost({song,platform:id});assert.ok(p.title.includes('Música'));assert.ok(p.hashtags.includes('#Artista'));}
 assert.match(generatePost({song,platform:'rumble'}).description,/Rumble/);assert.match(generatePost({song,platform:'odysee'}).description,/Odysee/);
 assert.match(generatePost({song,platform:'youtube',destination:'shorts'}).hashtags,/#Shorts/);assert.doesNotMatch(generatePost({song,platform:'youtube'}).hashtags,/#Shorts/);
 assert.throws(()=>generatePost({song,platform:'youtubeMusic'}),/Escolha/);
});
