# Coleção nostálgica, vinhetas e comerciais — 2.21.0

## Entrega e uso

O fluxo aprovado de produção continua: escolher música, capa/abertura opcionais, edição, prévia e exportação. As novas peças são opcionais e não são aplicadas automaticamente.

- **Estúdio de capas:** 12 novos fundos originais, quatro por década. Filtre 70/80/90; título, artista, ano, fonte, cores e posição continuam editáveis. Exporte PNG/JPG vertical 1080×1920 ou horizontal 1280×720. A nova composição horizontal reserva espaço para texto à esquerda e imagem à direita; os estilos anteriores foram preservados. Os PNGs de origem são 941×1672; a exportação usa o tamanho escolhido, sem alegar ganho de detalhe nativo.
- **Vinhetas:** três assinaturas musicais instrumentais de 5 segundos, cada uma horizontal 1920×1080 e vertical 1080×1920. Golden 70 · Memória Analógica; Golden 80 · Pulso de Luz; Golden 90 · Groove Digital. Download de MP4 e MP3 original. Na montagem, escolha início e/ou final e se deseja o áudio próprio. A inicial vem antes da capa/abertura; a final, após a última música. Nenhuma é repetida entre faixas. A duração exata inclui esses segundos.
- **Vinhetas próprias:** carregar vídeo ou imagem, ou MP3 com uma imagem de acompanhamento. Escolher trecho, duração (1–60 s), formato, fade e áudio. Edição guarda uma nova variante. Retirar da biblioteca move para lixeira recuperável, sem apagar originais ou vídeos já gerados.
- **Áudios e comerciais:** biblioteca para MP3/M4A/WAV/FLAC/OGG e MP4/MKV/MOV/WebM. Preparar peça de até 10 minutos, escutar/ver prévia, baixar, editar variante e retirar/restaurar. Áudio é preparado em AAC/M4A 256 kb/s; original preservado. Vídeo usa H.264/AAC.
- **Montar vídeo → Áudios e comerciais opcionais:** até 30 inserções por montagem, com horário absoluto, início dentro da peça, duração, volume de 0–150%, música de 0–100% e fade. MP4 pode ocupar a tela ou um dos quatro cantos, mantendo proporção. São sobreposições sobre a música contínua: não pausam o clipe nem aumentam a duração. Inserções que se sobrepõem ou ultrapassam o final são recusadas. Chamadas visuais de like/seguir/comentar continuam independentes.

Use **Gerar prévia real** para conferir a composição; **Exportar vídeo** guarda o resultado no acervo. Rascunho e padrão por destino incluem as escolhas novas, inclusive a remoção de todos os itens. Capas, aberturas e vinhetas continuam com bibliotecas separadas e acessíveis pelo menu Ferramentas.

## Direção criativa e procedência

Fundos em `templates/nostalgia/`, com prompts completos em `PROMPTS.json`. Anos 70: vinil, esfera de discoteca, gravador de rolo e rádio; anos 80: cassete portátil, sintetizador, caixa de ritmos e boombox; anos 90: MiniDisc, coleção de CDs, estúdio digital e clube. Sem marcas artificiais ou reprodução de capas de álbuns. As artes foram geradas especificamente para esta coleção.

Áudios originais em `media-branding/`, gerados com ElevenLabs Sound Effects v2; prompts e IDs de geração em `PROMPTS.json`. Não contêm locução solicitada nem imitação de música/artista no prompt. A duração de 5 s é uma decisão editorial para assinatura curta, não uma regra universal. Referências consultadas: [identidade musical MTV / Sonic Lens](https://www.soniclensagency.com/viacom-mtv-sonic-branding), [Technics e a linhagem SL-1200](https://www.technics.com/global/home/sl1200/heritage.html), [Roland TR-808](https://www.roland.com/us/promos/roland_tr-808/), [Sony MZ-1 de 1992](https://www.sony.com/en/SonyInfo/design/gallery/MZ-1/). Walkman e CD nasceram antes das décadas evocadas em parte da coleção; a direção representa uso e memória cultural, sem atribuir lançamentos falsos.

Os seis vídeos foram compostos localmente com FFmpeg, sem nova chamada paga. Script reproduzível: `node scripts/build-nostalgia-branding.mjs`. Usa os MP3 já existentes, normalização medida, fades curtos, vídeo CRF18/30fps e AAC256k/48kHz. `manifest.json` contém dimensões, duração, IDs fixos e SHA-256. A instalação no serviço é idempotente e respeita itens retirados para a lixeira.

## Causas encontradas e correções verificadas

1. A composição não possuía segmentos audiovisuais próprios antes/depois da música. Foram acrescentados segmentos opcionais, com silêncio apenas quando configurado, áudio próprio e continuidade de capítulos/duração.
2. Amostras dentro de uma vinheta final silenciosa eram rejeitadas pela medição de áudio. Silêncio passou a ser aceito somente nas janelas em que ele é esperado, considerando as inserções audíveis.
3. Fonte sem áudio com peça audível podia ignorar normalização. Agora a medição considera vinhetas e comerciais; nas coleções, uma peça que atravessa faixas compartilha os mesmos coeficientes globais.
4. Fades de áudio avaliados por bloco após normalização podiam silenciar toda a chamada; a redução da música podia durar além da peça. Fades de áudio por amostra e blocos delimitados para o envelope da música corrigiram os renders reproduzidos.
5. Comercial exclusivamente visual aplicava limitador desnecessário à música. Esse limitador foi retirado quando não há mistura audível.
6. Durações fracionadas preenchidas automaticamente eram incompatíveis com `step=0.1` e podiam bloquear a submissão de Exportar vídeo. Campos aceitam milissegundos; exportação de uma inserção de 1,237 s conferida na UI.
7. Filtro de capas era perdido ao selecionar um estilo. Seleção agora mantém o filtro. A área comercial ocupa a largura do formulário e suas prévias respeitam a coluna e o celular.

## Validação executada

- Lote principal: 19 testes Node aprovados, incluindo FFmpeg real para vinhetas, comerciais, biblioteca, cortes, montagem individual/coletiva, cancelamento, preservação e concatenação representativa acima de 45 min. Essa última é uma fixture de concatenação, não um novo filme editorial Full HD de 45 min.
- Lote complementar: 8 testes aprovados de biblioteca, instalação dos seis vídeos/MP3, download por bytes, integridade e referências de restauração. Há testes repetidos entre os lotes; não somar como testes distintos.
- Doze fundos verificados (4/4/4); seis MP4 decodificados integralmente, dimensões/duração/áudio/picos conferidos e arquivos baixados pela API comparados por bytes. Instalação repetida não duplica nem restaura peças retiradas.
- UI isolada: upload de vídeo para vinheta, aplicação inicial/final, prévia de 8 s, restauração do rascunho e opção Sem vinheta. Upload de MP3, variante de 1,237 s, retirada e restauração; upload e reprodução de MP4 comercial.
- Exportação feita pela UI com vinheta Golden 70 e comercial aos 6 s: 1920×1080, 9 s, áudio medido −15,99 LUFS / −1,88 dBTP. Produção e dados são sintéticos e permanecem fora da operação real.
- UI de capas: filtros 70/90, edição, PNG horizontal baixado e aberto, capa vertical guardada na biblioteca. Texto permanece editável. Reprodução no navegador e largura real 390 px conferidas; página e prévia sem transbordamento horizontal.

Evidências privadas em `.cache/vinhetas-v221/`: screenshots, renders sintéticos, estados antes/depois e verificações de publicação. Comandos de regressão: `npm run test:branding`; bibliotecas e montagem seguem com seus testes existentes.

## Limites e publicação

Qualidade técnica e visual conferida no escopo acima. Preferência estética e audição editorial humana integral dos novos sons continuam sendo avaliação do proprietário; não são substituídas por medição de pico ou reprodução sem erro. Os sons são instrumentais conforme os prompts, mas não houve análise humana de exclusividade musical. Não houve postagem de vídeos em redes sociais.

Versão **2.21.0 ativa localmente**, interface `a58885e11a97`, backend `653aa9c2fcb5`. Atualização realizada com zero jobs/downloads/uploads ativos. Comparação antes/depois confirmou os mesmos 165 clipes, 20 produções, 10 intros, histórico, coleções, fila, presets, inputs e finais. Seis vinhetas novas instaladas; nenhum dado sintético levado à operação. Software 4d35fc73ee205e00a3e162e554c0974849673fef enviado às duas branches; Pages 40278643702 concluído com success. Quarenta arquivos públicos conferidos por SHA-256 e UI pública 2.21.0 confirmada. Serviço e interface locais correspondem; nenhuma postagem social. A página pública hospeda a interface e as artes; Python/FFmpeg, renderizações e dados privados continuam no serviço local 127.0.0.1:8877.
