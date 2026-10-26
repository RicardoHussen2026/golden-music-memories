# Acervo pronto e programação — V2.3

**Atualização local 2.11.0 — 25/10/2026:** catálogo real de 165 clipes, preparação individual/longa e novas coleções. Ver [entrega e guia atual](CATALOGO_CLIPES_V211.md). Catálogo legado retirado da seleção ativa com referências recuperáveis; demais dados preservados. Sequências novas usam capa/intro opcionais apenas no começo e clipes completos. Rotina externa não ativada. Biblioteca `acervo/` precisa de preservação própria, além do backup do navegador e do serviço.


**Cliente Web autorizado, cadastro bloqueado no público — 25/10/2026:** autorização específica recebida para cliente Golden Music Memories Local no My First Project/project-31b0194d-55fb-457e-a91, conta ric.hussen@gmail.com e callback local. A UI Google exigiu cadastro prévio da plataforma/branding; nome e suporte foram preenchidos em rascunho, sem clicar Criar. Ao selecionar Externo, revisão automática rejeitou antes da ação: público/consentimento foram separados da autorização do cliente. Ambos os rádios continuam desmarcados. Não tentou outra opção/rota nem criou cliente/segredo. Necessária aprovação específica para cadastrar público Externo em modoTestes, com somente ric.hussen@gmail.com como usuário de teste, sem publicar app ou conceder acesso Drive. Se surgir termo adicional, tratar separadamente. Tela preservada no Chrome; evidência.cache/drive-auditoria/publico-pendente.png.

**Preparação local independente:** candidatos em.cache/drive-auditoria/candidate, NÃO aplicados/ativados: Providers adaptado para drive.file, recusando grants/tokens legados amplos; Drive/setup integra vínculo por IDs selecionados e remove criação por nome; configuração candidata exige ID raiz explícito; Picker/orquestração exigem raiz+4subpastas, verificam conta/pais/tipos/capacidades/permissões, cancelamento e salvamento único após validação completa.18 testes isolados passaram; não é integração Google real. Ainda faltam colar rotas/UI e aprovar contrato de access token efêmero em memória no navegador, preservando refresh/client_secret no servidor, além de origens/CSP. Não há broker real expondo tokens. Requisitos de futura chave: mesmo projeto/número AppID do OAuth, restrição de aplicação HTTP referrers http://127.0.0.1:8877/* e restrição de API Google Picker API; nenhuma chave criada. drive.file não garante acesso a filhos preexistentes não selecionados, nem privacidade eterna de pastas. Software operacional2.9.9/interface8e3c066ca510/backenddd821933af77 intacto, sem build/restart/push. TXT32bytes não enviado; acervo parado, auditoria22checks preservada/pausada.

**Conexão Drive — checkpoint atualizado de 25/10/2026:** conta ric.hussen@gmail.com confirmada na tela Google Cloud e no conector. Leitura pelo conector confirmou a raiz1GArPHKjcbMyfEyDi7l8gcaB07mIQtXoH e quatro subpastas com pais corretos; ARTES DO PROJETO também existe e foi preservada. A leitura não concede OAuth ao painel nem prova capacidade de escrita retornada pelo aplicativo. Painel ainda configured=false/oauthEnabled=false. Console aberto em My First Project/project-31b0194d-55fb-457e-a91 mostra zero clientes OAuth e zero chaves de API; buscaGolden não mostrou recurso no seletor atual, sem afirmar inexistência global. Nenhuma credencial criada, consentimento aceito ou arquivo enviado. Único escopo exigido hoje por Providers é https://www.googleapis.com/auth/drive (amplo/restrito). drive.file é alternativa de menor privilégio, mas seleção explícita/Picker e adaptação ainda não implementadas; não garante varrer todo conteúdo previamente colocado numa pasta. NÃO solicitar/aceitar acesso amplo nesta etapa. Antes de criação/configuração de cliente e persistência de token, o principal deve obter aprovação da ação específica, projeto, conta e escopos. Callbackprevisto127.0.0.1:8877/api/oauth/drive/callback. Auditoria pausada após22checksUI isolados/0erros/0overflow; evidências em.cache/drive-auditoria/ui. Código/runtime2.9.9 e acervo intactos; resolvedor seguro permanece isolado, integração ainda não entregue.

## Diagnóstico vigente do Drive — conexão não iniciada

**Drive — diagnóstico focal de 25/10/2026:** runtime operacional 2.9.9/dd821933af77, Drive configured=false/oauthEnabled=false e rede/publicação/worker=false confirmados por health. Não foi lido .env, criado cliente/chave/token, iniciada conexão ou transmitido arquivo. Não há negativa de OAuth: a ação não foi iniciada por ausência de configuração e autorização específica. Integração permanece PARCIAL/BLOQUEADA para homologaçăo real; conexão do assistente não configura o aplicativo.

| Parte | Estado verificado | Limite/próximo passo |
|---|---|---|
| Runtime Drive existente | Upload MP4 retomável com ID reservado/probe/offset; importação paginada, cache e verificações de versão/MD5/tamanho; OAuth valida conta e cifra tokens | Não conectado nem homologado em conta real. Suporta o fluxo legado de MP4, não prova entrega do novo pacote organizado de todas as categorias |
| Plano/fila preparados | scripts/drive-preparation/plan.mjs e queue.mjs deduplicam hash/categoria, preservam versões/referências, conciliam resposta perdida e cancelamento | Permanecem isolados, sem adaptador real/rotas/UI/bundle. Não chamar essa preparação de integração concluída |
| Destino previsto | Conta ric.hussen@gmail.com; raiz 1GArPHKjcbMyfEyDi7l8gcaB07mIQtXoH; subpastas 01_EM_EDICAO,02_VIDEOS_PRONTOS,03_CAPAS_E_CAPCUT,04_CONTROLE_E_BACKUPS | Referência informada anteriormente, não prova de acesso/conteúdo/privacidade atuais; não é o e-mail do canal. Confirmar identidade, raiz, IDs únicos dos filhos e permissões antes de uso |
| Vinculação da pasta | setup() legado procura/cria Golden Music Memories por nome; UI chama /drive/setup sem ID | Não garante uso da raiz indicada. Resolver ligação explícita ao ID, pai e permissões antes da homologaçăo. O resolvedor seguro resolveFolders já existe no plano isolado; não usar botão antigo para criar outra pasta por suposição |
| Privacidade e integralidade | Runtime confirma MD5/tamanho/ID; plano novo exige também SHA e privacidade explícita no recibo | Runtime não comprova permissões herdadas/públicas da pasta pelo checksum. Adaptador/checagem de permissões e conciliação são lacunas antes de afirmar cópia privada |
| Testes atuais | 7 preparação +33 operações =40 passaram com mocks/arquivos/bancos temporários, zero chamadas Google | Primeira execução no sandbox teve 4 falhas EPERM em rename da Temp; execução normal autorizada passou sem alterar código/atomicidade. Não é upload real aprovado |

**Autorização mínima a solicitar pelo principal:** confirmar uso da conta e pasta previstas e autorizar configuração do cliente OAuth do próprio aplicativo (ou informar que já existe um cliente para configuração local segura), incluindo persistência cifrada do refresh token. O código atual solicita https://www.googleapis.com/auth/drive, permissão ampla/restrita de leitura e gerenciamento dos arquivos da conta, não restrita pelo Google só à pasta Golden. O titular deve decidir entre aprovar conscientemente esse escopo ou adotar drive.file com seleção explícita/Picker e adaptação do fluxo. Não alterar escopo/credenciais, aceitar consentimento, criar acesso persistente ou habilitar rede por inferência. Não pedir segredo pelo chat. Retorno local previsto: http://127.0.0.1:8877/api/oauth/drive/callback, a cadastrar exatamente no cliente autorizado; não abrir rede/LAN.

Após essa decisão: terminar ligação segura da raiz/transporte/UI em ambiente isolado; confirmar conta/pasta com leitura autorizada. Só então apresentar arquivo de teste, hash, categoria, destino e ação para aprovação de transmissão. Backup externo anterior foi cancelado: NÃO enviar controle/backup/mídia real como teste. Nenhum consentimento de publicação social decorre dessa conexão.

Fontes oficiais consultadas em25/10/2026: [escopos Drive](https://developers.google.com/workspace/drive/api/guides/api-specific-auth) recomenda acesso por arquivo quando possível e distingue drive amplo de drive.file; [upload retomável](https://developers.google.com/workspace/drive/api/guides/manage-uploads); [OAuth Web](https://developers.google.com/identity/protocols/oauth2/web-server), com exceção de loopback para HTTP local. Decisão de escopo não foi tomada pelo assistente.

O bloqueio do Drive está estabelecido. Prosseguir somente à auditoria geral autorizada, finita, sem reativar acervo ou implementar seus achados antes da apresentação da nova lista pelo principal. Software local/público permanece2.9.9, sem novo build/ativação/publicação.


## Documentação anterior preservada — não autoriza conexão/envios

## Item 9 — preparação isolada do Drive, 25/10/2026

Estado **parcial**: planejamento/fila testados sem conta, sem upload real e sem integração nova ao painel. O código novo fica somente em scripts/drive-preparation/{plan,queue}.mjs; não é importado por app/ ou server/runtime/. Não altera versão, cache, interface servida ou backend preparado no item 8. Painel operacional permanece 2.7.2 enquanto Ricardo testa o baixador; build 2.8.0 preparada continua sem ativação.

### Destino conhecido, sem inferir acesso

Raiz informada pelo proprietário: https://drive.google.com/drive/folders/1GArPHKjcbMyfEyDi7l8gcaB07mIQtXoH , conta ric.hussen@gmail.com. Não é o e-mail do canal. Os quatro nomes são 01_EM_EDICAO, 02_VIDEOS_PRONTOS, 03_CAPAS_E_CAPCUT e 04_CONTROLE_E_BACKUPS. O conteúdo atual e os IDs das subpastas NÃO foram consultados nesta rodada; não afirmar que continuam vazias.

O runtime existente drive.mjs já prevê upload retomável de MP4, ID reservado, offset/probe, verificação MD5/tamanho, importação, controle cifrado e conta conferida. Providers pede o escopo amplo https://www.googleapis.com/auth/drive e compara o e-mail configurado. A função setup antiga procura/cria a raiz pelo nome: **não usá-la como se já estivesse vinculada ao ID confirmado**. O novo resolvedor isolado exige a raiz exata, o pai e uma única subpasta por nome; não cria pastas, não resolve ambiguidades escolhendo a primeira.

Leitura exclusiva de /api/health em 25/10 às 02:03 UTC confirmou Drive configured=false e oauthEnabled=false, rede/worker/publicação false. Isso é ausência de configuração declarada do aplicativo, não prova de permissão da sessão do navegador ou do conector do assistente. Não foram lidos .env, tokens ou chave, abertos logins, criados clientes ou armazenados acessos.

### Preparação implementada e limites

- Plano local com raiz explícita, arquivos presentes, produção/coletânea por UUID completo, versão positiva, papel, categoria, título/artista fornecidos e destinos. Calcula SHA-256/MD5 em fluxo e recusa alteração do arquivo, links simbólicos, saída da raiz e nomes típicos de segredos/configuração. Mesmo nome não é identidade; conteúdo diferente para a mesma produção/papel/versão exige nova versão.
- Reutiliza uma cópia por hash/categoria/pasta/conta, preservando referências de várias postagens/produções no manifesto; mesmo MP4 adequado não vira sete uploads. Nome remoto determinístico GMM_UUID_Vn_HASH.ext, sem mudar o original. Manifesto não contém caminho absoluto local, senha ou tokens. Planos repetidos com as mesmas entradas mantêm ID.
- Fila local com estados not_sent (não enviado), sending (enviando), complete (concluído por recibo), error e cancelled, persistência atômica, progresso, cancelamento e retomada. Antes de enviar, concilia por ID reservado/chave/hash/pai; resposta perdida não autoriza criar outro arquivo. Recibo precisa confirmar ID, MD5, tamanho, SHA registrado e privacidade explícita. Cópia ausente/divergente/ambígua não é sobrescrita ou excluída. Manifesto consolidado é produzido apenas quando todos os recibos conferem.
- **Transporte real deste fluxo novo ainda NÃO conectado.** A interface de transporte foi exercitada somente em mocks. O mock confirma privacidade; não comprova permissões de uma pasta real. Um adaptador futuro deve conferir permissões efetivas e herança, sem torná-la pública ou alterar permissões silenciosamente. Nenhum botão/API novo foi exposto e nenhum estado de mídia operacional mudou.
- Fontes podem ir à edição, finais à pasta de prontos, capas/ZIPs à pasta correspondente, controles à pasta de backups. Snapshot do serviço é uma pasta composta: não enviar só manifest.json como se fosse backup recuperável. Upload completo desse bundle, consolidação com o fluxo antigo, UI compacta e teste real continuam pendentes; não foi prometido backup automático no Drive. Não há agendamento novo.

Documentação oficial consultada para o desenho: [uploads retomáveis e IDs pré-gerados](https://developers.google.com/workspace/drive/api/guides/manage-uploads), [propriedades privadas do aplicativo](https://developers.google.com/workspace/drive/api/guides/properties), [escopos Drive](https://developers.google.com/workspace/drive/api/guides/api-specific-auth). A confirmação local de hash não é uma nova API remota de SHA-256: o plano prevê appProperties e confirmação MD5, que precisam ser implementadas/conferidas pelo adaptador autorizado.

### Testes e próximo passo mínimo

node --test tests/drive-preparation.test.mjs: 7 testes passaram; arquivos próprios em diretórios temporários, transporte simulado, nenhum fetch ao Google. Cobertura: plano/dedupe/versionamento, raiz/pastas, persistência/reabertura idempotente, resposta perdida, cancelamento/progresso, conta/pasta/privacidade/checksum divergentes, arquivo alterado e ambiguidade. Regressão existente operations.test.mjs: 33 testes passaram com fixtures/mocks. Logs em .cache/drive9/, incluindo a tentativa inicial EPERM de rename recusada pelo sandbox; a execução específica aprovada passou sem relaxar assertivas. Build do item 8 permaneceu idêntica.

Para avançar ao real, a coordenação precisa obter autorização específica para **configurar/conectar OAuth próprio do aplicativo à conta ric.hussen@gmail.com**, explicando que o código existente pede Drive amplo. Antes da configuração, decidir manter esse escopo aprovado ou implementar seleção de pasta/drive.file compatível com a raiz já existente; não trocar silenciosamente um pelo outro. Depois conectar e conferir conta/raiz/subpastas somente por leitura. O upload de UMA fixture pequena, com nome/destino/tamanho/hash mostrados antes, exige autorização separada. Não pedir senha ou tokens pelo chat. O conector do assistente não substitui esse consentimento do aplicativo.

Nenhuma dessas autorizações foi presumida nesta rodada. A pendência não bloqueia preparação independente do item 10; integrações de publicação também não estão autorizadas a enviar ou publicar. As seções V2.3 abaixo são históricas e não significam ativação/configuração atual.


O aplicativo organiza capas e produções, recebe os MP4 finalizados no CapCut, conserva referências no Google Drive e seleciona vídeos para a programação. A edição, a legenda e a tradução continuam no CapCut.

## Fluxo diário

1. No Catálogo, reserve as músicas e crie as produções.
2. Em **Acervo e programação → Gerar lote de capas e pacote CapCut**, escolha de uma a cinco produções. São geradas duas capas por produção (vertical 1080×1920 e horizontal 1280×720), guardadas como novas versões. O ZIP contém os cinco pacotes de edição, textos e identificação.
3. No CapCut, finalize áudio, clipe, tradução, legenda e chamada adequada ao destino. A aplicação não reconhece letras nem renderiza vídeos.
4. Use `GMM_ID_COMPLETO_DA_PRODUCAO_YOUTUBE.mp4`, `_TIKTOK.mp4` ou `_AMBOS.mp4` para o arquivo final. O ID está no nome do pacote. Um mesmo arquivo pode atender aos dois destinos; versões diferentes permanecem separadas.
5. Leve os finais à pasta `02_VIDEOS_PRONTOS` do Drive, ou receba-os no serviço pelo seletor de MP4 e use **Enviar ao Drive**.
6. Para começar manualmente, publique pelas plataformas e use **Registrar postagem manual**, indicando destino, link e data. **Sincronizar produções e histórico deste navegador** traz os registros antigos para a seleção do serviço.
7. Quando configurado, habilite a entrada automática da pasta. O consentimento declara que seus arquivos já estão finalizados e autorizados. Somente nomes associados a uma produção inequívoca e MP4 com vídeo, áudio, duração e integridade identificáveis tornam-se elegíveis. Arquivos sem identificação ficam em edição para associação.
8. Configure dias, horários, fuso e política de repetição. Comece com simulação. O modo real exige configuração e conta autorizada.

Não use a pasta de prontos para exportações parciais. Mantenha o arquivo em `01_EM_EDICAO` e mova-o para a pasta de prontos somente depois de concluir o upload. As chamadas desenhadas no vídeo não se tornam links clicáveis. A miniatura YouTube e o quadro escolhido no TikTok dependem dos recursos de cada conta/formato.

## Serviço local e início no Windows

Requer Node.js 24 ou superior. A instalação não usa Python, FFmpeg, Oracle ou Colab. Na raiz da cópia do repositório:

```powershell
npm run service:setup
npm run service:start
```

O primeiro comando cria `.env` somente se não existir, com senha exclusiva e chave aleatória de cifragem. Não imprime os segredos. Abra esse arquivo localmente para obter a senha do serviço e guarde a chave em lugar seguro. Não envie senhas/chaves por chat e não as comite.

Abra `http://127.0.0.1:8877/painel.html`, entre em **Configurações → Entrar no serviço** e depois vá a **Acervo e programação**. A página GitHub Pages continua entregando o painel estático. O serviço com fila, arquivos e OAuth funciona neste computador, em sua própria origem.

O launcher inicia Node em segundo plano; fechar a aba não encerra o serviço. O computador precisa estar ligado, conectado e sem suspensão. O comando `npm run service:stop` encerra somente o processo registrado pelo launcher, depois de conferir sua identidade. Pause a operação no painel antes de encerrar.

Opcionalmente, `npm run service:startup` cria um atalho na inicialização do usuário Windows. Não instala serviço administrativo nem modifica a política de execução do sistema. Requer sessão do usuário aberta. Para retirar essa opção, remova apenas o atalho **Golden Music Memories** da pasta Inicializar do Windows.

Preparação, início em segundo plano, detecção de processo já iniciado, parada e reinício foram exercitados neste computador. A inicialização automática no login não foi instalada; permanece para configuração de uso. O segundo PC ainda precisa ser homologado. Porta personalizada exige usar o endereço definido em `.env`, em vez do endereço padrão informado pelo launcher.

## Dados e migração

- IndexedDB preservado: catálogo, produções, capas, materiais anteriores e publicações locais.
- SQLite privado: acervo do serviço, referências Drive, política, slots, tarefas, histórico e conexões.
- `media/UUID.mp4` no diretório privado: cache em disco, sem colocar vídeos grandes em memória ou no Git.
- Drive: cópia externa dos arquivos finalizados e pacotes cifrados de controle.
- **Sincronizar produções e histórico** copia metadados por ID; não apaga nem migra automaticamente o IndexedDB.

GitHub Pages, localhost:8765 e localhost:8877 têm bancos de navegador diferentes. Antes de trocar de origem, exporte o backup ZIP na origem antiga e restaure-o na nova. O backup do navegador e o controle do serviço têm responsabilidades diferentes.

## Google Drive

Configure um cliente OAuth Web do próprio projeto Google Cloud, ative a Drive API e cadastre o retorno exato:

```text
http://127.0.0.1:8877/api/oauth/drive/callback
```

Variáveis em `.env`:

```text
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_EMAIL=ric.hussen@gmail.com
GMM_ALLOW_NETWORK=true
```

O código solicita `https://www.googleapis.com/auth/drive`, pois a rotina deve descobrir arquivos que você colocou manualmente na pasta. Esse é um escopo amplo e restrito do Google; a configuração do consentimento e eventuais exigências de verificação são pendências reais. O aplicativo limita suas operações às pastas do projeto e à conta configurada. O escopo `drive.file` sozinho não concede acesso geral a arquivos colocados manualmente pelo usuário sem seleção/autorização apropriada.

Entre no serviço, use **Conectar Google Drive** e **Preparar pastas do projeto**. A rotina reutiliza pastas de mesmo nome no mesmo pai; nomes duplicados exigem correção explícita. Nada é tornado público.

Estrutura:

```text
Golden Music Memories/
  01_EM_EDICAO/
  02_VIDEOS_PRONTOS/
  03_CAPAS_E_CAPCUT/
  04_CONTROLE_E_BACKUPS/
```

A estrutura foi criada e relida pelo conector autorizado nesta entrega, na conta indicada. Isso não configura o OAuth próprio do aplicativo. IDs e links privados foram entregues ao proprietário fora do repositório público.

O scanner trabalha na pasta imediata de prontos, com paginação. Com a entrada automática ativa, consulta novidades aproximadamente a cada cinco minutos, enquanto a máquina estiver ativa. Arquivos em subpastas não são importados recursivamente. MP4 modificados no Drive recebem nova revisão e são verificados por versão, tamanho e MD5; o cache calcula também SHA-256.

Upload usa sessão retomável com posição consultada antes de repetir blocos. Resposta inicial desconhecida fica para conferência; não cria outro arquivo automaticamente. Download confirma faixa e versão antes e depois. Falhas de Drive não impedem o processador de consultar outras tarefas independentes.

## Programação

Padrão: cinco horários diários por plataforma, configuráveis. YouTube começa habilitado para a simulação; TikTok pode ser incluído na simulação. O modo real do TikTok permanece bloqueado. Dias da semana, período opcional e fuso são salvos no serviço.

A prévia mostra os próximos horários configurados; ela não confirma agendamento externo. O processador prepara arquivos com antecedência (padrão 120 minutos). YouTube recebe vídeos como privados com `publishAt` quando há antecedência suficiente. No modo de recuperação imediata de horário perdido, a opção é publicação pública após processamento.

O estoque considera arquivos prontos, produção válida, destino, licença vigente e histórico daquele destino. Por padrão, uma música já utilizada naquele destino não volta à seleção. Reutilização exige intervalo positivo em dias. Intervalo de artistas e filtro de décadas também afetam a elegibilidade. Simulação não marca o vídeo como publicação real.

Slots têm identidade estável e tarefas persistentes. Reiniciar o serviço não deve duplicar a mesma tarefa. Falhas ambíguas exigem conciliação; não se reinicia um upload arbitrariamente. Se um vídeo candidato não estiver disponível, a política escolhe o próximo elegível ou deixa o slot vazio. Um slot futuro vazio pode ser reavaliado a cada minuto. Slots perdidos são pulados ou recuperados sem rajada, no máximo um por destino a cada retomada.

A recuperação considera no máximo sete dias anteriores. Não se tenta despejar meses de postagem quando um computador retorna. Pausar impede novos envios automáticos. **Agendamentos já aceitos pelo YouTube continuam no provedor**, inclusive com os dois computadores desligados; altere-os na tarefa correspondente ou no Studio.

## YouTube e TikTok

YouTube: OAuth, renovação, upload retomável, consulta do processamento e estados privado/não listado/agendado/público têm adaptadores implementados. Configuração é descrita também em PUBLICACAO_SERVIDOR.md. A rotina permite declarar conteúdo infantil e conteúdo alterado/sintético. Categoria padrão: música.

O limite local inicial é 900 segundos para YouTube. Se a conta estiver verificada e admitir vídeos maiores, ajuste `YOUTUBE_MAX_DURATION_SECONDS` para o limite confirmado, até 43.200. O sistema mede o arquivo e **não corta a música**. Duração de metadados do catálogo não substitui a duração do MP4.

TikTok: existe upload assistido com `video.upload`, condicionado à elegibilidade/aprovação e a retorno OAuth HTTPS. O usuário finaliza no aplicativo. **A publicação automática Direct Post de uma ferramenta limitada às próprias contas não é aceita pelas diretrizes consultadas. Não basta deixar uma aprovação Developer pendente para prometer automação total.** É necessária uma solução oficialmente compatível antes de ampliar esse recurso.

**Enviar pelo serviço** permite um envio pontual a partir da biblioteca, com consentimento específico e recibo. Isso não altera a política da rotina. As credenciais, quotas, limites efetivos de cada conta e um upload real autorizado ainda precisam ser homologados. Clientes Google em Testing podem ter tokens de renovação com validade curta (frequentemente sete dias nesse cenário).

## Cache, retenção e backup

`GMM_MAX_FILE_MIB=10240` permite até 10 GiB por MP4. `GMM_MIN_FREE_MIB=1024` preserva 1 GiB livre. São limites configuráveis, não recomendação de preencher o disco. O navegador anterior conserva seu limite de 500 MB; use a nova biblioteca para arquivos maiores.

Os testes exercitam cabeçalhos/durações e leitura por faixas de arquivo esparso acima de 500 MiB. Eles **não medem desempenho de upload de um MP4 real de 10 GiB**. No início desta entrega havia aproximadamente 5 GB livres no computador; a liberação de espaço segue necessária para um acervo maior.

**Liberar cache** só remove o MP4 local quando a cópia Drive é reconfirmada e não há tarefa que dependa dele. Não apaga original no Drive nem histórico. Retenção é explícita: nenhum expurgo automático do acervo/histórico. A agenda pode restaurar cache de candidatos próximos; **Restaurar cache** permite fazê-lo manualmente. Fila e erros continuam visíveis.

**Baixar controle cifrado** captura metadados e fila em pacote AES-GCM, pausando a operação. **Guardar controle no Drive** também envia esse pacote à pasta de backups; mantém a cópia baixada. Esses pacotes não contêm os MP4 nem o IndexedDB. Use também o ZIP completo do navegador. O backup SQLite existente continua disponível:

```powershell
npm run service:backup -- C:\CAMINHO_PRIVADO\backup.sqlite
```

O SQLite da V2.3 referencia MP4 externos ao banco; ele sozinho não leva esses arquivos. Guarde a pasta privada ou confirme as cópias Drive. Preserve a chave de cifragem separadamente. Antes de restaurar controles, o sistema cria uma cópia SQLite local consistente; não sobrescreve a anterior.

## Computador principal e reserva

Cada instalação tem um ID próprio, armazenado fora do snapshot. Não copie um banco em funcionamento para uma pasta sincronizada e não abra o mesmo SQLite nos dois PCs.

1. Prepare o serviço no reserva, com a mesma chave de recuperação protegida; mantenha-o pausado. Anote o ID exibido.
2. No principal, finalize transferências, confirme as cópias Drive e baixe o backup ZIP do navegador.
3. Use **Transferir controle**, informando o ID do reserva. A origem fica pausada e não pode reativar pela interface até receber uma devolução do controle.
4. Leve o pacote cifrado e o ZIP ao reserva; restaure ambos. Reconecte as contas. Restauração fica pausada e marca tarefas em andamento para conciliação.
5. Confira os resultados externos, restaure caches necessários e conclua a conciliação. Só então ative o reserva e a rotina desejada.
6. Para voltar, repita a transferência no sentido inverso.

Se a origem falhar antes de transferir, use o último backup disponível, mantenha a origem desligada e confira as plataformas antes de operar. Alterações posteriores ao backup podem estar ausentes. Este é um procedimento manual; não há eleição distribuída nem failover automático. Reaplicar o mesmo pacote na mesma instalação é recusado. Uma instalação restaurada de cópia antiga não pode provar, sozinha, que outro computador está desligado.

## Atualização e recuperação de código

Pause a operação, exporte os backups e pare o serviço. Confira alterações locais e atualize somente com `git pull --ff-only`; não use reset/clean sobre trabalho existente. Reabra o serviço e confira diagnósticos antes de ativar. A V2.3 não muda a versão do IndexedDB nem remove tabelas do SQLite. Uma reversão de código exige também conferir compatibilidade dos objetos e manter backup do banco; o código V2.2 não entende referências de MP4 externos da V2.3.

## Verificação real ainda necessária

OAuth próprio de Drive/YouTube, consentimento Google, conta TikTok elegível, MP4 real finalizado, quotas, espaço liberado, rede da máquina, launcher/login Windows e operação no segundo PC. Não houve postagem pública ou contratação. Notificações funcionam com permissão do navegador enquanto o painel está aberto; com a aba fechada, os eventos permanecem no serviço para consulta.

## Fontes oficiais consultadas

- [Drive: escopos e consentimento](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [Drive: uploads retomáveis](https://developers.google.com/workspace/drive/api/guides/manage-uploads)
- [YouTube: upload](https://developers.google.com/youtube/data/reference/rest/v3/videos/insert)
- [YouTube: estados e agendamento](https://developers.google.com/youtube/data/reference/rest/v3/videos)
- [Google: expiração OAuth](https://developers.google.com/identity/protocols/oauth2#expiration)
- [TikTok: diretrizes e uso pretendido](https://developers.tiktok.com/docs/en/content-sharing-guidelines)
