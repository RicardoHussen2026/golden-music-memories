import {createHash} from 'node:crypto';
import {stamp} from './store.mjs';
export const AUDIO_TARGET={integrated:-16,truePeak:-1.5,lra:11,encodePeak:-2.5,revision:2};
export async function measureAudio(assembler,source,{start=0,duration,signal,allowSilence=false}={}){
 const id=createHash('sha256').update(JSON.stringify([source.hash,start,duration||'full',AUDIO_TARGET])).digest('hex');
 const old=assembler.store.get('audio_measurement',id);if(old)return old;
 const raw=await assembler.runner(assembler.tool('ffmpeg'),['-hide_banner','-nostats','-v','info',...(start?['-ss',String(start)]:[]),'-i',source.path,...(duration?['-t',String(duration)]:[]),'-vn','-af','loudnorm=I=-16:TP=-2.5:LRA=11:print_format=json','-f','null','-'],{timeout:2*3600000,maxOutput:2*1048576,signal,captureStderr:true});
 const block=raw.match(/\{\s*"input_i"[\s\S]*?\}/g)?.at(-1);if(!block)throw Error('Não foi possível medir o áudio desta fonte.');
 const result=JSON.parse(block),fields=['input_i','input_tp','input_lra','input_thresh','target_offset'];
 if(allowSilence&&result.input_i==='-inf'&&result.input_tp==='-inf')return {silent:true,integrated:null,truePeak:null,measuredAt:stamp()};
 if(fields.some(k=>!Number.isFinite(Number(result[k]))))throw Error('Áudio silencioso ou medição inválida; mantenha o volume original.');
 const row={id,sourceHash:source.hash,start,duration:duration||null,integrated:Number(result.input_i),truePeak:Number(result.input_tp),lra:Number(result.input_lra),threshold:Number(result.input_thresh),offset:Number(result.target_offset),measuredAt:stamp(),target:AUDIO_TARGET};assembler.store.put('audio_measurement',id,row);return row;
}
export function normalizationFilter(m){return `loudnorm=I=-16:TP=-2.5:LRA=11:measured_I=${m.integrated}:measured_TP=${m.truePeak}:measured_LRA=${m.lra}:measured_thresh=${m.threshold}:offset=${m.offset}:linear=true:print_format=none,alimiter=limit=0.749894:level=false,aresample=48000`;
}
