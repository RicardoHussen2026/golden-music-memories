import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {check} from './store.mjs';
import {fileHash} from './media.mjs';
import {normalizationFilter} from './audio-quality.mjs';

export class BumperLibrary {
 constructor(store,directory){Object.assign(this,{store,directory});}
 list(){return this.store.list('artwork').filter(a=>a.kind==='bumper'&&a.state==='completed'&&!a.trashedAt).map(({id,label,width,height,duration,format,audioCodec,sha256})=>({id,label,width,height,duration,format,audioCodec,sha256}));}
 get(id){const row=this.store.get('artwork',id);check(row?.kind==='bumper'&&row.state==='completed'&&!row.trashedAt,'Vinheta indisponível. Carregue e confira o arquivo na biblioteca.',404);check(/^art-[a-f\d-]{36}\.mp4$/.test(row.file),'Arquivo de vinheta inválido.');const path=join(this.directory,row.file);check(existsSync(path)&&fileHash(path)===row.sha256,'Vinheta ausente ou alterada. Confira a biblioteca.');return {...row,path};}
 selection(input,format){const result={};for(const side of ['Start','End']){const id=input['bumper'+side+'Id'];if(!id)continue;const row=this.get(id);check(row.format===format,'Vinheta de outro formato. Prepare a variante horizontal/vertical correspondente.');result['bumper'+side]={id:row.id,label:row.label,hash:row.sha256,duration:row.duration,audio:input['bumper'+side+'Audio']!==false&&!!row.audioCodec};}return result;}
 paths(plan){const paths={};for(const key of ['bumperStart','bumperEnd'])if(plan[key]){const item=this.get(plan[key].id);check(item.sha256===plan[key].hash,'A vinheta mudou. Confira e monte novamente.');paths[key]=item.path;}return paths;}
}

export const bumperSeconds=selection=>(selection.bumperStart?.duration||0)+(selection.bumperEnd?.duration||0);
export function addBumpers(plan,selection){if(!bumperSeconds(selection))return plan;return Object.assign(plan,{...selection,bodyDuration:plan.duration,duration:plan.duration+bumperSeconds(selection),audioCopy:false});}

// Only accept silence when the sampled interval contains no configured audio.
export function silentBumperSample(plan){
 if(!bumperSeconds(plan))return plan.sourceAudioPresent===false;
 if(!plan.sample)return false;
 const start=plan.sample.start,end=start+plan.sample.duration,head=plan.bumperStart?.duration||0,bodyEnd=head+plan.bodyDuration;
 const overlaps=(a,b)=>start<b-1e-6&&end>a+1e-6;
 return !(plan.bumperStart?.audio&&overlaps(0,head))
  &&!(plan.sourceAudioPresent!==false&&overlaps(head+(plan.musicStart||0),bodyEnd))
  &&!(plan.bumperEnd?.audio&&overlaps(bodyEnd,plan.duration));
}

// Compose the optional clips before the CTA overlays. Timings remain absolute in the final video.
export function appendBumperGraph(graph,plan,last,audioLabel,indexes){
 if(!bumperSeconds(plan))return {video:last,audio:audioLabel};
 const duration=plan.bodyDuration;
 graph.push(`[${last}]trim=duration=${duration},setpts=PTS-STARTPTS,setsar=1[bumperbodyv]`);
 if(plan.sourceAudioPresent)graph.push(`[${audioLabel}]atrim=duration=${duration},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,apad=whole_dur=${duration},atrim=duration=${duration}[bumperbodya]`);
 else graph.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${duration}[bumperbodya]`);
 const pieces=[];
 for(const key of ['bumperStart','body','bumperEnd']){
  if(key==='body'){pieces.push('[bumperbodyv][bumperbodya]');continue;}
  const item=plan[key];if(!item)continue;const index=indexes[key];
  graph.push(`[${index}:v:0]trim=duration=${item.duration},setpts=PTS-STARTPTS,setsar=1,fps=30,format=yuv420p[${key}v]`);
  if(item.audio)graph.push(`[${index}:a:0]atrim=duration=${item.duration},asetpts=PTS-STARTPTS${item.audioNormalization?','+normalizationFilter(item.audioNormalization):''},aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,apad=whole_dur=${item.duration},atrim=duration=${item.duration}[${key}a]`);
  else graph.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${item.duration}[${key}a]`);
  pieces.push(`[${key}v][${key}a]`);
 }
 graph.push(pieces.join('')+`concat=n=${pieces.length}:v=1:a=1[bumperedv][bumpereda]`);
 return {video:'bumperedv',audio:'bumpereda'};
}
