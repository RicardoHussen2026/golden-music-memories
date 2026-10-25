import {buildMetadata} from '../../scripts/build-metadata.mjs';
const RUNNING_BUILD=Object.freeze(buildMetadata());
import {createServer} from 'node:http';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Store,sha,check,publicJob,stamp} from './store.mjs';
import {configuration,availability} from './config.mjs';
import {Transfers} from './contracts.mjs';
import {Providers} from './providers.mjs';
import {Worker} from './worker.mjs';
import {MediaLibrary} from './media.mjs';
import {Drive} from './drive.mjs';
import {Scheduler} from './scheduler.mjs';
import {Continuity} from './continuity.mjs';
import {SourceImporter} from './source-import.mjs';
import {Collections} from './collections.mjs';
import {StorageBackups,storageUsage} from './storage-backup.mjs';
import {HistoricalCovers} from './historical-covers.mjs';
import {VideoAssembler} from './video-assembly.mjs';

const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.mp4':'video/mp4','.webmanifest':'application/manifest+json'};
const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').filter(s=>s.includes('=')).map(s=>{const i=s.indexOf('=');return [s.slice(0,i).trim(),s.slice(i+1)];}));
async function body(req,limit){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;check(size<=limit,'Corpo da requisição acima do limite.',413);chunks.push(chunk);}return Buffer.concat(chunks);}
async function jsonBody(req,limit=65536){try{return JSON.parse((await body(req,limit)).toString());}catch(e){if(e.status)throw e;check(false,'JSON inválido.');}}
export function createApplication(config=configuration(),options={}){
  if(config.localAccess&&(config.host!=='127.0.0.1'||config.origin!==new URL(`http://127.0.0.1:${config.port}`).origin))throw Error('Acesso local exige bind e origem exclusivos em 127.0.0.1.');
  const store=options.store||new Store(config.directory,config.encryptionKey),transfers=new Transfers(store,config),providers=new Providers(store,config,options.transport),worker=new Worker(store,config,providers);
  const library=new MediaLibrary(store,config),drive=new Drive(store,config,providers,library),scheduler=new Scheduler(store,config,library),continuity=new Continuity(store,config,scheduler);
  const sourceImporter=new SourceImporter(store,config,options.sourceImporter);
  const assembler=new VideoAssembler(store,config,library,sourceImporter,options.assembler);
  const historicalCovers=new HistoricalCovers(options.historicalCoversDirectory||resolve(root,'acervo/capas-historicas'));
  const collections=new Collections(store,config,assembler,options.collections);
  let mutations=0;
  const storageBackups=new StorageBackups(store,config,{version:RUNNING_BUILD.version,canStart:()=>mutations<=1&&!config.network&&!config.worker&&!sourceImporter.running.size&&!assembler.running.size&&!collections.running.size&&!collections.preparing&&!store.list('render_input').some(r=>r.state==='receiving')&&!store.list('media').some(m=>['receiving','downloading'].includes(m.state))&&!store.db.prepare('SELECT id FROM jobs WHERE lease_until>? LIMIT 1').get(Date.now())});
  drive.needsCache=()=>['youtube','tiktok'].flatMap(p=>scheduler.candidates(p,Date.now()).slice(0,5).map(m=>m.id));
  const cycle=async()=>{if(storageBackups.busy||!continuity.status().active)return;const steps=[...(config.network?[()=>drive.tick()]:[]),...(config.worker?[()=>scheduler.tick(),()=>worker.tick()]:[])];for(const step of steps){try{await step();}catch(error){store.put('ops_event','last-error',{id:'last-error',at:stamp(),message:'Uma etapa foi interrompida. Consulte os diagnósticos e as tarefas.',code:error.code||'PROCESSING_ERROR'});}}};
  const salt=randomBytes(32),passwordHash=scryptSync(config.password,salt,32),loginFailures=new Map();let interval,pendingWorker=null;
  const server=createServer(async(req,res)=>{
    const id=randomBytes(8).toString('hex');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
    const reply=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
    try{
      const url=new URL(req.url,config.origin),path=url.pathname;
      check(req.headers.host===new URL(config.origin).host,'Host não permitido.',403);
      if(config.localAccess){
        check(['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress),'Conexão local obrigatória.',403);
        check(!Object.keys(req.headers).some(h=>h==='forwarded'||h.startsWith('x-forwarded-')),'Proxy não permitido no modo local.',403);
      }
      if(path.startsWith('/api/')){
        check(!storageBackups.busy||path==='/api/health'||req.method==='GET'&&path==='/api/storage/backup'||req.method==='POST'&&/^\/api\/storage\/backup\/[a-f\d-]{36}\/cancel$/.test(path),'Backup em andamento; aguarde ou cancele antes de alterar dados.',409);
        if(!['GET','HEAD'].includes(req.method)){mutations++;let ended=false;const done=()=>{if(!ended){ended=true;mutations--;}};res.once('finish',done);res.once('close',done);}
        res.setHeader('Cache-Control','no-store');
        if(req.method==='GET'&&path==='/api/health')return reply({service:'Golden Music Memories',storageBackupAvailable:true,sourceImportAvailable:true,automaticSourceInspection:true,videoAssemblyAvailable:true,build:{version:RUNNING_BUILD.version,backendBuild:RUNNING_BUILD.backendBuild},...availability(config)});
        const origin=req.headers.origin;
        if(!['GET','HEAD'].includes(req.method))check(origin===config.origin&&req.headers['x-gmm-request']==='1','Origem da operação não permitida.',403);
        if(path==='/api/session/local'&&req.method==='POST'){
          check(config.localAccess===true,'Acesso local não habilitado.',404);
          check(!req.headers['sec-fetch-site']||req.headers['sec-fetch-site']==='same-origin','Origem da operação não permitida.',403);
          const token=randomBytes(32).toString('base64url');
          store.put('session',sha(token),{owner:'operator',accessMode:'local',expires:Date.now()+8*3600000});
          res.setHeader('Set-Cookie',`gmm_session=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=28800`);
          return reply({authenticated:true,accessMode:'local'});
        }
        if(path==='/api/session'&&req.method==='POST'){
          check(config.password.length>=16,'Configure GMM_OPERATOR_PASSWORD no servidor (mínimo 16 caracteres).',503);
          const ip=req.socket.remoteAddress,fail=loginFailures.get(ip);check(!fail||fail.count<5||Date.now()-fail.at>60000,'Aguarde um minuto antes de tentar novamente.',429);
          const input=await jsonBody(req);check(typeof input.password==='string'&&input.password.length<=1024,'Senha inválida.',401);const valid=timingSafeEqual(scryptSync(input.password,salt,32),passwordHash);
          if(!valid){loginFailures.set(ip,{count:(fail?.count||0)+1,at:Date.now()});check(false,'Acesso recusado.',401);}loginFailures.delete(ip);
          const token=randomBytes(32).toString('base64url'),sessionId=sha(token);store.put('session',sessionId,{owner:'operator',expires:Date.now()+8*3600000});
          res.setHeader('Set-Cookie',`gmm_session=${token}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=28800${config.secure?'; Secure':''}`);return reply({authenticated:true});
        }
        const sessionId=sha(cookies(req).gmm_session||''),session=store.get('session',sessionId);check(session&&session.expires>Date.now()&&(session.accessMode!=='local'||config.localAccess===true),'Entre no serviço para continuar.',401);const owner=session.owner;
        if(path==='/api/session'&&req.method==='DELETE'){store.delete('session',sessionId);res.setHeader('Set-Cookie','gmm_session=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0');return reply({authenticated:false});}
        if(path.startsWith('/api/historical-covers')){
          check(config.host==='127.0.0.1'&&['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress),'Biblioteca disponível somente neste computador.',403);
          check(!Object.keys(req.headers).some(h=>h==='forwarded'||h.startsWith('x-forwarded-')),'Consulta por proxy não permitida.',403);
          check(req.method==='GET','Biblioteca histórica é somente leitura.',405);
          if(path==='/api/historical-covers')return reply(await historicalCovers.list(url.searchParams.get('songId')));
          const image=/^\/api\/historical-covers\/images\/([a-f\d]{64})$/.exec(path);
          check(image,'Imagem não encontrada.',404);const bytes=await historicalCovers.image(image[1]);
          res.writeHead(200,{'Content-Type':'image/jpeg','Content-Length':bytes.length,'Cache-Control':'no-store'});return res.end(bytes);
        }
        if(path.startsWith('/api/storage')){
          check(config.host==='127.0.0.1'&&['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress),'Backup disponível somente neste computador.',403);
          check(!Object.keys(req.headers).some(h=>h==='forwarded'||h.startsWith('x-forwarded-')),'Backup por proxy não permitido.',403);
          if(path==='/api/storage'&&req.method==='GET')return reply(await storageUsage(config.directory));
          if(path==='/api/storage/backup'&&req.method==='GET')return reply({job:storageBackups.status()});
          if(path==='/api/storage/backup'&&req.method==='POST')return reply(storageBackups.start(),202);
          const cancel=/^\/api\/storage\/backup\/([a-f\d-]{36})\/cancel$/.exec(path);if(cancel&&req.method==='POST')return reply(storageBackups.cancel(cancel[1]),202);
          return reply({error:'Backup não encontrado.'},404);
        }
        if(path.startsWith('/api/collections')){
          check(config.host==='127.0.0.1'&&['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress),'Coletânea disponível somente neste computador.',403);
          check(!Object.keys(req.headers).some(h=>h==='forwarded'||h.startsWith('x-forwarded-')),'Coletânea por proxy não permitida.',403);
          if(path==='/api/collections'&&req.method==='GET')return reply({collections:collections.list()});
          if(path==='/api/collections/catalog'&&req.method==='GET')return reply(await collections.catalog());
          if(path==='/api/collections'&&req.method==='POST')return reply(await collections.save(await jsonBody(req,1024*1024)),201);
          const match=/^\/api\/collections\/([a-f\d-]{36})(?:\/(start|cancel|file|manifest))?$/.exec(path);
          if(match){const [,cid,action]=match;
            if(req.method==='POST'&&action==='start'){const body=await jsonBody(req);return reply(await collections.start(cid,body.revision),202);}
            if(req.method==='POST'&&action==='cancel')return reply(collections.cancel(cid),202);
            if(req.method==='GET'&&(!action||action==='manifest'))return reply(collections.get(cid));
            if(req.method==='GET'&&action==='file'){const c=collections.get(cid);check(c.state==='completed','Coletânea ainda não concluída.',409);const file=collections.file(cid),info=await stat(file);let start=0,end=info.size-1,status=200;if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);check(m,'Faixa inválida.',416);start=Number(m[1]);end=m[2]?Math.min(end,Number(m[2])):end;check(start<=end&&start<info.size,'Faixa fora do arquivo.',416);status=206;}const headers={'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,'Cache-Control':'no-store'};if(status===206)headers['Content-Range']='bytes '+start+'-'+end+'/'+info.size;if(url.searchParams.has('download'))headers['Content-Disposition']='attachment; filename="GMM_coletanea_'+cid.slice(0,8)+'.mp4"';res.writeHead(status,headers);createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);return;}
          }return reply({error:'Coletânea não encontrada.'},404);
        }
        if(path.startsWith('/api/assembly')){
          check(config.host==='127.0.0.1'&&['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress),'Montagem disponível somente neste computador.',403);
          check(!Object.keys(req.headers).some(h=>h==='forwarded'||h.startsWith('x-forwarded-')),'Montagem por proxy não permitida.',403);
          if(path==='/api/assembly'&&req.method==='GET')return reply(assembler.status(url.searchParams.get('productionId')));
          if(path==='/api/assembly'&&req.method==='POST'){check(!collections.running.size&&!collections.preparing,'Aguarde a coletânea ativa.',409);return reply(await assembler.start(await jsonBody(req)),202);}
          if(path==='/api/assembly/inputs'&&req.method==='POST')return reply(assembler.begin(await jsonBody(req)),201);
          const inputMatch=/^\/api\/assembly\/inputs\/([a-f\d-]{36})(\/(?:complete|cancel))?$/.exec(path);
          if(inputMatch){if(req.method==='PUT'&&!inputMatch[2])return reply(assembler.append(inputMatch[1],Number(req.headers['x-upload-offset']),await body(req,config.chunkBytes)));if(req.method==='POST'&&inputMatch[2])return reply(inputMatch[2]==='/cancel'?assembler.cancelInput(inputMatch[1]):await assembler.complete(inputMatch[1]));}
          const generatedAction=/^\/api\/assembly\/([a-f\d-]{36})\/generated\/(impact|trash|restore)$/.exec(path);if(generatedAction){const [,jid,action]=generatedAction;if(action==='impact'&&req.method==='GET')return reply(assembler.generatedImpact(jid));if(req.method==='POST'&&action!=='impact'){check(!collections.running.size&&!collections.preparing,'Aguarde a coletânea ativa.',409);return reply(action==='trash'?assembler.trashGenerated(jid,await jsonBody(req)):assembler.restoreGenerated(jid));}}
          const previewAction=/^\/api\/assembly\/([a-f\d-]{36})\/(discard|restore)$/.exec(path);if(previewAction&&req.method==='POST')return reply(previewAction[2]==='discard'?assembler.discardPreview(previewAction[1]):assembler.restorePreview(previewAction[1]));
          const saveMatch=/^\/api\/assembly\/([a-f\d-]{36})\/save$/.exec(path);if(saveMatch&&req.method==='POST')return reply(assembler.savePreview(saveMatch[1]));
          const cancelMatch=/^\/api\/assembly\/([a-f\d-]{36})\/cancel$/.exec(path);if(cancelMatch&&req.method==='POST')return reply(assembler.cancel(cancelMatch[1]),202);
          const outputMatch=/^\/api\/assembly\/files\/([a-f\d-]{36})$/.exec(path);
          if(outputMatch&&req.method==='GET'){const job=assembler.get(outputMatch[1]);check(job.state==='completed','Vídeo ainda não concluído.',409);const file=assembler.outputPath(job),info=await stat(file),range=req.headers.range;let start=0,end=info.size-1,status=200;if(range){const match=/^bytes=(\d+)-(\d*)$/.exec(range);check(match,'Faixa inválida.',416);start=Number(match[1]);end=match[2]?Math.min(end,Number(match[2])):end;check(start<=end&&start<info.size,'Faixa fora do arquivo.',416);status=206;}const headers={'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,'Cache-Control':'no-store'};if(status===206)headers['Content-Range']='bytes '+start+'-'+end+'/'+info.size;if(url.searchParams.has('download'))headers['Content-Disposition']="attachment; filename*=UTF-8''"+encodeURIComponent(assembler.downloadName(job)).replace(/'/g,'%27');res.writeHead(status,headers);createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);return;}
          return reply({error:'Montagem não encontrada.'},404);
        }
        if(path.startsWith('/api/source-import')){
          check(config.host==='127.0.0.1'&&['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress),'Importador disponível somente neste computador.',403);
          check(!Object.keys(req.headers).some(h=>h==='forwarded'||h.startsWith('x-forwarded-')),'Importação por proxy não permitida.',403);
          if(path==='/api/source-import'&&req.method==='GET')return reply(sourceImporter.status());
          if(path==='/api/source-import'&&req.method==='POST')return reply(sourceImporter.inspect(await jsonBody(req)),202);
          const fileMatch=/^\/api\/source-import\/files\/([a-f\d-]{36})$/.exec(path);
          if(fileMatch&&req.method==='GET'){const {asset,path:file}=sourceImporter.file(fileMatch[1]);const info=await stat(file);res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':info.size,'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(asset.name).replace(/'/g,'%27'),'Cache-Control':'no-store'});createReadStream(file).on('error',()=>res.destroy()).pipe(res);return;}
          const task=/^\/api\/source-import\/([a-f\d-]{36})\/(start|cancel)$/.exec(path);
          if(task&&req.method==='POST')return reply(task[2]==='start'?sourceImporter.start(task[1],await jsonBody(req)):sourceImporter.cancel(task[1]),202);
          return reply({error:'Importação não encontrada.'},404);
        }
        if(path==='/api/connections'&&req.method==='GET')return reply({connections:providers.connections(owner),...availability(config)});
        const oauth=/^\/api\/oauth\/(youtube|tiktok|drive)\/(begin|callback)$/.exec(path);
        if(oauth){const [,platform,action]=oauth;
          if(action==='begin'&&req.method==='POST')return reply(providers.begin(owner,sessionId,platform));
          if(action==='callback'&&req.method==='GET'){await providers.callback(owner,sessionId,platform,Object.fromEntries(url.searchParams));res.writeHead(303,{Location:'/painel.html#settings','Cache-Control':'no-store'});return res.end();}
        }
        if(path==='/api/disconnect'&&req.method==='POST')return reply(await providers.disconnect(owner,(await jsonBody(req)).accountId));
        if(path==='/api/library'&&req.method==='GET')return reply({media:library.list({includeTrashed:url.searchParams.get('includeTrashed')==='1'}).map(({driveUpload,...m})=>m)});
        const libraryFile=/^\/api\/library\/([a-f\d-]{36})\/file$/.exec(path);if(libraryFile&&req.method==='GET'){const m=library.get(libraryFile[1]);check(m.hash,'Arquivo não concluído.',409);const file=resolve(config.directory,'media',m.id+'.mp4'),info=await stat(file);let start=0,end=info.size-1,status=200;if(req.headers.range){const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);check(match,'Faixa inválida.',416);start=Number(match[1]);end=match[2]?Math.min(end,Number(match[2])):end;check(start<=end&&start<info.size,'Faixa fora do arquivo.',416);status=206;}const headers={'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,'Cache-Control':'no-store'};if(status===206)headers['Content-Range']='bytes '+start+'-'+end+'/'+info.size;if(url.searchParams.has('download'))headers['Content-Disposition']="attachment; filename*=UTF-8''"+encodeURIComponent(m.name).replace(/'/g,'%27');res.writeHead(status,headers);createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);return;}
        if(path==='/api/operations/history'&&req.method==='GET'){const publications=store.list('publication').map(p=>({...p,status:'published',origin:'service'}));for(const row of store.jobs(owner)){if(row.mode==='real'&&row.state==='published'&&row.result?.url){const m=store.get('media',row.envelope?.assetId),p=store.get('production',row.envelope?.productionId);publications.push({id:'job:'+row.id,status:'published',publicationSource:'api',serverDelivery:{mode:'real',state:'published'},platform:row.platform,productionId:p?.id,songId:p?.songId,title:p?.title,artist:p?.artist,productionVersion:p?.version,hash:m?.hash||row.envelope?.fileHash,publishedAt:row.result?.completedAt||row.updatedAt,url:row.result.url,postingAccountId:row.envelope?.accountId,postingAccountLabel:providers.connections(owner).find(c=>c.id===row.envelope?.accountId)?.label||row.envelope?.accountId,origin:'service'});}}return reply({publications,productions:store.list('production')});}
        if(path==='/api/operations'&&req.method==='GET')return reply({...scheduler.dashboard(),diagnostics:continuity.diagnostics(),connections:providers.connections(owner),productions:store.list('production'),publications:store.list('publication'),media:library.list().map(({driveUpload,...m})=>({...m,driveUpload:driveUpload?{state:driveUpload.state,offset:driveUpload.offset}:null})),folders:store.get('drive','folders'),driveScan:store.get('drive','scan'),events:store.list('ops_event')});
        if(path==='/api/operations/records'&&req.method==='POST')return reply(library.records(await jsonBody(req,16*1024*1024)));
        if(path==='/api/operations/publications'&&req.method==='POST')return reply(library.record(await jsonBody(req)));
        if(path==='/api/operations/send'&&req.method==='POST'){const input=await jsonBody(req),job=scheduler.prepareManual(input.mediaId,input);return reply(worker.authorize(owner,job.id,job.revision,{confirm:true,binding:job.envelope.approval.binding,assistedUpload:input.assistedUpload,musicUsage:true}));}
        if(path==='/api/operations/schedule'&&req.method==='POST')return reply(scheduler.save(await jsonBody(req)));
        if(path==='/api/operations/pause'&&req.method==='POST')return reply(continuity.pause());
        if(path==='/api/operations/activate'&&req.method==='POST')return reply(continuity.activate(await jsonBody(req)));
        if(path==='/api/operations/simulate'&&req.method==='POST'){check(scheduler.settings().mode==='simulation','A rotina precisa estar em simulação.');await scheduler.tick();for(let n=0;n<24;n++){const j=store.jobs(owner).find(j=>j.mode==='simulation'&&j.state==='authorized');if(!j)break;await worker.tick(owner,j.id);}return reply(scheduler.dashboard());}
        if(path==='/api/operations/backup'&&req.method==='POST'){const input=await jsonBody(req);return reply(continuity.export(input,{handoff:input.handoff===true}));}
        if(path==='/api/operations/restore'&&req.method==='POST'){const input=await jsonBody(req,32*1024*1024);return reply(continuity.import(input.packet,input));}
        if(path==='/api/operations/reconciled'&&req.method==='POST')return reply(continuity.reconcile(await jsonBody(req)));
        if(path==='/api/library'&&req.method==='POST')return reply(library.begin(await jsonBody(req)),201);
        const media=/^\/api\/library\/([a-f\d-]+)(?:\/(complete|describe|drive|resume|reconcile|evict|download))?$/.exec(path);
        if(media){const [,mid,action]=media;if(req.method==='PUT'&&!action)return reply(library.append(mid,Number(req.headers['x-upload-offset']),await body(req,config.chunkBytes)));
          if(req.method==='POST'){if(action==='complete')return reply(library.complete(mid));if(action==='describe')return reply(library.describe(mid,await jsonBody(req)));if(action==='drive')return reply(drive.queueUpload(mid));if(action==='resume')return reply(drive.resume(mid));if(action==='download')return reply(drive.restoreCache(mid));if(action==='reconcile')return reply(await drive.reconcileUpload(mid));if(action==='evict'){const m=library.get(mid),remote=await drive.metadata(m.drive?.id);check(!remote.trashed&&remote.md5Checksum===m.md5&&remote.version===m.drive.version,'A cópia Drive mudou; cache preservado.');return reply(library.evict(mid));}}}
        if(path==='/api/drive/setup'&&req.method==='POST')return reply(await drive.setup());
        if(path==='/api/drive/policy'&&req.method==='POST')return reply(drive.policy(await jsonBody(req)));
        if(path==='/api/drive/backup'&&req.method==='POST')return reply(await drive.backup((await jsonBody(req,32*1024*1024)).packet));
        if(path==='/api/drive/scan'&&req.method==='POST')return reply(await drive.scan());
        if(path==='/api/drive/import'&&req.method==='POST'){const input=await jsonBody(req);check(Array.isArray(input.ids)&&input.ids.length<=100,'Selecione até 100 vídeos por lote.');const results=[];for(const id of input.ids){try{results.push({id,media:await drive.importFile(id)});}catch(e){results.push({id,error:e.status<500?e.message:'Não foi possível consultar este vídeo.'});}}return reply({results});}
        if(path==='/api/transfers'&&req.method==='POST')return reply(transfers.begin(owner,await jsonBody(req)),201);
        const transfer=/^\/api\/transfers\/([a-f\d-]+)(\/complete)?$/.exec(path);
        if(transfer){const [,tid,complete]=transfer;
          if(complete&&req.method==='POST')return reply(transfers.complete(owner,tid));
          if(req.method==='GET'){const t=store.transfer(tid,owner);return reply({id:tid,offset:t.offset,fileSize:t.envelope.fileSize});}
          if(req.method==='PUT')return reply(transfers.append(owner,tid,Number(req.headers['x-upload-offset']),await body(req,config.chunkBytes)));
        }
        if(path==='/api/jobs'&&req.method==='GET')return reply({jobs:store.jobs(owner).map(publicJob)});
        const job=/^\/api\/jobs\/([a-f\d-]+)(?:\/(authorize|cancel|run|reconcile|events|schedule))?$/.exec(path);
        if(job){const [,jid,action]=job;
          if(!action&&req.method==='GET')return reply(publicJob(store.job(jid,owner)));
          if(action==='events'&&req.method==='GET'){store.job(jid,owner);return reply({events:store.db.prepare('SELECT at,event FROM events WHERE job_id=? ORDER BY id').all(jid)});}
          if(req.method==='POST'){const input=await jsonBody(req);
            if(action==='authorize')return reply(worker.authorize(owner,jid,input.revision,input));
            if(action==='cancel')return reply(worker.cancel(owner,jid,input.revision));
            if(action==='reconcile')return reply(worker.reconcile(owner,jid,input.revision));
            if(action==='schedule')return reply(publicJob(await providers.changeSchedule(owner,store.job(jid,owner),input.revision,input)));
            if(action==='run'){const task=store.job(jid,owner);check(task.mode==='simulation','Execução real pertence ao processador configurado.',409);await worker.tick(owner,jid);return reply(publicJob(store.job(jid,owner)));}
          }
        }
        return reply({error:'Recurso não encontrado.'},404);
      }
      check(['GET','HEAD'].includes(req.method),'Método não permitido.',405);
      let name;try{name=decodeURIComponent(path);}catch{check(false,'Endereço inválido.');}
      // Nunca servir banco, backend, testes, documentação privada, env ou diretório Git.
      const allowed=name==='/'||['/index.html','/painel.html','/manifest.webmanifest','/sw.js'].includes(name)||/^\/(app|data|templates|vendor)\//.test(name)||/^\/[\d][\d]_[\w.-]+\.(html|png|mp4|txt|md|zip)$/.test(name);
      check(allowed&&!name.split('/').some(p=>p.startsWith('.')),'Arquivo não disponível.',404);
      const file=resolve(root,'.'+(name==='/'?'/index.html':name));check(file.startsWith(root+sep),'Endereço inválido.',403);const info=await stat(file);check(info.isFile(),'Arquivo não encontrado.',404);
      res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-cache'});if(req.method==='HEAD')return res.end();createReadStream(file).pipe(res);
    }catch(error){
      const status=error.status||(error.code==='ENOENT'?404:500);const message=error.code==='ENOENT'?'Arquivo não encontrado.':status<500?error.message:status===503?error.message:'Não foi possível concluir a operação. Consulte o identificador.';
      if(!res.headersSent)reply({error:message,correlationId:id},status);else res.end();
      // Sem URL, corpo, cookies, tokens ou mensagem bruta de provedor.
      options.log?.({at:stamp(),correlationId:id,status,event:'request_failed'});
    }
  });
  server.requestTimeout=60000;server.headersTimeout=15000;
  return {server,store,providers,worker,library,drive,scheduler,continuity,sourceImporter,assembler,collections,storageBackups,listen:()=>new Promise(resolve=>server.listen(config.port,config.host,()=>{interval=setInterval(()=>{if(!pendingWorker)pendingWorker=cycle().finally(()=>pendingWorker=null);},1000);resolve(server.address());})),close:async()=>{clearInterval(interval);await storageBackups.close();await sourceImporter.close();await collections.close();await assembler.close();await new Promise(resolve=>server.close(resolve));await pendingWorker;store.close();}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const config=configuration(),app=createApplication(config,{log:event=>console.error(JSON.stringify(event))});await app.listen();console.log(`Golden Music Memories · ${config.origin}/painel.html · publicação externa ${config.publishing?'habilitada por configuração':'desativada'}`);for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await app.close();process.exit(0);});}
