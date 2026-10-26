import {POST_DESTINATIONS} from './destinations.js';

export function validateAssemblyInputs(form,get,mode){
 for(const field of form.elements){
  if(!field.willValidate||field.closest('#assembly-cover-tools,#assembly-opening-tools'))continue;
  if(field===get('targetSeconds')&&get('durationMode')?.value!=='exact')continue;
  if(field===get('sampleStart')&&mode!=='sample')continue;
  if([get('cropX'),get('cropY')].includes(field)&&get('fit').value!=='crop')continue;
  if(!field.reportValidity())return false;
 }
 return true;
}

// Move the existing controls, never clone them: FileLists, handlers and draft IDs survive.
export function mountAssemblyWorkspace({root,form,get,collection,settings}){
 const lookup=get,nodes=new Map([...root.querySelectorAll('[id]')].map(node=>[node.id,node]));get=id=>lookup(id)||nodes.get('assembly-'+id);
 const body=root.querySelector('#dialog-body'),panels=[],tabs=[],field=id=>get(id)?.closest('label');
 const element=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;};
 const move=(parent,...nodes)=>nodes.filter(Boolean).forEach(node=>parent.append(node));
 root.classList.add('assembly-workspace');
 form.noValidate=true;
 const header=element('div','assembly-workspace-head'),heading=element('div');move(heading,get('heading'),get('subtitle'));
 const headActions=element('div','actions'),view=element('button','secondary small','Ver prévia'),close=element('button','secondary small','Fechar');view.type=close.type='button';close.onclick=()=>root.close();move(headActions,view,get('cancel'),close);move(header,heading,headActions);
 const nav=element('div','assembly-navigation');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Etapas da montagem');
 const workspace=element('div','assembly-workbench'),editor=element('div','assembly-editor'),side=element('div','assembly-live');side.setAttribute('aria-label','Prévia e resultado');
 const names=['Vídeo e destino','Identidade','Edição e áudio','Chamadas','Conferir'];
 names.forEach((name,i)=>{const tab=element('button','assembly-tab'),number=element('span','assembly-tab-number',String(i+1));tab.type='button';tab.id='assembly-tab-'+i;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','assembly-panel-'+i);move(tab,number,document.createTextNode(name));nav.append(tab);tabs.push(tab);const panel=element('section','assembly-editor-panel');panel.id='assembly-panel-'+i;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.append(element('h3','assembly-section-title',name));panels.push(panel);editor.append(panel);});
 const select=(index,focus=false)=>{tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});workspace.classList.remove('show-live');view.textContent='Ver prévia';editor.scrollTop=0;if(focus)tabs[index].focus();};
 tabs.forEach((tab,i)=>{tab.onclick=()=>select(i);tab.onkeydown=event=>{let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();select(next,true);}};});
 const help=(parent,title,...nodes)=>{const box=element('details','assembly-help');box.append(element('summary','',title));move(box,...nodes);parent.append(box);return box;};
 const group=(parent,title)=>{const box=element('div','assembly-control-group');if(title)box.append(element('h4','',title));parent.append(box);return box;};
 const sourceGroup=group(panels[0],collection?'Seleção da sequência':'Arquivo de origem');move(sourceGroup,field('source'));
 if(collection)sourceGroup.append(element('p','',collection.items.length+' clipes na ordem escolhida. Ajuste os trechos em Edição e áudio.'));
 help(sourceGroup,'Importar arquivo deste computador',field('local')).hidden=!!collection;
 const destination=group(panels[0],'Destino e formato');move(destination,get('destination').closest('.destination-picker'));help(destination,'Orientações do destino',get('destination-note'));
 const cover=group(panels[1],'Capa / miniatura separada');move(cover,field('cover'),get('cover-compat'),get('cover-choices'),get('cover-tools'));
 const intro=group(panels[1],'Abertura');move(intro,get('intro-note').closest('section'));move(panels[1],get('bumpers'));
 const cut=group(panels[2],collection?'Faixas e duração':'Trecho do clipe');move(cut,get('trim-tools'));get('trim-tools').open=true;
 const framing=group(panels[2],'Imagem');move(framing,field('fit'),get('fit-note'),get('crop-tools'));
 help(framing,'Movimento para vídeo de imagem fixa',field('staticMotion'),get('static-source-label'),get('motion-note'));
 const audio=group(panels[2],'Áudio');const audioLabel=field('normalizeAudio'),audioNote=audioLabel.nextElementSibling;move(audio,audioLabel,audioNote,field('audio-visual'));
 get('calls-help').textContent='Adicione as artes e ajuste quando cada uma aparece. Os horários contam desde o início do vídeo final.';
 const calls=group(panels[3],'Curtidas, inscrição e outras chamadas');move(calls,get('calls-help'),get('add-choice').closest('.actions'),get('sequence'),get('call-distribution'));
 get('calls-heading').remove();move(panels[3],get('commercials'));
 const review=element('dl','assembly-review');review.id='assembly-review';panels[4].append(review);
 move(panels[4],get('sample-tools'),get('preset-tools'));const delivery=group(panels[4],'Opções de entrega');move(delivery,get('thumbnail'),get('queue'));help(panels[4],'Como a montagem é gerada',get('render-help'));
 const sourceView=get('source-view');sourceView.open=true;const resultTitle=element('h3','','Resultado renderizado');move(side,resultTitle,get('result'),sourceView);help(side,'Resumo da composição',get('timeline'));const technical=help(side,'Informações da fonte e duração',get('quality-note'));technical.open=true;
 const history=help(side,'Vídeos salvos e lixeira',get('saved-choice').closest('.actions'),get('trash'),get('outputs-heading'),get('outputs'),get('delete-review'),get('generated-trash'));history.hidden=!!collection;
 const toolbar=element('div','assembly-generation'),status=element('div','assembly-status'),progress=element('progress');progress.id='assembly-work-progress';progress.max=100;progress.hidden=true;progress.setAttribute('aria-label','Progresso da montagem');move(status,get('message'),progress,get('draft-note'));toolbar.append(status);
 const actions=element('div','actions');get('sample').textContent='Amostra · até 8 s';get('preview').textContent='Prévia completa';move(actions,get('sample'),get('preview'),get('export'));toolbar.append(actions);
 get('quality').remove();
 // Any older/help-only wrappers stay available without dominating the editor.
 const remainder=[...form.childNodes].filter(node=>node.textContent.trim()||node.querySelector?.('input,select,button'));
 if(remainder.length)help(panels[4],'Outras informações da edição',...remainder);
 form.replaceChildren(editor,toolbar);move(workspace,form,side);
 const contextual=[...body.children].filter(node=>node!==form&&node!==get('quality')&&node!==get('heading')&&node!==get('subtitle')&&node.textContent.trim());
 for(const node of contextual)if(!header.contains(node)&&!workspace.contains(node)&&node!==form)help(panels[0],'Sobre esta seleção',node);
 body.replaceChildren(header,nav,workspace);
 view.onclick=()=>{const open=workspace.classList.toggle('show-live');view.textContent=open?'Voltar à edição':'Ver prévia';if(open)side.scrollTop=0;};
 const reveal=target=>{const panel=target.closest('.assembly-editor-panel');if(panel)select(panels.indexOf(panel));for(let parent=target.parentElement;parent&&parent!==form;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;};
 form.addEventListener('invalid',event=>reveal(event.target),true);
 for(const button of form.querySelectorAll('[data-track-preview]'))button.addEventListener('click',()=>{workspace.classList.add('show-live');view.textContent='Voltar à edição';});
 const chosen=id=>get(id)?.selectedOptions?.[0]?.textContent||'Não selecionado';
 function update(){if(!form.isConnected)return;const s=settings(),local=get('local').files[0],hasCover=!!get('cover').value;
  get('intro-note').hidden=!get('intro').value&&!collection;
  get('crop-tools').hidden=get('fit').value!=='crop';field('audio-visual').hidden=!!collection||!((get('source-preview').readyState>0&&get('source-preview').videoWidth===0)||local&&(/audio\//.test(local.type)||/\.(mp3|m4a|wav|flac|ogg)$/i.test(local.name)));
  const rows=[['Destino',POST_DESTINATIONS[get('destination').value]?.label||'Escolha o destino'],['Fonte',collection?collection.items.length+' clipes':local?.name||chosen('source')],['Miniatura',hasCover?chosen('cover'):'Sem miniatura'],['Abertura',get('intro').value?chosen('intro'):'Sem abertura'],['Vinhetas',[s.bumperStartId?'No início':'',s.bumperEndId?'No final':''].filter(Boolean).join(' e ')||'Sem vinhetas'],['Chamadas',s.calls.length+' visuais · '+(s.commercials||[]).length+' áudios/comerciais'],['Áudio',s.normalizeAudio?'Volume equilibrado por medição':'Manter áudio da fonte']];review.replaceChildren(...rows.flatMap(([label,value])=>[element('dt','',label),element('dd','',value)]));
  const rendered=!!get('result').querySelector('video');resultTitle.hidden=!rendered;sourceView.querySelector('summary').textContent=rendered?'Consultar fonte e enquadramento':'Fonte e enquadramento';
  if(!workspace.classList.contains('show-live'))view.textContent=rendered?'Ver resultado':'Ver prévia';get('thumbnail').disabled=!hasCover||get('export').disabled;
  const msg=get('message').textContent,percent=msg.match(/(?:Montando|Cancelando|Recebendo|Medindo|Conferindo)[^%]*?(\d+)%/);progress.hidden=!percent;if(percent)progress.value=Math.min(100,Number(percent[1]));
  liveMessage.textContent=msg;liveProgress.hidden=progress.hidden;liveProgress.value=progress.value;
 }
 const liveStatus=element('div','assembly-live-status'),liveMessage=element('p'),liveProgress=element('progress');liveMessage.setAttribute('role','status');liveProgress.max=100;liveProgress.setAttribute('aria-label','Progresso da montagem');move(liveStatus,liveMessage,liveProgress);side.prepend(liveStatus);
 const singlePlayback=event=>{for(const player of root.querySelectorAll('video,audio'))if(player!==event.target&&!player.paused)player.pause();};root.addEventListener('play',singlePlayback,true);
 form.addEventListener('input',update);form.addEventListener('change',update);
 const observer=new MutationObserver(update);for(const id of ['sequence','commercial-rows','message','quality-note'])observer.observe(get(id),{childList:true,subtree:true,characterData:true});
 const resultObserver=new MutationObserver(()=>{if(get('result').querySelector('video')){get('source-preview').pause();sourceView.open=false;const metadata=get('result').querySelector(':scope > p:not(.assembly-result-caption)');if(metadata){const caption=element('p','assembly-result-caption',metadata.textContent.split(' · ').slice(0,2).join(' · '));metadata.before(caption);help(get('result'),'Dados do arquivo e composição',metadata);}}else sourceView.open=true;update();});resultObserver.observe(get('result'),{childList:true});
 const cleanup=()=>{observer.disconnect();resultObserver.disconnect();root.removeEventListener('play',singlePlayback,true);for(const player of root.querySelectorAll('video,audio'))player.pause();root.classList.remove('assembly-workspace');root.removeEventListener('gmm-dialog-replace',cleanup);root.removeEventListener('close',cleanup);};root.addEventListener('close',cleanup);root.addEventListener('gmm-dialog-replace',cleanup);
 select(0);update();
}
