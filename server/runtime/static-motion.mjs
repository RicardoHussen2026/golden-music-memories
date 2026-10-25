import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {check} from './store.mjs';

export function staticMotionGraph(width,height){
 const W=width,H=height,bw=Math.ceil(W*1.082/2)*2,bh=Math.ceil(H*1.082/2)*2,blur=Math.min(24,Math.max(1,Math.floor(Math.min(W,H)/4))),pan=Math.min(8,W*.007),bx=Math.min(12,W*.011),by=Math.min(8,H*.007);
 const factor='(0.94+0.04*(1-cos(2*PI*t/8))/2)',fit=`min(${W}/iw,${H}/ih)`;
 return `[0:v]fps=30,split[motionbg][motionfg];[motionbg]scale=${bw}:${bh}:force_original_aspect_ratio=increase,crop=${W}:${H}:x='(iw-ow)/2+${bx}*sin(2*PI*t/8)':y='(ih-oh)/2+${by}*cos(2*PI*t/8)',boxblur=${blur}:2,eq=brightness=-0.15,setsar=1[motionback];[motionfg]scale=w='trunc(iw*${fit}*${factor}/2)*2':h='trunc(ih*${fit}*${factor}/2)*2':eval=frame,setsar=1[motionfront];[motionback][motionfront]overlay=x='(W-w)/2+${pan}*sin(2*PI*t/8)':y=(H-h)/2,setsar=1,format=yuv420p[base]`;
}

// Bounded samples reject visible changes; explicit operator confirmation is
// still required. This is not certification that every source frame is static.
export async function inspectStaticSource(runner,ffmpeg,input,work,duration,{signal}={}){
 const count=Math.min(9,Math.max(3,Math.ceil(duration/4)+1)),times=Array.from({length:count},(_,i)=>Math.max(0,(duration-.15)*i/(count-1))),frames=[];
 for(const [i,time]of times.entries()){
  check(!signal?.aborted,'Montagem cancelada.');const output=join(work,'static-check-'+i+'.gray');
  await runner(ffmpeg,['-hide_banner','-v','error','-y','-threads','1','-filter_threads','1','-protocol_whitelist','file,pipe','-ss',String(time),'-i',input,'-frames:v','1','-vf','scale=32:32:flags=area,format=gray','-threads','1','-f','rawvideo',output],{signal,timeout:30000,maxOutput:1024});
  const bytes=readFileSync(output);check(bytes.length===1024,'Não foi possível conferir a imagem fixa desta fonte. Use Sem movimento e confira a prévia.');frames.push(bytes);
 }
 let maxMeanDifference=0,maxChangedFraction=0;for(const frame of frames.slice(1)){let sum=0,changed=0;for(let i=0;i<1024;i++){const d=Math.abs(frame[i]-frames[0][i]);sum+=d;if(d>8)changed++;}maxMeanDifference=Math.max(maxMeanDifference,sum/1024);maxChangedFraction=Math.max(maxChangedFraction,changed/1024);}
 check(maxMeanDifference<=1.25&&maxChangedFraction<=.02,'A fonte apresentou mudanças nas amostras. Use Sem movimento em clipes com cenas, textos ou imagens mudando.');
 return {version:1,samples:count,times,maxMeanDifference,maxChangedFraction,limitation:'Amostras não certificam todos os quadros; confirmação explícita do operador mantida.'};
}
