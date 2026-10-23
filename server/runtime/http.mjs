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

const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.mp4':'video/mp4','.webmanifest':'application/manifest+json'};
const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').filter(s=>s.includes('=')).map(s=>{const i=s.indexOf('=');return [s.slice(0,i).trim(),s.slice(i+1)];}));
async function body(req,limit){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;check(size<=limit,'Corpo da requisição acima do limite.',413);chunks.push(chunk);}return Buffer.concat(chunks);}
async function jsonBody(req){try{return JSON.parse((await body(req,65536)).toString());}catch(e){if(e.status)throw e;check(false,'JSON inválido.');}}
export function createApplication(config=configuration(),options={}){
  const store=options.store||new Store(config.directory,config.encryptionKey),transfers=new Transfers(store,config),providers=new Providers(store,config,options.transport),worker=new Worker(store,config,providers);
  const salt=randomBytes(32),passwordHash=scryptSync(config.password,salt,32),loginFailures=new Map();let interval,pendingWorker=null;
  const server=createServer(async(req,res)=>{
    const id=randomBytes(8).toString('hex');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
    const reply=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
    try{
      const url=new URL(req.url,config.origin),path=url.pathname;
      check(!req.headers.host||req.headers.host===new URL(config.origin).host,'Host não permitido.',403);
      if(path.startsWith('/api/')){
        res.setHeader('Cache-Control','no-store');
        if(req.method==='GET'&&path==='/api/health')return reply({service:'Golden Music Memories',...availability(config)});
        const origin=req.headers.origin;
        if(!['GET','HEAD'].includes(req.method))check(origin===config.origin&&req.headers['x-gmm-request']==='1','Origem da operação não permitida.',403);
        if(path==='/api/session'&&req.method==='POST'){
          check(config.password.length>=16,'Configure GMM_OPERATOR_PASSWORD no servidor (mínimo 16 caracteres).',503);
          const ip=req.socket.remoteAddress,fail=loginFailures.get(ip);check(!fail||fail.count<5||Date.now()-fail.at>60000,'Aguarde um minuto antes de tentar novamente.',429);
          const input=await jsonBody(req);check(typeof input.password==='string'&&input.password.length<=1024,'Senha inválida.',401);const valid=timingSafeEqual(scryptSync(input.password,salt,32),passwordHash);
          if(!valid){loginFailures.set(ip,{count:(fail?.count||0)+1,at:Date.now()});check(false,'Acesso recusado.',401);}loginFailures.delete(ip);
          const token=randomBytes(32).toString('base64url'),sessionId=sha(token);store.put('session',sessionId,{owner:'operator',expires:Date.now()+8*3600000});
          res.setHeader('Set-Cookie',`gmm_session=${token}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=28800${config.secure?'; Secure':''}`);return reply({authenticated:true});
        }
        const sessionId=sha(cookies(req).gmm_session||''),session=store.get('session',sessionId);check(session&&session.expires>Date.now(),'Entre no serviço para continuar.',401);const owner=session.owner;
        if(path==='/api/session'&&req.method==='DELETE'){store.delete('session',sessionId);res.setHeader('Set-Cookie','gmm_session=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0');return reply({authenticated:false});}
        if(path==='/api/connections'&&req.method==='GET')return reply({connections:providers.connections(owner),...availability(config)});
        const oauth=/^\/api\/oauth\/(youtube|tiktok)\/(begin|callback)$/.exec(path);
        if(oauth){const [,platform,action]=oauth;
          if(action==='begin'&&req.method==='POST')return reply(providers.begin(owner,sessionId,platform));
          if(action==='callback'&&req.method==='GET'){await providers.callback(owner,sessionId,platform,Object.fromEntries(url.searchParams));res.writeHead(303,{Location:'/painel.html#settings','Cache-Control':'no-store'});return res.end();}
        }
        if(path==='/api/disconnect'&&req.method==='POST')return reply(await providers.disconnect(owner,(await jsonBody(req)).accountId));
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
  return {server,store,providers,worker,listen:()=>new Promise(resolve=>server.listen(config.port,config.host,()=>{if(config.worker)interval=setInterval(()=>{if(!pendingWorker)pendingWorker=worker.tick().catch(()=>{}).finally(()=>pendingWorker=null);},1000);resolve(server.address());})),close:async()=>{clearInterval(interval);await new Promise(resolve=>server.close(resolve));await pendingWorker;store.close();}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const config=configuration(),app=createApplication(config,{log:event=>console.error(JSON.stringify(event))});await app.listen();console.log(`Golden Music Memories · ${config.origin}/painel.html · publicação externa ${config.publishing?'habilitada por configuração':'desativada'}`);for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await app.close();process.exit(0);});}
