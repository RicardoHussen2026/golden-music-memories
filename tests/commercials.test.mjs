import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createApplication} from '../server/runtime/http.mjs';
import {configuration} from '../server/runtime/config.mjs';
import {runProcess} from '../server/runtime/source-import.mjs';
import {fileHash} from '../server/runtime/media.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));

test('comerciais: MP3 e vídeo, ducking, amostra, silêncio, vinheta sonora e travessia entre músicas',{timeout:240000},async()=>{
 const root=resolve('.cache/vinhetas-v221/commercial-'+randomUUID());mkdirSync(root,{recursive:true});const ff=resolve('.cache/import-tools/ffmpeg.exe'),config=configuration({GMM_DATA_DIR:join(root,'db'),GMM_PORT:'0',GMM_LOCAL_ACCESS:'true',GMM_MIN_FREE_MIB:'0',GMM_RENDER_CPU_PROFILE:'conservative'});
 const source=join(root,'source.mp4'),clip=join(root,'commercial.mp4'),mp3=join(root,'voice.mp3'),img=join(root,'visual.png'),quiet=join(root,'silent.mp4');
 for(const [file,color,freq] of [[source,'lime',440],[clip,'blue',880]])await runProcess(ff,['-v','error','-f','lavfi','-i',`color=c=${color}:s=320x180:r=30:d=4`,'-f','lavfi','-i',`sine=frequency=${freq}:duration=4`,'-c:v','libx264','-preset','ultrafast','-c:a','aac','-ar','48000','-ac','2','-shortest',file]);
 await runProcess(ff,['-v','error','-f','lavfi','-i','sine=frequency=1000:duration=4','-c:a','libmp3lame','-b:a','320k',mp3]);await runProcess(ff,['-v','error','-i',source,'-an','-c:v','copy',quiet]);await runProcess(ff,['-v','error','-f','lavfi','-i','color=red:s=320x180','-frames:v','1',img]);const original=fileHash(mp3);
 const app=createApplication(config,{bundledBranding:false,clipDirectory:join(root,'clips')});
 const upload=async(file,kind,pid)=>{const bytes=readFileSync(file),a=pid?app.assembler.begin({productionId:pid,purpose:'video',name:file.split(/[\\/]/).at(-1),size:bytes.length}):app.artworks.begin({kind,name:file.split(/[\\/]/).at(-1),size:bytes.length});app.assembler.append(a.id,0,bytes);return app.assembler.complete(a.id);};
 const art=async(input)=>{const a=await app.artworks.start(input);while(app.artworks.running.has(a.id))await pause(40);const done=app.artworks.get(a.id);assert.equal(done.state,'completed',done.error);return done;};
 const render=async(input)=>{const a=await app.assembler.start(input);while(app.assembler.running.has(a.id))await pause(40);const done=app.assembler.get(a.id);assert.equal(done.state,'completed',done.error);return done;};
 const tone=(file,at,d=.1)=>{const b=execFileSync(ff,['-v','error','-ss',String(at),'-i',file,'-t',String(d),'-vn','-ar','48000','-ac','1','-f','s16le','pipe:1']);let crossings=0,energy=0;for(let i=2;i<b.length;i+=2){const a=b.readInt16LE(i-2),v=b.readInt16LE(i);if(a<=0&&v>0)crossings++;energy+=v*v;}return {frequency:crossings/d,rms:Math.sqrt(energy/(b.length/2))};};
 const pixel=(file,at,crop='')=>[...execFileSync(ff,['-v','error','-ss',String(at),'-i',file,'-frames:v','1','-vf',crop+'scale=1:1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'])].slice(0,3);
 try{await app.listen();app.store.put('production','first',{id:'first',title:'Fonte sintética',artist:'Teste',songId:'first',version:1});app.store.put('production','second',{id:'second',title:'Segunda faixa',artist:'Teste',songId:'second',version:1});const other=await upload(clip,'video','second');const base=await upload(source,'video','first'),silent=await upload(quiet,'video','first'),voice=await upload(mp3,'video'),video=await upload(clip,'video'),visual=await upload(img,'image');
 const a=await art({kind:'audio-call',inputId:voice.id,label:'Chamada teste',duration:3,start:.5});assert.equal(a.audioCodec,'aac');assert.ok(Math.abs(a.duration-3)<.03);
 const v=await art({kind:'video-call',inputId:video.id,label:'Comercial teste',duration:3,format:'horizontal',fade:0});
 const bumper=await art({kind:'bumper',inputId:voice.id,visualInputId:visual.id,label:'MP3 com imagem',duration:3,format:'horizontal',fade:0,useAudio:true});assert.equal(bumper.audioCodec,'aac');assert.equal(bumper.visualInputId,visual.id);assert.ok(Math.abs(tone(app.artworks.file(bumper.id).path,1).frequency-1000)<25);
 const data={productionId:'first',sourceKind:'input',sourceId:base.id,destination:'youtube',coverSeconds:0,calls:[],fit:'original',preview:true};const row={artworkId:a.id,at:1,duration:2,volume:1,musicVolume:0,fade:.2};
 const mixed=await render({...data,commercials:[row]}),file=app.assembler.outputPath(mixed);assert.equal(mixed.actualDuration,4);assert.ok(Math.abs(tone(file,.4).frequency-440)<25);assert.ok(Math.abs(tone(file,1.5).frequency-1000)<25);assert.ok(Math.abs(tone(file,3.5).frequency-440)<25);assert.ok(pixel(file,1.5)[1]>200);
 const visualAd=await render({...data,commercials:[{...row,artworkId:v.id,layout:'full'}]});assert.ok(pixel(app.assembler.outputPath(visualAd),1.5)[2]>200);assert.ok(pixel(app.assembler.outputPath(visualAd),3.5)[1]>200);
 const cornerAd=await render({...data,commercials:[{...row,artworkId:v.id,layout:'corner',corner:'top-left',widthFraction:.35,volume:0}]});assert.ok(pixel(app.assembler.outputPath(cornerAd),1.5,'crop=300:100:100:80,')[2]>200);assert.ok(Math.abs(tone(app.assembler.outputPath(cornerAd),1.5).frequency-440)<25);
 const normal=await render({...data,commercials:[row],normalizeAudio:true});assert.ok(normal.audioVerification.truePeak<=-1.5);assert.ok(normal.plan.commercials[0].audioNormalization);
 const quietNormal=await render({...data,sourceId:silent.id,commercials:[row],normalizeAudio:true});assert.equal(quietNormal.plan.normalizeAudio,true);assert.ok(tone(app.assembler.outputPath(quietNormal),.3).rms<3);assert.ok(tone(app.assembler.outputPath(quietNormal),1.5).rms>100);
 const sample=await render({...data,sourceId:silent.id,commercials:[row],normalizeAudio:true,sample:true,sampleStart:3});assert.equal(sample.audioVerification.silent,true);
 await assert.rejects(()=>app.assembler.start({...data,commercials:[row,{...row,at:2}]}),/sobrepõem/);await assert.rejects(()=>app.assembler.start({...data,commercials:[{...row,at:3}]}),/fim do vídeo/);
 const collection=await app.collections.save({...data,normalizeAudio:true,title:'Comercial atravessa músicas',targetSeconds:8,mode:'manual',openingMode:'once',items:[{productionId:'first',sourceKind:'input',sourceId:base.id},{productionId:'second',sourceKind:'input',sourceId:other.id}],commercials:[{...row,at:3.8,duration:2,fade:.5}]});assert.deepEqual(collection.issues,[]);assert.equal(collection.items[1].plan.commercials[0].offset,.20000000000000018);await app.collections.start(collection.id,collection.revision);while(app.collections.running.has(collection.id))await pause(40);const c=app.collections.get(collection.id);assert.equal(c.state,'completed',c.error);const cfile=app.collections.file(c.id);assert.ok(Math.abs((await app.assembler.probe(cfile)).duration-8)<.04);assert.ok(Math.abs(tone(cfile,4.6).frequency-1000)<25);assert.ok(Math.abs(tone(cfile,6.2).frequency-880)<25);assert.deepEqual(c.items[0].plan.commercials[0].audioNormalization,c.items[1].plan.commercials[0].audioNormalization);
 const before=app.artworks.file(a.id).path,hash=fileHash(before);app.artworks.trash(a.id);assert.ok(!app.assembler.commercials.list().some(r=>r.id===a.id));await assert.rejects(()=>app.assembler.start({...data,commercials:[row]}),/indisponível/);app.artworks.trash(a.id,true);assert.equal(fileHash(before),hash);assert.ok(app.assembler.commercials.list().some(r=>r.id===a.id));assert.equal(fileHash(mp3),original);await runProcess(ff,['-v','error','-i',cfile,'-f','null','-']);
 }finally{await app.close();}
});
