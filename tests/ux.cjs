const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.cache/qa-ux');
const base=(process.env.GMM_BASE_URL||'http://127.0.0.1:8765').replace(/\/$/,'');
fs.mkdirSync(out,{recursive:true});
const results=[],errors=[];let browser,context,page;
const check=(name,ok,details='')=>{assert.ok(ok,name+' '+details);results.push({name,result:'PASSOU',details});console.log('OK',name);};
const action=name=>page.locator(`[data-action="${name}"]`).first();
const rows=()=>page.locator('#main tbody tr, #main .song-card, #main .song-row');
const store=name=>page.evaluate(async name=>(await import('./app/db.js')).all(name).then(rows=>rows.map(({blob,...meta})=>meta)),name);
async function waitForStore(name,predicate){for(let i=0;i<120;i++){const rows=await store(name);if(predicate(rows))return rows;await page.waitForTimeout(100);}throw Error('Persistência não observada em '+name);}
async function query(text){await page.locator('#catalog-search').fill(text);await page.waitForTimeout(450);}
async function navigate(view){const button=page.locator(`nav [data-view="${view}"]`).first();if(await button.isVisible())await button.click();else{await page.evaluate(v=>{location.hash=v;},view);}await page.waitForFunction(v=>location.hash==='#'+v,view);await page.waitForTimeout(180);}
async function savePublication(platform,title){await page.locator(`[data-action="edit-publication"][data-platform="${platform}"]`).click();await page.locator('#pubTitle').fill(title);await page.locator('#publication-form button[type="submit"]').click();await page.waitForFunction(()=>!document.querySelector('#dialog').open);}

(async()=>{try{
 browser=await chromium.launch({channel:process.env.GMM_BROWSER_CHANNEL||(process.platform==='win32'?'chrome':undefined),headless:true});
 context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
 // Nenhuma consulta externa ou conta real é necessária para esta suíte.
 await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(base+'/painel.html#catalog');await page.waitForSelector('#catalog-search');
 check('Pesquisa universal com instrução clara',(await page.locator('#catalog-search').getAttribute('placeholder'))==='Pesquisar música, artista, ano, álbum ou gênero...');
 check('Lista compacta é padrão',await page.locator('#main .result-row').count()>0);
 check('Campos com identificadores únicos',await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return new Set(ids).size===ids.length;}));
 await query('a-ha 1985');check('Combinação artista e ano recupera resultados',await rows().count()>0);
 check('Ano solicitado respeitado',(await rows().allTextContents()).every(t=>t.includes('1985')));
 await query('Take On Me a-ha');check('Título e artista fora da concatenação recuperam música',(await rows().first().innerText()).includes('Take On Me'));
 await query('Take On Me a-ha 1985');check('Título artista e ano combinados',await rows().count()>0);
 await query('Tkae On Me aha');check('Pequeno erro de digitação é tolerado',(await rows().first().innerText()).includes('Take On Me'));
 await query('qzxwvplmkj inexistente');check('Consulta sem correspondência não inventa resultados',await rows().count()===0);
 await query('  TAKE   ON ME  a-ha ');check('Caixa e espaços normalizados',await rows().count()>0);
 await page.locator('#decade-filter').selectOption('1980');await page.waitForTimeout(250);
 check('Busca e década podem ser combinadas',(await rows().allTextContents()).every(t=>/198\d/.test(t))&&await rows().count()>0);
 check('Filtros avançados recolhidos inicialmente',!(await page.locator('#advanced-filters').evaluate(el=>el.open)));
 await page.locator('#advanced-filters summary').click();await page.waitForTimeout(100);await page.locator('#filter-year').fill('1985');await page.locator('#filter-year').dispatchEvent('change');await page.waitForTimeout(350);
 check('Ano específico combina com busca e década',await rows().count()>0&&(await rows().allTextContents()).every(text=>text.includes('1985')));
 check('Alterar filtro mantém painel aberto',await page.locator('#advanced-filters').evaluate(el=>el.open));
 await page.locator('#advanced-filters summary').click();await page.waitForTimeout(100);check('Filtros ativos funcionam com painel recolhido',!(await page.locator('#advanced-filters').evaluate(el=>el.open))&&await rows().count()>0);
 const beforeQuery=await page.locator('#catalog-search').inputValue();await action('song-info').click();
 check('Diálogo possui nome acessível',await page.locator('#dialog').evaluate(el=>Boolean(el.getAttribute('aria-label')||document.getElementById(el.getAttribute('aria-labelledby'))?.textContent.trim())));
 await page.locator('#close-dialog').click();check('Detalhes preservam pesquisa e filtro',(await page.locator('#catalog-search').inputValue())===beforeQuery&&(await page.locator('#decade-filter').inputValue())==='1980');
 await action('clear-filters').click();await page.waitForTimeout(250);
 check('Limpeza única remove busca década e filtros avançados',(await page.locator('#catalog-search').inputValue())===''&&(await page.locator('#decade-filter').inputValue())===''&&(await page.locator('#filter-year').inputValue())==='');
 await query('Take On Me a-ha');const search=page.locator('#catalog-search');await search.focus();
 check('Sugestões nativas disponíveis',(await search.getAttribute('list'))==='search-suggestions'&&await page.locator('#search-suggestions option').count()>0);
 await search.press('Enter');await page.waitForTimeout(250);
 check('Enter registra pesquisa recente',(await store('settings')).some(row=>JSON.stringify(row).includes('Take On Me a-ha')));
 await action('song-info').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#dialog').open);
 check('Ficha acessível usando teclado',await page.locator('#dialog').innerText().then(text=>text.includes('Take On Me')));
 await page.keyboard.press('Escape');check('Escape fecha ficha',!(await page.locator('#dialog').evaluate(el=>el.open)));
 await query('Take On Me a-ha 1985');await action('start-song').click();await page.waitForSelector('#production-form');
 const productions=await waitForStore('productions',rows=>rows.length===1),pid=productions[0].id;
 const songs=await store('songs'),song=songs.find(s=>s.id===productions[0].songId);
 check('Seleção mantém identidade da música na produção',song.title.includes('Take On Me')&&song.artist.replace(/[^a-z]/gi,'').toLowerCase()==='aha');
 await action('cover-production').click();await page.waitForSelector('#cover-canvas');
 check('Capa recebe dados sem redigitação',(await page.locator('#cover-title').inputValue())===song.title&&(await page.locator('#cover-artist').inputValue())===song.artist);
 check('Modelo original e seis extensões preservados',await page.locator('.template-card').count()===7);
 await page.locator('[data-action="select-template"][data-id="premium-neon"]').click();await page.waitForFunction(()=>document.querySelector('#cover-style').value==='premium-neon');await page.locator('#cover-title').fill('Take On Me — teste de continuidade');
 await action('approve-cover').click();await waitForStore('assets',rows=>rows.some(a=>a.productionId===pid&&a.coverConfig?.style==='premium-neon'));
 await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('Capa aprovada e guardada'));
 await page.locator('[data-action="select-template"][data-id="premium-romance"]').click();await page.waitForFunction(()=>document.querySelector('#cover-style').value==='premium-romance');await page.locator('#cover-title').fill('Take On Me — segunda versão de continuidade');
 await action('approve-cover').click();const savedCovers=await waitForStore('assets',rows=>rows.filter(a=>a.productionId===pid&&a.coverConfig).length===2);
 check('Aprovar outra capa preserva a configuração anterior',savedCovers.some(a=>a.coverConfig?.style==='premium-neon')&&savedCovers.some(a=>a.coverConfig?.style==='premium-romance'));
 await navigate('production');await action('open-production').click();await action('cover-production').click();await page.waitForSelector('#cover-title');
 check('Retomar capa recupera a versão aprovada mais recente',(await page.locator('#cover-style').inputValue())==='premium-romance'&&(await page.locator('#cover-title').inputValue()).includes('segunda versão'));
 await navigate('production');await action('open-production').click();
 await savePublication('tiktok','Rascunho TikTok isolado');await savePublication('youtube','Rascunho YouTube isolado');
 await page.locator('[data-action="edit-publication"][data-platform="tiktok"]').click();
 check('Retomar publicação conserva texto anterior',(await page.locator('#pubTitle').inputValue())==='Rascunho TikTok isolado');
 await page.locator('#publication-form button[type="submit"]').click();await page.waitForFunction(()=>!document.querySelector('#dialog').open);
 const pubs=await waitForStore('publications',rows=>rows.length>=2);check('Rascunhos independentes sem duplicação ao retomar',pubs.length===2&&pubs.every(p=>p.status!=='published')&&new Set(pubs.map(p=>p.platform)).size===2);
 await navigate('catalog');await query('Take On Me a-ha');await page.locator('#toast').waitFor({state:'hidden',timeout:7000});await page.screenshot({path:path.join(out,'catalogo-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'catalogo-celular.png'),fullPage:true});
 check('Catálogo cabe na largura de celular',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 check('Pesquisa identificada para leitores de tela',Boolean(await page.locator('#catalog-search').getAttribute('aria-label')));
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.waitForSelector('#catalog-search');await query('a-ha 1985');
 check('Pesquisa e catálogo funcionam offline após carga',await rows().count()>0);
 check('Sem erro JavaScript não tratado',errors.length===0,JSON.stringify(errors));
}catch(error){results.push({name:'Fluxo UX',result:'FALHOU',details:error.stack});console.error(error.stack);process.exitCode=1;if(page){console.error('Mensagem do painel:',await page.locator('#toast').textContent().catch(()=>''));await page.screenshot({path:path.join(out,'falha.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(out,'assets-na-falha.json'),JSON.stringify(await store('assets').catch(()=>[]),null,2));}
}finally{fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify({testedAt:new Date().toISOString(),environment:'Playwright · banco e contextos isolados · sem contas externas',results,errors},null,2));await browser?.close();}})();
