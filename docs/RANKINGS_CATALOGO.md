# Rankings e catálogo — staging do item 6

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
