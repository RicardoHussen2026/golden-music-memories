import {availableParallelism,freemem} from 'node:os';
export const CONSERVATIVE_CPU=Object.freeze({id:'conservative',threads:2,filterThreads:1});
const MODERATE_CPU=Object.freeze({id:'moderate',threads:4,filterThreads:2});
export function selectRenderCpu(mode='auto',{cores=availableParallelism(),freeBytes=freemem()}={}) {
 if(!['auto','conservative','moderate'].includes(mode))throw Error('Perfil CPU inválido. Use auto, conservative ou moderate.');
 return mode!=='conservative'&&cores>=8&&freeBytes>=3*1024**3?MODERATE_CPU:CONSERVATIVE_CPU;
}
export function cpuForArguments(profile){return profile?.id==='moderate'?MODERATE_CPU:CONSERVATIVE_CPU;}
export async function runRenderCpu(runner,executable,buildArgs,options,profile,onFallback=()=>{}) {
 const requested=cpuForArguments(profile);options.signal?.throwIfAborted();
 try {await runner(executable,buildArgs(requested),options);return requested;}
 catch(error){
  if(requested.id!=='moderate'||options.signal?.aborted||error.code!=='RENDER_THREAD_RESOURCE')throw error;
  options.signal?.throwIfAborted();onFallback(CONSERVATIVE_CPU);
  await runner(executable,buildArgs(CONSERVATIVE_CPU),options);return CONSERVATIVE_CPU;
 }
}
