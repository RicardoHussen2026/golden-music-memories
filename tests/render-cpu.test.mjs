import test from 'node:test';import assert from 'node:assert/strict';
import {selectRenderCpu,cpuForArguments,runRenderCpu} from '../server/runtime/render-cpu.mjs';
import {configuration} from '../server/runtime/config.mjs';
import {videoArguments,planVideo} from '../server/runtime/video-assembly.mjs';
import {runProcess} from '../server/runtime/source-import.mjs';
const strong={cores:12,freeBytes:8*1024**3};
test('auto conservador em máquina pequena ou memória baixa; opção anterior mantida',()=>{
 assert.equal(selectRenderCpu('auto',strong).id,'moderate');
 for(const mode of ['auto','moderate']){assert.equal(selectRenderCpu(mode,{...strong,cores:4}).id,'conservative');assert.equal(selectRenderCpu(mode,{...strong,freeBytes:2*1024**3}).id,'conservative');}
 assert.equal(selectRenderCpu('conservative',strong).threads,2);assert.equal(cpuForArguments().threads,2);assert.equal(configuration({GMM_RENDER_CPU_PROFILE:'conservative'}).renderCpuProfile,'conservative');assert.throws(()=>configuration({GMM_RENDER_CPU_PROFILE:'invalid'}));
});
test('argumentos alteram somente threads; CRF, encoder, animação, áudio e saída preservados',()=>{
 const plan=planVideo({destination:'tiktok',coverSeconds:0,calls:[]},5),base=videoArguments({input:'fixture',output:'out',arts:{},plan}),moderate=videoArguments({input:'fixture',output:'out',arts:{},plan:{...plan,cpuProfile:selectRenderCpu('auto',strong)}});
 assert.deepEqual(moderate.filter((v,i)=>v!==base[i]),['2','4','4']);assert.equal(moderate[moderate.indexOf('-crf')+1],'18');assert.equal(moderate[moderate.indexOf('-preset')+1],'veryfast');assert.notEqual(JSON.stringify(plan),JSON.stringify({...plan,cpuProfile:selectRenderCpu('auto',strong)}));
});
test('sucesso único e fallback uma vez somente em recurso de threads',async()=>{
 const profiles=[];const effective=await runRenderCpu(async(exe,args)=>{profiles.push(args[0]);if(profiles.length===1)throw Object.assign(Error('sanitized'),{code:'RENDER_THREAD_RESOURCE'});},'ffmpeg',p=>[p.id],{},selectRenderCpu('auto',strong));assert.deepEqual(profiles,['moderate','conservative']);assert.equal(effective.id,'conservative');
 let calls=0;await runRenderCpu(async()=>{calls++;},'ffmpeg',p=>[p.id],{},effective);assert.equal(calls,1);
});
test('sem fallback em cancelamento, erro de arquivo ou segunda falha',async()=>{
 for(const message of ['No space left','Invalid input','Tempo limite']){let n=0;await assert.rejects(runRenderCpu(async()=>{n++;throw Error(message);},'ffmpeg',()=>[],{},selectRenderCpu('auto',strong)));assert.equal(n,1);}
 const c=new AbortController();let n=0;await assert.rejects(runRenderCpu(async()=>{n++;c.abort();throw Object.assign(Error('x'),{code:'RENDER_THREAD_RESOURCE'});},'ffmpeg',()=>[],{signal:c.signal},selectRenderCpu('auto',strong)));assert.equal(n,1);
 n=0;await assert.rejects(runRenderCpu(async()=>{n++;throw Object.assign(Error('x'),{code:'RENDER_THREAD_RESOURCE'});},'ffmpeg',()=>[],{},selectRenderCpu('auto',strong)));assert.equal(n,2);
});
test('runner classifica thread sem expor stderr e não classifica entrada inválida',async()=>{
 await assert.rejects(runProcess(process.execPath,['-e',"console.error('pthread_create failed private detail');process.exit(1)"]),e=>e.code==='RENDER_THREAD_RESOURCE'&&!e.message.includes('private detail'));
 await assert.rejects(runProcess(process.execPath,['-e',"console.error('Invalid input');process.exit(1)"]),e=>!e.code);
});
