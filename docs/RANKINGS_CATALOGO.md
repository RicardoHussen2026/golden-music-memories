# Rankings e catálogo — staging do item 6

## Conciliação do pacote TOP30 — entrega 2.9.5, 25/10/2026

O ZIP fornecido pelo titular contém 50 seleções anuais preliminares com30 posições cada e20 posições gerais. Há17 entidades compartilhadas: **1.500+20−17=1.503 entidades de pesquisa**. Isso não constitui ranking por década, Top100 geral validado ou1.503 novas músicas. O próprio pacote informa baixa confiança editorial; URLs recebidas são proveniência declarada, não validação automática de cada posição. Algumas podem apontar para conteúdo divergente. Não se copiou o ano da lista como lançamento nem se inferiu tema romântico.

Simulação contra2.009 registros:2 novos com prova discográfica direta,3 identificadores já presentes,39 casos semelhantes/ambíguos,1.456 sem conferência suficiente e3 fora de1960–2009. Os dois novos são [Will You Love Me Tomorrow — The Shirelles, mono](https://musicbrainz.org/recording/0ca12a54-b5b1-4029-b4eb-4824eb210845) e [Only the Lonely (Know the Way I Feel) — Roy Orbison](https://musicbrainz.org/recording/08817236-aafd-4fc6-9f9b-27b85e49b6d7), ambos1960. Identidade/crédito/primeiro ano e edição Official foram conferidos em resposta MusicBrainz registrada com data/SHA e release. Isso não autentica um master de áudio ou concede direitos. A terceira consulta, Georgia on My Mind, retornouHTTP503; lote encerrado, sem repetir/burlar nem iniciar pesquisa massiva.

Aplicado ao catálogo distribuído e ao perfil Chrome habitual com backup anterior: **2.011 registros**. Pós-backup conferiu todos os2.009 registros antigos campo a campo, três produções, oito anexos e seus hashes, uma publicação e três reservas intactos; apenas um evento de auditoria e uma fila adicionados. A repetição real acrescentou0; após recarga segura da aba,2011persistiram. A fila mantém39+1456+3=**1.498 pendências**, sem incluí-las como músicas do acervo. Por década:1960=2;1970=514;1980=498;1990=490;2000–2009=507;outros/sem ano=0. Total é de gravações/versões, não certificação de composições únicas.

### Uso e recuperação

Catálogo → Adicionar e exportar → **Conciliar pesquisa**. Escolha o ZIP ou JSON de pesquisa, revise a simulação e use **Backup e adicionar N confirmados**. O fluxo cria ZIP completo do navegador antes da transação; guarde o download. Nenhum cadastro antigo é substituído. O botão sem novos salva a mesma fila sem duplicá-la; **Filas de revisão salvas** permite baixá-la. A normalização Unicode/acentos/pontuação/conjunções só propõe candidatos. Identificadores, créditos e versões prevalecem; homônimas, covers/live/remix/remaster não são fundidos por fuzzy. Atualização é aditiva e transacional, revalidada contra a base atual; divergência exige nova simulação.

O catálogo distribuído usa o processo reutilizável node scripts/apply-confirmed-catalog.mjs data/catalog.json data/catalog-confirmed-update.json (simulação); --apply cria backup local/hash, verifica concorrência e só então grava novos confirmados. Não atualiza automaticamente outros perfis IndexedDB ou SQLite; cada armazenamento tem seu backup. Não inclui download de mídia ou consultas automáticas de API. Evidências operacionais/ZIPs ficam privados em.cache/catalog-reconcile e Downloads, fora do Git; apenas metadados públicos/provas de dois registros acompanham o software.

Validação:19 testes de lógica/arquivo (identidade, versões, colisões, prova inválida, backup/idempotência);10UI isolada (simulação, transação, campos privados preservados, fila, erro, mobile e restauração);22busca,12catálogo e10versão. No perfil real, aplicação/repetição/recarga e backups com hashes foram conferidos. Sem upload externo, novas credenciais ou alteração dos MP4 aprovados. Serviço2.9.5 alinhado; publicação confirmada no commitbea8d7f, Pages40175018486 aprovado e seis hashes públicos verificados. A pesquisa antiga1.000posições e suas lacunas permanecem independentes, abaixo; a ampliação editorial não está concluída. Próximo item: filtros com os dados conhecidos, sem inventar classificações ou Top30 de década.

### Histórico anterior preservado


## Estado atual — suplemento2000–2004 conferido em25/10/2026

O staging combinado tem **1.000 posições documentadas:900 anuaisGB (1980–2009) +100 de referência histórica de vendasGB**. Não são1.000 músicas novas nem1.000 gravações autenticadas. O Top100 geral pretendido continua sem fonte/critério aprovado; só900 posições cumprem o objetivo anual. Faltam1960–1979/600posições anuais, a decisão doTop100 e a ampliaçãoTop50.

As150 posições de2000–2004 foram extraídas da primeira colunaCIN/OCC, ordenadas1–30 e comparadas visualmente nas cinco páginas de tabela. CHARTWATCH/Tobias Zywietz é fonte secundária que reproduz essas posições oficiais britânicas; CW/Pos são colunas distintas e não foram usadas como ranking oficial. Edição contemporânea não é a mesma apuração das retrospectivas1980–1999. Corrigidos DJ Ötzi truncado, travessão interno de Ignition – Remix e acentos Aserejé/Beyoncé. Transcrição extraída e normalização ficam separadas; grafias impressas como Loose Yourself/Ellis-Baxtor não foram corrigidas por suposição. As inconsistências de ano/datas na introdução2004 foram registradas, sem apagar a quarentena da antiga páginaHTML.

Arquivos: `research/rankings/staging/chartwatch-2000-2004.json` (150 fatos revisados), `research/rankings/chartwatch-review.json` (hashes/páginas/créditos/revisão), `chartwatch-summary.json` e `chartwatch-comparison.json` no staging. A base850 original, comparison/summary/quarantine anteriores e data/catalog.json permaneceram byte a byte iguais. Combinado e plano técnico ficam somente em .cache/chartwatch-reviewed, sem aplicação. O catálogo conserva2.009 IDs, dois vínculos antigos e zero músicas novas/aplicações nesta rodada. Hash6f48896fd5b403d2fd942de2811b370588bd340b036a2fa9f0a6f0e3c51e6360.

Comparação do lote150:7 créditos exatos em revisão,9 singles compostos,7 relacionados e127 sem correspondência textual. Nenhum desses estados comprova nova gravação; ano de lista não virou lançamento. No combinado são941 créditos normalizados distintos, não941 gravações confirmadas. Identidades confirmadas continuam somente as duas anteriores.

Processo reutilizável, sem rede ou importação: execute scripts/rankings-chartwatch.py com Python/pdfplumber do runtime empacotado e depois node scripts/rankings-chartwatch-stage.mjs. A revisão confere hashes do PDF/créditos e todas30posições por ano; fonte alterada exige nova revisão. A combinação recusa ano duplicado, suplemento não revisado ou crédito modificado. O coletor antigo OfficialCharts não foi ampliado silenciosamente: as150 listas secundárias ficam em suplemento explícito para não serem perdidas numa coleta futura.

Validação final:7 testes Python de extração (incluindo as cinco tabelas reais, sem pulados) e17 testes Node de staging/rankings passaram; repetição não duplica anos e originais foram reconferidos. A primeira execução de um teste de persistência falhou por EPERM no rename temporário do sandbox; repetição autorizada no contexto apropriado passou integralmente. Não foi modificado código de produção para contornar o ambiente. Versão2.9.4, serviço e vídeos não foram alterados pela pesquisa. Evidências privadas em .cache/chartwatch-reviewed/VALIDACAO.json. Próxima pesquisa só para lacunas identificadas, sem reiniciar todo levantamento.

### Checkpoints anteriores preservados

**Checkpoint25/10/2026 — pausa pela prioridade das artes:** as850 posições validadas e o catálogo2.009/hash6f48896fd5b403d2fd942de2811b370588bd340b036a2fa9f0a6f0e3c51e6360 permanecem intactos. Os cinco PDFs CHARTWATCH2000–2004 existentes foram relidos nas páginas físicas41/37/44/43/45. Extração candidata150linhas somente da colunaCIN/OCC em `research/rankings/staging/chartwatch-2000-2004.json`; NÃO VALIDADA nem somada: artista DJ Ötzi truncado, separador interno de Ignition Remix e mapeamentos incorretos de acentos identificados. Corrigir o parser, revisar todas as linhas e só então comparar/validar staging separado, sem aplicar ao catálogo por inferência. Script parcial `scripts/rankings-chartwatch.py`, com pdfplumber do Python empacotado, sem rede ou escrita operacional. Introdução2004 contém erros de ano/datas, preservados como ressalva; capa/seção/músicas identificam2004, mantendo a quarentena da fonte anterior separada. Nenhuma pesquisa massiva nova ou acesso à outra conversa. Após validar150 ainda faltarão600posições1960–1979, decisão do Top100 geral e expansãoTop50. Fontes do próprio editor: [2000](https://www.zobbel.de/cluk/CLUK2000.pdf), [2001](https://www.zobbel.de/cluk/CLUK2001.pdf), [2002](https://www.zobbel.de/cluk/CLUK2002.pdf), [2003](https://www.zobbel.de/cluk/CLUK2003.pdf), [2004](https://www.zobbel.de/cluk/CLUK2004.pdf). Reproduções secundárias das posições oficiais britânicas, não ranking mundial. Ponto de retomada em `.cache/chartwatch/CHECKPOINT.md`.

Retomada de 25/10/2026, segundo checkpoint. **Item 6 parcial, não concluído.** A ordem oficial continua somente em ORGANIZACAO_PROJETO.md. Há 850 posições documentadas e dois vínculos aplicados somente ao catálogo distribuído, sem música nova ou alteração do perfil habitual. O primeiro checkpoint de 340 posições e sua quarentena foram preservados.

## Recorte e cobertura real

Não existe ranking musical universal. O recorte de trabalho escolhido nesta fase é **Reino Unido (GB), Official Charts Company**. A consulta às duas páginas Billboard para anuais/geral retornou HTTP 402 no navegador de pesquisa; não foi contornada. Não misturar anuais americanos e britânicos sem identificar listas e mercados diferentes.

| Entrega pretendida | Staging validado | Falta levantar |
|---|---:|---:|
| Top 30 de cada ano 1960–2009: 1.500 posições | 750: 1980–1999 e 2005–2009 | 750 posições, 25 anos |
| Top 100 geral pretendido | Escolha editorial pendente | Fonte e critério ainda precisam ser definidos |
| Referência adicional de vendas históricas GB | 100 posições documentadas | Não cumpre silenciosamente o Top 100 geral/mundial |

As 850 posições têm **797 créditos distintos normalizados**, sem equivaler a 797 gravações confirmadas. Há 2 vínculos por identidade conferidos; continuam 29 créditos exatos candidatos, 1 grupo de crédito ambíguo, 41 relacionados, 38 compostos/medleys/EPs e 739 sem correspondência textual. Não declarar 739 músicas novas. Nenhuma música foi inserida. A referência Top 100 de vendas britânicas permanece pendente de aceitação editorial para o objetivo geral, e não foi rotulada mundial.

O arquivo anual navegável consultado termina em 2004. A página rotulada 2004 repete exatamente as mesmas 30 posições de 2005. **2004 foi retirado da cobertura e colocado em quarentena**, com fonte/hash/fatos preservados em research/rankings/staging/quarantine.json. A primeira contagem provisória de 370 foi corrigida para 340 antes de qualquer importação. Não usar título de página sozinho para comprovar ano dos dados.

Na retomada, as retrospectivas oficiais de 1983–1999 acrescentaram 510 posições. O parser de 1993 passou a reconhecer o cabeçalho SONG observado na tabela, sem relaxar posições/créditos. Faltam 1960–1979 e 2000–2004: 25 anos. A quarentena original de 2004 permanece; não concluir que os dados históricos não existem.

## Fontes e metodologia

- Anuais 2005–2009: páginas End of Year Singles Chart da Official Charts Company; extraídas apenas as 30 primeiras posições da tabela anual, nunca pico semanal/Weeks. Exemplo: https://www.officialcharts.com/charts/end-of-year-singles-chart/20090104/37501/ . A data técnica da URL não é data de lançamento da música. A fonte descreve o período janeiro–dezembro e a fórmula histórica de seu ranking britânico.
- Anuais 1980–1999: retrospectivas oficiais Top 50 best-selling songs publicadas em 2021, das quais se usam as 30 primeiras posições. São dados de vendas revistos; podem diferir das listas impressas originalmente. Exemplo: https://www.officialcharts.com/chart-news/the-official-top-50-best-selling-songs-of-1980__32562/ . Não misturar edição retrospectiva e original como se fossem a mesma apuração.
- Geral: primeiras 100 posições de The UK's Official best-selling songs of all time, artigo com data editorial 08/11/2023, snapshot acessado em 25/10/2026: https://www.officialcharts.com/chart-news/the-best-selling-singles-of-all-time-on-the-official-uk-chart__21298/ . Mede vendas britânicas de singles físicos e downloads, exclui streaming; não é votação de melhores músicas do mundo. Não filtrar/reordenar para fabricar outro Top 100.

O registro completo de URLs, edições e metodologia está em research/rankings/sources.json. Cada lista de staging guarda URL, publisher, mercado, data de acesso, SHA 256 do HTML, data editorial quando disponível, posições, créditos e ligação do single quando publicada. O staging contém somente fatos de catálogo, sem reproduzir comentários ou texto editorial. Não foram baixadas capas, áudio ou vídeo. Cache de HTML fica em .cache/rankings-research/, fora do Git.

`chartYear` é o ano da lista. `releaseYear` permanece nulo quando a gravação não foi identificada. No Top 100, `chartEntryYear` conserva separadamente o ano da tabela de singles; não o promove a primeiro lançamento da gravação. Há 25 posições desse Top 100 com ano informado fora de 1960–2009, marcadas para decisão de escopo. Preservar as posições de origem enquanto isso.

## Processo reutilizável

Schema: research/rankings/staging.schema.json; validação adicional e comparação em scripts/rankings-lib.mjs. Parsers públicos em scripts/rankings-source.mjs não executam scripts da página. Recusam tabela incompleta, posições repetidas, cabeçalho divergente e listas anuais com os mesmos 30 créditos em anos diferentes. HTTP negado não desencadeia tentativas de contorno.

Comandos na raiz:

```text
npm.cmd run rankings:collect
npm.cmd run rankings:collect -- --fetch
npm.cmd run rankings:stage
npm.cmd run test:rankings
```

O primeiro usa cache sem rede. `--fetch` consulta somente fontes HTTPS oficiais cadastradas cujo cache estiver ausente; não usa credenciais. Falhas são lacunas. Cache é conferido por hash/origem/data. Antes de substituir staging gerado, preserva snapshot em .cache/rankings-research/staging-history; se nenhuma lista validar, conserva o staging anterior.

O resultado source-lists.json contém os fatos de origem; comparison.json separa candidatos de planos aplicáveis; summary.json resume este checkpoint. Não são um novo catálogo nem dados já inseridos no Chrome.

Comparação automática não remove live/remix/remaster para fingir igualdade. Aliases de artista/título exigem fonte/data em aliases.json e só geram candidatos. Título/artista exatos, fuzzy, ano da lista, cover/regravação, single duplo e metadados MusicBrainz existentes não provam sozinhos a gravação do single. O plano só autoriza vínculo/inserção com Recording ID e evidência específica de conferência do single. Ausente também precisa de ano de lançamento verificado. Direitos permanecem pendentes.

O aplicador `node scripts/rankings-plan.mjs apply CAMINHO_DO_PLANO CAMINHO_DO_CATALOGO` só altera IDs confirmados ou acrescenta IDs comprovadamente novos. Faz backup normal com igualdade de bytes/SHA 256, confere o hash de base contra edição concorrente, grava por arquivo temporário e preserva os outros campos/registros. Repetição do mesmo plano é idempotente. Nesta retomada, aplicou somente os dois vínculos documentados em staging/applied.json ao catálogo distribuído, sem inserir músicas. O backup normal foi conferido por bytes/SHA 256 e a segunda aplicação foi no-op. Não foi operado contra o perfil habitual. A cópia de baseline do catálogo distribuído está em .cache/rankings-baseline/manifest.json e foi conferida; não é backup do IndexedDB privado, SQLite ou mídia.

## Continuação e limites

Faltam os 25 anos indicados, resolver gravações/aliases/singles compostos e definir o Top 100 geral. ChartsPlus 2001/2002/2004 falhou com timeout, 2003 com 502; a consulta Node a 2004 falhou sem conteúdo. Music Week 17/01/2004 no WorldRadioHistory retornou 403; não foi contornado. EveryHit 1960s/1970s é acessível, mas só exibe dez posições anuais; SixtiesCity lista picos por artista. Não fabricar Top 30 a partir disso. Ações/URLs/motivos em research/rankings/access-log.json. Esses resultados são limites das fontes tentadas, não prova de impossibilidade de pesquisar todo o restante. Billboard 402 não foi consultada novamente.

A compatibilidade 1960–2009 foi implementada em cadastro, normalizador de metadados, backup, filtros/busca por década, ano de produção e pastas. Pasta nova 00_MUSICAS_ANOS_60; prefixos e arquivos anteriores preservados. Não foi importada música real de 1960 nem alterado ano de gravação para encaixar chartYear. O aplicador continua recusando anos fora de 1960–2009 e ausência de evidência.

O catálogo distribuído recebeu I Feel for You/Chaka Khan, lista 1984 posição 12, e I've Been Thinking About You/Londonbeat, lista 1990 posição 29, nesta última explicitamente o Recording ID da versão 7″. Evidências MusicBrainz de gravação e faixa em single em research/rankings/evidence/; resoluções conferem hash/posição/crédito de origem antes de compor o plano. Remixes/outros IDs foram conservados. O vínculo é de metadados, não uma validação do áudio privado.

Para um navegador já em uso: Catálogo → Adicionar e exportar → Backup e atualizar rankings. Baixa o ZIP normal desse navegador antes de mesclar por sourceName/Recording ID exato, sem inserir músicas ou substituir campos do proprietário. Identidade duplicada ou posição/edição divergente fica em conflito. Detalhes mostra mercado, ano da lista, posição e fonte. Repetição não duplica vínculo nem histórico. Esse comando não foi executado no Chrome habitual. Novos perfis recebem os campos na carga inicial; alterar catalog.json sozinho continua sem atualizar um perfil antigo automaticamente. ZIP do navegador não substitui backup SQLite/mídia do serviço.

A investigação dos nove matches originais não encontrou troca de artista/título: zero coincidências invertidas. Normalização candidata de conjunções/feat./The acrescenta somente um candidato nas 340 posições originais; 273 delas têm artista ausente mesmo nessa comparação. O importador histórico amostrou tags e décadas, sem critério de ranking. Isso explica boa parte da baixa sobreposição, sem comprovar que todas as ausências textuais são novas gravações. Relatório credit-diagnostics.json preserva comparação original e atual, sem fuzzy automerge.

Validação desta retomada: 12 testes de rankings, 16 verificações de UI e 14 conjuntos de regressão passaram (os 13 npm test mais versão). Incluem identidade específica, idempotência, evidência inválida, conflito, backup antes/depois e restauração em navegador independente, preservação de IDs/favoritos/notas/direitos/produção/anexo, suporte 1960 e abertura offline. UI desktop/celular inspecionada. Evidências .cache/rankings-tests/final-stage2.log, .cache/rankings-ui/ e .cache/rankings-regression/resultado.json. Nada disso homologa os 25 anos ainda faltantes ou gravações que não foram conferidas.

Baseline anterior 325359b559d2c3421f6019ff8aad9014bd050fceff0235a6a030bb3e4888a670 preservada no backup. Catálogo atual 6f48896fd5b403d2fd942de2811b370588bd340b036a2fa9f0a6f0e3c51e6360: continuam 2.009 registros, só dois campos de associação acrescentados, demais dados/IDs conferidos iguais. Não é backup de dados privados.

Versão 2.7.1 ativa somente em 127.0.0.1:8877, interface44cff2433c 7c/backend a3d5f627a62a. Atualização sem jobs ativos, sessão/contagens/hash SQLite preservados; network/publishing/worker continuam false. Perfil/abas habituais não recarregados nem mesclados. Sem mídia baixada, credencial nova, custo, commit/push/deploy externo ou publicação. O item 6 permanece parcial; a coordenação pode seguir entregas independentes mantendo suas pendências explícitas.
