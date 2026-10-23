const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),results=[];
let browser,page;
const check=(name,ok)=>{assert(ok,name);results.push(name);console.log('OK '+name);};
const pub=async id=>page.evaluate(async id=>(await (await import('./app/db.js')).all('publications')).find(p=>p.id===id),id);
const action=(name,id)=>page.locator(`[data-action="${name}"][data-id="${id}"]`);
async function openDelivery(){await page.locator('.delivery-panel').evaluate(el=>el.open=true);}
async function run(id,scenario){await openDelivery();await action('simulate-delivery',id).click();await page.locator('#simulation-scenario').selectOption(scenario);await page.locator('#run-simulation').click();await page.waitForFunction(()=>!document.querySelector('#dialog').open);}
(async()=>{try{
 browser=await chromium.launch({headless:true,channel:process.env.GMM_BROWSER_CHANNEL||(process.platform==='win32'?'chrome':undefined)});
 const context=await browser.newContext({viewport:{width:1366,height:900}});page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.GMM_BASE_URL||'http://127.0.0.1:8765')+'/painel.html');await page.waitForFunction(()=>document.querySelector('#store-status').textContent.includes('Salvo'));
 await page.evaluate(async base64=>{
  const db=await import('./app/db.js'),song=(await db.all('songs'))[0],blob=new Blob([Uint8Array.from(atob(base64),c=>c.charCodeAt(0))],{type:'video/mp4'}),hash=await db.digest(blob),at=db.now();
  const production={id:'ui-prod',songId:song.id,version:1,status:5,createdAt:at,notes:'Fixture isolada',rights:{recording:'confirmed',composition:'confirmed',visual:'confirmed',youtube:'confirmed',tiktok:'confirmed',commercial:'confirmed'},approval:{at,files:[{id:'ui-final-yt',hash},{id:'ui-final-tt',hash}]}};
  const assets=['youtube','tiktok'].map(platform=>({id:'ui-final-'+(platform==='youtube'?'yt':'tt'),productionId:production.id,songId:song.id,role:platform,type:'video/mp4',name:'teste.mp4',originalName:'teste.mp4',blob,hash,size:blob.size,rights:'confirmed',version:1,createdAt:at}));
  const publications=['youtube','tiktok'].map(platform=>({id:'ui-pub-'+platform,productionId:production.id,platform,title:platform+' · teste',description:'Texto original de teste',hashtags:'#Teste',status:'draft',finalAssetId:assets.find(a=>a.role===platform).id,metrics:{views:7},createdAt:at}));
  await db.batch([{store:'productions',value:production},...assets.map(value=>({store:'assets',value})),...publications.map(value=>({store:'publications',value}))]);
 },fs.readFileSync(path.join(__dirname,'fixtures/youtube-teste.mp4')).toString('base64'));
 await page.goto((process.env.GMM_BASE_URL||'http://127.0.0.1:8765')+'/painel.html#publications');await page.waitForSelector('.delivery-panel');
 await action('edit-pub-id','ui-pub-youtube').click();await page.locator('.publication-options').evaluate(el=>el.open=true);await page.locator('#pubPrivacy').selectOption('unlisted');await page.locator('#pubCategory').fill('10');await page.locator('#pubTags').fill('nostalgia, anos 80');await page.locator('#pubSynthetic').check();await page.locator('#pubTitle').fill('Título editado da publicação');check('UI: vídeo final correto pode ser visualizado',await page.locator('#publication-video video').count()===1);await page.locator('#publication-form button[type="submit"]').click();await page.waitForFunction(()=>!document.querySelector('#dialog').open);
 await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('Registro salvo.'));let p=await pub('ui-pub-youtube');check('UI: metadados específicos salvos sem duplicar publicação',p.options.privacy==='unlisted'&&p.options.containsSyntheticMedia&&p.options.tags.length===2&&p.title==='Título editado da publicação');
 await openDelivery();await action('prepare-delivery',p.id).click();await page.waitForFunction(()=>document.querySelector('.delivery-panel').textContent.includes('Aguardando configuração'));p=await pub(p.id);check('UI: conferência sem conta permanece aguardando configuração',p.delivery.state==='awaiting_connection'&&p.status==='draft');
 await run(p.id,'network');p=await pub(p.id);check('UI: falha de conexão simulada persiste com possibilidade de repetir',p.delivery.state==='failed'&&p.delivery.error.retryable&&p.status==='draft');
 await page.reload();await page.waitForSelector('.delivery-panel');await run(p.id,'success');p=await pub(p.id);check('UI: repetir após recarga conclui mesma tarefa idempotente',p.delivery.state==='simulated_complete'&&p.delivery.attempts===2&&p.delivery.envelope.metadata.title==='Título editado da publicação'&&p.delivery.envelope.metadata.options.tags[0]==='nostalgia');
 check('UI: simulação conserva status, métricas e ausência de link real',p.status==='draft'&&p.metrics.views===7&&!p.url&&p.delivery.result.externalId===null);
 await run('ui-pub-tiktok','rejected');let tt=await pub('ui-pub-tiktok');check('UI: rejeição TikTok preserva sucesso YouTube',tt.delivery.state==='failed'&&!tt.delivery.error.retryable&&(await pub(p.id)).delivery.state==='simulated_complete');
 await action('cancel-delivery',tt.id).click();await page.waitForFunction(()=>document.querySelector('.delivery-panel').textContent.includes('Simulação cancelada'));tt=await pub(tt.id);check('UI: cancelamento preserva o registro manual',tt.delivery.state==='cancelled'&&tt.status==='draft'&&tt.metrics.views===7);
 await page.evaluate(async()=>{const db=await import('./app/db.js'),p=(await db.all('productions')).find(p=>p.id==='ui-prod');p.rights.tiktok='unauthorized';await db.put('productions',p);});await page.reload();await page.waitForSelector('.delivery-panel');await run(tt.id,'success');tt=await pub(tt.id);check('UI: direitos retirados bloqueiam nova simulação',tt.delivery.state==='awaiting_review'&&tt.delivery.issues.some(x=>x.includes('tiktok'))&&tt.status==='draft');
 check('UI: sem erros JavaScript',errors.length===0);console.log(JSON.stringify({checks:results.length,realPublications:false}));
 }catch(e){console.error(e);process.exitCode=1;}finally{await browser?.close();}
})();
