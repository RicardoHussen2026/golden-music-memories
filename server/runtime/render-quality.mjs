import {check} from './store.mjs';
import {fileHash} from './media.mjs';
import {measureAudio} from './audio-quality.mjs';
// AAC priming from concat must not shift the picture or lengthen the delivery.
export async function alignContainer(assembler,input,output,duration,signal){
 const info=await assembler.probe(input),offset=Number(info.videoStart)||0;
 await assembler.runner(assembler.tool('ffmpeg'),['-v','error','-y','-i',input,'-itsoffset',String(-offset),'-i',input,'-map','1:v:0','-map','0:a:0','-c','copy','-t',String(duration),'-video_track_timescale','30','-movflags','+faststart',output],{signal,timeout:2*3600000});
 const measured=await assembler.probe(output);
 check(Math.abs(measured.audioDuration-duration)<.025,'O áudio final não acompanha a duração prevista; resultado não aprovado.');
 check(Math.abs(measured.duration-duration)<.002,'O arquivo final não atingiu a duração exata; resultado não aprovado.');
 return measured;
}
export async function verifyEncodedAudio(assembler,path,signal){
 const measurement=await measureAudio(assembler,{path,hash:fileHash(path)},{signal});
 check(measurement.truePeak<=-1.5,'Pico do AAC final acima de −1,5 dBTP. Arquivo não aprovado; reveja o volume.');
 return {integrated:measurement.integrated,truePeak:measurement.truePeak,measuredAt:measurement.measuredAt};
}
