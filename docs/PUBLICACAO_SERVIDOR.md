# Publicação: implementação preparada para configuração

**Revisão do item 10, 25/10/2026:** consulte [matriz atual de integrações e relatório das dez entregas](INTEGRACOES_ESTADO_ATUAL.md). APIs preparadas não são contas conectadas ou publicação homologada; autorizações reais continuam pendentes.

**Atualização local de 25/10/2026:** backup composto e recuperação estão documentados em [ARMAZENAMENTO_BACKUP.md](ARMAZENAMENTO_BACKUP.md). O comando antigo service:backup continua sendo somente SQLite; não inclui mídias nem IndexedDB. V2.8.0 está preparada, sem ativação durante teste de Ricardo. Instruções históricas abaixo não autorizam habilitar flags/contas.

Implementação local de 23/10/2026, baseada no commit `d8d0aaf` da V2.1. O painel e a hospedagem existentes foram preservados em outra cópia. Esta etapa não conecta contas, não publica vídeos e não aplica SQL em nuvem.

## O que foi acrescentado

- Serviço Node.js 24, sem dependências adicionais de produção, com banco SQLite privado e migração própria.
- Acesso por senha exclusiva e sessão em cookie HttpOnly; proteção de origem nas alterações.
- Transferência autenticada em blocos de até 4 MiB, retomada por posição confirmada e verificação SHA-256 do MP4.
- Recebimento e autorização separados: salvar um rascunho não cria uma tarefa executável.
- Tarefas persistentes, aquisição transacional exclusiva, recuperação após reinício, idempotência, histórico e retentativas limitadas.
- OAuth de servidor para YouTube e TikTok, state de uso único vinculado à sessão, tokens cifrados com AES-256-GCM, renovação e desconexão.
- Adaptador YouTube: upload retomável, consulta de processamento e diferenciação entre privado, não listado, público e agendamento.
- Reagendamento e retirada do agendamento YouTube, com permissão adicional e confirmação, preservando o vídeo como privado.
- Adaptador TikTok para upload assistido à caixa de entrada, dependente de aprovação; Direct Post permanece indisponível neste aplicativo pessoal.
- Interface integrada em Configurações e Publicações, recibos separados do registro manual, áudio do MP4 e escolha de fuso.
- Backup consistente do SQLite do servidor, separado do backup dos dados locais.

## Execução local sem configurar plataformas

Na raiz do repositório, com Node.js 24 ou superior:

```sh
npm run dev
```

O comando anterior continua servindo apenas o painel estático, na porta 8765 por padrão. Para abrir a versão com serviço:

```sh
npm run service
```

Abra `http://127.0.0.1:8877/painel.html`. Sem `.env`, o painel abre, a disponibilidade pode ser consultada e a execução externa permanece desativada. Login, OAuth e execução real não são liberados pela falta de configuração.

Para testar transferências locais posteriormente, copie `.env.example` para `.env` e defina somente uma senha exclusiva em `GMM_OPERATOR_PASSWORD`, com pelo menos 16 caracteres. Não use a senha do Google ou TikTok. Mantenha os três controles de rede, publicação e worker como `false`. Em Configurações → Serviço de publicação, entre com essa senha. A conta fictícia de simulação permite transferir arquivos ao servidor local e executar testes sem acessar as redes sociais.

O processador faz parte do processo `npm run service`. Quando habilitado futuramente, continuará trabalhando com o painel fechado **enquanto o processo e o computador/servidor permanecerem ligados**. Fechar o terminal ou suspender o computador interrompe a execução; as tarefas permanecem no banco para retomada.

## Origem e continuidade entre computadores

O IndexedDB é específico de cada origem. As portas 8765 e 8877 e o GitHub Pages têm bancos locais diferentes. Antes de trocar de endereço, exporte um backup ZIP na origem antiga e restaure-o na nova. Não existe leitura automática dos dados privados de outra origem.

Nesta etapa, a API e o painel usam **a mesma origem**. Para hospedagem futura, use um domínio HTTPS com proxy reverso que encaminhe `/api/` ao serviço e mantenha o cabeçalho Host correspondente a `GMM_PUBLIC_ORIGIN`, ou sirva o painel por esse serviço. O processo escuta apenas em loopback. Não foi implementado acesso por CORS entre o GitHub Pages e um domínio de API separado.

Não é preciso migrar nem substituir o GitHub Pages para continuar utilizando o núcleo local. Uma publicação futura do backend exige escolher o ambiente de execução, armazenamento persistente, HTTPS e operação do processo. Esses serviços não foram contratados ou provisionados.

## Fluxo do operador

1. Finalize o vídeo da plataforma, registre direitos e aprove sua revisão no fluxo existente.
2. Salve o rascunho em Publicações. Nas opções, informe o fuso e se o MP4 já contém o áudio autorizado. O padrão mantém áudio pendente.
3. Em Publicações → Envio pelo serviço, escolha **Revisar e transferir**. Confira prévia, texto, destino e opções; autorize a transferência.
4. O servidor confirma os bytes e devolve uma tarefa em **Recebida**. Uma segunda confirmação autoriza executá-la.
5. Em simulação, execute o teste no servidor. Na operação futura real, o worker habilitado processará a tarefa.
6. Consulte os detalhes e o histórico. **Consultar tarefas e recuperar recibos** permite recuperar referências após restaurar um backup local. A consulta não dispara uploads.

Os dados aceitos pelo servidor são uma cópia imutável. Editar ou remover arquivos no navegador não modifica automaticamente uma tarefa aceita. **Antes de alterar uma peça já autorizada, consulte/cancele a tarefa no servidor e, se já existir agendamento externo, remova-o na plataforma.** Uma edição feita offline não consegue interromper um envio remoto. A conciliação sinaliza conflito e preserva os dois fatos sem sobrescrever a edição local.

Somente um resultado real do YouTube confirmado como público atualiza o registro como publicado pela API. Privado, não listado, processamento, simulação e envio TikTok para finalizar no aplicativo não viram automaticamente uma publicação pública. Métricas manuais não são sobrescritas. TikTok confirmado sem link público permanece com recibo separado para conferência.

## Configuração futura do YouTube

1. Escolha um projeto Google Cloud dedicado; habilite YouTube Data API e prepare consentimento OAuth adequado à conta e ao uso.
2. Crie um cliente de aplicação web. Cadastre exatamente `<GMM_PUBLIC_ORIGIN>/api/oauth/youtube/callback` como retorno autorizado.
3. Defina `YOUTUBE_CLIENT_ID` e `YOUTUBE_CLIENT_SECRET` somente no ambiente privado do serviço.
4. Gere uma chave aleatória de 32 bytes e informe a representação hexadecimal de 64 caracteres em `GMM_ENCRYPTION_KEY`. Guarde-a separadamente do código e do banco.
5. Habilite `GMM_ALLOW_NETWORK=true` somente quando for autorizado conectar. Em Configurações, conecte o canal e confira o nome efetivamente retornado.
6. Para operação básica, são solicitados `youtube.upload` e `youtube.readonly`: upload, identificação do canal e processamento.
7. Para alterar/remover agendamentos aceitos, habilite `YOUTUBE_MANAGE_SCHEDULES=true` e autorize novamente. Nesse modo o escopo solicitado é `youtube.force-ssl`, que também atende as operações básicas. O modo básico não promete permissão de edição.
8. Só habilite `GMM_ALLOW_PUBLISH=true` e `GMM_WORKER_ENABLED=true` após autorizar um teste controlado. Comece com vídeo próprio ou licenciado, visibilidade privada e sem agendamento.

Agendamento usa `status.publishAt` em UTC e exige vídeo privado ainda não publicado. A interface converte o horário do fuso selecionado, rejeitando horários ambíguos/inexistentes. O servidor exige pelo menos um minuto de antecedência e recusa iniciar um upload cujo horário já passou. Datas não são usadas para prometer instante exato de disponibilidade.

Para reagendar um vídeo já aceito, salve a nova data no rascunho, preserve vídeo/conta/demais metadados e use **Aplicar nova data do rascunho** nos detalhes. **Remover agendamento no YouTube** mantém o vídeo privado. Essas operações exigem consulta da situação atual e confirmação. Se a resposta for perdida, a tarefa fica para conciliação em vez de repetir a alteração silenciosamente.

Não há endpoint especial de Shorts nem garantia de classificação ou miniatura personalizada. Título/descrição/hashtags são enviados como preparados; não há seleção ou incorporação de música comercial pela API.

## Configuração futura do TikTok

Direct Post não foi habilitado: as diretrizes oficiais não aceitam ferramenta limitada às próprias contas/equipe. O código não contorna essa regra e nenhuma promessa de aprovação foi feita.

O caminho implementado é **upload assistido**, com finalização pelo usuário no aplicativo. Antes de usar, obtenha confirmação de que o aplicativo e seu uso são elegíveis e a aprovação de `video.upload`; configure Login Kit e a URL HTTPS `<GMM_PUBLIC_ORIGIN>/api/oauth/tiktok/callback`.

Defina `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` e `TIKTOK_UPLOAD_APPROVED=true` somente após conferir a aprovação real. Esta variável é uma declaração administrativa, não consulta nem concede aprovação. São solicitados `user.info.basic` e `video.upload`. OAuth TikTok fica bloqueado em origem HTTP local; é necessário ambiente HTTPS autorizado para homologar a conexão web.

O adaptador inicializa a sessão, transfere o arquivo e consulta `publish/status/fetch`. `SEND_TO_USER_INBOX` significa aguardando ação; `PUBLISH_COMPLETE` é preservado como confirmação do provedor, sem inferir visibilidade pública ou inventar URL. Título/descrição precisam ser conferidos e aplicados no fluxo do aplicativo; o endpoint de inbox para vídeo não recebe os mesmos campos do Direct Post.

Agendamento automático TikTok não é oferecido. Não há Direct Post, seleção automática de música nem automação de navegador. Vídeos que precisam receber música dentro do aplicativo permanecem no fluxo manual; a API não transforma a licença da biblioteca em permissão para incorporar a faixa ao MP4.

## Confiabilidade e dados privados

O SQLite fica por padrão em `.cache/publishing-private/publishing.sqlite`, com WAL. Tokens são cifrados; cookies, URLs de upload e tokens não são devolvidos nos recibos nem incluídos no ZIP do navegador. O servidor não serve `.cache`, `.env`, código de servidor ou banco por HTTP. A senha existe apenas no ambiente e durante a autenticação; não é persistida em IndexedDB.

O modelo é de **um operador**, sem compartilhamento multiusuário. Não é uma integração Supabase e não aplica `db/schema-proposto.sql`. A migração local está em `server/runtime/migrations/001-publishing.sql`; o banco do navegador continua com os stores e a versão existentes.

Não limpe a pasta privada ou substitua seu SQLite por um banco vazio para retomar uma fila. Isso perderia os identificadores de idempotência. Guarde um backup consistente do serviço:

```sh
npm run service:backup -- CAMINHO_PRIVADO_FORA_DO_PROJETO/backup.sqlite
```

O arquivo inclui tarefas, mídia e tokens cifrados: é privado e não deve ir ao GitHub. A chave de cifragem e a configuração devem ser guardadas separadamente. Para recuperar o servidor, pare o serviço, preserve o banco atual e restaure o backup como `publishing.sqlite` em um diretório dedicado, com a chave original. Revalide credenciais e tarefas antes de reativar o worker. O ZIP do navegador não substitui esse backup, e sua restauração não autoriza tarefas novas no servidor.

Em Windows, configure permissões do diretório privado para a conta operadora; modos POSIX não substituem ACLs do sistema. Em homologação, dimensione espaço (até 500 MiB por vídeo, mais banco/WAL/backups), retenção, tráfego e limites da API. Não há expurgo automático dos registros de idempotência. A biblioteca Drive segue manual, sem sincronização nova nesta etapa.

Timeout de inicialização de upload e sessão expirada exigem conciliação; não iniciam outro upload automaticamente. YouTube consulta a posição da mesma sessão para retomar. TikTok não tem retomada arbitrária presumida: resultado desconhecido de um bloco fica para conferência. Cancelamento local é recusado quando já pode existir conteúdo externo; utilize o fluxo de agendamento ou o aplicativo/Studio.

## Testes e limites de validação

```sh
npm ci
# Em outro terminal: npm run dev
npm test
# Somente as novas verificações:
npm run test:service
npm run test:service:ui
```

Os testes novos usam diretórios temporários e navegador isolado. O transporte das plataformas é injetado com respostas simuladas: nenhuma autenticação ou publicação externa real é realizada. A verificação de interface bloqueia destinos de rede fora do servidor local.

Foram testados recebimento/retomada, SHA-256, duplicidade, concorrência, reinício, autorização separada, limites de repetição, OAuth, revogação, cifragem, visibilidades, reagendamento e cancelamento externo simulados, resposta ambígua, backup consistente, proteção da API, fuso, áudio pendente, recibos e conflitos locais.

Pendências reais: configuração dos aplicativos e ambiente, elegibilidade/aprovação TikTok, autorização das contas, testes privados autorizados, quotas efetivas e avaliação operacional com vídeos grandes. Não há afirmação de integração homologada em produção. Renderização MP4, Drive automático e criação audiovisual por IA continuam fora desta implementação.

## Fontes oficiais consultadas em 23/10/2026

- [YouTube OAuth](https://developers.google.com/identity/protocols/oauth2/web-server)
- [YouTube upload](https://developers.google.com/youtube/data/reference/rest/v3/videos/insert)
- [YouTube sessão retomável](https://developers.google.com/youtube/data/guides/using_resumable_upload_protocol)
- [YouTube estados e publishAt](https://developers.google.com/youtube/data/reference/rest/v3/videos)
- [YouTube atualização de agendamento](https://developers.google.com/youtube/data/reference/rest/v3/videos/update)
- [TikTok Login Kit web](https://developers.tiktok.com/docs/en/login-kit-web)
- [TikTok tokens](https://developers.tiktok.com/docs/en/oauth-user-access-token-management)
- [TikTok upload assistido](https://developers.tiktok.com/docs/en/content-posting-api-get-started-upload-content)
- [TikTok status](https://developers.tiktok.com/docs/en/content-posting-api-reference-get-video-status)
- [TikTok elegibilidade/Direct Post](https://developers.tiktok.com/docs/en/content-sharing-guidelines)
