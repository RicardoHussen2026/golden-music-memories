import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {TEMPLATES} from '../app/cover.js';
import {createApplication} from '../server/runtime/http.mjs';
import {configuration} from '../server/runtime/config.mjs';
import {installBundledBranding} from '../server/runtime/bundled-branding.mjs';
import {fileHash} from '../server/runtime/media.mjs';
import {runProcess} from '../server/runtime/source-import.mjs';
test('coleção nostálgica: doze fundos, seis vídeos, instalação idempotente e remoção preservada',{timeout:120000},async()=>{
 const covers=Object.values(TEMPLATES).filter(t=>t.decade);assert.equal(covers.length,12);for(const decade of ['70','80','90'])assert.equal(covers.filter(t=>t.decade===decade).length,4);for(const c of covers){const png=readFileSync(c.asset);assert.equal(png.readUInt32BE(16),941);assert.equal(png.readUInt32BE(20),1672);}
 const root=resolve('.cache/vinhetas-v221/branding-'+randomUUID());mkdirSync(root,{recursive:true});const config=configuration({GMM_DATA_DIR:root,GMM_PORT:'0',GMM_LOCAL_ACCESS:'true'}),app=createApplication(config,{clipDirectory:join(root,'clips')});
 try{await app.listen();config.origin='http://127.0.0.1:'+app.server.address().port;const headers={Origin:config.origin,'X-GMM-Request':'1','Content-Type':'application/json'},login=await fetch(config.origin+'/api/session/local',{method:'POST',headers,body:'{}'});headers.Cookie=login.headers.get('set-cookie').split(';')[0];const rows=app.assembler.bumpers.list();assert.equal(rows.length,6);assert.equal(installBundledBranding(app.artworks),0);
 for(const row of rows){const file=app.artworks.file(row.id).path,info=await app.assembler.probe(file);assert.equal(info.audioCodec,'aac');assert.ok(Math.abs(info.duration-5)<.04);assert.equal(info.width,row.width);assert.equal(info.height,row.height);assert.equal(fileHash(file),row.sha256);const audioDownload=await fetch(config.origin+'/api/artworks/'+row.id+'/audio?download=1',{headers});assert.equal(audioDownload.status,200);assert.equal(audioDownload.headers.get('content-type'),'audio/mpeg');assert.deepEqual(Buffer.from(await audioDownload.arrayBuffer()),readFileSync(app.artworks.file(row.id,false,true).path));await runProcess(app.assembler.tool('ffmpeg'),['-v','error','-i',file,'-f','null','-']);const audio=await runProcess(app.assembler.tool('ffmpeg'),['-hide_banner','-i',file,'-af','loudnorm=print_format=json','-f','null','-'],{captureStderr:true});const measured=JSON.parse(audio.match(/\{\s*"input_i"[\s\S]*?\}/g).at(-1));assert.ok(Number(measured.input_tp)<=-1.5);assert.ok(Number(measured.input_i)>-25);const download=await fetch(config.origin+'/api/artworks/'+row.id+'/file?download=1',{headers});assert.equal(download.status,200);assert.match(download.headers.get('content-disposition'),/Golden/);assert.deepEqual(Buffer.from(await download.arrayBuffer()),readFileSync(file));}
 app.artworks.trash(rows[0].id);assert.equal(installBundledBranding(app.artworks),0);assert.equal(app.assembler.bumpers.list().length,5);app.artworks.trash(rows[0].id,true);assert.equal(app.assembler.bumpers.list().length,6);
 }finally{await app.close();}
});
