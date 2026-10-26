# Verificação da pesquisa de anos e gêneros dos clipes

**Etapa posterior concluída:** o titular autorizou a integração flexível e os dados foram aplicados na2.13.0. Este documento registra a conferência anterior; a indicação de aplicação não executada abaixo é histórica. Estado atual em [INTEGRACAO_PESQUISA_CLIPES_V213.md](INTEGRACAO_PESQUISA_CLIPES_V213.md).

25/10/2026. Solicitação: conferir o levantamento recebido de outro chat para organizar o acervo e identificar os anos. Esta etapa verifica e prepara diferenças; não aplica metadados no painel.

**Parecer:** pacote íntegro, correspondente ao acervo real e útil como pesquisa documentada. Aprovado na conferência estrutural e de vínculos, com ressalvas para aplicação dos metadados. Não equivale a 165 gravações historicamente identificadas nem a 162 datas de videoclipe confirmadas.

## Conferência executada

- ZIP recebido: `2-Golden_Pesquisa_165_Clipes_184_Origens_2026-10-25-1-.zip`. SHA-256: `fde96a48e08f901b3db1d32c292bd150b449770ff7f274873c43eff5fed91c33`.
- CRC de todos os membros e 13 hashes internos conferidos; todos os arquivos de conteúdo cobertos.
- **17 verificações passaram**: estrutura, IDs, referência ao manifesto, origens, arquivos, chaves de fontes, tipos/anos/décadas, equivalência CSV/JSON e integridade dos vídeos.
- **165 fichas / 165 IDs / 165 hashes únicos**, com cobertura exata do manifesto e dos IDs retornados pelo serviço operacional.
- **184 origens** corretamente vinculadas; 19 repetições binárias não são novas músicas. Nenhuma origem perdida.
- **165 vídeos reais** relidos integralmente para SHA-256, além de existência e tamanho: 3.361.307.296 bytes, todos correspondentes à pesquisa/manifesto. A conferência de bytes não é audição nem validação histórica.
- Metadados `original`, duração, caminho e origens preservados. Não houve alteração física, exclusão, renomeação ou fusão de vídeos.
- 277 registros de fonte, com 277 URLs distintas; todas as referências internas resolvidas. URLs foram verificadas estruturalmente, sem consulta externa integral das 277 páginas.
- Serviço atual consultado em leitura: 165 entradas; campos de ano/gênero ainda vazios nessa camada. O navegador tem estado próprio, que não foi exportado nem reconciliado campo a campo nesta conferência.

Evidências privadas: `.cache/verificacao-pesquisa-clipes-20261025/RESULTADO.json`, `DIFERENCAS_PARA_REVISAO.json`, `VERIFICACAO_REPRODUZIVEL.ipynb`, `verificar.py`, `servico-atual.json` e cópia extraída em `recebido/`. O notebook contém o código executado e o resultado registrado. O JSON de diferenças tem `aplicar=false` em todas as linhas: não é um importador automático.

## Cobertura declarada na pesquisa, recalculada

| Situação | Clipes | Significado |
|---|---:|---|
| Pesquisado documentalmente | 119 | Propostas sem ressalva específica assinalada; não são 119 identidades audiovisuais integralmente confirmadas |
| Pesquisado com ressalvas | 43 | Revisões de versão, evento, participantes, idioma ou gênero |
| Pendente de identidade/data | 3 | Fichas 019, 104 e 108; manter dados não estabelecidos nulos |
| Com ano e gênero propostos | 162 | Soma das duas primeiras categorias; não chamar de ano confirmado do videoclipe |

| Década da referência musical proposta | Clipes |
|---|---:|
| 1960 | 4 |
| 1970 | 26 |
| 1980 | 50 |
| 1990 | 71 |
| 2000 | 11 |
| Pendente | 3 |

As 15 referências fora de 1970–1999 devem continuar disponíveis e identificadas pela década efetiva; o nome da coleção de origem não determina o ano da música. Estes números descrevem as propostas do pacote, não uma nova validação histórica exaustiva.

## Pontos que precisam orientar a integração

| Prioridade | Evidência | Risco prático | Tratamento proposto |
|---|---|---|---|
| Alta | 38 fichas têm `ano_referencia` diferente de `ano_single` | Um único campo chamado Ano do clipe torna diferentes critérios indistinguíveis | Mostrar Ano da música/referência; manter ano do single e data do vídeo/show em campos separados |
| Alta | 21 fichas têm apresentação, nenhuma data de arquivo confirmada nesse campo; há candidatos e conflitos | Transformar data de show declarada em ano musical ou confirmação histórica | Preservar candidato, fonte, status e data confirmada separadamente; não promover por cópia |
| Alta | 43 fichas com ressalvas ainda têm `bloquear_aplicacao_automatica=false`; 20 dessas pedem revisão de variante/participantes/idioma | Um importador que confira apenas esse booleano aceitaria metadados ainda dependentes da versão | Avaliar por campo e por ressalva. O booleano significa ausência de bloqueio total declarado, não aprovação de todos os campos |
| Média | 15 fichas trazem revisão explícita de gênero por evidência contextual/divergente | Tratar contexto do artista/álbum como classificação inequívoca do arranjo local | Manter gênero amplo editorial e estilos, origem da classificação e revisão visíveis |
| Média | 261 das 277 fontes são rotuladas como secundárias no pacote | Confundir quantidade de referências com fontes independentes que confirmam cada ficha | Preservar proveniência; reforçar fontes em conflitos, sem declarar revisão universal |
| Alta | Metadados do navegador e do serviço são independentes | Sobrescrever edição manual ou preencher só uma camada e não aparecer no painel | Comparação campo a campo no fluxo de aplicação, preservando mudanças atuais do titular |

As contagens de ressalvas se sobrepõem: 22 fichas pedem revisão de variante (incluem duas das três bloqueadas), 21 pedem evento, 15 pedem gênero e três pedem identidade/data. Não somar esses grupos para obter total de clipes.

## Casos importantes conferidos

- **Ficha 018 — Because You Loved Me:** o quadro aos 12 s foi extraído novamente do vídeo real com posicionamento preciso e conferido. Os créditos exibem título, Céline Dion e Falling Into You (1996), compatíveis com a proposta. A [discografia oficial de Céline Dion](https://www.celinedion.com/discography/falling-into-you/) confirma o álbum de 1996 e a faixa como single. É evidência favorável à correção do crédito anterior atribuído a Mabel, sem afirmar audição integral.
- **Ficha 003 — Fernando:** a ressalva do pacote está correta: o álbum Greatest Hits começou em 1975, mas Fernando foi acrescentada em edições de 1976, conforme o [site oficial do ABBA](https://abbasite.com/tracks/greatest-hits/). Não extrair automaticamente 1975 do ano inicial do álbum para a gravação inglesa.
- **Ficha 009 — Take On Me:** a [Rhino/Warner discrimina versões de 1984 e 1985](https://www.rhino.com/article/now-available-a-ha-hunting-high-low-super-deluxe-30th-anniversary-edition). Isso sustenta preservar a ressalva sobre a versão; a consulta não identifica sozinha a edição exata do MP4 local.
- **Ficha 036 — Toxic:** 2003 é a referência ao álbum; 2004 é o single na proposta. O resultado indexado do [áudio oficial](https://www.youtube.com/watch?v=tVdr_JWmnsA) registra fonograma/lançamento de álbum em 2003; abertura direta da página falhou nesta conferência. Não afirmar ano do videoclipe com base apenas nessa referência.

São verificações dirigidas a casos relevantes. Não foi refeita a pesquisa independente de todos os 165 anos nem a audição de todas as versões.

As pendências críticas seguem identificadas:

| Ficha | Arquivo identificado na origem | Pendência |
|---|---|---|
| 019 | Clipes de Musicas Romanticas e Antigas 4 | Título genérico; hipótese musical não confirmada |
| 104 | Nick / Heaven In Your Eyes / Frankfurt 96 | Identidade/versão e conflito 1996–1997; não herdar 1999 de álbum posterior |
| 108 | Olivia Newton / GREASE | Nome do filme não identifica a canção do arquivo |

## Entrega indicada para o painel

Manter os 165 IDs e arquivos como estão. Organizar por filtros e metadados, sem reorganização física que quebre os caminhos. Preservar as 184 origens e o nome original da coleção como proveniência.

1. Receber o pacote como pesquisa associada ao `clip_id`/SHA-256, com versão, fonte, data e critério do levantamento.
2. Apresentar comparação de valor atual e proposto por campo. A diferença preparada contra o serviço contém 162 propostas de ano/década/gênero, 70 alterações textuais de título e 18 de artista; parte é apenas grafia/capitalização. Isso não representa 88 erros de identificação confirmados. Edições feitas no navegador ainda precisam entrar na comparação.
3. Separar no modelo: ano de referência musical, ano do single, ano/evento da apresentação, ano de edição/remasterização, gênero amplo e estilos, além de evidência/status de cada campo. `apresentacao.ano_candidato` não preenche o ano confirmado. `albuns_contexto` não vira álbum confirmado do arquivo sem correspondência.
4. Usar os 119 registros documentais como primeiro conjunto de propostas para revisão, os 43 com ressalvas com decisão por campo e os três bloqueados sem preencher dados desconhecidos. Não marcar `curated`, identidade audiovisual validada, direitos ou publicação só por receber a pesquisa.
5. Adaptar a persistência suportada para serviço e navegador: hoje `ClipLibrary.entries()` deriva ano nulo do manifesto e `migrateClipCatalog()` preserva ano anterior do navegador, sem adotar `row.year`. Copiar JSON no servidor ou substituir `data/catalog.json` não implementa a integração completa. Incluir filtro de ano/década com todas as décadas presentes e seção de pendências.
6. Validar a aplicação por IDs, contagens, campos alterados, persistência após recarga e preservação de versões/produções/publicações. Renders, capas e postagens antigas não devem ser reescritos por atualização de metadados.

**Resultado desta etapa:** conferência e diferenças entregues. Aplicação no acervo operacional ainda não executada. Painel 2.12.0, código, banco operacional, mídia e sessão/origem preservados; nenhum reinício, render musical, envio externo ou backup nesta verificação. A associação do chat foi solicitada pela operação oficial e retornou o projeto correto; a divergência histórica da listagem permaneceu registrada. Outros chats consultados estavam inativos. Continuidade oficial em `ORGANIZACAO_PROJETO.md`.
