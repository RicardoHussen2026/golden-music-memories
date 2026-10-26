# Baixador YouTube — API Python 2.19

## Implementação

O painel usa `engine.py` com `import yt_dlp` e `YoutubeDL`. `bridge.py` mantém o protocolo JSON-lines com Node e executa a API em uma `threading.Thread`; a fila persistente continua no serviço local. O módulo original recebido foi preservado para tipos e sondagem; seu caminho CLI não é chamado pelo painel.

- MP4 é o padrão: `bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`, com `merge_output_format='mp4'`. Essa seleção prioriza formatos MP4 disponíveis, não necessariamente a maior resolução disponível em outros contêineres.
- Extensão MP4 não garante codec. FFprobe confere os fluxos; H.264/yuv420p e AAC são copiados. Somente fluxos incompatíveis são convertidos (H.264 CRF 18/preset medium, AAC 256 kb/s). Conversão com perdas não é chamada de preservação integral. MKV mantém os codecs originais e continua disponível.
- Metadados musicais fornecidos pela fonte são gravados com `FFmpegMetadataPP`; capa com `EmbedThumbnailPP`. Não inventa artista/ano nem transforma data de upload em ano musical. Se a fonte não fornecer thumbnail, não há capa a embutir. Áudio em contêiner sem suporte à capa permanece original, com aviso.
- Progresso por fluxo: título, porcentagem, MB/s e ETA quando conhecidos. Atualizações limitadas a duas por segundo; pós-processamento mostra sua etapa. Retentativas com espera progressiva, quatro fragmentos simultâneos e os cabeçalhos/clientes padrão mantidos pelo yt-dlp. Não fixa clientes obsoletos nem extrai credenciais do navegador.
- URL `/playlist?list=...` expande a lista em tarefas individuais, inclusive acima de 500. Link `watch?v=...&list=...` continua significando apenas aquele vídeo. Até 100 links de entrada por envio; esse limite não corta os filhos de playlists. Canal/perfil não equivale a playlist.
- Cada vídeo tem estado, cancelamento, retomada e destino preservados. Reinício deixa tarefas pendentes aguardando retomada. Reenviar a playlist não duplica itens presentes e retoma falhas da mesma combinação de destino/formato. Resultados indisponíveis são informados quando retornados pelo extrator.
- Histórico MP4 em `<destino>/_Golden Informações/historico_downloads.txt`; MKV e áudio têm históricos próprios. Só grava sucesso depois da sondagem final e de um manifesto durável com SHA-256. Se falhar a cópia de entrega no Node, a retomada reutiliza o manifesto verificado. Apagar um arquivo manualmente não o remove automaticamente do histórico.
- Entrega plana mantida: `Artista — Música [id].mp4`, ou título disponível, sem 500 pastas de entrega. Trabalho interno separado em `_Golden Processamento`; CSV/JSON em `_Golden Informações`. Título, artista, álbum, ano informado e origem seguem para conferência ao catalogar. IDs evitam colisões de nomes.
- A lista distingue arquivos prontos, playlists recebidas e itens pulados pelo histórico. A busca usa a data legível, não os milissegundos do registro.

## Instalação e execução no Windows

Execute na raiz do projeto. Requer Python 3.11+, Node 24+, FFmpeg e FFprobe. O ambiente do Golden já contém as dependências; o instalador é idempotente. Não atualize o motor durante um download.

```powershell
# Versões testadas nesta entrega, dentro do ambiente isolado do projeto
.\scripts\install-media-downloader.ps1

# Atualização explícita futura para versões oficiais mais recentes
.\scripts\install-media-downloader.ps1 -Update

# Checagem individual das ferramentas já instaladas
& .\.cache\media-downloader-env\Scripts\python.exe -m pip show yt-dlp yt-dlp-ejs
& .\.cache\import-tools\ffmpeg.exe -version
& .\.cache\import-tools\ffprobe.exe -version
node --version

# Diagnóstico da integração sem baixar vídeos
& .\.cache\media-downloader-env\Scripts\python.exe -X utf8 .\server\media-downloader\bridge.py --tools .\.cache\import-tools --node (Get-Command node).Source --check

# Abrir o serviço existente; o launcher não duplica um serviço já iniciado
npm run service:start
```

O botão do painel é o ponto de entrada recomendado para playlists: `bridge.py --expand` enumera itens; o Node persiste e executa cada filho. O comando `--expand` sozinho não baixa todos os vídeos. Não troque a origem operacional `http://127.0.0.1:8877/painel.html#downloader` para usar os testes.

## Verificação

19 testes específicos: 15 Node e 4 Python, com mídia gerada localmente e extratores de teste separados. Incluem 501 entradas, persistência/reinício/retentativa, ausência de duplicação, limite de links, metadados, capa MP4 lida por Mutagen e FFprobe, áudio AAC idêntico por hash de pacotes, VP9/Opus convertido em H.264/AAC, duração preservada, decodificação integral dos arquivos sintéticos, erro final sem inclusão no histórico, importação idempotente, cancelamento, pastas e entrega plana de 50 fixtures.

```powershell
npm run test:downloader
& .\.cache\media-downloader-env\Scripts\python.exe -X utf8 tests\downloader_api_test.py
```

Evidências privadas em `.cache/baixador-v219/` e `.cache/mediadownloader-v215/test-*/RESULTADO.json`. As 501 entradas são sintéticas; não são prova de 501 downloads reais do YouTube. O titular reservou para si o teste externo. Disponibilidade, login, verificação e formatos da fonte podem impedir o download. Não há promessa de contornar todos os bloqueios, custos de API ou assinatura do motor.

Referências oficiais: [Embedding yt-dlp](https://github.com/yt-dlp/yt-dlp#embedding-yt-dlp), [Extrator YouTube](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#youtube).

## Situação

Código, 19 testes específicos e 31 testes de regressão concluídos. Percurso visual isolado conferiu envio, progresso/ETA, 501 itens, paginação, busca, cancelamento selecionado e reprodução integral do MP4 de 1 s com capa (320×180, sem erro). Em 390 px não houve transbordamento horizontal. Um conflito de cookies entre duas instâncias de teste no mesmo host foi isolado usando localhost para o ensaio; a origem operacional permanece 127.0.0.1:8877. Motor incluído na entrega acumulada 2.20.0, ativada e conferida localmente junto da ferramenta Aberturas; ver ABERTURAS_CAPAS_V220.md. Publicação do software em execução; nenhum vídeo foi publicado nas plataformas.
