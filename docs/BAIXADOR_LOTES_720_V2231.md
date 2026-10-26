# Lotes 720p — operação local 2.23.1

Pedido de 26/10/2026: iniciar o lote de links pendentes, pesquisar mais 500 fontes sem duplicidade e encadear os downloads e a entrada no acervo, priorizando agilidade e controle. A pesquisa/recebimento dos lotes está em execução; este documento não declara 807 vídeos concluídos.

## Software aplicado e verificado

- Limite de entrada/fila individual ampliado de 100 para 500 links; expansão de playlists preservada.
- Qualidade por tarefa: melhor disponível, até 720p ou até 1080p. Tarefas anteriores conservam comportamento e destino. Áudio ignora a opção de resolução.
- Em 720p, resolução e taxa de quadros têm prioridade; H.264/AAC nativo é preferido quando equivalente, evitando conversão desnecessária. O teste conserva 720p AV1 se H.264 só existir em 360p, e conserva maior FPS quando necessário.
- Um caso real anterior selecionava AV1 398+140 apesar de oferecer H.264 720p no mesmo FPS. Após o ajuste, fontes reais como Bee Gees/Too Much Heaven passaram a selecionar 136+140/AVC, sem conversão de vídeo. Isso não reduz resolução para acelerar.
- Histórico separado por qualidade; destinos persistentes por tarefa e destino específico por envio, sem substituir a pasta padrão do proprietário.
- Duas recusas consecutivas de login/verificação pausam o início dos próximos downloads. A mensagem é exibida; arquivos, registros e fila permanecem. Não há solução automática de CAPTCHA nem extração de sessão/cookies.
- Sem novas dependências. Origem 127.0.0.1:8877, chave/sessões/proteções e publicações externas preservadas.

17 testes Node e seis Python passaram com dados separados dos reais. Cobrem 500 entradas, rejeição de 501 antes de gravar, persistência de qualidade/destino, deduplicação, pausa após duas recusas, playlists 501, reinício, cancelamento, mídia MP4/MKV/áudio, metadados/capa, seleção real 720p e comparação de pacotes de áudio. Três cenários de seleção garantem preferência nativa sem baixar resolução/FPS. Sintéticos não são prova de 500 downloads reais.

```powershell
npm run test:downloader
& .\.cache\media-downloader-env\Scripts\python.exe -X utf8 tests\downloader_api_test.py
```

Ativação local: 2.23.1, interface e1594265b369, backend e0016b06f242. A ativação final aguardou o término do arquivo corrente, preservou a fila e retomou suas entradas. As 20 produções, histórico e registros anteriores do baixador permaneceram iguais nas comparações. A interface mostrou a qualidade 720p, capacidade de 500 entradas e downloads reais em progresso. Software local não equivale a versão publicada no Pages.

## Lote atual e próximo

Lote 1: 307 URLs únicas, registradas na fila real do painel com limite de 720p, MP4 e destinos em `acervo/LOTE_001_720_2026-10-26/01_BAIXADOS/<decada>`.

Lote 2: 500 URLs novas de canais verificados, 500 IDs de vídeo e 500 chaves artista/título distintas. Conferência sem sobreposição com acervo conhecido/fontes anteriores, incluindo alguns aliases e artista declarado no título da fonte. Distribuição de referência: 52/219/229 para 1970/1980/1990. Fontes, CSV, TXT e conferência em `acervo/LOTE_002_720_2026-10-26/03_CONTROLE/`.

A pesquisa adicional coletou 3.000 posições anuais e formou 2.622 candidatos novos após exclusões; 1.401 buscas produziram as 500 fontes. As listas anuais servem para descoberta: não comprovam primeiro lançamento nem ranking global. Canal verificado e título compatível não garantem ausência de marca ou edição integral; isso depende da conferência da mídia.

## Controlador contínuo no projeto

Código: `scripts/controlar-lotes-acervo.mjs`. Estado privado: `.cache/expansao-720/`. Processo e log em `processo.json`, `controlador.log` e `controlador-erros.log`. Um arquivo de controle impede dois controladores simultâneos. Não iniciar outro enquanto o atual estiver ativo.

O controlador recebe somente arquivos que o baixador declarou concluídos. Compara identidade, SHA-256, H.264/AAC, altura, duração declarada da fonte, decodificação integral e áudio não silencioso; usa GPU com fallback de software e confere amostras. Copia o arquivo validado sem mudar o original, produz miniatura, associa metadados flexíveis pela API existente e acrescenta o manifesto. Os arquivos catalogados ficam em `02_CATALOGADOS/<decada>`, com artista, título, ano de referência e ID da fonte no nome. Os anos podem ser ajustados no painel.

Versões de músicas conhecidas, divergências de artista e falhas ficam separadas no registro de conferência, sem exclusão de mídia. Foi detectado, por exemplo, um vídeo de All Saints associado pela seleção antiga a Labelle/1974; o arquivo foi preservado e não entrou automaticamente como clipe dos anos 70. Vídeos curtos recebem alerta para conferir eventual edição reduzida. Duração igual à fonte não prova a duração integral da composição.

Após o lote 1 terminar e a fila operacional estar livre, o controlador valida a seleção de 500 e envia o lote 2 em 720p. A troca real para o segundo lote ainda não havia ocorrido na primeira validação deste fluxo. A catalogação funciona enquanto os próximos downloads seguem. Pausar fila no painel impede avançar; o controlador não a libera automaticamente. Erro isolado de arquivo não encerra o restante da conferência. Margem de 30 GiB impede continuar copiando quando falta espaço.

Para retomar o controlador após conferir que o processo anterior terminou:

```powershell
node scripts/controlar-lotes-acervo.mjs .cache/expansao-720
```

O computador e os processos locais precisam permanecer em execução. O controlador não foi instalado como novo serviço de inicialização do Windows. Depois de reinício do serviço, conferir o estado da fila e retomar pelo painel; nunca iniciar dois controladores para compensar uma fila pausada.

## Evidências e limites

Conferência operacional intermediária de 26/10: 151 downloads concluídos, um em andamento e 155 aguardando, todos com limite de 720p; zero erros no recebimento. Histórico das 20 produções e downloads anteriores preservados por comparação. Esse é um retrato intermediário, não o encerramento do lote. O catálogo foi aberto em uma nova aba e exibiu a coleção do lote; Highway to Hell reproduziu sem erro (640×480, 207,10 s, readyState 4 e tempo avançando). Capturas `FILA_720.png` e `REPRODUCAO_CATALOGO.png` estão no controle privado.

Foram vistas três amostras de imagem em cada um dos primeiros 24 clipes. Não apareceu marca externa nessas amostras; isso não certifica o vídeo inteiro. Filmagens contemporâneas, apresentações e duração curta permanecem ressalvadas no controle editorial. A faixa Boys Don't Cry tem cartela final de copyright Polydor 1986; isso não altera automaticamente o ano musical de referência 1979.

O acompanhamento desta conversa está agendado a cada hora (`acompanhar-lotes-do-acervo-720p`), silencioso durante progresso normal. O processo local executa os downloads entre as conferências; o acompanhamento verifica falhas, a troca de lote e a contagem final, sem reiniciar processos saudáveis.

- `.cache/expansao-720/CONTROLADOR_STATUS.json`: lote, concluídos, falhas, pendências e pausa.
- `.cache/expansao-720/CATALOGACAO_LOTES.jsonl`: IDs, hashes, aceitos, duplicidades, identidades/arquivos a revisar e resultado da decodificação.
- `acervo/LOTE_001_720_2026-10-26/03_CONTROLE/`: índices, pacotes de metadados e amostras visuais.
- `acervo/LOTE_002_720_2026-10-26/03_CONTROLE/CONFERENCIA_500.json`: verificação da seleção seguinte, ainda não equivalente a 500 arquivos disponíveis.

A revisão humana visual é por amostras. Não há garantia de todos os frames sem marcas, nem avaliação auditiva humana integral de todos os vídeos. Referências de ano, datas de filmagem e versões permanecem distintas. Não houve postagem de vídeos nas redes. Mídia, estado e dados privados não são sincronizados por Git.

## Publicação do software e ponto de continuidade

Commit `77174fefdd74cb982d8d076bf3434b8078f690c3` enviado atomicamente às branches `main` e `desenvolvimento/validacao-local-p6`. [Pages 40321896766](https://github.com/RicardoHussen2026/golden-music-memories/actions/runs/40321896766) concluído com success; 13 arquivos públicos coincidem por SHA-256 com o commit. Navegador público confirmou 2.23.1 / e1594265b369, opções 720p/1080p e limite de 500. O endereço público distribui a interface estática; o motor, a fila e os arquivos operam no PC em 127.0.0.1:8877. Não foi reiniciado o serviço durante a publicação.

Às 09h24 (Brasília), a API registrou 166 concluídos, um baixando e 140 aguardando no primeiro lote; o controlador já havia integrado tecnicamente 159 (67 referências dos anos 70 e 92 dos anos 80) e separado cinco fontes por identidade duvidosa. Os 228 IDs anteriores, os registros antigos do baixador e o histórico das 20 produções permaneciam iguais. Evidência privada: `.cache/expansao-720/CONFERENCIA_ATUAL.json`. A contagem continuará mudando; a conclusão dos lotes e a aprovação editorial não estão declaradas.
