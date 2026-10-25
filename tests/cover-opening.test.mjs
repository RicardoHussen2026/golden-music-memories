import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,mkdirSync,rmSync,copyFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {Store} from '../server/runtime/store.mjs';
import {configuration} from '../server/runtime/config.mjs';
import {MediaLibrary,fileHash} from '../server/runtime/media.mjs';
import {SourceImporter,runProcess} from '../server/runtime/source-import.mjs';
import {VideoAssembler,planVideo,videoArguments} from '../server/runtime/video-assembly.mjs';
const tools=resolve('.cache/import-tools'),ff=join(tools,'ffmpeg.exe'),out=resolve('.cache/cover-opening-test');
test('padrão de 3 s, duração explícita e CTAs sem deslocamento',()=>{
 const input={destination:'youtube',timing:'manual',calls:[{key:'like',order:1,start:3.2,duration:.4}]};
 const plan=planVideo(input,4);assert.equal(plan.coverSeconds,3);assert.equal(plan.calls[0].start,3.2);
 assert.equal(planVideo({...input,coverSeconds:1},4).coverSeconds,1);
 assert.equal(planVideo({destination:'shorts',coverSeconds:0,calls:[]},1).coverSeconds,0);
 assert.throws(()=>planVideo({destination:'shorts',calls:[]},1),/Reduza.*Sem capa/);
 const args=videoArguments({input:'source',cover:'cover',arts:{like:'like'},output:'out',plan});
 assert.ok(args.includes('0:a:0?'));assert.ok(args.some(s=>s.includes('st=2.65:d=0.35')));
 assert.ok(!args.some(s=>/adelay|apad|concat/.test(s)));
});
test('render real: abertura total, transição, áudio imediato, duração e clipe curto',{timeout:180000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gmm-cover-opening-')),config=configuration({GMM_DATA_DIR:dir,GMM_MIN_FREE_MIB:'0'}),store=new Store(dir),library=new MediaLibrary(store,config),sources=new SourceImporter(store,config),assembler=new VideoAssembler(store,config,library,sources,{toolsDirectory:tools});
 mkdirSync(out,{recursive:true});const results=[];
 try{
  const source=join(dir,'source.mp4'),coverFile=join(dir,'cover.png');
  await runProcess(ff,['-v','error','-f','lavfi','-i','color=blue:size=320x180:rate=30:duration=4','-f','lavfi','-i','sine=frequency=440:duration=4','-c:v','libx264','-preset','ultrafast','-c:a','aac','-shortest',source]);
  await runProcess(ff,['-v','error','-f','lavfi','-i','color=red:size=320x180','-frames:v','1','-update','1',coverFile]);
  store.put('production','p',{id:'p',artist:'Fixture',title:'Abertura',songId:'s',version:1});
  const upload=async(file,purpose)=>{const bytes=readFileSync(file),r=assembler.begin({productionId:'p',purpose,name:purpose==='video'?'source.mp4':'cover.png',size:bytes.length});assembler.append(r.id,0,bytes);return assembler.complete(r.id);};
  const s=await upload(source,'video'),cover=await upload(coverFile,'cover'),original=fileHash(source);
  const input={productionId:'p',sourceKind:'input',sourceId:s.id,coverId:cover.id,coverAspectAcknowledged:true,calls:[],preview:true};
  const finish=async j=>{while(assembler.running.size)await new Promise(r=>setTimeout(r,25));assert.equal(assembler.get(j.id).state,'completed',JSON.stringify(assembler.get(j.id)));return assembler.outputPath(assembler.get(j.id));};
  const audioHash=async file=>(await runProcess(ff,['-v','error','-i',file,'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-'])).trim();
  await assert.rejects(()=>assembler.start({...input,destination:'tiktok',coverAspectAcknowledged:false}),/Capa em formato diferente/);
  for(const destination of ['tiktok','youtube']){
   const j=await assembler.start({...input,destination,coverAspectAcknowledged:true}),file=await finish(j);assert.equal(j.plan.coverSeconds,3);
   copyFileSync(file,join(out,destination+'.mp4'));
   const measured=await assembler.probe(file);assert.ok(Math.abs(measured.duration-4)<.1);assert.equal(await audioHash(file),await audioHash(source));
   const timing=async f=>JSON.parse(await runProcess(join(tools,'ffprobe.exe'),['-v','error','-show_streams','-of','json',f])).streams.find(s=>s.codec_type==='audio').start_time;
   assert.equal(await timing(file),await timing(source));
   const samples=[];
   for(const [label,time]of [['inicio',0],['antes-fade',2.5],['transicao',2.8],['apos',3.1]]){
    await runProcess(ff,['-v','error','-ss',String(time),'-i',file,'-frames:v','1','-update','1',join(out,destination+'-'+label+'.png')]);
    const stats=await runProcess(ff,['-v','info','-ss',String(time),'-i',file,'-vf','crop=2:2:(iw-2)/2:(ih-2)/2,signalstats,metadata=print:file=-','-frames:v','1','-f','null','-']);
    // U is low for the red cover and high for the blue source; transition lies between.
    const u=Number(/lavfi.signalstats.UAVG=(\S+)/.exec(stats)?.[1]);samples.push(u);
   }
   assert.ok(samples[0]<130&&samples[1]<130);assert.ok(samples[2]>samples[1]+15&&samples[2]<samples[3]-15);assert.ok(samples[3]>200);
   results.push({destination,coverSeconds:3,fadeStart:2.65,fadeDuration:.35,duration:measured.duration,audioBitstreamUnchanged:true,audioStartUnchanged:true,samples});
  }
  const explicit=await assembler.start({...input,destination:'youtube',coverSeconds:1});await finish(explicit);assert.equal(explicit.plan.coverSeconds,1);
  const short=join(dir,'short.mp4');await runProcess(ff,['-v','error','-i',source,'-t','1.2','-c','copy',short]);const shortSource=await upload(short,'video');
  await assert.rejects(()=>assembler.start({...input,sourceId:shortSource.id,destination:'tiktok'}),/Reduza/);
  const adjusted=await assembler.start({...input,sourceId:shortSource.id,destination:'tiktok',coverSeconds:.8});await finish(adjusted);assert.ok(adjusted.plan.duration<1.4);
  const noCover=await assembler.start({...input,sourceId:shortSource.id,coverId:null,destination:'youtube'});await finish(noCover);assert.equal(noCover.plan.coverSeconds,0);
  assert.equal(fileHash(source),original);assert.equal(library.list().length,0);const shared=await assembler.start({...input,destination:'youtube',preview:false});for(const requestedDestination of ['facebook','rumble','odysee']){const reused=await assembler.start({...input,destination:'youtube',requestedDestination,preview:false});assert.equal(reused.id,shared.id);assert.ok(reused.reused);assert.equal(library.list().length,1);assert.equal(assembler.status('p').preset.requestedDestination,requestedDestination);}const sharedVertical=await assembler.start({...input,destination:'tiktok',preview:false});for(const requestedDestination of ['facebook_reels','instagram']){const reused=await assembler.start({...input,destination:'tiktok',requestedDestination,preview:false});assert.equal(reused.id,sharedVertical.id);assert.ok(reused.reused);assert.equal(library.list().length,2);}
  writeFileSync(join(out,'resultado.json'),JSON.stringify({results,shortClip:'refused unless adjusted or no cover',savedExplicitSeconds:1,originalUnchanged:true,multipleDestinationsReuseTwoPhysicalExports:true,operationalDataUsed:false},null,2));
 }finally{await assembler.close();await sources.close();store.close();assert.ok(resolve(dir).startsWith(join(tmpdir(),'gmm-cover-opening-')));rmSync(dir,{recursive:true,force:true});}
});
