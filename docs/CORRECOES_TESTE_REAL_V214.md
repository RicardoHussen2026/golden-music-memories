# Correções do ensaio audiovisual — versão 2.14.0

Implementação e ativação local em 25/10/2026, noite de Brasília (26/10 UTC). Pedido: transformar os achados Q01–Q11 do ensaio anterior em melhorias verificadas. A autorização nova supera a restrição a propostas daquele ensaio. Nenhuma postagem externa ou publicação do software na web foi feita nesta etapa.

## Resultado e disponibilidade

Painel operacional: http://127.0.0.1:8877/painel.html. Versão 2.14.0, interface **584a69dc0662**, backend **2d7c89569843**. A aba operacional anterior do usuário foi preservada com os mesmos valores; uma aba nova carrega a interface atual. As abas antigas continuam com o JavaScript já carregado até serem atualizadas voluntariamente.

Código evoluído no checkout oficial, branch `desenvolvimento/validacao-local-p6`, preservando as alterações anteriores. Associação oficial do chat ao projeto realizada; divergência histórica da listagem do aplicativo registrada. O chat de pesquisa trabalhou em arquivos isolados fora do repositório. Não houve edição concorrente identificada do aplicativo.

## Achados, causas e correções

| Achado | Causa confirmada | Implementação | Evidência e limite |
|---|---|---|---|
| Q01 — duração exata | Soma de arquivos sem meta de corte; timestamps de concatenação AAC acrescentavam milissegundos; relógio truncava a soma | Modo exato opcional, corte explícito somente na última faixa, validação de capacidade, alinhamento dos timestamps e duração do áudio de cada segmento e normalização do contêiner sem recodificar o vídeo e duração medida na entrega | 7,000 s, 52,000 s, 60,000 s e 3600,000 s. A meta não repete faixas nem compensa seleção insuficiente com silêncio. Meta anterior à última faixa é recusada |
| Q02 — pausas entre clipes | Montagem longa ignorava entrada/saída e conservava as bordas dos arquivos | Entrada/saída por faixa, conferência da fonte, persistência do rascunho, cortes aplicados conjuntamente a imagem/áudio e capítulos recalculados | Teste sintético sem silêncio acima de 80 ms; amostra real de 60 s sem silêncio/preto acima de 150 ms. **Não existe limpeza editorial automática de todo o acervo**; cenas escuras com música exigem revisão, sem corte indiscriminado |
| Q03 — download | Links não indicavam explicitamente download. Na repetição isolada, houve resposta 401; os dois serviços locais de teste/uso compartilhavam o nome e host do cookie | Atributo de download nos links de montagem, entrega, Meu acervo e fluxo anterior de coletâneas | Download de Big in Japan confirmado no painel operacional: 120.968.523 bytes e SHA-256 idêntico ao original. A falha isolada é compatível com concorrência entre sessões de teste, sem alteração de autenticação. O bloqueio histórico de outro clique não teve causa retrospectiva comprovada |
| Q04 — pico do AAC | Alvo aplicado antes do encoder; pico pós-codificação maior que o anunciado | Margem no processamento, AAC convertido a 48 kHz, medição do arquivo final e recusa de aprovação se o pico superar −1,5 dBTP | Vídeo real: −16,13 LUFS / −2,21 dBTP. UI informa medição real, não promessa baseada na entrada. Ajuste de volume continua opcional; AAC compatível sem edição continua preservável |
| Q05 — amostra mostrava duração completa | UI usava `plan.duration` | Duração medida e intervalo original explicitados | Amostra de 4 s mostra intervalo 8–12 s; exportação correspondente mostra 12 s. Amostra não pode ser aprovada como final |
| Q06 — rascunho dizia faltar áudio | Campo não herdava informação do MP4 selecionado | Novo campo sem decisão anterior herda `audioReady` do arquivo de serviço | UI selecionou “MP4 completo com áudio”; escolha manual posterior “Ainda precisa…” persistiu após salvar/reabrir |
| Q07 — nome da thumbnail | Nome obtido da primeira música, apesar de arte coletiva | Nome usa título da sequência | PNG recebido: `Golden Music Memories - Flashback · Validação das correções - Capa - V1.png` |
| Q08 — título pesado/marca duplicada | Template musical usava a marca também como artista | Capas de sequência sem artista duplicado, título com até duas linhas e tipografia menor no horizontal | Capa e quadro do MP4 inspecionados visualmente. É ajuste de legibilidade; aprovação estética humana permanece separada |
| Q09 — chamadas exigiam PNG externo | Texto das artes era fixo; seleção de PNG não aparecia no título da chamada | Texto opcional gera PNG nas cores existentes; arquivo customizado identificado por nome e com prioridade; composição rápida usa arte escolhida | “Curta o vídeo”, “Siga o perfil”, “Deixe seu comentário” renderizados aos 30/35/40 s. Textos recuperados no rascunho. PNG local ainda precisa ser selecionado novamente ao reabrir, por ser um arquivo do navegador |
| Q10 — abertura silenciosa/inconsistência | Sequência sempre prefixava capa/intro antes da música | Escolha explícita entre música sob a abertura desde zero e música depois da abertura | Música desde zero, capa 0–3 s, intro a partir de 3 s e clipe no instante correspondente conferidos. Uma única capa/intro. O modo depois da abertura continua disponível e é informado como silencioso |
| Q11 — exportação chamada de prévia | Mesmo rótulo para todas as conclusões | Prévia, amostra e exportação identificadas separadamente; aprovação da prévia completa reutiliza bytes; mudanças invalidam resultado exibido | Exportação real mostra “Vídeo completo exportado e salvo”; aprovação unitária preserva hash e rejeita amostra/revisão desatualizada |

## Como usar as correções

1. No Catálogo, selecione os clipes, confira a ordem e abra a montagem.
2. Em **Qualidade e edição → Editar bordas e duração da sequência**, confira cada fonte e ajuste a entrada/saída quando houver sobra. Os originais permanecem inteiros.
3. Para duração fixa, escolha **Terminar na duração exata** e informe segundos: uma hora = **3600**. A seleção precisa alcançar a meta; somente a última faixa pode ser encurtada. Para preservar todos os trechos, mantenha o modo completo.
4. Escolha o início musical em **Áudio durante capa e intro**. “Desde o início” faz a música tocar sob a abertura, avançando junto com a imagem do clipe. “Depois” preserva todas as cenas, com abertura silenciosa.
5. Nas chamadas, ajuste tempos, duração e o texto opcional. PNG próprio tem prioridade. Gere amostra e depois o vídeo completo; confira a entrega antes de preparar a postagem.

## Validação executada

- 27 testes Node nas suítes selecionadas de coleções, capa, qualidade, intros, montagem, pesquisa e correções desta etapa; todos passaram. O teste de uma hora e os percursos reais de navegador foram adicionais. As verificações não abrangem toda combinação possível de mídia/configuração.
- Sequência sintética Full HD de **52 s**, gerada pelo navegador: duas faixas, cortes 1–29 s, capa, intro, três textos personalizados, áudio medido e exportação. Primeiro MP4 baixado pelo botão foi observado no disco; o download operacional posterior foi conferido por hash (Q03). PNG com nome correto permanece disponível.
- Arquivo real horizontal de **60 s**, usando trechos de Purple Rain e Big in Japan: 1920×1080, H.264, AAC 48 kHz; medido após codificação. Decodificação integral sem erro; nenhum evento de silêncio ou preto ≥150 ms nos limiares usados. Fontes relidas por SHA-256 e inalteradas.
- Sincronização real: três comparações de áudio, cerca de **5 ms**, correlações 0,9918–0,9982; três comparações de imagem com melhor correspondência no quadro previsto, correlações acima de 0,9996. Capa, intro, transição entre as fontes e chamadas inspecionadas em quadros.
- Pipeline completo de **uma hora**, com duas fontes sintéticas pequenas: final **3600,000 s**, vídeo começando em zero e faixa de áudio com 3600,000 s, AAC 48 kHz. Um defeito de timestamps descontínuos, que encurtava o áudio em 57 ms, foi corrigido com sincronização dos samples antes da concatenação; regressão de 20 s adicionada. Resolução **32×18**, 30 fps; este resultado valida a duração e o caminho longo, **não** uma nova entrega musical Full HD de uma hora.
- Individual vertical: amostra de **4 s** e exportação de **12 s**, com passagem à preparação TikTok. Áudio preenchido automaticamente e decisão manual preservada após salvar/reabrir.
- Sequência reaberta conservou entradas/saídas e os três textos. Meta impossível de 2 s recusada antes de upload/render, com orientação clara. Botões bloqueados durante render; tentativa concorrente rejeitada.
- Viewport de **390×844**: largura do documento 375 px, diálogo 345 px, conteúdo interno 330 px. Preparação legível e sem transbordamento horizontal. Viewport restaurado; nenhum celular físico foi testado.
- Serviço reativado sem jobs/fila ativos. Mesma origem e configurações; formulário operacional preservado. Mídia de teste e publicações fictícias ficaram em armazenamento separado. Um novo rascunho da coletânea operacional apareceu durante o uso do titular (00:53 UTC); foi preservado, não substituído pelo estado anterior.

## Evidências e reversão

- `acervo/VALIDACAO_CORRECOES_V214/`: vídeo real de validação de 60 s, quadros, medições e cópia deste relatório. **É um teste de trechos, não uma nova postagem pronta aprovada.**
- `.cache/correcoes-v214/`: testes, resultados, capturas, scripts, estado anterior/posterior e arquivos sintéticos. `real/VALIDACAO.json` e `real/decode.log` documentam a mídia real; `hour/RESULTADO.json` documenta a hora sintética.
- `.cache/correcoes-v214/antes/`, `changed-files.json` e `changes.patch`: antes/depois somente dos arquivos tocados nesta etapa. Uma reversão deve comparar o estado atual e preservar alterações posteriores; não aplicar rollback geral do Git. Nenhum banco aberto foi copiado para essa finalidade.

## Limites relevantes

O download operacional foi confirmado no Chrome por clique e comparação integral de SHA-256. A repetição anterior no ambiente isolado retornou 401; não representa falha reproduzida na origem operacional única. A ocorrência histórica de bloqueio pelo navegador não teve causa retrospectiva comprovada; não se alteraram suas proteções ou configurações. Outros navegadores não foram homologados.

Os dois vídeos do ensaio anterior e suas capas foram preservados; **não foram substituídos nem reeditados automaticamente**. A antiga coletânea de uma hora continua com as pausas documentadas até receber cortes editoriais por faixa e uma nova renderização. O painel agora permite essa edição. Um corte por meta exata pode interromper a última música; a interface informa essa escolha, sem anunciar que todas as faixas ficaram completas.

Não houve audição humana integral, homologação de todas as transições do acervo, teste em celular físico, envio social, validação de monetização, commit, push ou deploy web. A melhoria facilita preparação e exportação; receita e aceitação pelas plataformas não são comprovadas por esses testes.
