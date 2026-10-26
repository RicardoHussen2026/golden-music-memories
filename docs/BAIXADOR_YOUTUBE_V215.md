# Baixador YouTube — entrega local 2.15.0

Ferramenta instalada dentro do painel em **Ferramentas → Baixador YouTube**, na origem operacional `http://127.0.0.1:8877/painel.html`. Interface `877da3eaea3a`, serviço `7300be7e57fb`, ambos conferidos carregados. Não é atalho para programa externo.

## Uso

1. Cole um ou mais links individuais, um por linha (até 30 por envio).
2. Escolha vídeo com áudio ou áudio original. Para vídeo, escolha MP4 ou MKV e legendas em português quando disponíveis.
3. Adicione à fila. Acompanhe o progresso, cancele ou tente novamente. O processamento continua ao navegar pelo painel.
4. Ao concluir, baixe o arquivo ou abra a prévia. Alguns codecs originais exigem reprodutor compatível; MKV preserva maior variedade de codecs.
5. Para usar um vídeo no Golden, confira título, artista e coleção e clique em **Adicionar ao catálogo**. Esta ação é explícita e deduplica pelo conteúdo. Áudio não é cadastrado como clipe.

Fila persistente, execução serial, recuperação pausada após reinício. Links com playlist baixam somente o vídeo informado. Lives e playlists completas não fazem parte desta entrega. Sem conversão destrutiva do áudio para MP3; sem recompressão dos vídeos baixados. Exportações posteriores do editor continuam com seu fluxo existente.

## Instalação e arquivos

Núcleo recebido de `MediaDownloader.rar`, preservado em `server/media-downloader/media_downloader`; proveniência e hashes em `server/media-downloader/PROVENIENCIA.md`. Ambiente Python separado em `.cache/media-downloader-env`, instalado com dependências oficiais fixadas. Reinstalação local: `scripts/install-media-downloader.ps1`. Não se executaram o instalador nem o ambiente virtual distribuídos no RAR.

Adaptador Node/API em `server/runtime/media-downloader.mjs`; interface em `app/media-downloader.js`; adaptador Python em `server/media-downloader/bridge.py`. Downloads permanecem no armazenamento do serviço, em subpastas próprias. O painel informa o caminho. Arquivos anteriores de código em `.cache/mediadownloader-v215/antes/` permitem revisão/reversão das alterações sem mexer nos dados.

## Evidências

- `node --test tests/media-downloader.test.mjs tests/posting-thumbnail.test.mjs`: 3 testes aprovados. Mídia sintética de 3 s e servidor HTTP local; núcleo recebido, yt-dlp e FFmpeg reais.
- MP4, MKV, áudio nativo, arquivos baixados por API e pacotes de áudio sem alteração; inclusão explícita e idempotente no catálogo com SHA-256 preservado.
- Cancelamento real de processo, cancelamento na fila, falha simulada e nova tentativa concluída. Ajuste de caminhos longos no Windows comprovado pelo teste.
- UI operacional: seção interna, motor pronto, entrada inválida rejeitada, controles de vídeo desativados em áudio. Largura de 390 px sem transbordamento da página; navegação móvel existente permanece rolável.
- Antes/depois: 165 clipes e 20 produções; produções, publicações existentes, configurações/mídia coletiva, fila, jobs e saídas preservados. Quatro arquivos anteriores conferidos por hash. Reinício somente após fila vazia, sem job ativo.
- Evidências privadas: `.cache/mediadownloader-v215/testes.txt`, `test-*/RESULTADO.json`, `antes-ativacao.json`, `depois-ativacao.json`, `tela-desktop.png`, `tela-mobile.png`.

## Limites e ponto de parada

**O titular fará o teste real do YouTube.** Nenhum vídeo externo foi baixado durante estes testes, nenhum conteúdo foi publicado e nenhuma conta foi conectada. Extração real depende da disponibilidade do vídeo e do provedor; os testes internos não comprovam sucesso para todos os links. Não se simula aprovação humana. Instalação, integração, teste interno e ativação local concluídos; sem commit/push/deploy nesta etapa. Próxima tarefa autorizada: oito artes das chamadas; depois reforma de Meu acervo.
