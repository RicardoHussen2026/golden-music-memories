# Desempenho da montagem local — 2.9.3

Estado de ativação e publicação: consultar a tabela vigente em [ORGANIZACAO_PROJETO.md](ORGANIZACAO_PROJETO.md). Versão no disco não comprova versão carregada. Esta mudança não refaz vídeos existentes nem ativa aceleração AMF.

## Escolha de CPU e retorno seguro

Novas montagens usam libx264, preset veryfast, CRF18, 30 fps e os mesmos filtros, áudio, capas e chamadas. No modo auto, quatro threads de codec e duas de filtros são escolhidas somente com pelo menos oito processadores lógicos disponíveis e 3 GiB de memória livre. Caso contrário, permanecem duas threads e um filtro. Não há alteração de prioridade do Windows, driver ou segurança.

`GMM_RENDER_CPU_PROFILE=conservative` preserva o perfil anterior; `auto` é o padrão. `moderate` também respeita a guarda de recursos. É uma configuração local opcional, sem credencial; não alterá-la durante uma montagem. O perfil solicitado faz parte do plano/fingerprint. A assinatura de composição separada reconhece arquivos legados e perfis anteriores adequados, sem obrigar novo render apenas para mudar CPU. O job registra separadamente o perfil efetivamente usado. Arquivos aprovados continuam associados aos mesmos IDs e não são regenerados.

Uma falha especificamente classificada como impossibilidade de criar threads permite uma única tentativa no perfil conservador, usando o arquivo temporário do próprio job. Cancelamento, timeout, entrada inválida ou falta de espaço não causam essa repetição. Uma segunda falha encerra o job. A seleção é aplicada também aos segmentos de coletâneas; a concatenação continua copiando vídeo e tratando o áudio pelo fluxo existente.

A guarda interna de espaço/tamanho passa a informar falha específica. Antes, esse caminho podia mostrar apenas “Montagem cancelada”, como o cancelamento manual. A causa de um cancelamento histórico do TikTok aos 80% não pôde ser determinada retrospectivamente; a nova tentativa expressamente autorizada concluiu com os limites existentes, sem reprodução da interrupção. Isso não prova qual foi a causa original.

## Evidência medida no PC de casa

Ryzen 5 5600G, 12 processadores lógicos, Radeon integrada, driver existente 31.0.12042.4. Fixture sintética de seis segundos, saída Full HD/30fps, capa e chamadas animadas. Comparação pelo mesmo grafo e parâmetros. CPU média é tempo de CPU do processo dividido pelo tempo de parede e pelos 12 processadores lógicos; RAM é pico de working set amostrado, não toda a memória gráfica.

| Amostra | CPU2/filtros1 | CPU4/filtros2 | Redução de tempo |
|---|---:|---:|---:|
| Horizontal, enquadramento original | 8,095 s | 4,871 s | 39,8% |
| Horizontal, filtro de fundo | 10,326 s | 7,090 s | 31,3% |
| Repetição horizontal, ordem invertida | 10,523 s | 7,291 s | 30,7% |
| Vertical, fundo desfocado visível | 9,309 s | 6,480 s | 30,4% |

No vertical, RAM passou de aproximadamente 564 para 606 MiB e CPU média total de 14,2% para 22,4%. A primeira fonte horizontal já tinha proporção 16:9, cobrindo o fundo calculado; o teste vertical adicional verificou desfoque efetivamente visível. Quadros revistos preservaram proporção e chamadas. SSIM alinhado por índice de frame contra referência FFV1: horizontal 0,998391 em ambos; vertical 0,998447 em ambos. Métrica não substitui avaliação subjetiva. Áudio AAC copiado teve payload idêntico nas amostras de benchmark. Resultados de seis segundos não garantem o mesmo ganho para qualquer fonte, computador ou coletânea longa.

AMF realmente codificou uma amostra com o hardware existente. Com transcoding/quality/CQP18, ganhou somente cerca de 2% sobre CPU2, gerou arquivo cerca de 82% maior e SSIM inferior (0,986853). CRF e QP não são escalas equivalentes; não foi uma busca exaustiva de regulagens. AMF não foi escolhido como padrão. Filtros da pipeline continuam em CPU.

## Avaliação de movimento em imagem estática

Foi criada uma amostra privada de oito segundos, separada dos finais aprovados: zoom de 94% a 98% do espaço disponível, pequeno deslocamento lateral e fundo derivado com movimento discreto/desfoque. O conteúdo central permanece inteiro, sem recortar título/rostos, deformação ou animação de pessoas por IA. Não foi acrescentada aplicação automática ao catálogo ou detecção genérica de vídeo estático.

Comparação curta com a mesma fonte e CPU2: estática 3,649 s/359 MiB/705.376 bytes; movimento 4,075 s/367 MiB/2.231.112 bytes. Duração e resolução verificadas; áudio convertido para AAC com correlação de aproximadamente 0,999645 em relação à fonte recebida. A variação aumenta tamanho e custo de processamento; avaliação editorial pelo proprietário continua separada. Os vídeos finais com desfoque não receberam esse efeito experimental.

Logs, scripts, quadros e métricas ficam privadamente em `.cache/render-performance/bench-20261025/` e `.cache/edicao-isley/`, fora do Git. Somente código, testes e documentação pertencem à publicação do software. Não incluir fontes, MP4, bancos, backups ou configuração real no commit.
