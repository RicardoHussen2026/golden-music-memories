import {BUILD_INFO} from './build-info.js';
export function mountVersion(){
 const footer=document.querySelector('#app-version');if(!footer)return;
 const interfaceLabel=footer.querySelector('#interface-version'),backendLabel=footer.querySelector('#backend-version');
 // Captured by this loaded module, never replaced with a later build fetched over HTTP.
 interfaceLabel.textContent=`v${BUILD_INFO.version} · Interface ${BUILD_INFO.interfaceBuild}`;
 let checking=false;
 async function updateBackend(){if(checking)return;checking=true;try{
  const response=await fetch('/api/health',{cache:'no-store',signal:AbortSignal.timeout(2500)});
  if(response.status===404){backendLabel.textContent='Somente interface · sem serviço neste endereço.';return;}
  if(!response.ok)throw Error();const health=await response.json();
  if(health.service!=='Golden Music Memories')throw Error();
  if(!health.build){backendLabel.textContent='Serviço anterior · versão não informada. Reinício necessário para identificar a atualização.';return;}
  const version=String(health.build.version||''),build=String(health.build.backendBuild||'');
  if(!/^[\w.+-]{1,60}$/.test(version)||! /^[a-f0-9]{12}$/.test(build))throw Error();
  backendLabel.textContent=`Serviço v${version} · ${build}${build===BUILD_INFO.backendBuild&&version===BUILD_INFO.version?' · corresponde a esta interface.':' · diferente do esperado por esta interface; confira a atualização e o reinício.'}`;
 }catch{backendLabel.textContent='Serviço indisponível · a versão da interface permanece identificada.';}finally{checking=false;}}
 footer.querySelector('details').addEventListener('toggle',event=>{if(event.target.open)updateBackend();});
 updateBackend();
}
