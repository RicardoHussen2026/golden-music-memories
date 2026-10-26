# Montagem e materiais para edição externa — 2.22.0

26/10/2026. Implementação e validação local concluídas; publicação do software em andamento. Interface `a2175e06100f`; backend `9f0c5a67013a`. O serviço está ativo em `http://127.0.0.1:8877/painel.html`, na origem já utilizada pelo proprietário.

## Entrega

A janela **Preparar vídeo para publicar / Montar sequência** passou a usar cinco áreas: Vídeo e destino, Identidade, Edição e áudio, Chamadas e Conferir. No desktop, edição e prévia ficam lado a lado; os botões Amostra, Prévia completa e Exportar permanecem acessíveis. No celular, Ver prévia/Voltar à edição alterna a área de trabalho. As abas aceitam teclado. Erros de campos abrem automaticamente a seção correspondente.

Os controles existentes foram movidos, sem clonagem: arquivos escolhidos, eventos, IDs e integrações continuam os mesmos. Foram preservados capa/abertura opcionais, vinhetas no início/final, áudios/comerciais, corte e duração exata, enquadramento, movimento de imagem fixa, áudio, chamadas, padrões por destino, fila, histórico, miniatura e lixeira recuperável. As instruções longas ficam recolhidas; campos sem efeito no modo atual ficam ocultos. A prévia da fonte é identificada como aproximada; somente o resultado renderizado representa a composição completa.

## Materiais separados para CapCut

- **Catálogo → Ver clipe → Baixar música / clipe original**: copia a fonte do acervo, sem criar produção ou renderizar novamente.
- **Montagem → Vídeo e destino**: Baixar música / clipe original, inclusive arquivo importado e anexo do navegador.
- **Montagem de sequência → Edição e áudio**: Baixar esta música / clipe em cada faixa.
- **Montagem → Identidade**: Baixar capa selecionada, Baixar abertura selecionada, Baixar vinheta inicial/final.
- **Ferramentas → Aberturas** mantém Baixar MP4; **Vinhetas** mantém Baixar MP4 e, para as três peças sonoras fornecidas, Baixar MP3.
- Capas/miniaturas e MP4 final continuam com seus downloads existentes.

O download da música preserva o formato original. Um clipe MP4 continua MP4 com seu áudio; não há conversão automática para MP3 nem projeto proprietário do CapCut. Nomes musicais e extensões são enviados pelo serviço. Downloads do acervo local exigem o painel local com seu serviço disponível.

## Achados e correções

| Achado | Causa e correção |
|---|---|
| Janela estreita, longa e carregada de avisos | Layout único misturava todas as decisões; organização por áreas, prévia lateral, ações fixas e ajuda contextual |
| Alterar/remover chamadas da sequência podia reaproveitar a prévia anterior | Reordenação/remoção não marcava a coleção como alterada; agora invalida o resultado anterior e exige novo render |
| Resposta de consulta anterior podia interferir na preparação de outro job | Estado de envio separado e revisão das consultas; resultados assíncronos antigos são ignorados |
| Campos de criadores opcionais podiam bloquear a montagem | Validação limitada aos controles que afetam a montagem; erro ativo abre a área correspondente |
| Saída de faixa com precisão real era considerada inválida | `step=0.001` não aceitava, por exemplo, 292.548209 s; cortes aceitam precisão livre, sem arredondar a mídia |
| PNG próprio de chamada não era recuperado no rascunho | Arquivo agora guardado como mídia com hash e referência; pacote do navegador inclui os bytes. Referência ausente é preservada e exige reposição, sem substituição silenciosa |
| Padrão podia ser associado ao destino trocado durante gravação do PNG | Destino e configurações são capturados juntos antes da gravação assíncrona |
| Prévias podiam tocar simultaneamente | A reprodução de um player pausa os outros; fechamento pausa as mídias |
| Materiais originais exigiam navegação extra | Downloads diretos na montagem, por faixa e no visualizador do catálogo |

## Validação executada

Dados sintéticos, serviço e IndexedDB separados em `localhost:61398`; nenhum registro fictício foi inserido na operação.

- Lote de regressão: **15 testes aprovados** em quality-workflow, video-assembly, collections, bumpers, commercials e artwork-library. A primeira execução restrita teve impedimentos do ambiente em socket/renomeação temporária; a execução autorizada concluiu os 15.
- **Dois testes adicionais** de campos ativos/inativos e precisão da duração aprovados. A repetição do teste artwork-library confirmou download binário de fonte/abertura; não é contada novamente como teste diferente.
- Percurso real da interface: criação de capa dentro da montagem, seleção de abertura/vinheta, PNG personalizado, fechamento/reabertura, trecho inválido e campos opcionais sem efeito, cinco abas, desktop e viewport de **390 px**. Sem overflow horizontal do diálogo; abas têm rolagem própria. PNG restaurado no seletor após recarregar.
- Reprodução de uma fonte pausou a abertura em 1,009 s; a fonte terminou em 4 s. Nenhum erro de mídia no percurso isolado. No painel operacional, o primeiro clipe abriu com duração 292,548209 s e readyState 4.
- Prévia individual Full HD de **9 s** (vinheta de 5 s + fonte de 4 s), com chamada, reproduziu até o fim sem erro. Áudio medido em −15,99 LUFS / −1,88 dBTP.
- Sequência de duas fontes: prévia de **7 s** com duas chamadas; após retirar Curtir, exportação gerou **outro job**, com apenas Seguir aos 3 s. Final H.264/AAC, 1920×1080, 30 fps, áudio e vídeo com 7,000 s; reprodução completa e decodificação FFmpeg sem erros. Medição −16,01 LUFS / −11,18 dBTP.
- Validação fracionária reproduzida no navegador: 3,548209 s apresentava stepMismatch; após correção, mesmo valor válido, sem arredondamento.
- Cinco respostas de download comparadas por SHA-256: original do catálogo, faixa de sequência, abertura, vinheta MP4 e vinheta MP3. Todos os bytes e nomes coincidiram. Capa PNG também foi baixada pela interface.
- Pacote exportado pela interface contém a referência e os **1.326.632 bytes** do PNG personalizado, com hash igual ao arquivo guardado.
- Sintaxe dos módulos alterados e `git diff --check` aprovados. Revisão auxiliar somente leitura encontrou os dois últimos ajustes de duração fracionária e destino do padrão, corrigidos antes da ativação.

Evidências privadas, fora do Git: `.cache/montagem-v222/` contém `download-proof.json`, `portable-art.json`, `sequence-proof.json`, `mobile-identidade.png`, `desktop-sequencia.png` e comparação `before-state.json`/`after-state.json`. Renders sintéticos estão no serviço isolado `.cache/vinhetas-v221/ui-1a0ab4b0-9f3e-41ce-a4ad-ade043149e6f/`.

## Limites reais

O navegador automatizado não confirmou o salvamento físico dos MP4 via link HTTP na pasta Downloads; a entrega desses endpoints foi verificada pelos bytes, nomes e hashes. Não foi contornado controle do navegador. O clique manual no ambiente habitual continua a conferência pendente; download de capa PNG funcionou. Não declarar todos os downloads homologados pela interface.

O cenário de upload muito lento com troca concorrente de destino não foi ensaiado com limitação de rede; a correção foi inspecionada e os fluxos normais passaram. Testes audiovisuais desta release usaram fontes sintéticas curtas; não equivalem a nova revisão musical integral de uma hora, dispositivo físico móvel ou aprovação estética/auditiva do titular.

As 12 capas nostálgicas e três vinhetas sonoras da 2.21 permanecem disponíveis. Nenhuma qualidade de codificação foi reduzida, nenhum original foi substituído e nenhum vídeo foi publicado nas redes sociais.

## Ativação e continuidade

Antes do reinício não havia montagem, coletânea, download, upload ou criação de arte ativa. Depois, backend 2.22.0 e interface a2175e06100f foram conferidos. Mantidos **165 clipes, 20 produções, dez intros e seis variantes de vinheta**; hashes de histórico, coleções, fila, baixador, montagens, clipes e artes permaneceram iguais. Origem/porta e abas operacionais do titular preservadas. Código anterior recuperável no Git; mídia e dados privados não fazem parte do commit.

Publicação: aguardando fechamento do commit/push e conferência do GitHub Pages. A hospedagem pública distribui a interface; FFmpeg, acervo, dados privados e downloads locais continuam no PC.