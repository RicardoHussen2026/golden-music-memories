// Rebuild only the three approved generated sonic assets, without paid calls.
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {runProcess} from '../server/runtime/source-import.mjs';
const dir=resolve('media-branding'),ff=resolve('.cache/import-tools/ffmpeg.exe'),probe=resolve('.cache/import-tools/ffprobe.exe'),work=resolve('.cache/vinhetas-v221/branding-build');mkdirSync(work,{recursive:true});
const rows=JSON.parse(readFileSync(join(dir,'PROMPTS.json'),'utf8')),images=['70-vinil-sala-dourada','80-noite-em-fm','90-memoria-minidisc'],labels=['Memória Analógica','Pulso de Luz','Groove Digital'],manifest=[];
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
for(const [i,row] of rows.entries()){
 const audio=join(dir,row.slug+'.mp3'),image=resolve('templates/nostalgia/'+images[i]+'.png');
 const raw=await runProcess(ff,['-hide_banner','-v','info','-i',audio,'-af','loudnorm=I=-16:TP=-2.5:LRA=11:print_format=json','-f','null','-'],{captureStderr:true,maxOutput:1048576});const measured=JSON.parse(raw.match(/\{\s*"input_i"[\s\S]*?\}/g).at(-1));
 const af=`loudnorm=I=-16:TP=-2.5:LRA=11:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true,afade=t=in:d=0.03,afade=t=out:st=4.85:d=0.15,aresample=48000`;
 for(const format of ['horizontal','vertical']){
  const horizontal=format==='horizontal',w=horizontal?1920:1080,h=horizontal?1080:1920,filename=row.slug+'-'+format+'.mp4',id=`art-22100000-0000-4000-8000-${String(i*2+(horizontal?1:2)).padStart(12,'0')}`;
  const font="fontfile='C\\:/Windows/Fonts/georgiab.ttf'",sans="fontfile='C\\:/Windows/Fonts/arial.ttf'";
  const base=horizontal?`scale=1100:1956,crop=1100:1080:0:876,pad=1920:1080:820:0:color=0x091215,drawbox=x=0:y=0:w=870:h=1080:color=0x091215:t=fill`:`scale=1080:1920`;
  const x=horizontal?120:90,y=horizontal?310:260,fs=horizontal?92:100;
  const vf=`${base},drawtext=${sans}:text='GOLDEN MUSIC MEMORIES':fontsize=24:fontcolor=0xf4c879:x=${x}:y=${y-90},drawtext=${font}:text='Golden':fontsize=${fs}:fontcolor=0xfff4e2:x=${x}:y=${y},drawtext=${font}:text='Music Memories':fontsize=${horizontal?64:72}:fontcolor=0xfff4e2:x=${x}:y=${y+125},drawbox=x=${x}:y=${y+235}:w=160:h=3:color=0xd4a35b:t=fill,drawtext=${sans}:text='MEMÓRIAS QUE TOCAM':fontsize=24:fontcolor=0xf4c879:x=${x}:y=${y+270},fade=t=in:d=0.2,fade=t=out:st=4.8:d=0.2,setsar=1,fps=30,format=yuv420p`;
  const out=join(dir,filename);await runProcess(ff,['-v','error','-y','-threads','2','-filter_threads','1','-loop','1','-framerate','30','-i',image,'-i',audio,'-t','5','-vf',vf,'-af',af,'-map','0:v','-map','1:a','-c:v','libx264','-preset','slow','-crf','18','-threads','2','-c:a','aac','-b:a','256k','-ar','48000','-ac','2','-movflags','+faststart',out],{timeout:180000});
  const thumbnail=row.slug+'-'+format+'.png';await runProcess(ff,['-v','error','-y','-ss','1','-i',out,'-frames:v','1','-vf','scale=360:360:force_original_aspect_ratio=decrease',join(dir,thumbnail)]);await runProcess(ff,['-v','error','-i',out,'-f','null','-']);
  const info=JSON.parse(await runProcess(probe,['-v','error','-show_streams','-show_format','-of','json',out]));if(Math.abs(Number(info.format.duration)-5)>.04||info.streams[0].width!==w||info.streams[0].height!==h)throw Error('Vinheta fora da especificação.');
  manifest.push({id,kind:'bumper',label:`Golden ${70+i*10} · ${labels[i]}`,format,width:w,height:h,duration:5,audioCodec:'aac',asset:filename,audioAsset:row.slug+'.mp3',thumbnailAsset:thumbnail,sha256:hash(out),thumbnailHash:hash(join(dir,thumbnail)),sourceHash:hash(audio),size:statSync(out).size});console.log(filename+' · 5 s · '+w+'×'+h);
 }
}
writeFileSync(join(dir,'manifest.json'),JSON.stringify({version:1,items:manifest},null,2)+'\n');
