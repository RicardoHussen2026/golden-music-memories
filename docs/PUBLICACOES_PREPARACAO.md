## Destinos e formatos — V2.6.0, 25/10/2026

## Histórico e avisos — candidato isolado 2.9.0

Preparado/testado, sem ativação na operação atual. Publicações reúne registros deste navegador e fatos do serviço local quando acessível, distinguindo legado sem conta. Escolha explicitamente conta/canal (rótulo local, não autorização externa), confira última postagem/data/link, intervalo de aviso e vídeo final já pronto. Reutilizar MP4 não exige render novo. Para repostagem recente, marque a decisão explícita antes de abrir o upload; o aviso não controla ações feitas fora do painel. Padrão inicial editável 7 dias, por plataforma/conta, sem alterar cooldown da rotina.

Registrar como Publicada exige vídeo associado, conta para novos registros, data/hora efetiva sem futuro e link HTTPS; upload/baixar/exportar não fazem isso. Correções preservam histórico anterior e motivo. Contas distintas não recebem o aviso específico de outra conta; registros antigos sem conta continuam como evidência incerta. Ausência de registro não significa nunca publicado. Sem reconhecimento de áudio: usa vínculo canônico e hash quando disponíveis. Detalhes, limitações e testes em [ENTREGA_MONTAGEM_HISTORICO.md](ENTREGA_MONTAGEM_HISTORICO.md).

**Revisão do item 10, 25/10/2026:** consulte [matriz atual de integrações e relatório das dez entregas](INTEGRACOES_ESTADO_ATUAL.md). APIs preparadas não são contas conectadas ou publicação homologada; autorizações reais continuam pendentes.

Na produção, os botões antigos Preparar TikTok/YouTube permanecem. O seletor **Plataforma e formato da postagem → Preparar postagem** acrescenta Shorts, Facebook horizontal/vertical, Instagram Reels, Rumble e Odysee. Rascunhos de YouTube comum e Shorts, ou dos dois formatos Facebook, são independentes. Registros antigos sem destino explícito continuam interpretados pela plataforma; não há migração de banco nem alteração automática de registros pessoais.

| Destino | Preset local de saída | Duração e fluxo |
|---|---|---|
| YouTube comum | 1920×1080, 16:9 | Limites da conta devem ser conferidos; motor local aceita até 3 h. Upload manual no Studio. |
| YouTube Shorts | 1080×1920, 9:16 | Até 180 s; arquivo quadrado/vertical. Incompatibilidade é recusada, sem corte ou troca automática de formato. |
| TikTok | 1080×1920, 9:16 | Preset conservador de até 60 min; conferir limite efetivo da conta e finalizar no site/app. |
| Facebook | 1920×1080 ou 1080×1920 | Presets de enquadramento, não dois sistemas de publicação. Meta anunciou unificação de vídeos em Reels, sem restrição geral de tamanho/formato; o fluxo da conta deve ser conferido. |
| Instagram Reels | 1080×1920, 30 fps | Preset conservador de até 180 s, não um limite universal da plataforma; maior duração exige outro preset ou edição escolhida pelo operador. |
| Rumble | MP4 H.264/AAC 1920×1080 | Limites da conta e licença escolhida no upload exigem conferência. Não usar limites de anúncios ou lives como limites de vídeo comum. |
| Odysee | MP4 H.264/AAC 1920×1080 | Ajuda recomenda bitrate inferior a 8 Mbps e informa limite de 16 GB; limite local atual de 10 GiB continua independente. CRF18 não garante bitrate abaixo de 8 Mbps: conferir antes do upload. |

As resoluções acima são escolhas do painel. A montagem conserva a duração integral, capa de 3 s incluindo fade e áudio desde o início. Trocar a plataforma sem alterar a composição reaproveita a exportação base compatível. Nome e ID do MP4 base são preservados; não se criam sete cópias iguais. Vídeo já existente também pode ser selecionado em várias postagens, com referência ao mesmo anexo ou render. A prévia informa dimensões/duração; divergência de enquadramento é avisada. Shorts e presets verticais recusam arquivo horizontal; não o recortam automaticamente. Vídeos verticais legados no YouTube comum continuam aceitos com aviso.

Textos, hashtags e campos de conferência usam a plataforma escolhida. Hashtag Shorts só é sugerida no destino Shorts. Odysee tem campo local para tags/categorias sem #; Rumble, campo para licença/visibilidade a conferir. Esses campos e as opções Meta são notas locais, não configurações aplicadas ao site. Novos destinos ficam fora dos painéis de transferência/rotina do serviço. Seu histórico é mantido no IndexedDB e no backup do navegador; não presumir conciliação/API no SQLite. A sincronização operacional continua limitada aos registros YouTube/TikTok já suportados.

Atalhos: YouTube/TikTok continuam na tela de upload; Rumble usa o endereço de upload publicado na ajuda oficial. Facebook, Instagram e Odysee abrem suas páginas oficiais, onde a conta escolhe criar/enviar. Não foi verificado um diálogo direto de criação universal nessas três páginas. Sem autenticação de novas contas, preenchimento, postagem ou integração API nesta entrega. A experiência efetiva por conta/celular segue pendente.

**YouTube Music:** upload pessoal de áudio permite somente a audição pelo próprio usuário e não aceita o MP4 de produção. Distribuição pública de música requer entrega de áudio/metadados por distribuidor/parceiro e direitos adequados. Nenhum preset ou botão de publicação Music foi criado. Decisão humana pendente: se existe catálogo próprio/licenciado e se haverá distribuição pública. Isso não bloqueia o trabalho dos destinos de vídeo.

Fontes oficiais consultadas (25/10/2026): [Shorts até três minutos e reivindicações musicais](https://support.google.com/youtube/answer/15424877?hl=en), [Shorts no computador](https://support.google.com/youtube/answer/12779649?co=GENIE.Platform%3DDesktop&hl=en), [Meta: unificação dos vídeos Facebook](https://about.fb.com/news/2025/06/making-it-easier-create-videos-facebook/), [Instagram: proporções de Reels](https://www.facebook.com/help/instagram/1038071743007909?locale=en_GB), [Instagram: duração e recomendação](https://www.facebook.com/help/instagram/2720958398006062), [Rumble: envio e licença](https://rumble.support/en/help/how-to-upload-a-video), [Odysee: formatos e tamanho](https://help.odysee.tv/category-uploading/category-fileuploads/fileselection/), [Odysee: encoding e bitrate](https://help.odysee.tv/category-uploading/category-fileuploads/encoding/), [YouTube Music: uploads pessoais](https://support.google.com/youtubemusic/answer/9716522?hl=en), [distribuição musical](https://support.google.com/youtube/answer/9105565?hl=en-GB). As páginas Meta Help redirecionaram para login; o preset Instagram foi mantido conservador e sua aceitação real continua pendente. Não foi feita pesquisa comercial nem contratação.

## Atalhos de upload — histórico V2.5.2

Na ficha Preparar TikTok/Preparar YouTube, ao lado de Copiar título/legenda/hashtags, use **Abrir TikTok · upload** ou **Abrir YouTube · upload**. Abre uma nova aba na página oficial e mantém sua edição local. Confira a conta e o canal da plataforma; o painel não escolhe nem troca contas. O link nativo usa noopener/noreferrer e não depende de popup por JavaScript. Se houver bloqueio, use o menu do link para abrir manualmente. No celular, pode ser solicitado login ou aplicativo.

Selecione o vídeo em **Vídeo final desta plataforma**. Quando disponível, **Baixar MP4 selecionado** fica junto dos controles de cópia. Baixe o arquivo, copie os textos e selecione/cole manualmente na plataforma. **Montar vídeo** gera o MP4; **Preparar** organiza os textos; **Abrir** só navega. Nenhuma dessas ações registra publicação como realizada. Datas/URL e situação continuam sob confirmação manual.

Destinos verificados: [TikTok Studio upload](https://www.tiktok.com/tiktokstudio/upload) e [YouTube upload](https://www.youtube.com/upload), com redirecionamento oficial ao Studio. [Ajuda oficial do YouTube](https://support.google.com/youtube/answer/57407?co=GENIE.Platform%3DDesktop&hl=pt-BR). Nenhum arquivo foi enviado nesta verificação.

Serviço operacional atualizado para 2.5.2 em 127.0.0.1:8877; itens 1–3 disponíveis. Preserve edições abertas: salve antes de atualizar uma aba antiga. Rotinas externas permanecem desligadas.

## Preparação de textos — entrega local V2.5, 24/10/2026

Na produção existente, use **Preparar TikTok** ou **Preparar YouTube**. A primeira abertura sugere título, descrição e hashtags por plataforma. Registros existentes conservam seus textos. O catálogo não fornece áudio nem comprova ano/álbum: a sugestão usa somente dados confirmados da produção, quando existentes. Em **Dados do texto e ícone**, ano/álbum são opcionais e o ícone musical pode ser desmarcado.

Edite livremente. **Atualizar sugestão** mostra uma prévia; marque os campos desejados e use **Aplicar selecionados**. Campos modificados manualmente começam desmarcados. **Salvar registro** guarda texto, opções e vínculo com o vídeo. Fechar sem salvar não guarda a edição. Um rascunho já salvo é reaproveitado ao reabrir a mesma produção/plataforma; dados de TikTok e YouTube são independentes.

Use **Copiar título**, **Copiar legenda** (TikTok), **Copiar descrição completa** (YouTube) e **Copiar hashtags**. A legenda/descrição completa inclui hashtags sem repetir as que já estiverem no texto. Se o navegador negar a cópia automática, o texto aparece selecionado para copiar manualmente. O padrão editorial sugere 3–5 hashtags TikTok e 3 YouTube; não promete alcance. YouTube recusa salvar título acima de 100 caracteres ou descrição completa acima de 5.000.

**Vídeo final desta plataforma** lista anexos do navegador e MP4s exportados pela montagem local para aquele destino. A referência de render permanece no serviço, sem nova cópia no IndexedDB. Uma prévia indisponível conserva o vínculo anterior; confira o serviço antes de publicar manualmente. Conflito com outra aba exige reabrir para conferir a versão atual, sem sobrescrever a edição alheia. Recibos atualizados pelo serviço são preservados.

Salvar prepara/atualiza um registro local. Não envia arquivos ou publica. O proprietário ainda deve conferir dados, tom, hashtags e MP4. Os testes desta entrega usaram Chrome/contextos/bancos isolados e fixtures; resultado e limitações na [lista oficial](ORGANIZACAO_PROJETO.md). O serviço operacional não foi reiniciado para ativar a build. Backup do navegador conserva os textos/fatos; MP4s do serviço, SQLite e chave exigem suas próprias cópias.

---

> Histórico das etapas anteriores abaixo. A implementação de publicação com serviço está em [PUBLICACAO_SERVIDOR.md](PUBLICACAO_SERVIDOR.md); conexões e execução externa continuam desativadas.

# Publicações: preparação local e contratos de integração

Implementação de 23/10/2026. A interface continua estática, sem novo framework, cadastro duplicado ou migração do IndexedDB. Nenhuma conta foi conectada, credencial solicitada, aplicativo externo cadastrado ou publicação realizada.

## O que funciona

`app/publishing.js` complementa cada registro de `publications` com o campo `delivery`. O registro manual, o vínculo com a produção, arquivo final, métricas, URL e situação anterior são preservados. O backup existente inclui esse campo como parte da publicação, sem novo store.

O operador prepara um rascunho, confere o MP4 correspondente à plataforma, os direitos atuais e a revisão do arquivo. A ausência de conexão aparece como **Aguardando configuração**. Escolher explicitamente uma conta de teste permite **simular** recebimento, autorização, processamento, sucesso, rejeição, falha transitória e revogação. Não existe envio escondido ou ativação por variável de ambiente. Simulação concluída conserva `status` manual e nunca preenche URL, ID externo ou métricas reais.

Antes da simulação, o módulo consulta o banco atual e recalcula SHA-256 dos bytes do vídeo. Não confia apenas em uma aprovação antiga ou no hash declarado. Licença “Biblioteca de plataforma” continua disponível no fluxo manual, mas não satisfaz a autorização para transferir um MP4 com música incorporada. Direitos de gravação, composição, imagens, plataforma e arquivo final precisam estar confirmados. A validade da licença da produção e do arquivo final é verificada pela data em São Paulo.

### Estados e recuperação

`awaiting_review` → `awaiting_connection` ou `simulation_ready` → `transferring` → `received` → `authorized` → `processing` → `simulated_complete` / `failed`.

Todos os estados intermediários acima são identificados como simulação. Não significam que o servidor ou a plataforma tenham recebido conteúdo. Cancelar preserva o registro e seu histórico. Uma falha de rede simulada pode ser repetida com a mesma chave; rejeição ou consentimento revogado exige revisar, cancelar e preparar outra tentativa. Se o navegador for fechado entre etapas, o estado salvo não executa nada sozinho: é possível cancelar a tentativa interrompida e preparar novamente. Não há worker oculto no service worker.

A chave de idempotência incorpora publicação, produção e versão, plataforma, conta simulada, arquivo/hash/versão, metadados e aprovação. Alterar esses elementos gera nova preparação. Transações de publicação e histórico conferem a revisão esperada; duas execuções concorrentes não sobrescrevem silenciosamente uma à outra. Conciliação com resultado simulado preserva alterações editoriais locais e apresenta conflito quando a revisão mudou. TikTok e YouTube permanecem independentes.

Datas de planejamento são interpretadas no horário do dispositivo e normalizadas para ISO UTC no manifesto. A data registrada no calendário permanece um planejamento local. Horários passados são recusados para execução simulada, evitando transportar futuramente um `publishAt` que provoque publicação imediata.

## Contrato da interface

- `prepareDelivery(pub, production, assets, account?)`: grava preparação a partir dos registros atuais. Sem conta, aguarda configuração. Uma conta de teste tem `{id: 'simulation:youtube', platform: 'youtube', mode: 'simulation', label: 'Conta de teste local'}`.
- `deliveryIssues(...)`: pendências legíveis. `deliveryLabel(pub)`: situação. `connectionSummary(platform)`: real sempre desabilitado, nenhuma conta conectada.
- `runSimulation(pub, scenario)`: `success`, `network`, `rejected` ou `revoked`. A repetição de um sucesso é idempotente.
- `cancelDelivery(pub)`: cancela a tentativa, preservando histórico e publicação manual.
- `reconcileDelivery(pub, result)`: aceita somente resultado de simulação com publicação/chave/revisão correspondentes; não sobrepõe textos editados.
- `transferManifest(pub)`: valida novamente e gera um manifesto de simulação. Não inicia rede ou transferência. O arquivo segue separado; tokens nunca integram o manifesto.

Os métodos assíncronos retornam o registro atualizado. A interface deve atualizar o estado após cada ação e usar a palavra “simulação”.

## Componentes de servidor preparados, sem serviço remoto ativo

`server/simulation-service.mjs` é um serviço **embutível de homologação**, sem listener HTTP e sem chamadas de rede. Os testes chamam seus métodos diretamente. Recebe sessão aleatória de teste e proprietário; recusa sessão inválida, modo real, arquivo divergente e aprovação ausente. Persiste tarefas e bytes em diretório privado fornecido pelo chamador, com gravação de manifesto por arquivo temporário e renomeação. O diretório deve ficar fora da raiz pública e do Git; os testes usam pasta temporária isolada.

`accept(auth, envelope, bytes)` recebe explicitamente os dados. Só após recebimento persistido, `authorize(auth, id, revision, consent)` habilita `process(...)`. Repetições usam a mesma tarefa; mudança de conteúdo sob a mesma chave é erro. `get`, `cancel` e revisão esperada permitem consulta e recuperação após recriar a instância. Arquivos são conferidos novamente antes do processamento. Limite de homologação: 50 MB por arquivo, um escritor por diretório. Não é fila distribuída nem serviço de produção.

`server/oauth-simulation.mjs` exercita state aleatório com validade, vínculo ao proprietário, consumo único e recusa de consentimento. Tokens de teste são cifrados com AES-256-GCM por chave efêmera de teste; renovação e revogação são simuladas. A persistência privada é injetada. Não cria URL real de autorização, troca código real, conecta canal ou revoga credencial no Google. A chave nunca é gerada para produção nem incluída no frontend.

`server/provider-adapters.mjs` gera planos de requisição **desabilitados** e interpreta respostas de teste do YouTube: progresso retomável 308/Range, falha transitória, sessão expirada, necessidade de reconexão e rejeição no processamento. Os planos não possuem transporte. As funções de conexão, publicação e agendamento reais sempre falham com mensagem de desabilitação.

### Antes de qualquer ativação real futura

Faltam API HTTP autenticada e proteção CSRF/CORS, identidade persistente, backend dedicado, armazenamento privado com cota e limpeza, fila/worker com exclusão entre processos, biblioteca oficial OAuth, cofre de chaves, persistência cifrada de tokens e sessões retomáveis, autorização granular, observabilidade sem segredos e homologação real autorizada. O recebimento deve recalcular hash e consultar a aprovação/conta no servidor, não confiar em um booleano enviado pelo cliente. Uma URL retomável é segredo de servidor e não deve aparecer no histórico público ou backup do navegador.

É necessário implementar transporte explícito do navegador, recibo persistido e consulta de tarefa antes de afirmar que fechar a aba permite o servidor concluir um envio. Hoje a simulação local não usa o serviço embutível automaticamente. GitHub Pages segue hospedando somente a interface. Drive continua um fluxo manual, sem sincronização alegada.

## YouTube: requisitos verificados em fontes oficiais

O contrato separa `youtube.upload` para `videos.insert` de `youtube.readonly` para identificação do canal e consulta autorizada dos vídeos; o código não presume que upload conceda leitura de tudo. É preciso confirmar os escopos efetivamente concedidos antes de cada operação. O plano de upload define explicitamente privacidade, categoria, público infantil, declaração de conteúdo sintético e tags. [OAuth YouTube](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps), [videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert).

Agendamento requer vídeo privado e ainda não publicado; datas passadas podem publicar imediatamente. O plano local exige uma data futura. [Recurso videos — status](https://developers.google.com/youtube/v3/docs/videos#status.publishAt).

A sessão retomável deve persistir a URL retornada pelo servidor e confirmar os bytes recebidos, respeitando Range e Retry-After. Não se deve iniciar outro upload após perder a resposta sem reconciliar a sessão anterior. Os redutores implementados cobrem as respostas principais; persistência da URL real, envio de chunks e backoff aguardam transporte seguro. [Upload retomável](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol).

State, retorno, negativa de consentimento, renovação e revogação precisam ser implementados no servidor com biblioteca oficial e segredos protegidos. Os testes locais demonstram os contratos de erro; não certificam OAuth de produção. [OAuth para aplicações de servidor](https://developers.google.com/identity/protocols/oauth2/web-server).

## TikTok: restrições preservadas

Direct Post exige aplicação destinada a público amplo e considera inadequada ferramenta restrita às próprias contas/equipe. Clientes não auditados têm restrições de visualização privada. A interface futura deve consultar informação atual do criador, oferecer somente opções permitidas, obter escolha explícita de privacidade e consentimento musical; isso não está ativo neste painel pessoal. [Diretrizes de conteúdo](https://developers.tiktok.com/docs/en/content-sharing-guidelines).

`video.publish` e `video.upload` são permissões diferentes. Upload para caixa de entrada não equivale a publicação: o usuário ainda precisa finalizar no TikTok. Nenhuma delas foi solicitada. A exportação manual continua sendo o caminho operacional; o módulo de capacidades não promete agendamento ou aprovação do aplicativo. [Direct Post](https://developers.tiktok.com/docs/en/content-posting-api-get-started), [Upload](https://developers.tiktok.com/docs/en/content-posting-api-get-started-upload-content).

## Testes e custos

Com a prévia local iniciada: `node tests/publishing.cjs` e `node tests/publication-ui.cjs`. Utilizam as mesmas dependências Playwright e configurações `GMM_BASE_URL` / `GMM_BROWSER_CHANNEL` já presentes. Foram aprovadas 29 verificações de contrato, persistência, concorrência, cancelamento, falha/retomada, integridade, validade das licenças, OAuth simulado e separação entre plataformas; mais 10 verificações do fluxo real da interface, com edição de opções, prévia, revisão, simulação, falha/repetição após recarga e preservação do registro manual. Contexto de navegador isolado e diretório temporário são descartados; o banco pessoal não é utilizado.

Custos incrementais nesta etapa: nenhuma chamada paga, conta conectada, hospedagem alterada ou gasto contratado. Backend, armazenamento, tráfego, quotas, eventual auditoria e operação real precisam de dimensionamento e autorização em etapa própria. Variáveis preenchidas não comprovam conexão nem autorização.

## Auditoria posterior ao checkpoint principal

Rodada delimitada após o checkpoint `98fb962`, em 23/10/2026. Três achados P2 foram reproduzidos em banco descartável e corrigidos, sem mudança de stores ou registro manual:

| Achado e impacto | Correção de baixo risco | Evidência de validação |
|---|---|---|
| Resposta sem revisão era aceita; um sucesso podia voltar a processamento. Isso tornava inconsistente a situação simulada. | Revisão deve ser inteiro positivo; resposta tardia não regride sucesso terminal. | Revisões ausentes, zero, negativas, fracionárias, string e não finitas recusadas sem alterar tarefa; processamento/falha posterior preservam sucesso e resultado. |
| Conciliação não verificava aprovação, direitos ou bytes atuais. Resultado antigo podia aparecer como válido após revogação. | Revalidar a preparação inclusive ao conciliar estados terminais. Divergências geram conflito. | Revogação e corrupção real do Blob geram conflito; recibo com estado/revisão recebidos e resultado anterior são preservados; métricas e situação manual não mudam. |
| Manifesto podia ser construído para uma tentativa cancelada. | Somente tarefa preparada ou falha transitória repetível pode gerar manifesto. | Manifesto válido na preparação; após cancelar, operação recusada e cancelamento preservado. |

Risco e complexidade: baixos, restritos à validação e transições do módulo local; não introduzem rede, credenciais ou novas tabelas. A evidência externa é mantida em `delivery.conflict.receivedResult` quando há conflito, permitindo revisão sem reescrever textos, métricas ou o resultado anterior. As cinco regressões adicionais estão no teste de publicação, que totaliza 29 verificações.
