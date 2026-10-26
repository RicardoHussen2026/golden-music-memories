import {escapeHTML as e} from './quality.js';
const labels={pesquisado_documentalmente:'Referência pesquisada',pesquisado_com_ressalvas:'Referência com observações',pendente_identidade_ou_data:'Identificação a completar'};
export function clipResearchDetails(song){
 const r=song.metadataResearch;if(!r)return '<p>Você pode preencher o ano de referência da música e ajustar depois.</p>';
 const notes=[...new Set([...(r.notes||[]),...(r.reviews||[])])];
 const sources=(r.sources||[]).filter(s=>/^https?:\/\//i.test(s.url));
 const names={title:'música',artist:'artista',year:'ano',genre:'gênero'};
 return `<details class="clip-research"><summary>Pesquisa e fontes · ${e(labels[r.status]||'Referência importada')}</summary>
 <p>Ano de referência da música: <b>${e(r.proposed.year??'A completar')}</b> · Single: ${e(r.singleYear??'Não informado')}. O ano da gravação ou do show pode ser diferente.</p>
 ${r.styles?`<p>Estilos: ${e(r.styles)}</p>`:''}
 ${r.performance?`<p>Apresentação: ${r.performance.ano_confirmado_arquivo?e(r.performance.ano_confirmado_arquivo):r.performance.ano_candidato?e(r.performance.ano_candidato)+' (referência a conferir)':r.performance.anos_em_conflito?'datas citadas '+e(r.performance.anos_em_conflito.join(' / ')):'data a completar'}.</p>`:''}
 ${song.metadataConflicts?.length?`<p>Suas escolhas foram mantidas em: ${song.metadataConflicts.map(f=>names[f]).join(', ')}.</p>`:''}
 ${notes.length?`<ul>${notes.map(n=>`<li>${e(n)}</li>`).join('')}</ul>`:''}
 <p>Identificação recebida na origem: ${e(r.sourceOriginal?.artista)} — ${e(r.sourceOriginal?.titulo)}. ${e(r.sourceOriginal?.versao||'')}</p>
 <ul>${sources.map(s=>`<li><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.titulo||s.url)}</a> · ${e(s.tipo||'fonte')}</li>`).join('')}</ul>
 <small>Pesquisa de ${e(r.researchDate)}. Informações usadas de forma flexível para organizar o acervo; podem ser corrigidas a qualquer momento.</small></details>`;
}
