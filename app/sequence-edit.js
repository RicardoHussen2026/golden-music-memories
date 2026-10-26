// These edits affect derivatives only; source files and existing renders are immutable.
import {trimRange} from './quality.js';
export function editedSequence(items,{targetSeconds,durationMode='whole'}={}){
 const result=items.map(item=>{const range=trimRange(item,item.duration);return {...item,trimStart:range.start,trimEnd:range.end,duration:range.duration};});
 if(!['whole','exact'].includes(durationMode))throw Error('Modo de duração inválido.');
 if(durationMode==='exact'){
  const target=Number(targetSeconds),total=result.reduce((n,i)=>n+i.duration,0),beforeLast=total-result.at(-1)?.duration;
  if(!Number.isFinite(target)||target<1||target>43200)throw Error('Meta exata deve ficar entre 1 segundo e 12 horas.');
  if(target>total+.001)throw Error('Faltam músicas para atingir a meta. Adicione clipes; nenhum silêncio será acrescentado.');
  if(target<beforeLast+1)throw Error('A meta termina antes da última faixa. Retire faixas do fim ou aumente a meta.');
  const last=result.at(-1);last.duration=target-beforeLast;last.trimEnd=last.trimStart+last.duration;
 }
 return result;
}
export const displayDuration=n=>{const s=Math.max(0,Math.round(Number(n)||0));return (s>=3600?String(Math.floor(s/3600)).padStart(2,'0')+':':'')+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};

export function sequenceFields(collection,escape){return `<details><summary>Editar bordas e duração da sequência</summary><p>Entrada e saída são segundos da fonte. Corte somente trechos que conferiu. Cenas escuras podem conter música: nenhum corte automático é aplicado.</p><div class="form-grid"><label class="field">Duração<select id="assembly-durationMode"><option value="whole">Usar os trechos selecionados completos</option><option value="exact">Terminar na duração exata (encurta a última faixa)</option></select></label><label class="field">Meta exata, em segundos<input id="assembly-targetSeconds" type="number" min="1" max="43200" step="1" value="3600"></label></div><p>A meta inclui vinhetas, capa e abertura; precisa alcançar a última faixa e caber nas músicas disponíveis. Não repete músicas nem acrescenta silêncio. Para uma hora, use 3600.</p>${collection.items.map((i,n)=>`<section class="panel" data-track-index="${n}"><b>${n+1}. ${escape(i.artist)} — ${escape(i.title)}</b><small>Fonte: ${displayDuration(i.duration)}</small><div class="form-grid"><label class="field">Entrada da faixa ${n+1} (s)<input data-track-in type="number" min="0" max="${i.duration}" step="0.001" value="0"></label><label class="field">Saída da faixa ${n+1} (s)<input data-track-out type="number" min="1" max="${i.duration}" step="0.001" value="${i.duration}"></label></div><button type="button" data-track-preview>Conferir esta faixa</button></section>`).join('')}</details><label class="field">Áudio durante capa e intro<select id="assembly-musicFromStart"><option value="after">Começar depois da abertura visual</option><option value="start">Música desde o início, sob capa e intro</option></select></label><small>Desde o início: a imagem do clipe avança sob a abertura; música contínua, sem repetição. Depois da abertura: preserva cada cena do clipe, com abertura silenciosa.</small>`;}
