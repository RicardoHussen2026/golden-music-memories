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

Com a prévia local iniciada: `node tests/publishing.cjs` e `node tests/publication-ui.cjs`. Utilizam as mesmas dependências Playwright e configurações `GMM_BASE_URL` / `GMM_BROWSER_CHANNEL` já presentes. Foram aprovadas 24 verificações de contrato, persistência, concorrência, cancelamento, falha/retomada, integridade, validade das licenças, OAuth simulado e separação entre plataformas; mais 10 verificações do fluxo real da interface, com edição de opções, prévia, revisão, simulação, falha/repetição após recarga e preservação do registro manual. Contexto de navegador isolado e diretório temporário são descartados; o banco pessoal não é utilizado.

Custos incrementais nesta etapa: nenhuma chamada paga, conta conectada, hospedagem alterada ou gasto contratado. Backend, armazenamento, tráfego, quotas, eventual auditoria e operação real precisam de dimensionamento e autorização em etapa própria. Variáveis preenchidas não comprovam conexão nem autorização.
