# Capas separadas e abertura junto da música — 2.23.0

Pedido de 26/10/2026: retirar a capa incorporada e sua duração de todas as novas montagens. Manter a imagem para baixar e usar como miniatura. A abertura visual começa junto da música, depois revela o videoclipe já avançado. O titular confirmou que a vinheta inicial continua como opção sonora separada antes da música.

## Comportamento implementado

- **Identidade → Capa / miniatura separada:** criação, importação, biblioteca e download permanecem no mesmo local. Nenhum frame dessa imagem é acrescentado ao vídeo. A proporção da miniatura não bloqueia o render.
- **Abertura junto da música:** ambas começam no tempo zero do corpo musical. Durante a abertura, o clipe continua avançando; o áudio não reinicia quando ela termina. A duração da abertura não aumenta o total.
- **Vinhetas opcionais:** a inicial precede o corpo musical; a final vem depois. São os únicos acréscimos de duração nessa composição. Chamadas e comerciais continuam contando desde o início do arquivo final.
- **MP3/áudio:** em Edição e áudio, selecione uma imagem de fundo própria. Ela acompanha a música e fica salva no rascunho; é independente da miniatura. A seleção de capa não é convertida automaticamente em imagem do áudio.
- **Sequências:** a abertura aparece somente junto da primeira música, sem pausa entre faixas. A seleção automática antiga também deixou de exigir/inserir capa por faixa.
- Parâmetros antigos `coverSeconds` e `musicFromStart:false` não reativam o comportamento cancelado. Os planos novos registram a política `thumbnail-only-music-first-v1`.
- Coleções antigas ainda não renderizadas precisam ser conferidas/salvas em nova edição. Execução direta, fila e amostra recusam o plano antigo, evitando duração/capítulos incorretos. Arquivos já concluídos, downloads, IDs, histórico e capítulos históricos são preservados.

## Causas e correções

O motor tinha caminhos de capa sobreposta, capa antes da música e intro prefixada. A interface e o seletor de coletâneas também calculavam duração a partir dessas opções. Os caminhos de composição foram unificados para capa zero e intro sobreposta desde o início musical. A miniatura mantém vínculo próprio para download e publicação manual. A imagem de áudio ganhou referência independente e persistência no rascunho.

Após essa implementação, foi investigado o relato de aberturas indisponíveis. **Os dez originais estão íntegros:** cinco horizontais e cinco verticais, com hash, decodificação completa, download e streaming parcial conferidos no serviço operacional. As opções cinzas “outro formato” são a proteção existente contra escolher horizontal em TikTok/Shorts ou vertical em YouTube horizontal; ela foi preservada.

Foi reproduzido um defeito em **Aberturas → Editar variante**: o campo aceitava apenas incrementos de 0,1 s, embora os arquivos tenham durações como 3,966667 s. O navegador rejeitava o valor preenchido pelo próprio editor. Somente esse campo passou a aceitar a precisão original (`step="any"`), mantendo limites de 1–30 s. A mesma variante K7 vertical foi gerada pela interface após a correção, sem arredondamento manual.

## Verificações realizadas

Dados sintéticos e diretórios isolados, sem produzir ou substituir vídeos operacionais:

- 26 casos Node aprovados entre montagem/capas, intros, enquadramento, coleções, vinhetas, comerciais, destinos, lixeira, qualidade/fila e entradas. O caso de intros contém 26 verificações internas; não somar como cobertura independente.
- FFmpeg real vertical/horizontal: frames da fonte desde zero, miniatura vermelha ausente, áudio AAC idêntico quando copiável e duração original preservada. Clipe curto não exige mais reduzir uma duração de capa.
- Fonte de oito segundos muda imagem e frequência no quarto segundo. Após a intro, aparece o frame correspondente e toca a frequência correta. Repetido com corte inicial de dois segundos e coleção com meta exata de seis segundos.
- MP3 com fundo azul e miniatura vermelha: fundo independente confirmado; música imediata e contínua. Ausência de fundo explícito é recusada.
- Sequência com duas faixas e vinhetas: duração/ordem/capítulos, som contínuo, final silencioso previsto, meta exata e amostra. Guard de coleção antiga e sua amostra verificado.
- Regressões de comerciais entre músicas, volume medido, miniatura, reaproveitamento, fila, cancelamento, lixeira e restauração técnica isolada passaram.
- Concatenação representativa de 2.720 s passou em 32×18, 1 fps. Isso não comprova um render Full HD longo.
- Interface real do Chrome: rascunho antigo, campos removidos, miniatura separada, prévia de nove segundos com vinheta+intro, MP3 com imagem própria, fechar/reabrir e reutilizar a mesma prévia. Player Full HD chegou ao final sem erro. Em viewport de 390 px, sem transbordamento horizontal.
- Dez aberturas: arquivos e thumbnails íntegros, download HTTP 200 com SHA-256 igual ao original, Range HTTP 206 e decodificação completa. Reprodução de K7 vertical no navegador chegou a 3,97 s sem erro. A inspeção técnica dos dez não equivale a revisão estética humana de cada um.

Uma primeira execução restrita encontrou EPERM no renomeio de fixture temporária e foi repetida em execução nativa autorizada. Um novo teste usou inicialmente `assert.rejects` para um método síncrono; corrigido para `assert.throws`, e o caso passou. Não foram enfraquecidas as validações do produto.

Evidências locais em `.cache/capas-v223/`: `intros/test-real-results.json`, renders MP4, frames e resultados de capa/coleção; `identidade.png`, `previa-interface.png`, `mobile-390.png`, captura do erro de duração e `intros-health.json`. O acervo operacional não recebe essas fixtures.

## Disponibilização e limites

Implementação, validação e ativação local concluídas. Interface **d23b24bc7067**, backend **1ca2d6265dfa**, versão **2.23.0**. O serviço foi reiniciado apenas após verificar zero operações ativas. Os hashes de histórico, coleções, fila, baixador, montagens, clipes e bibliotecas permaneceram iguais: 165 clipes, 20 produções, dez intros e seis variantes de vinheta. A primeira consulta ocorreu antes de o serviço terminar de iniciar; a consulta seguinte confirmou a versão e preservação. Evidências `before-state.json` e `after-state.json`. Commit e publicação serão registrados após conferência efetiva. Serviço e mídias permanecem no PC, em `127.0.0.1:8877`; GitHub Pages distribui somente a interface/documentação pública.

Revisão estética/auditiva humana permanece separada. Os testes não prometem eliminar silêncio já existente na música original. Nenhum vídeo foi postado em redes sociais, nenhuma mídia antiga foi regenerada e nenhuma nova integração externa foi ativada.

Continuidade: raiz/Git/branch conferidos; associação do chat ao projeto refeita pela operação oficial, embora a listagem ainda apresente a divergência histórica. Um único executor fez as alterações; auxiliares revisaram somente leitura. Reversão de código disponível pelo Git, sem rollback de dados privados.
