# Auditoria de qualidade e produtividade — Golden Music Memories 2.11.0

Data: 25/10/2026. Objetivo do titular: preparar e postar vídeos com facilidade, praticidade e muita qualidade, com finalidade de receita. Esta entrega identifica problemas e melhorias; não aplica correções.

**Conclusão:** o núcleo de montagem funciona, mas a jornada ainda apresenta falhas de integração, retrabalho e acabamento que precisam ser corrigidos antes de escalar a produção. Foram reproduzidas **7 falhas**, identificadas **8 melhorias** e separado **1 ponto comercial prioritário**. Segurança e backup não fizeram parte desta vistoria; não foram executados testes, alterações ou operações dessas áreas.

## Base e alcance

- Operacional: `http://127.0.0.1:8877/painel.html`, versão 2.11.0, interface `d5f79ff08241`, backend `4d1c3e76ae5f`.
- Checkout: `C:\Users\RicardoPC\Documents\Codex\Golden Music Memories\golden-music-memories`, branch `desenvolvimento/validacao-local-p6`, HEAD `c774d015fd6bbb501778c2c582f7f16b8059755a`. Alterações preexistentes preservadas.
- Navegação operacional somente para inspeção. Reproduções mutantes em serviço, banco e origem de teste separados (`127.0.0.1:60659`), com três clipes sintéticos. Nenhuma produção real criada, editada ou renderizada nesta auditoria.
- Percurso: Hoje, Catálogo, Produções, Meu acervo, Publicações, Estúdio de capas, Acervo e programação e configurações de produtividade. Leitura do guia inicial e dos módulos relevantes. Não foi uma auditoria de cada integração externa.
- Render individual real em Full HD, 11 s, capa + intro + chamada; render contínuo de duas fontes de 8 s com prefixo único de 6,9 s, total medido **22,921354 s**. Decodificação integral do individual sem erro; quadros de capa/intro/chamada inspecionados. A fonte sintética não comprova qualidade perceptiva de todos os clipes reais.
- Inventário técnico dos 165 clipes calculado a partir do manifesto atual. Medição nova de áudio em oito arquivos reais, somente nos trechos de 20 a 80 s; não representa normalização nem análise integral de todas as músicas.
- Formulário de entrega longa inspecionado em viewport de 390×844: sem transbordamento horizontal (página 375 px; área rolável do diálogo 330 px). Não é teste em aparelho físico.
- Não foram feitos envios às plataformas, avaliações da elegibilidade das contas, compras, publicação de software, reinício do serviço operacional ou geração de vídeos musicais longos completos.

## Ponto comercial prioritário

**C01 — Definir um formato que possa sustentar a receita, antes de aumentar o volume.**

A qualidade técnica do MP4 e a facilidade de upload não comprovam monetização. O YouTube cita coletâneas de músicas de vários artistas, inclusive com permissão, entre exemplos de conteúdo reutilizado que não pode gerar receita. A política também avalia originalidade e contribuição significativa. Logo, capa, intro e chamadas, por si, não são evidência suficiente de elegibilidade — esta é uma inferência para o formato atual. [Política oficial consultada em 25/10/2026](https://support.google.com/youtube/answer/1311392?hl=pt-BR).

**Melhoria proposta:** registrar o objetivo de cada formato (audiência, receita de anúncios, outro modelo), o valor editorial próprio e o resultado efetivo da plataforma. O projeto já menciona histórias/comentários no guia; transformar essa proposta em uma linha editorial executável é mais útil do que apenas aumentar o número de clipes. Novos módulos de roteiro/narração precisam de escopo próprio. Não há previsão de receita nem afirmação de que o canal esteja aprovado ou reprovado.

## Falhas reproduzidas

Prioridade **alta**: pode produzir resultado errado, esconder entregas ou prejudicar o fluxo principal. **Média**: causa retrabalho ou informação enganosa, com alternativa manual disponível.

| ID | Prioridade | Falha observada | Impacto prático |
|---|---|---|---|
| F01 | Alta | Trocar YouTube por Facebook e reaproveitar o mesmo render abre a preparação de **YouTube** | Texto, contexto e atalho podem ficar na plataforma errada |
| F02 | Alta | MP4 aprovado no serviço não aparece em **Meu acervo**; Hoje mostra zero finalizados no teste | O operador pode achar que perdeu a entrega ou produzir novamente |
| F03 | Alta | Ano vazio vira a palavra **ANO** na capa exportada e no vídeo | Texto de modelo chega ao material final |
| F04 | Média | Seleção some na recarga; título e ordem da sequência somem ao fechar e reabrir antes de renderizar | Perda de organização, especialmente em listas longas |
| F05 | Alta | Sequência nova herda controles inconsistentes da montagem individual | Chamada fica indisponível mesmo sem estar adicionada; prévia de intro contradiz Sem intro |
| F06 | Alta | Preparação da coletânea salva não aparece na lista principal de Publicações e não oferece registro de URL/data/resultado | Fluxo longo fica separado do acompanhamento de postagens |
| F07 | Média | Erro ao salvar título longo desaparece na atualização periódica | Mensagem volta a dizer que a prévia está disponível, sem manter o motivo da falha |

### F01 — Destino antigo retido no reaproveitamento

**Reprodução:** gerar/aprovar uma prévia horizontal para YouTube; mudar somente o destino para Facebook horizontal; gerar novamente com a mesma composição; clicar em Preparar textos e abrir plataforma. A janela abriu **YouTube · horizontal · V1**, com link de upload do YouTube. Nenhum link externo foi acionado.

**Causa confirmada:** a assinatura da composição permite reutilizar o render, mas o retorno mantém `job.requestedDestination` da criação anterior. O botão usa esse destino antigo. O preset consultado no serviço indicava `facebook`, enquanto o job reutilizado continuava `youtube`.

**Referências:** `server/runtime/video-assembly.mjs:67`, `app/video-assembly.js:29`. Evidências: `render-evidence.json`, `destino-incorreto-dom.txt`, `destino-incorreto.png` na pasta privada desta auditoria.

**Aceite da correção:** reaproveitar os bytes do MP4 sem novo render e abrir os textos/atalho do destino escolhido agora. Verificar também outros pares com a mesma proporção; não reescrever publicações anteriores.

### F02 — Entregas e indicadores fragmentados

**Reprodução:** aprovar o MP4 sintético pela montagem; abrir Meu acervo e Hoje. Meu acervo mostrou “Nenhum vídeo final encontrado”; Hoje indicou zero arquivos finais e zero produções finalizadas. Acervo e programação encontrou o arquivo e o identificou como finalizado localmente. A produção continuou rotulada Música selecionada.

**Causa:** Meu acervo e parte dos indicadores usam anexos do navegador, enquanto a montagem atual guarda os finais no serviço. Não houve perda do MP4: falta apresentação coerente entre as telas. “Pronto para rotina” e “arquivo finalizado” também devem permanecer conceitos distintos, mas compreensíveis.

**Referências:** `app/main.js:56`, `app/main.js:64`, `server/runtime/video-assembly.mjs:103`. Evidências: `acervo-vazio-apos-aprovar.txt/png`, `dashboard-apos-aprovar.txt`, `operacao-dom.txt`, `render-evidence.json`.

**Aceite:** vídeo final visível em uma biblioteca unificada, sem duplicação física, com plataforma/proporção/versão e acesso direto a baixar/preparar postagem. Indicadores devem contar os finais locais e explicar o que ainda não está pronto para uma rotina.

### F03 — Texto provisório na arte final

**Reprodução:** clipe sem ano confirmado → Criar capa e selecionar → gerar prévia. O quadro de capa contém **ANO**. O caso foi visto no MP4 e não apenas em um formulário.

**Causa:** `drawCover` usa `cfg.year || 'ANO'` também na exportação. O fluxo novo passa ano vazio de propósito para não inventar informação. Os 165 registros atuais não têm ano confirmado.

**Referência:** `app/cover.js:17`. Evidência visual: `frame-capa.png`.

**Aceite:** omitir ano e seu espaço quando vazio; manter o ano quando confirmado. Verificar vertical/horizontal e templates utilizados, sem substituir por texto genérico ou inventar datas.

### F04 — Trabalho anterior ao render não é retomável

**Reprodução 1:** marcar uma música no Catálogo e recarregar. A contagem voltou de 1 para 0.

**Reprodução 2:** selecionar Alfa/Beta, renomear a sequência e colocar Beta primeiro; fechar e reabrir Montar sequência. Voltaram o título padrão e Alfa/Beta. O problema ocorre antes da criação do registro persistente da coletânea.

**Referências:** `app/clip-catalog.js:7`, `app/clip-catalog.js:29` (`orderDialog`).

**Aceite:** seleção, título, ordem e escolhas de montagem recuperáveis antes de renderizar; indicação clara de salvo/pendente. Sair e voltar não deve refazer a escolha de vinte músicas.

### F05 — Estado visual incorreto ao entrar no modo longo

**Reprodução:** salvar montagem individual da primeira faixa com intro CD e chamada Curtir; abrir sequência nova usando essa faixa como primeira. A lista de chamadas está vazia, porém Curtir está desativado. O seletor diz Sem intro, mas a prévia e a explicação mostram a intro CD anterior. A nota de capa também chegou a dizer compatível quando a opção era Sem capa.

Os controles de fonte/arquivo, destinados a ficar ocultos nesse modo, ficaram visíveis: o elemento estava `hidden=true`, porém o estilo calculado era `display:block`. Depois do render, a fonte apareceu habilitada. Isso aumenta a chance de o operador alterar um campo sem compreender seu efeito sobre a sequência.

**Referência:** `app/video-assembly.js:39`, inicialização do ramo `collection`, e estilos de campos. Evidências: `sequencia-controles-incoerentes-dom.txt/png`; observação DOM: zero chamadas, opção Curtir desabilitada, intro vazia com player CD.

**Aceite:** montar o estado longo explicitamente e atualizar seletor, prévia, notas e opções após limpar presets. Cada chamada disponível deve poder ser adicionada; controles não aplicáveis devem ficar realmente ocultos.

### F06 — Postagem longa não fecha o ciclo operacional

**Reprodução:** renderizar sequência, conferir a prévia e salvar preparação. Reabrir pelo histórico confirma o rascunho, mas Publicações continua vazia no ambiente de teste. O formulário longo não tem conta/canal, URL, data efetiva ou métricas.

**Causa:** preparação fica em `collection.posting`, separada da entidade usada pela lista de publicações. O botão faz o que diz — salva localmente —, mas a jornada de produzir/postar/acompanhar fica incompleta para coletâneas.

**Referências:** `app/collection-delivery.js:7`, `server/runtime/http.mjs:117`, `app/main.js:63`. Evidências: `coletanea-textos-dom.txt`, `publicacoes-sem-coletanea.txt`, `render-evidence.json`.

**Aceite:** coletânea participa do mesmo histórico por destino, permite registrar postagem manual e resultados, mantém suas faixas associadas e pode ser reaberta/duplicada para uma nova edição. Isso não exige publicação automática.

### F07 — Atualização de progresso apaga erro de formulário

**Reprodução:** abrir uma coletânea concluída; digitar título de 128 caracteres; Salvar preparação. Surge “YouTube: título até 100 caracteres”. Na atualização seguinte, o erro some e o mesmo espaço passa a exibir “Prévia completa disponível. Confira antes de postar”. O limite do campo é 160, sem contador específico antes da tentativa.

**Referência:** `app/collection-delivery.js:8-9`, tratamento do formulário e `tick` periódico. Evidências: `erro-titulo-imediato.txt`, `erro-titulo-substituido.txt`.

**Aceite:** separar status do render, erro e confirmação do formulário; manter erro até a edição/correção. Mostrar limites por plataforma antes de salvar e preservar os textos digitados.

## Melhorias de qualidade e praticidade

| ID | Prioridade | Evidência atual | Melhoria e critério de aceite |
|---|---|---|---|
| M01 | Alta | Manifesto: 0 fontes com altura ≥1080; 93 com 720; 72 abaixo de 720, sendo 27 abaixo de 480 | Mostrar qualidade de origem, ampliações e alternativas antes de renderizar. Exportar 1080p não deve sugerir detalhe nativo Full HD. Comparação lado a lado em tamanho de exibição real |
| M02 | Alta | Oito trechos medidos: −17,38 a −9,90 LUFS, diferença 7,48 LU; picos estimados até +1,20 dBTP | Medir músicas completas e oferecer ajuste opcional de volume/picos para a coletânea, mantendo originais. Conferir transições com audição; não aplicar ganho uniforme às cegas |
| M03 | Alta | 158 dos 165 clipes excedem 180 s; só 7 cabem nessa duração antes de acrescentar elementos | Avisar compatibilidade já na escolha do destino; oferecer versão curta com entrada/saída escolhidas e trechos revisados. O limite de 180 s é dos presets atuais Shorts/Instagram, não declaração universal de limite do Instagram |
| M04 | Alta | Ajuste de recorte/capa/chamadas depende de render completo; capa escolhida não tem comparação visual simples no fluxo | Prévia rápida de trechos, linha de tempo e prévia visual do recorte/posições; depois render final integral. Presets pessoais por destino para capa, abertura e chamadas; sem tornar itens opcionais obrigatórios |
| M05 | Média | 6 artistas não confirmados; 14 grupos de nomes iguais; nenhum ano confirmado. Cartões omitem a versão e uploads novos não geram miniatura | Curadoria visível, versão/qualidade, filtros de uso e duração, edição de campos confirmados e miniaturas automáticas. Não fundir gravações apenas por nomes iguais; não inventar datas |
| M06 | Média | Lista da sequência com capa/intro começa em 00:06 e não em 00:00 | Gerar capítulos compatíveis quando aplicável, começando em 00:00, agrupando abertura ao primeiro capítulo se necessário; validar pelo menos 3 marcas e mínimo 10 s por capítulo. Distinguir lista de faixas de capítulos válidos |
| M07 | Alta comercial | Formulário registra só visualizações, curtidas, comentários e compartilhamentos | Acompanhar também retenção, tempo assistido, cliques da capa quando disponível, seguidores e receita efetiva por vídeo/destino. Começar com registro manual/importação, sem depender de integração nova. Comparar formatos semelhantes e esforço de produção |
| M08 | Média | Catálogo → Montar sequência e Produções → Preparar coletânea abrem fluxos distintos; o antigo usa capa por faixa e só considera fontes ligadas a produções. Operação ainda descreve CapCut→Drive como caminho principal | Uma entrada principal para produzir, com opções avançadas recolhidas; legado identificado como edição anterior. Fila de renders e presets para volume, nomes legíveis nos arquivos, instruções atuais e menor repetição de configurações |

M06 usa as [regras oficiais de capítulos do YouTube](https://support.google.com/youtube/answer/9884579?hl=pt-BR). Não foi testada a criação real de capítulos na conta; o problema é a formatação local dos textos.

**Limites de M02:** medições são de oito trechos, não de toda a coleção. Os valores indicam variabilidade e justificam medição integral antes de qualquer ajuste. Pico acima de 0 dBTP estimado não é, por si só, prova de distorção audível. O FFmpeg processou a análise para saída nula; nenhum original foi normalizado ou sobrescrito.

**Limites de M05:** nomes repetidos indicam necessidade de comparação, não duplicação musical comprovada. Os arquivos têm versões e resoluções diferentes. Miniaturas novas ausentes foram verificadas pela implementação de `ClipLibrary.register/get`; não foi necessário importar conteúdo real.

## O que funcionou nesta rodada

- O catálogo ativo carregou 165 itens e miniaturas; busca/seleção e acesso às telas foram observados.
- Render individual produziu H.264 1920×1080/AAC com 11 s; capa, intro e chamada chegaram ao arquivo final. Legibilidade da chamada foi boa no quadro inspecionado.
- Remover uma chamada invalidou corretamente a prévia e pediu nova montagem. A hipótese de aprovação indevida após essa remoção não se confirmou.
- Repetir a mesma composição reaproveitou o render. O defeito F01 está no destino da preparação, não na necessidade de recodificar o arquivo.
- Sequência de duas fontes preservou 8 s de cada clipe, com capa 3 s + intro 3,9 s somente no início. Primeiro áudio aos 6,9 s; segunda faixa na timeline 14,9 s; total 22,921354 s. Não foi ensaio de 20 músicas reais.
- A preparação longa foi salva e reaberta por Produções longas salvas. F04 se refere ao trabalho ainda não persistido; F06 à integração com o acompanhamento geral.
- Formulário longo permaneceu utilizável em 390 px, sem transbordamento horizontal. Nenhuma alegação de validação em celular físico.

## Ordem recomendada para correção posterior

1. **Acerto de resultados e acabamento:** F01, F03, F05 e F07. Aceite: destino certo, arte sem texto provisório, opções coerentes e erros persistentes.
2. **Continuidade da jornada:** F02, F04 e F06. Aceite: selecionar→montar→revisar→baixar→registrar postagem no mesmo fluxo, com rascunho retomável e final visível.
3. **Qualidade audiovisual e velocidade:** M01–M04, M06. Aceite: alertas antes de renderizar, amostras rápidas, volume conferido, edição curta e textos por destino.
4. **Operação comercial:** decidir C01; executar M05, M07 e M08 conforme a linha editorial escolhida. Medir tempo por postagem, abandono do fluxo, necessidade de refazer vídeo e resultados reais. Não escalar volume como substituto de qualidade ou elegibilidade.

As correções acima **não foram aplicadas**. Esta ordem é uma proposta para decisão do titular, não autorização de implementação, integração ou postagem.

## Evidências e continuidade

Pasta privada: `.cache/auditoria-qualidade-2110/`.

- `media-quality.json`: inventário e medições de áudio; `media-audit.mjs`: método reproduzível.
- `render-evidence.json`: dimensões/codecs, destino antigo versus preset novo, coletânea e tempos; `render-evidence.mjs`: verificação reproduzível.
- `frame-capa.png`, `frame-intro-chamada.png`, `frame-clipe.png`: quadros do vídeo sintético de teste.
- Capturas e snapshots DOM citados nos achados; `coletanea-mobile.png`, `estudio-capas.png`, `coletanea-antiga-capa-por-faixa.txt`.
- `environment.json`, `serve-audit.mjs` e `service-fixture/`: ambiente separado usado nas reproduções. Arquivos de teste não são entregas musicais nem pertencem ao acervo operacional.

A associação do chat ao projeto foi solicitada pela operação oficial e retornou sucesso, mas a listagem continuou exibindo projeto nulo. A divergência foi registrada; terminal/Git, raiz e versão foram conferidos. Não houve edição de metadados internos. Os outros chats do projeto consultados estavam sem operações ativas.

Ponto de encerramento operacional e limites da próxima etapa: `.cache/auditoria-qualidade-2110/STOP.md`. A tabela inicial de `docs/ORGANIZACAO_PROJETO.md` é a fila oficial. Alterações desta auditoria limitam-se ao relatório, à continuidade, à lista oficial e às evidências privadas.
