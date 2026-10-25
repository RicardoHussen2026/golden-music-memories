import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {planVideo,videoArguments} from '../server/runtime/video-assembly.mjs';

test('original preserva preset, capas e chamadas; legado contém desfoque e recorte explícito permanece',()=>{
 for(const destination of ['youtube','tiktok']){
  const p=planVideo({destination,fit:'original',coverSeconds:3,timing:'manual',calls:[{key:'like',order:1,start:3,duration:1}]},5);
  const args=videoArguments({input:'fixture',cover:'cover.png',arts:{like:'like.png'},output:'out.mp4',plan:p}),graph=args[args.indexOf('-filter_complex')+1];
  assert.equal(p.fit,'original');assert.ok(graph.includes('force_original_aspect_ratio=decrease,pad='));assert.ok(!graph.includes('boxblur')&&!graph.includes('crop='));assert.ok(graph.includes('[covered]')&&graph.includes('[likeout]'));assert.equal(p.calls[0].start,3);assert.equal(p.width,destination==='youtube'?1920:1080);
 }
 assert.equal(planVideo({destination:'youtube',calls:[]},5).fit,'contain');assert.equal(planVideo({destination:'youtube',fit:'crop',calls:[]},5).fit,'crop');
 assert.throws(()=>planVideo({destination:'youtube',coverSeconds:3,calls:[]},1),/abertura/);
 assert.throws(()=>planVideo({destination:'youtube',coverSeconds:0,timing:'manual',calls:[{key:'like',order:1,start:4,duration:2}]},5),/não cabe/);
});

test('FFmpeg real diminuto: fonte horizontal, vertical e quadrada conserva conteúdo com margens simples',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'gmm-original-fit-')),exe=join(process.env.GMM_TEST_TOOLS||'.cache/import-tools',process.platform==='win32'?'ffmpeg.exe':'ffmpeg');
 const run=args=>{const r=spawnSync(exe,args,{encoding:null,windowsHide:true,maxBuffer:1024*1024});assert.equal(r.status,0,r.stderr?.toString()||r.error?.message);return r.stdout;};
 try{for(const [w,h,W,H]of [[64,32,64,96],[32,64,96,64],[48,48,64,96]]){
  const input=join(dir,'in.mp4'),output=join(dir,'out.mp4');run(['-v','error','-y','-f','lavfi','-i',`color=c=red:s=${w}x${h}:d=1`,'-c:v','libx264','-pix_fmt','yuv420p',input]);
  const plan={...planVideo({destination:'youtube',fit:'original',coverSeconds:0,calls:[]},1),width:W,height:H};run(videoArguments({input,arts:{},output,plan}));
  const rgb=run(['-v','error','-i',output,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']),pixel=(x,y)=>Array.from(rgb.subarray((y*W+x)*3,(y*W+x)*3+3));
  assert.equal(rgb.length,W*H*3);const centre=pixel(W/2,H/2),margin=w/h>W/H?pixel(W/2,1):pixel(1,H/2);assert.ok(centre[0]>220&&centre[1]<25&&centre[2]<25);assert.ok(margin[0]<50&&margin[1]<65&&margin[2]<65);let minX=W,maxX=-1,minY=H,maxY=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=pixel(x,y);if(p[0]>180&&p[1]<45&&p[2]<45){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}assert.ok(Math.abs((maxX-minX+1)/(maxY-minY+1)-w/h)<.08,"Proporção do conteúdo deve ser preservada");
 }}finally{await rm(dir,{recursive:true,force:true});}
});
