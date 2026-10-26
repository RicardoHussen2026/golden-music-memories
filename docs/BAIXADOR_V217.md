# Baixador YouTube — evolução 2.17.0

Entrega local concluída em 26/10/2026. Interface `d14afc9b810e`, backend `2d116409ccc8`, origem operacional preservada em `http://127.0.0.1:8877/painel.html#downloader`. Publicação do software solicitada para depois da aba financeira; nenhum vídeo foi enviado a plataformas.

## Funcionalidades entregues

- Até 100 links por envio e 100 downloads pendentes; deduplicação antes de verificar capacidade.
- YouTube/Music, Vimeo, Dailymotion, TikTok, Instagram Reels, Facebook e X/Twitter, com validação compartilhada de links individuais. O núcleo Python recebido permanece intacto; o adaptador amplia a entrada.
- Navegador de pastas dentro do painel: atalhos de locais/unidades, subpastas, filtro, pasta acima, caminho manual e cancelamento. Pasta padrão original mantida. Escolher outra pasta só afeta downloads novos; históricos e retomadas conservam seu destino.
- Fila sequencial persistente, pausa dos próximos itens, cancelamento e retomada individual/em lote.
- Busca por nome/fonte/link/data, filtros combináveis, ordenação, dez registros por página e seleção múltipla. Opções, metadados, detalhes técnicos e importação ficam recolhidos.
- Limpar erros e excluir da lista com recuperação em **Situação → Limpos**. Não apaga arquivos nem clipes. Seis falhas reais foram retiradas da lista; todos os seis registros continuam recuperáveis.
- Mensagens específicas para login/verificação, indisponibilidade, rede, pasta/espaço, contêiner e faixa não disponível. Não recomenda MKV para resolver verificação do YouTube.

## Entrega dos arquivos

Os novos vídeos/áudios ficam juntos na pasta escolhida, com nomes legíveis baseados nos metadados e sufixo de colisão. Um lote de 50 não cria 50 pastas de entrega. `_Golden Processamento` reúne a estrutura interna; `_Golden Informações` contém `INDICE_DOWNLOADS.csv` e `INDICE_DOWNLOADS.json`, atualizados ao concluir/importar. O CSV também pode ser baixado no painel.

Título, artista, álbum, ano informado, data de publicação, canal, link, duração, resolução, codecs, tamanho e hash permanecem associados. Ano da música e data de publicação são distintos. Quando só existe um título no padrão “artista — música”, a separação é identificada como sugestão. Campos desconhecidos permanecem vazios e editáveis; canal não é presumido como artista. Importação explícita aproveita os campos conferidos e conserva a deduplicação.

Arquivos entregues são cópias independentes verificadas por SHA-256. Originais do processamento permanecem separados; não se usa hardlink, que permitiria alterar ambos ao editar um deles. Pode haver uso adicional de espaço. O índice usa a data de conclusão, sem substituí-la pela data de limpeza/importação.

## Evidências

- Dez testes específicos aprovados: navegabilidade das pastas, raiz de unidade, metadados, lote de 50 fixtures, nomes únicos, índice completo, cópias independentes, data estável, paridade Node/Python, classificação de falhas, filtros, destino por tarefa, limpeza/restauração, persistência, deduplicação e erro de espaço.
- Dois testes do núcleo aprovados: downloads de MP4/MKV/áudio através de HTTP sintético local com yt-dlp/FFmpeg reais, igualdade dos pacotes de áudio, download por bytes, importação idempotente, cancelamento e retentativa.
- Três testes de catálogo/montagem aprovados, incluindo render sintético com 20 clipes e capa/intro únicas.
- UI desktop e 390 px; sem transbordamento horizontal. Limpar/restaurar seis registros sintéticos, seleção em lote, filtros, pasta escolhida/aplicada, cancelamento do seletor, pausa/continuação e importação com título editado, artista, álbum e ano de 1984 conferidos.
- Prévia sintética de 3 s reproduzida até o fim no Chrome, 320×180, H.264/AAC, sem erro do elemento de mídia. Arquivo baixado pelo botão: 303.179 bytes, SHA-256 `f2176807e689fe8515b6370b3ed932bbdd79da710f08541eaad7835e95128aec`.
- Evidências privadas em `.cache/baixador-v217/`: `operacional.json`, `operacional-desktop.png`, `baixador-desktop.png`, `seletor-mobile.png`, pastas dos testes e índices. Estado anterior do código em `antes/`.
- Após ativação: 165 clipes e 20 produções; produções, publicações existentes, configurações coletivas, fila, jobs e saídas preservados. Quatro entregas anteriores reconferidas por hash.

O lote de 50 testa a organização com arquivos sintéticos; não equivale a 50 vídeos baixados de plataformas. Fontes externas foram reconhecidas offline pelo motor instalado, sem downloads reais nessas redes. O titular realizará esse teste. Algumas fontes exigem login/verificação ou não oferecem áudio separado; isso continua sendo um limite real, indicado no painel. O seletor nativo do Windows não abriu com confiabilidade no ambiente de teste e foi substituído pelo navegador de pastas integrado, validado na interface.
