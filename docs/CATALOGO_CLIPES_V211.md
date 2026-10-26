# Catálogo de clipes e preparação de postagens — 2.11.0

**Atualização 2.13.0:** pesquisa integrada a165 fichas,162 anos/gêneros. O ano passa a ser referência musical editável, com filtros de década/ano/gênero e fontes nos detalhes. Orientações anteriores de deixar todos os anos vazios são superadas por esta aplicação autorizada. [Guia e resultado atual](INTEGRACAO_PESQUISA_CLIPES_V213.md).

Entrega local de 25/10/2026, na raiz oficial `C:\Users\RicardoPC\Documents\Codex\Golden Music Memories\golden-music-memories`, branch `desenvolvimento/validacao-local-p6`.

## Estado entregue

O painel operacional em **http://127.0.0.1:8877/painel.html#catalog** usa a biblioteca Flashback: **165 clipes únicos, 184 origens, 11h57min59s**. Os 19 arquivos binariamente repetidos continuam representados pelas referências do pacote original. Gravações com bytes distintos permanecem separadas. Não foram inventados anos, décadas, álbuns, direitos ou identidades de gravação.

Os **2.011 cadastros anteriores foram retirados da seleção ativa**. Permanecem arquivados, com os mesmos IDs, para recuperação e consulta pelas produções existentes. A comparação dos backups antes/depois confirmou igualdade integral das tabelas de **4 produções, 13 anexos, 2 publicações e 4 reservas**. O banco passou a conter 165 registros ativos e 2.011 referências arquivadas; isso não significa 2.176 clipes disponíveis.

Versão carregada: **2.11.0**, interface **d5f79ff08241**, backend **4d1c3e76ae5f**. A ativação manteve origem, porta, configuração/chave, sessão local, proteção de Host/Origin/CSRF e loopback. Rede, publicação externa e worker continuam desligados. Sem commit, push, deploy público ou postagem em redes nesta entrega.

## Uso individual

1. Em **Catálogo**, busque a música e clique **Publicar**. A produção e o clipe ficam associados automaticamente.
2. Escolha YouTube, TikTok ou outro destino/formato.
3. Escolha **Sem capa** ou uma capa da produção. **Criar / importar capa** permite usar os templates existentes ou uma imagem pronta.
4. Escolha **Sem intro** ou uma das dez variantes locais. Intros de outra proporção são identificadas e recusadas sem corte automático.
5. Adicione as chamadas desejadas e ajuste ordem, início, intervalo, duração, tamanho e posição. Sem chamadas é uma combinação válida. As oito artes do projeto continuam disponíveis.
6. Gere a prévia completa, confira e aprove. O arquivo aprovado é reaproveitado sem renderização redundante.
7. Use **Preparar textos e abrir plataforma**: o MP4 aprovado fica selecionado no formulário existente de postagem. Edite/copie os textos, baixe o arquivo e abra o destino.

O comportamento individual de áudio/intro já existente foi preservado: sem intro a capa sobrepõe o começo da imagem, com música desde zero; com intro a capa precede a música, e a intro cobre o início do clipe enquanto o áudio avança. Para MP3 é necessária imagem explicitamente escolhida. Textos/desenhos no vídeo não são links clicáveis.

## Produções longas

Marque os clipes, clique **Montar sequência**, dê um título e altere a ordem com as setas. A seleção não exige que todas as músicas já tenham produção criada.

Na sequência nova, **uma capa e uma abertura opcionais precedem o primeiro clipe**. Depois, todos os clipes selecionados tocam completos, na ordem escolhida, sem capa, intro ou pausa acrescentada entre faixas. A intro é visual; seu áudio não é misturado. O áudio integral do primeiro clipe começa depois da capa/intro. Silêncios e imagens já presentes nos originais são preservados.

Chamadas usam o tempo do vídeo final. Uma chamada que atravessa a troca de faixa é repartida entre os segmentos para continuar visível; nesse caso não é introduzido um novo fade na fronteira. As artes próprias selecionadas são verificadas por hash.

**Produções longas salvas** permite recuperar o resultado, acompanhar/cancelar uma montagem, retomar seleção interrompida e preparar título, descrição com faixas/tempos e hashtags. O registro é um rascunho local; não marca publicação externa automaticamente. Coletâneas antigas com capas por faixa continuam com suas configurações originais.

Não há limite fixo de 20 ou 100 faixas na seleção. Permanecem os limites técnicos atuais: **até 12 horas por sequência**, arquivo conforme a configuração local (padrão 10 GiB), espaço livre mínimo e limite do destino escolhido. Para mais conteúdo, divida em várias produções. Uma montagem executa por vez. A concatenação trabalha com grupos de até 24 entradas para não abrir todos os arquivos simultaneamente. O programa não corta as músicas automaticamente para caber em Shorts/Reels.

## Crescimento e continuidade

**Adicionar clipes / coleção** recebe vários vídeos locais, com nome de coleção, gênero e artista opcionais. Títulos e gênero podem ser ajustados em **Informações**. O mesmo SHA-256 associa outras coleções sem criar outra entrada musical. A importação não cria uma produção artificial no painel. Novas capas podem ser importadas no próprio fluxo de montagem; o Estúdio de capas continua disponível.

Os originais Flashback continuam em `acervo/FLASHBACK_70_80_90_2026-10-25/01_VIDEOS/`, com manifesto e miniaturas do pacote. O manifesto antigo registra o estado de entrega anterior à integração e não foi reescrito. A confirmação atual está neste relatório e nas evidências da versão 2.11.0.

O serviço fornece metadados e arquivos por IDs em `/api/clips`, com sessão local e caminhos confinados. O frontend mantém metadados, capas e produções em IndexedDB. IDs dos clipes derivam de hashes, sem associar automaticamente MBIDs antigos por nome. Os novos uploads permanecem no armazenamento do serviço. O catálogo público distribuído ficou vazio: mídia privada não é empacotada no site estático.

Seleções, configurações, ordem e resultados ficam registrados para evolução futura. Geração programada e publicação automática **não foram ativadas**. Integrações, consentimentos e políticas de rotina continuam sendo uma etapa própria.

## Validações e recuperação

- Suíte final `npm test` concluída com código de saída 0: **88 testes Node, 12 verificações de compatibilidade do catálogo e 24 verificações de UI/segurança**, sem falhas, cancelamentos ou testes pulados no conjunto Node. Os recortes abaixo se sobrepõem a essa suíte; não devem ser somados como cobertura independente. Log: `.cache/catalogo-producao-2110/TESTE_FINAL.log`.
- 3 testes de biblioteca/planejamento/render, incluindo sequência real de **20 fontes sintéticas**, duração esperada 43 s e medida 43,021354 s. Maior intervalo próximo de zero medido no trecho musical: 0,000125 s; nenhum silêncio acrescentado de 30 ms. Esse ensaio usou 320×180 para testar a sequência; os planos foram validados em Full HD. Não é uma renderização dos 20 clipes musicais reais.
- 24 verificações de UI/segurança em banco separado: migração, recuperação de referências, backup, filtros/paginação, produção individual Full HD, seleção e ordem, sequência, rascunho, outras abas, 390 px sem rolagem horizontal, importação/coleções, deduplicação, sessão, ranges e CSRF.
- 21 testes de regressão Node: montagem, capas, concatenação longa de 45 min em fixture reduzida, cancelamento, lixeira, acesso local, backups e restauração isolada.
- Intros recebidas na continuidade: 20 verificações de render real e 21 verificações de UI passaram no código aplicado. O script `test:intros`, antes sem seus arquivos de teste, foi completado.
- Conferência operacional: 165 hashes dos MP4 originais iguais ao manifesto; 13 hashes de anexos e CRC do backup verificados; 23 arquivos do serviço preservados conforme snapshot; catálogo real e miniaturas vistos no Chrome.
- O launcher recebeu apenas normalização da data lida do JSON para funcionar também no PowerShell 7, conservando a verificação exata de PID, horário, raiz e comando. Reinício e chamada idempotente de iniciar foram conferidos. Nenhuma política de execução ou proteção do Windows foi alterada.

Backups privados do navegador: `Downloads/GMM_BACKUP_2026-10-25 (17).zip` (antes) e `(18).zip` (após migração). Snapshot consistente do serviço: `.cache/publishing-private/backups/snapshot-2a7e528d-1425-4c89-a933-f501cb2fab78/`. Configuração/chave preservada separadamente em pasta privada, sem conteúdo publicado. Estado recebido do código, resultados, captura e verificações estão em `.cache/catalogo-producao-2110/`.

O ZIP do navegador não inclui SQLite/mídia do serviço. O snapshot do serviço não inclui a pasta externa `acervo/`; preserve essa pasta inteira, os ZIPs originais e a configuração/chave para recuperação completa. Testes não usaram os dados operacionais como fixtures.

**Validação humana pendente:** escolha editorial da capa, abertura, enquadramento e tempos para cada postagem real. Nenhum vídeo foi postado. A sessão/conta e a tela final de envio são controladas pela plataforma. Instagram abre a página da conta e requer **Criar**; os demais atalhos apontam ao fluxo de envio/criação disponível, podendo exigir login.

Referências de envio consultadas: [YouTube](https://support.google.com/youtube/answer/57407?co=GENIE.Platform%3DDesktop&hl=en), [Facebook](https://www.facebook.com/help/www/2862139500770200), [Odysee](https://help.odysee.tv/category-uploading/category-fileuploads/fileselection/). Não se confirmou postagem autenticada nesses destinos como parte do teste.

## Comandos de validação

`npm test` usa os testes atuais do serviço e a aceitação isolada do catálogo de clipes. `npm run test:clips` executa o recorte desta entrega; `npm run test:intros` verifica as dez intros locais. A antiga suíte que pressupunha o catálogo MusicBrainz distribuído e o servidor estático 8765 foi preservada em `test:legacy-catalog` para contexto histórico, sem representar aceitação do catálogo novo.

## Retomada por outro chat

Leia a tabela inicial de `docs/ORGANIZACAO_PROJETO.md`, este relatório e `CONTINUIDADE.md`. O checkout possui alterações anteriores preservadas e as desta entrega; não limpar/resetar. Use a origem operacional 8877. Não reimporte o catálogo legado nem reconcilie gravações por nome. A associação deste chat ao projeto foi tentada pela operação oficial, mas a listagem não confirmou persistência; raiz terminal/Git foram verificadas. Não houve edição de metadados internos do Codex.

Não há tarefa mutante, montagem ou importação deixada por este chat. O ponto de encerramento está em `.cache/catalogo-producao-2110/STOP.md`. Aguardando uso/revisão do titular ou nova solicitação; Drive e auditoria geral permanecem parados.
