const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),results=[];
const check=(name,value)=>{assert(value,name);results.push({name,result:'PASSOU'});console.log('OK',name)};
(async()=>{let browser;try{
 browser=await chromium.launch({channel:process.env.GMM_BROWSER_CHANNEL||(process.platform==='win32'?'chrome':undefined),headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto((process.env.GMM_BASE_URL||'http://127.0.0.1:8765')+'/painel.html#covers');await page.waitForSelector('.template-card');
 check('Base oficial mais seis templates selecionáveis',await page.locator('.template-card').count()===7);
 const ids=await page.locator('.template-card').evaluateAll(els=>els.map(el=>el.dataset.id));
 const previews=[];
 for(const id of ids){
  await page.locator(`.template-card[data-id="${id}"]`).click();await page.waitForFunction(id=>document.querySelector('#cover-style').value===id,id);
  await page.locator('#cover-title').fill('Take On Me');await page.locator('#cover-artist').fill('a-ha');await page.locator('#cover-year').fill('1985');await page.waitForTimeout(550);
  const download=page.waitForEvent('download');await page.locator('[data-action="download-cover"]').click();const d=await download,artifact=path.join(root,'.cache/qa-templates',id+'.png');await d.saveAs(artifact);
  const bytes=fs.readFileSync(artifact);check('PNG editável exportado · '+id,bytes.readUInt32BE(16)===1080&&bytes.readUInt32BE(20)===1920&&bytes.length>100000);
  previews.push({id,name:await page.locator(`.template-card[data-id="${id}"] span`).textContent(),url:'data:image/png;base64,'+bytes.toString('base64')});
 }
 check('Composições geradas são distintas',new Set(previews.map(x=>x.url)).size===7);
 await page.reload();await page.waitForSelector('#cover-style');check('Template e textos recuperados após recarga',await page.locator('#cover-style').inputValue()==='premium-minimal'&&await page.locator('#cover-title').inputValue()==='Take On Me');
 await page.locator('#cover-title').fill('Uma música com um título bastante longo para testar a legibilidade');await page.waitForTimeout(400);
 const jpg=page.waitForEvent('download');await page.locator('[data-action="download-jpg"]').click();const j=await jpg;await j.saveAs(path.join(root,'.cache/qa-templates/long-title.jpg'));check('JPG com título longo',fs.readFileSync(path.join(root,'.cache/qa-templates/long-title.jpg'))[0]===255);
 await page.locator('nav [data-view="catalog"]').click();await page.locator('[data-action="start-song"]').first().click();await page.waitForSelector('#notes');await page.locator('[data-action="cover-production"]').click();await page.locator('.template-card[data-id="premium-romance"]').click();await page.waitForTimeout(300);await page.locator('[data-action="approve-cover"]').click();await page.waitForTimeout(500);
 check('Template aprovado preserva configuração e arquivo',await page.evaluate(async()=>{const db=await import('./app/db.js'),assets=await db.all('assets');return assets.some(a=>a.role==='cover'&&a.coverConfig?.style==='premium-romance'&&a.blob?.size>100000)}));
 await page.setViewportSize({width:390,height:844});check('Seletor de templates cabe no celular',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);await context.setOffline(true);await page.reload();await page.waitForSelector('.template-card');await page.locator('.template-card[data-id="premium-neon"]').click();await page.waitForTimeout(600);check('Novos fundos disponíveis offline',await page.evaluate(async()=>!!await caches.match('templates/neon.png')));await context.setOffline(false);
 check('Templates sem erros JavaScript',errors.length===0);
 const gallery=await context.newPage();await gallery.setViewportSize({width:1600,height:1050});await gallery.setContent('<body style="margin:0;background:#0b1519;color:#f8f0df;font-family:Arial;padding:30px"><h1 style="color:#edc283">Golden Music Memories</h1><p>Base oficial + seis templates editáveis · 1080 × 1920</p><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:16px">'+previews.map(p=>`<section><img style="width:100%;border-radius:12px" src="${p.url}"><p>${p.name}</p></section>`).join('')+'</div></body>');await gallery.screenshot({path:path.join(root,'docs/familia-templates.png'),fullPage:true});
 }catch(e){results.push({name:'Falha no teste de templates',result:'FALHOU',details:e.stack});console.error(e);process.exitCode=1;}finally{fs.writeFileSync(path.join(root,'docs/testes-templates.json'),JSON.stringify({testedAt:new Date().toISOString(),results},null,2));await browser?.close();}})();
