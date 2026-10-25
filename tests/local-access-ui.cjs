const path=require('node:path'),fs=require('node:fs/promises'),os=require('node:os'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const {createRequire}=require('node:module'),{pathToFileURL}=require('node:url');
const {chromium}=createRequire(path.join(root,'package.json'))('playwright');
(async()=>{
 const {configuration}=await import(pathToFileURL(path.join(root,'server/runtime/config.mjs'))),{createApplication}=await import(pathToFileURL(path.join(root,'server/runtime/http.mjs')));
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'gmm-local-ui-'));
 const config=configuration({GMM_LOCAL_ACCESS:'true',GMM_PORT:'0',GMM_DATA_DIR:directory});
 const app=createApplication(config),address=await app.listen();config.port=address.port;config.origin='http://127.0.0.1:'+address.port;
 let browser;const results=[],errors=[],check=(name,value)=>{assert.ok(value,name);results.push(name);console.log('OK',name);};
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext(),page=await context.newPage();
  await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===config.origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort();});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(config.origin+'/painel.html#operations');await page.waitForSelector('#ops-upload');
  check('acervo abre sem formulário de senha',await page.locator('#service-password').count()===0);
  check('sessão local existe sem senha operacional',app.store.list('session').some(s=>s.accessMode==='local'));
  await page.locator('nav [data-view="settings"]').click();
  await page.getByRole('button',{name:'Pausar acesso nesta aba',exact:true}).click(); await page.waitForFunction(()=>sessionStorage.getItem('gmm-local-access-paused')==='true');
  await page.locator('nav [data-view="operations"]').click();await page.waitForFunction(()=>document.querySelector('#operations-content')?.textContent.includes('Acesso pausado'));
  await page.reload();await page.waitForFunction(()=>document.querySelector('#operations-content')?.textContent.includes('Acesso pausado'));
  check('pausa desta aba permanece depois da recarga',await page.locator('#ops-upload').count()===0);
  const other=await context.newPage();await other.goto(config.origin+'/painel.html#operations');await other.waitForSelector('#ops-upload');
  check('outra aba pode entrar sem tornar a pausa uma promessa de bloqueio',await other.locator('#service-password').count()===0);
  await page.reload();await page.waitForFunction(()=>document.querySelector('#operations-content')?.textContent.includes('Acesso pausado'));
  check('nova sessão de outra aba não remove a pausa escolhida nesta aba',true);
  await page.locator('nav [data-view="settings"]').click();await page.getByRole('button',{name:'Retomar acesso local',exact:true}).click();
  await page.locator('nav [data-view="operations"]').click();await page.waitForSelector('#ops-upload');
  check('retomada abre acervo sem digitar senha',await page.locator('#service-password').count()===0);
  await page.reload();await page.waitForSelector('#ops-upload');check('reabertura mantém acesso local',true);
  check('integrações e execução externa permanecem desligadas',!config.network&&!config.publishing&&!config.worker);
  check('sem erros JavaScript',errors.length===0);
  const output=process.env.GMM_QA_OUTPUT||path.join(root,'.cache/local-access-ui');await fs.mkdir(output,{recursive:true});await page.screenshot({path:path.join(output,'acervo-local.png'),fullPage:true});await fs.writeFile(path.join(output,'resultado.json'),JSON.stringify({results,errors,externalCalls:false},null,2));
 }finally{await browser?.close();await app.close();assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir(),'gmm-local-ui-')));await fs.rm(directory,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
