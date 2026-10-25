const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.cache/qa-post-audit');
const base=(process.env.GMM_BASE_URL||'http://127.0.0.1:8765').replace(/\/$/,'');
fs.mkdirSync(out,{recursive:true});
const results=[],errors=[];let browser,context,page;
const check=(name,ok,details='')=>{assert.ok(ok,name+' '+details);results.push({name,result:'PASSOU',details});console.log('OK',name);};
const action=name=>page.locator(`[data-action="${name}"]`).first();
const store=name=>page.evaluate(async name=>(await import('./app/db.js')).all(name).then(rows=>rows.map(({blob,...meta})=>meta)),name);
async function goProduction(id){await page.evaluate(id=>{location.hash='production/'+id;},id);await page.locator(`[data-action="cover-production"][data-id="${id}"]`).waitFor();}
async function openCover(id){await goProduction(id);await action('cover-production').click();await page.waitForSelector('#cover-title');}
async function saveDraft(text,pid){await page.locator('#cover-title').fill(text);await page.waitForFunction(async ({text,pid})=>{const db=await import('./app/db.js');return (await db.all('settings')).some(s=>s.id==='coverDraft:'+pid&&s.config?.title===text);},{text,pid});}

(async()=>{try{
 browser=await chromium.launch({channel:process.env.GMM_BROWSER_CHANNEL||(process.platform==='win32'?'chrome':undefined),headless:true});
 context=await browser.newContext({viewport:{width:1440,height:1000}});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(base+'/painel.html#catalog');await page.waitForSelector('.song-card');
 const visibleIds=await page.locator('[data-action="start-song"]').evaluateAll(buttons=>buttons.map(b=>b.dataset.id));
 const ids=[visibleIds[0],visibleIds[10]],pids=[];
 for(const id of ids){await page.evaluate(()=>{location.hash='catalog';});await page.waitForSelector('#catalog-search');await page.locator(`[data-action="start-song"][data-id="${id}"]`).click();await page.waitForSelector('#production-form');pids.push(page.url().split('/').at(-1));}
 await openCover(pids[0]);await saveDraft('RASCUNHO LOCAL A RECUPERAR',pids[0]);
 await openCover(pids[1]);await saveDraft('RASCUNHO INDEPENDENTE B',pids[1]);
 await openCover(pids[0]);check('Retomar produção conserva rascunho não aprovado',(await page.locator('#cover-title').inputValue())==='RASCUNHO LOCAL A RECUPERAR');
 await openCover(pids[1]);check('Alternar produções conserva os dois rascunhos',(await page.locator('#cover-title').inputValue())==='RASCUNHO INDEPENDENTE B');
 await page.reload();await page.waitForSelector('#cover-title');check('Recarregar conserva rascunho atual',(await page.locator('#cover-title').inputValue())==='RASCUNHO INDEPENDENTE B');
 await page.locator('#cover-production').selectOption(pids[0]);await page.waitForFunction(()=>document.querySelector('#cover-title').value==='RASCUNHO LOCAL A RECUPERAR');
 check('Trocar associação recupera rascunho da produção escolhida',(await page.locator('#cover-title').inputValue())==='RASCUNHO LOCAL A RECUPERAR');
 await page.locator('#cover-title').fill('RASCUNHO A ANTES DE SAIR');await page.locator('nav [data-view="production"]').click();await openCover(pids[0]);
 check('Navegar antes do temporizador preserva a edição',(await page.locator('#cover-title').inputValue())==='RASCUNHO A ANTES DE SAIR');
 check('Editar rascunho não aprova nem cria mídia',(await store('assets')).length===0);
 await goProduction(pids[0]);
 await page.evaluate(async pid=>{const db=await import('./app/db.js');const old=(await db.all('settings')).find(s=>s.id==='coverDraft:'+pid);await db.batch([{store:'settings',delete:true,id:'coverDraft:'+pid},{store:'settings',value:{...old,id:'coverDraft',productionId:pid,config:{...old.config,title:'RASCUNHO LEGADO COMPATÍVEL'}}}]);},pids[0]);
 await page.reload();await page.waitForSelector('#production-form');
 await openCover(pids[0]);check('Rascunho legado é recuperado sem migração destrutiva',(await page.locator('#cover-title').inputValue())==='RASCUNHO LEGADO COMPATÍVEL');

 await page.evaluate(async pid=>{const db=await import('./app/db.js');const p=(await db.all('productions')).find(p=>p.id===pid);p.status=7;await db.put('productions',p);await db.put('publications',{id:'fixture-post-audit-publication',productionId:pid,platform:'youtube',status:'published',title:'Registro isolado de auditoria',historical:true});},pids[0]);
 await page.locator('nav [data-view="catalog"]').click();await action('clear-filters').click();await page.locator('#repertoire-filter').selectOption('archived');await page.waitForTimeout(200);
 check('Filtro arquivada inclui produção também publicada',await page.locator(`[data-action="open-production"][data-id="${pids[0]}"]`).count()===1);
 await page.locator('#repertoire-filter').selectOption('published');await page.waitForTimeout(200);check('Filtro publicada preserva produção arquivada',await page.locator(`[data-action="open-production"][data-id="${pids[0]}"]`).count()===1);
 await action('clear-filters').click();await page.locator('#catalog-search').fill('Take On Me a-ha');await page.waitForTimeout(350);
 for(const width of [360,390]){await page.setViewportSize({width,height:844});await page.evaluate(()=>scrollTo(0,0));const view=await page.evaluate(()=>{const bar=document.querySelector('.toolbar').getBoundingClientRect();const overlaps=[...document.querySelectorAll('.result-row .actions button')].filter(el=>{const b=el.getBoundingClientRect();return b.right>bar.left&&b.left<bar.right&&b.bottom>bar.top&&b.top<bar.bottom;}).length;return {overlaps,overflow:document.documentElement.scrollWidth>innerWidth};});check(`Paginação não cobre ações em ${width}px`,view.overlaps===0,JSON.stringify(view));check(`Sem transbordamento horizontal em ${width}px`,!view.overflow);await page.screenshot({path:path.join(out,`catalogo-${width}.png`),fullPage:true});}

 const backupChecks=await page.evaluate(async pids=>{
   const db=await import('./app/db.js'),backup=await import('./app/backup.js');
   const ps=await db.all('productions'),p=ps.find(p=>p.id===pids[0]),other=ps.find(p=>p.id===pids[1]);
   const blob=await (await fetch('tests/fixtures/youtube-teste.mp4')).blob(),hash=await db.digest(blob);
   const asset={id:'fixture-post-audit-asset',productionId:p.id,songId:p.songId,role:'youtube',type:'video/mp4',name:'fixture-auditoria.mp4',hash,blob,size:blob.size,version:1,createdAt:db.now(),rights:'pending'};
   await db.put('assets',asset);const pub=(await db.all('publications')).find(p=>p.id==='fixture-post-audit-publication');pub.finalAssetId=asset.id;await db.put('publications',pub);
   const result=await backup.exportBackup(),valid=await backup.readBackup(result.blob),answers=[{name:'Backup válido mantém mídia e hash coerentes',ok:valid.tables.assets[0].hash===hash}];
   async function rejects(name,mutate){const zip=await JSZip.loadAsync(result.blob);const manifest=JSON.parse(await zip.file('manifest.json').async('string'));mutate(manifest);zip.file('manifest.json',JSON.stringify(manifest));try{await backup.readBackup(await zip.generateAsync({type:'blob'}));answers.push({name,ok:false});}catch(error){answers.push({name,ok:true,reason:error.message});}}
   await rejects('Backup recusa hash de metadados divergente dos bytes',m=>{m.tables.assets[0].hash='0'.repeat(64);});
   await rejects('Backup recusa mídia ligada à música de outra produção',m=>{m.tables.assets[0].songId=other.songId;});
   await rejects('Backup recusa vídeo final da plataforma incorreta',m=>{m.tables.publications[0].platform='tiktok';});
   await rejects('Backup recusa publicação vinculada a arquivo de outra produção',m=>{m.tables.publications[0].productionId=other.id;});
   const after=await db.all('assets');answers.push({name:'Recusas preservam banco local existente',ok:after.length===1&&after[0].hash===hash&&(await db.all('productions')).length===2});
   return answers;
 },pids);for(const c of backupChecks)check(c.name,c.ok,c.reason||'');

 const importedContext=await browser.newContext(),importPage=await importedContext.newPage();await importPage.goto(base+'/00_comece_aqui.html');
 const fixture=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/recording-versions.json'),'utf8'))[0];
 const timestamps=await importPage.evaluate(async song=>{const db=await import('./app/db.js');const before=Date.now();await db.importSongs([song]);const first=(await db.all('songs'))[0];await db.importSongs([song]);const second=(await db.all('songs'))[0];return {before,after:Date.now(),first:first.createdAt,second:second.createdAt,count:(await db.all('songs')).length};},fixture);
 check('Nova importação registra data de inclusão',Number.isFinite(Date.parse(timestamps.first))&&Date.parse(timestamps.first)>=timestamps.before&&Date.parse(timestamps.first)<=timestamps.after);
 check('Importação duplicada não altera data de inclusão',timestamps.count===1&&timestamps.first===timestamps.second);
 await importedContext.close();check('Sem erro JavaScript nos fluxos corrigidos',errors.length===0,JSON.stringify(errors));
}catch(error){results.push({name:'Falha na auditoria posterior',result:'FALHOU',details:error.stack});console.error(error.stack);process.exitCode=1;if(page)await page.screenshot({path:path.join(out,'falha.png'),fullPage:true}).catch(()=>{});
}finally{fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify({testedAt:new Date().toISOString(),environment:'Chrome headless · bancos isolados · sem publicação real',results,errors},null,2));await browser?.close();}})();
