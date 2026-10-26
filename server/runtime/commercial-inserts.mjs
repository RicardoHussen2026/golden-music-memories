import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {check} from './store.mjs';
import {fileHash} from './media.mjs';
import {normalizationFilter,measureAudio} from './audio-quality.mjs';

const numeric=(value,fallback,min,max)=>{const n=value===undefined?fallback:Number(value);check(Number.isFinite(n)&&n>=min&&n<=max,'Ajuste os tempos e volumes da chamada/comercial.');return n;};
export class CommercialInserts {
 constructor(store,directory){Object.assign(this,{store,directory});}
 list(){return this.store.list('artwork').filter(a=>['audio-call','video-call'].includes(a.kind)&&a.state==='completed'&&!a.trashedAt);}
 get(id){const row=this.store.get('artwork',id);check(row&&['audio-call','video-call'].includes(row.kind)&&row.state==='completed'&&!row.trashedAt,'Chamada/comercial indisponível. Confira a biblioteca.');check(/^art-[a-f\d-]{36}\.(mp4|m4a)$/.test(row.file),'Arquivo de chamada inválido.');const path=join(this.directory,row.file);check(existsSync(path)&&fileHash(path)===row.sha256,'Arquivo da chamada ausente ou alterado.');return {...row,path};}
 selection(input,total){check(input===undefined||Array.isArray(input),'Lista de chamadas inválida.');const rows=input||[];check(rows.length<=30,'Use até 30 inserções por montagem.');const result=rows.map((r,i)=>{const art=this.get(r.artworkId),at=numeric(r.at,0,0,total),sourceStart=numeric(r.sourceStart,0,0,art.duration),duration=numeric(r.duration,art.duration-sourceStart,.2,art.duration-sourceStart+.01);check(at+duration<=total+.001,'Uma chamada/comercial ultrapassa o fim do vídeo.');const layout=r.layout||'corner';check(['corner','full'].includes(layout),'Posição visual inválida.');const corner=r.corner||'bottom-right';check(['top-left','top-right','bottom-left','bottom-right'].includes(corner),'Canto do comercial inválido.');return {artworkId:art.id,label:art.label,hash:art.sha256,kind:art.kind,at,sourceStart,duration,fullDuration:duration,offset:0,volume:numeric(r.volume,1,0,1.5),musicVolume:numeric(r.musicVolume,.25,0,1),audio:!!art.audioCodec,layout,corner,widthFraction:numeric(r.widthFraction,.35,.2,.8),fade:numeric(r.fade,.15,0,Math.min(1,duration/2))};}).sort((a,b)=>a.at-b.at);for(let i=1;i<result.length;i++)check(result[i].at>=result[i-1].at+result[i-1].duration-.001,'As chamadas/comerciais se sobrepõem. Ajuste os horários.');return result;}
 paths(rows=[]){return rows.map(row=>{const item=this.get(row.artworkId);check(item.sha256===row.hash,'Chamada alterada; confira e gere novamente.');return item.path;});}
}

export function splitCommercials(rows,start,duration){const end=start+duration;return rows.filter(r=>r.at<end&&r.at+r.duration>start).map(r=>{const a=Math.max(start,r.at),b=Math.min(end,r.at+r.duration);return {...r,at:a-start,sourceStart:r.sourceStart+a-r.at,duration:b-a,offset:(r.offset||0)+a-r.at};});}
export const commercialAudioInSample=plan=>(plan.commercials||[]).some(r=>r.audio&&r.volume>0&&r.at<(plan.sample?.start||0)+(plan.sample?.duration||plan.duration)&&r.at+r.duration>(plan.sample?.start||0));
export async function measureCommercials(assembler,plan,files,signal){for(const [i,row] of (plan.commercials||[]).entries())if(row.audio&&row.volume>0){const measurement=await measureAudio(assembler,{path:files[i],hash:row.hash},{start:Math.max(0,row.sourceStart-(row.offset||0)),duration:row.fullDuration||row.duration,signal,allowSilence:true});if(!measurement.silent)row.audioNormalization=measurement;}}

export function commercialGraph(graph,plan,last,audio,indexes){
 const rows=plan.commercials||[];if(!rows.length)return {video:last,audio};
 // One continuous envelope also when a commercial crosses a collection track.
 let base=audio;
 if(!base){graph.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${plan.duration}[commercialsilence]`);base='commercialsilence';}
 const envelopes=rows.filter(r=>r.audio&&r.volume>0&&r.musicVolume<1).map(r=>{const x=`(t-${r.at}+${r.offset||0})`,d=r.fullDuration||r.duration,f=r.fade;if(!f)return `if(between(${x},0,${d}),${r.musicVolume},1)`;return `(1-${1-r.musicVolume}*max(0,min(1,min(${x}/${f},(${d}-${x})/${f}))))`;});
 graph.push(`[${base}]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,apad=whole_dur=${plan.duration},atrim=duration=${plan.duration},asetnsamples=n=1024:p=0${envelopes.length?",volume='"+envelopes.join('*')+"':eval=frame":''}[commercialbase]`);
 const audios=['[commercialbase]'];
 rows.forEach((r,i)=>{const index=indexes[i],tag='commercial'+i,offset=r.offset||0,d=r.fullDuration||r.duration,fade=r.fade;
  if(r.kind==='video-call'){
   const w=r.layout==='full'?plan.width:Math.round(plan.width*r.widthFraction/2)*2,h=r.layout==='full'?plan.height:Math.round(plan.height*r.widthFraction/2)*2;
   const visualFade=fade?`,fade=t=in:st=0:d=${fade}:alpha=1,fade=t=out:st=${d-fade}:d=${fade}:alpha=1`:'';
   graph.push(`[${index}:v:0]trim=start=${r.sourceStart}:duration=${r.duration},setpts=PTS-STARTPTS+${offset}/TB,scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=rgba${visualFade},setpts=PTS-STARTPTS+${r.at}/TB[${tag}v]`);
   const x=r.layout==='full'?'0':r.corner.endsWith('right')?'W-w-W*0.04':'W*0.04',y=r.layout==='full'?'0':r.corner.startsWith('bottom')?'H-h-H*0.04':'H*0.04';
   graph.push(`[${last}][${tag}v]overlay=x=${x}:y=${y}:enable='gte(t,${r.at})*lt(t,${r.at+r.duration})':eof_action=pass:repeatlast=0[${tag}out]`);last=tag+'out';
  }
  if(r.audio&&r.volume>0){const env=fade?`,asetpts=PTS-STARTPTS+${offset}/TB,afade=t=in:st=0:d=${fade},afade=t=out:st=${d-fade}:d=${fade},asetpts=PTS-STARTPTS`:'';graph.push(`[${index}:a:0]atrim=start=${r.sourceStart}:duration=${r.duration},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo${r.audioNormalization?','+normalizationFilter(r.audioNormalization):''}${env},volume=${r.volume},adelay=${Math.round(r.at*1000)}:all=1[${tag}a]`);audios.push(`[${tag}a]`);}
 });
 graph.push(audios.join('')+`amix=inputs=${audios.length}:duration=first:normalize=0${audios.length>1?",alimiter=limit=0.749894:level=false:latency=1":""},atrim=duration=${plan.duration}[commercialmixed]`);
 return {video:last,audio:'commercialmixed'};
}
