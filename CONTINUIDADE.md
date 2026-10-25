# Continuidade do Golden Music Memories

**Release 2.9.2 — 25/10/2026:** frontend e backend locais ativados após confirmação do proprietário, sem jobs ativos; interface 65153bfb9a0d/backend 70f8f9368ab6, HTTP 200, contagens preservadas e SQLite íntegro. Frontend público 2.9.2 publicado e conferido: commit de software9fd42d0, GitHubPages build/deploy aprovados. Busca/filtro/capa horizontal e oito recursos HTTP200 verificados no endereço público. Não é hospedagem do serviço Node. As duas capas V1/V2 solicitadas foram movidas pela UI para lixeira recuperável; arquivos, IDs, fontes, MP4 e histórico preservados. Não foi feita nova edição/render do vídeo real salvo pelo proprietário. Backups compostos privados fora do Git; deploy não os inclui.


**Atualização incremental 25/10/2026 — 2.9.1 somente isolada:** Substituir clipe no Estúdio e Manter enquadramento original concluídos/testados, supersedendo as pendências anteriores abaixo. Troca conserva fonte/finais/histórico e campos, invalidando prévia exibida; conteúdo proporcional com margens simples sem crop/stretch/blur, resolução do preset e recodificação com overlays. Backend80/80, montagem28, histórico22 e versão10. Checkpoint2.9.0 preservado. Pacote acumulado em .cache/painel-next/workspace; relatório em docs/ENTREGA_MONTAGEM_HISTORICO.md. Não ativar/recarregar produção sem coordenação expressa. Raiz2.8 e operacional2.7.2 preservados.

Leia este documento antes de iniciar uma nova sessão. **Evolua o repositório existente; não recrie o projeto.**

## Registro histórico — 25/10/2026, pacote isolado 2.9.0

A fila única continua em docs/ORGANIZACAO_PROJETO.md: 1 montagem/visual (núcleo testado; Substituir clipe ainda pendente), 2 histórico/repostagem (preparado/testado), 3 auditoria/proposta das capas recebidas pelo principal, 4 desempenho, 5 ativação/backup real, 6 ampliar catálogo/rankings, 7 Drive, 8 integrações. Não reiniciar serviço, recarregar abas nem alterar a produção aberta de Ricardo. Nenhuma exclusão/desvinculação real foi feita; o usuário esclareceu que é resultado gerado/prévia salvo e usado em postagem, mas o ID inequívoco para qualquer ação real ainda falta.

Código novo e testes estão somente em .cache/painel-next/workspace, versão 2.9.0. A cópia isolada não contém .env, banco, mídia operacional ou IndexedDB pessoal. App/server/scripts da raiz permaneceram iguais ao baseline desta rodada; o frontend raiz preparado 2.8.0 e backend operacional 2.7.2 permanecem separados do candidato. A pasta oficial/repositório/branch não mudaram, sem clone, commit, push ou deploy. Esta é uma área temporária de desenvolvimento e revisão, não uma segunda instalação operacional.

Leia docs/ENTREGA_MONTAGEM_HISTORICO.md para arquivos, testes e limites. Montagem agora tem criação/seleção de capa no modal, aviso de proporção, prévia recuperável, Aprovar prévia e salvar no acervo sem render novo, descarte de tentativa e exclusão de vídeo gerado para lixeira recuperável com histórico preservado, além de nome musical. Preparar publicações/Montar vídeo compartilham destinos compactos; estados em português. Catálogo distingue década/ordenação e ranking documentado; Top 50 exige pesquisa, não foi fabricado.

Histórico reutiliza Publicações/SQLite, separa plataforma/conta e arquivo/versão, consulta legados sem inventar conta, registra correções com antes/depois/motivo e mostra aviso configurável (padrão inicial editável 7 dias, sem promessa universal). Abrir upload/baixar/exportar não registra publicação. Sem reconhecimento de áudio. Rotina permanece pausada e cooldown anterior preservado. Contas cadastradas aqui são rótulos locais, não OAuth. Testes usam bancos, perfis e pastas separados, transporte mockado onde indicado e nenhum FFmpeg pesado; não validam render/conta externos reais.

Acervo continua PARCIAL: 850 posições em staging, 2.009 registros, dois vínculos documentados e zero músicas novas. Top 50 amplia a pesquisa pendente; não abrir levantamento nesta rodada. Os cinco PDFs CHARTWATCH continuam preservados sem incorporação de 150 posições. Baixador validado pelo proprietário apenas para o link que ele testou. Piloto publicado manualmente continua evidência humana separada de APIs.

**Registro anterior - 25/10/2026, antes do pacote isolado 2.9.0 (evidência histórica):** a fila oficial em docs/ORGANIZACAO_PROJETO.md foi reordenada: (1) corrigir fluxo Montar vídeo: Escolher capa, recuperação da prévia e nome musical do MP4, (2) desempenho de render/integrada, (3) ativação e backup operacional após produção, (4) catálogo parcial, (5) Drive, (6) integrações de publicação. Pedido explícito da capa: investigar seletor só Sem capa na produção Isley Brothers — (Can't You See) What You Do To Me, distinguindo ausência/associação de falha; facilitar criar/escolher sem perder clipe/formato/CTAs/tempos. Não presumir causa pelo print, não operar o modal ou alterar produção/render do usuário enquanto ele produz. Correção funcional ainda não iniciada. Consulta posterior somente leitura confirmou duas prévias concluídas sem exportação/mediaId/job.name na produção The Isley Brothers — (Can’t You See) What You Do To Me. Exportação final já prevê Artista - Música - Destino - Vn.mp4 via Content-Disposition; prévia usa fallback Previa.mp4 ou URL técnica do player, e modal não reabre automaticamente a última prévia concluída. Registrar ajustes de recuperação/salvar/download e nome musical como partes da prioridade 1, sem confundir uploader Dj NeoCat da fonte com artista da produção. Nenhum botão foi clicado, arquivo renomeado ou dado operacional alterado. Histórico dos dez itens preservado e explicitamente separado da fila atual. Diagnóstico leve por leitura concluído: Ryzen 5 5600G 6/12, Radeon integrada, encoder atual libx264 CPU/veryfast/CRF18, 2 threads de encoder/1 de filtros, áudio copy, cerca de 24% CPU/871 MiB, RAM livre 10,7 GiB/disco sem fila relevante. Amostra 02:20 UTC: 57% de vídeo 250,497 s após 185 s, média estimada 0,77x. Não inferir GPU usada por sua existência nem incapacidade por ser integrada. Não interromper render, recarregar abas, alterar job ou começar benchmark durante a produção. Depois medir suporte real, ganho/qualidade comparável e fallback CPU antes de eventual integração; sem driver/segurança/permissões novos automáticos. Nenhuma alteração de desempenho aplicada. Backend 2.7.2 preservado; 2.8.0 preparada sem ativação. Ricardo confirmou baixador para o link testado e está produzindo; preservar sua operação. Pesquisa CHARTWATCH pausada com cinco PDFs em .cache/chartwatch/, páginas renderizadas; 150 posições ainda não integradas, staging segue 850. Dois vínculos anteriores e quarentena 2004 preservados. Itens 9/10 sem credenciais/envio reais, evidências anteriores mantidas. Diagnóstico em .cache/render-performance/diagnostic.json. Sem testes concorrentes deste chat, reinício, exclusão, custo ou commit/push/deploy. Estados abaixo são históricos.

## Origem oficial e recuperação

- Repositório: https://github.com/RicardoHussen2026/golden-music-memories
- Aplicativo: https://ricardohussen2026.github.io/golden-music-memories/
- Branch de publicação: `main`.
- Branch da implementação V2: `desenvolvimento/painel-v2`.
- Hospedagem: GitHub Pages, publicação a partir da raiz de `main`, sem build.
- Base V1 preservada: commit `ca2243e081be789a157ec691bbc07b2ae91a907b`.

Em outro computador ou Work na nuvem:

```sh
git clone https://github.com/RicardoHussen2026/golden-music-memories.git
cd golden-music-memories
git status
git log -5 --oneline
npm run dev
```

Abra a URL informada pelo servidor. A porta padrão é 8765. No Work, use a prévia/encaminhamento fornecido pelo ambiente quando disponível. Não é preciso instalar dependências para servir a aplicação. Não abra apenas o HTML pelo protocolo `file:`: IndexedDB, Web Crypto e service worker devem ser usados com servidor local ou HTTPS.

Para continuar uma cópia já existente, confira alterações locais antes de `git pull --ff-only`. Não use reset, clean ou sobrescrita automática. Crie uma branch de desenvolvimento para o próximo trabalho. Não altere a hospedagem sem necessidade e autorização.

## Estado real entregue

A V2 é uma aplicação estática modular, operacional com persistência local. O catálogo contém **2.009 registros reais**: 514 dos anos 70, 498 dos 80, 490 dos 90 e 507 dos anos 2000. São metadados consultados no MusicBrainz, com referência de gravação; **zero revisão editorial humana completa** foi declarada. Não há áudio das 2.009 músicas no pacote.

Funciona: catálogo com busca/filtros e importação JSON/CSV; favoritos; playlist reservada; produção individual e lote configurável; prevenção transacional de duplicidade; cancelamento auditado; registro de uso antigo; sete templates oficiais mais estilos de capas locais e exportação PNG/JPG vertical/horizontal; arquivos e prévias; direitos independentes; revisão editorial; ZIP para CapCut; finais separados TikTok/YouTube; publicações manuais e métricas; lista/Kanban/calendário; acervo e novas versões; backup ZIP com hashes e restauração; PWA offline após primeira carga.

Canva Pro funciona como fluxo externo assistido por CSV de Criação em lote, com retorno das artes ao painel. CapCut Pro é a ferramenta externa de edição; o ZIP não simula projeto proprietário do CapCut. Drive recebe estrutura e pacotes para upload **manual**, ainda sem OAuth ou sincronização automática.

Foram aprovadas 61 verificações automatizadas, mais uma verificação direcionada da raiz offline. Consulte os relatórios, a data e o ambiente em `docs/`. Reexecute os testes relevantes após mudanças; relatórios antigos não comprovam o código novo.

## Arquitetura e arquivos

| Arquivo/pasta | Responsabilidade |
|---|---|
| `index.html`, `painel.html` | Entradas equivalentes do painel. Manter ambas coerentes. |
| `app/main.js` | Navegação, formulários, produção e ações do operador. |
| `app/db.js` | IndexedDB, validação, importação e operações atômicas. |
| `app/cover.js` | Templates Canvas e dimensões das capas. |
| `app/backup.js` | ZIPs de edição, backup, hashes e restauração. |
| `app/style.css` | Identidade retrô premium e responsividade. |
| `data/catalog.json` | Metadados reais distribuídos; não é banco privado do operador. |
| `sw.js`, `manifest.webmanifest` | Cache do shell/PWA; não pré-carregam vídeos grandes. |
| `vendor/` | JSZip 3.10.1 e licença, sem CDN obrigatória. |
| `scripts/serve.mjs` | Servidor de prévia Node, sem dependências. |
| `scripts/import_musicbrainz.py` | Coleta reproduzível com cache e limite de requisições. |
| `tests/` | Aceitação, concorrência e fixtures isoladas. |
| `db/schema-proposto.sql` | Proposta relacional; NÃO executada, NÃO migração aplicada. |
| `docs/` | Auditoria, validação e plano de integrações/automação. |
| `00_comece_aqui.html`, `guia-v1.html`, `05_modelo_capa.html` | Guia e editor V1 preservados. |
| `09_projeto_video_editavel.zip` | Fontes Remotion do vídeo demonstrativo V1. |

Dependências: navegador moderno com IndexedDB, Canvas, Web Crypto e Blobs; Node para servidor/testes; Python 3 apenas para recoleta de metadados. A execução diária não usa API paga. Versões das dependências de testes estão fixadas em `package.json` e `package-lock.json`.

## Dados privados e continuidade entre máquinas

O banco IndexedDB se chama `golden-music-memories-v2`, versão 2. Stores: songs, productions, assets, publications, history, settings e reservations. Blobs ficam no store assets, associados à produção e à música. O catálogo público é somente uma carga inicial.

**Git clone não recupera o banco pessoal do navegador.** Antes de mudar de computador/origem, abra Backup e arquivos → Baixar backup ZIP. Guarde no Drive e, de preferência, em armazenamento externo. Na nova máquina, abra a aplicação e restaure o ZIP. A restauração verifica IDs, referências e SHA-256 antes da confirmação e substituição atômica. Não mantenha duas cópias editadas simultaneamente esperando uma sincronização que ainda não existe.

Os dados de localhost e do domínio GitHub Pages são separados. Reservas são coordenadas entre abas da mesma origem/navegador; não há lock distribuído entre computadores. Caso exista banco local antigo aberto em outra aba durante atualização de versão, feche/atualize a aba para permitir a migração.

Não comite backups pessoais, acervo operacional, áudios comerciais, tokens ou credenciais. Diretórios `.cache`, acervo, uploads e backups são ignorados. O vídeo silencioso demonstrativo já existente da V1 foi preservado; isso não transforma o GitHub em biblioteca de mídia.

## Testes reproduzíveis

Com o servidor em execução em outro terminal:

```sh
npm ci
npm test
```

No Windows, os testes usam o Google Chrome instalado por padrão. Em Linux/Work, usam Chromium do Playwright. Reaproveite um navegador/runtime já disponível no ambiente. Se o Chromium estiver ausente e o ambiente permitir, execute `npx playwright install chromium`; não instale dependências globais nem altere o sistema sem necessidade. Se o ambiente não suportar navegador, registre a limitação e não declare os testes visuais concluídos.

Configurações opcionais somente para testes: `GMM_BROWSER_CHANNEL` (por exemplo chrome) e `GMM_BASE_URL` (por padrão http://127.0.0.1:8765). Para alterar a porta do servidor, defina `PORT`. Não são credenciais. Fixtures e downloads de teste usam contextos isolados; não execute testes sobre a conta ou o banco pessoal do operador.

## Regras importantes de manutenção

- Não zerar IndexedDB, apagar histórico ou trocar nome do banco para contornar migrações.
- Reservas usam identidade canônica; produções e gravações preservam seus IDs. Não fundir gravações diferentes só porque têm o mesmo título.
- Iniciar nova versão exige ação explícita; volta a deixar direitos pendentes e conserva a anterior.
- Preservar transações de importação/reserva/criação e testar concorrência entre abas.
- Não transformar metadados em autorização de uso. Licenças de TikTok e YouTube são independentes.
- Não afirmar sincronização Drive, geração MP4 ou upload automático enquanto não existirem e forem testados.
- Não expor credenciais no frontend. Integrações com segredo exigem backend autenticado, configuração segura e orçamento aprovado.
- Atualizar a versão do cache em `sw.js` ao alterar o shell e verificar a abertura offline.
- Novos arquivos invalidam a revisão editorial; confirmar aprovação antes de qualquer futura publicação automatizada.

## Pendências e prioridade seguinte

1. Validar o uso diário com arquivos do proprietário, preservando backups e curando os metadados/versões.
2. Definir ambiente dedicado de homologação e autenticação para sincronização entre computadores. Nenhum Supabase de outros projetos foi modificado.
3. Implementar Drive como armazenamento principal com OAuth e conciliação por ID/hash/revisão; testar falhas, retomada e restauração.
4. Worker FFmpeg/Remotion para montagem MP4 e filas configuráveis: está avaliado, não implementado na V2. Manter o CapCut como alternativa manual.
5. OpenAI opcional em backend para rascunhos editoriais; precisa de credencial segura, modelo/preço vigente e limite de gasto aprovado. Nenhuma chamada paga feita.
6. YouTube Data API: OAuth, revisão e teste privado autorizado antes de upload/agendamento real.
7. TikTok: a diretriz Direct Post não aceita ferramenta limitada às próprias contas/equipe. Não prometer auditoria ou contornar consentimento; manter envio manual assistido para esse cenário.

Para condições, fontes oficiais e custos ainda a definir, leia `docs/AUTOMACAO_E_INTEGRACOES.md`. Para limitações e testes efetivos, leia `docs/VALIDACAO_V2.md`.

## Instrução para a próxima sessão

“Continue o Golden Music Memories a partir deste repositório. Leia CONTINUIDADE.md e docs/VALIDACAO_V2.md, confira git status/log e execute a prévia. Preserve código, acervo local e trabalho existente. Implemente a próxima melhoria solicitada em branch própria, testando os fluxos afetados. Não recomece o painel nem presuma APIs/credenciais ativas. Não faça gastos, uploads reais ou migrações de produção sem autorização.”

## Expansão de templates

Leia docs/TEMPLATES.md. O modelo cassete original é oficial e não deve ser substituído. Seis extensões estão integradas ao editor, com fundos em templates/ e configuração em app/cover.js. A geração e os campos editáveis são locais; não dependem de API. Testes em tests/templates.cjs.

## Etapa UX/publicações local

Branch desenvolvimento/ux-publicacoes: consulte docs/IMPLEMENTACAO_UX_PUBLICACOES.md, docs/PESQUISA.md e docs/PUBLICACOES_PREPARACAO.md. Nenhum deploy autorizado nesta etapa. A base publicada continua 97d 54 cb. Após o checkpoint principal, executar a rodada em docs/PROXIMA_ETAPA_AUDITORIA.md.

## Estado final da rodada 2.1

Implementação principal e auditoria posterior concluídas. Leia docs/RELATORIO_FINAL_UX_AUDITORIA.md e docs/VALIDACAO_FINAL.json: 189 verificações passaram. Branch desenvolvimento/ux-publicacoes, checkpoint principal 98 fb 962. Main/site permanecem 97d 54 cb: nenhum deploy autorizado nesta etapa. O código da branch inclui app/search.js, catalog.js, metadata.js, publishing.js e componentes simulados em server/. A auditoria posterior já foi executada, não deve ser repetida automaticamente. Rascunhos por produção ficam em settings (coverDraft:<ID>), com fallback compatível; o banco continua versão 2.

## Estado mais recente: V2.2 — publicação com servidor

Branch desenvolvimento/publicacao-servidor, baseada em d 8d 0 aaf. Leia docs/PUBLICACAO_SERVIDOR.md e docs/VALIDACAO_SERVIDOR.json. O núcleo e o IndexedDB continuam compatíveis. app/service.js integra a interface; server/runtime/ contém HTTP, SQLite, OAuth, transferências, worker e adaptadores com transporte real implementado e desativado por padrão. O SQL local não aplica o esquema Supabase proposto.

O serviço requer Node 24+, abre em 8877 e não depende de credenciais para servir o painel. Autenticação do operador, chave de cifragem e provedores são configuração posterior. Nenhuma conta conectada, upload externo ou deploy nesta etapa. TikTok Direct Post pessoal continua bloqueado; existe adaptador de upload assistido condicionado à elegibilidade e aprovação.

Não substituir este trabalho pela versão estática antiga. Preservar IDs, hashes, dados privados e tarefas recebidas. O ZIP local não recupera o banco do serviço: usar o backup SQLite próprio, com chave guardada separadamente. Mudanças locais não revogam tarefas imutáveis já autorizadas; consultar/cancelar no servidor e conferir agendamentos externos antes de substituí-las.

## Publicação do painel V2.2 autorizada

Em 23/10/2026, o proprietário solicitou commit, push e deploy desta entrega. O destino continua sendo a raiz de main no GitHub Pages existente. As notas anteriores de ausência de autorização/deploy registram o estado das respectivas etapas. Publicar o painel estático não hospeda server/runtime/, não configura credenciais nem habilita publicações reais. O serviço Node/SQLite continua dependendo de ambiente próprio e configuração posterior. Preservar a cópia de desenvolvimento/ux-publicacoes usada pelo outro trabalho.

## Estado mais recente: V2.3 — acervo pronto e programação

Escopo aprovado em docs/ESCOPO_ACERVO_PROGRAMACAO.md. Leia docs/ACERVO_PROGRAMACAO.md e docs/ENTREGA_ACERVO_PROGRAMACAO.md. A edição, tradução e legenda ficam no CapCut; o serviço recebe MP4 finalizados. Não implementar uma fábrica automática de vídeos nesta fase.

app/operations.js integra biblioteca, Drive, lotes de capas, rotina, diagnóstico e continuidade. server/runtime/media.mjs, drive.mjs, scheduler.mjs e continuity.mjs preservam o SQLite e acrescentam objetos de controle; o IndexedDB permanece compatível. Arquivos grandes ficam no cache privado em disco. A automação usa consentimento da rotina e da pasta de prontos, sem revisão humana individual; verificações técnicas permanecem.

A operação externa continua desligada por padrão. Configuração local de senha/chave e launcher foram preparados e testados neste computador, sem credenciais OAuth, rede ou publicação habilitadas. Não comitar .env ou .cache. GitHub Pages hospeda somente o painel; serviço local é separado. A troca entre principal/reserva é manual, com snapshot cifrado, origem pausada e conciliação. Não há failover automático.

TikTok Direct Post pessoal permanece indisponível por elegibilidade, não apenas por falta de credenciais. Upload assistido exige finalização no aplicativo. Homologação de Drive/YouTube, vídeo real e segundo PC ainda precisam ocorrer. O proprietário autorizou commit, push e deploy desta entrega depois dos testes.

## Validação local do PC de casa — 24/10/2026

Leia docs/VALIDACAO_LOCAL_P6.md. No DESKTOP-P6N6RDF, o painel e o serviço abriram em http://127.0.0.1:8877/painel.html. Foram aprovadas 160 verificações de execução local, com dados isolados e provedores simulados. O comando validado é npm.cmd run service, mantendo o terminal aberto; Ctrl+C encerra o serviço. Os launchers PowerShell estão bloqueados pela política atual do Windows, que não foi alterada. A criação de .env com senha e chave local aguarda confirmação; o acervo autenticado ainda não está liberado na instalação operacional. Publicações externas continuam desligadas. Não confundir os testes com configuração de plataformas ou homologação de vídeo real.

Atualização da configuração local: após autorização específica do proprietário, npm.cmd run service:setup criou .env sem exibir senha/chave; o serviço foi reiniciado na porta 8877. A saúde retornou HTTP 200 com autenticação e cifragem configuradas e rede/publicação/worker desligados. A confirmação de criação solicitada anteriormente foi atendida; não pedir novamente. O login do proprietário e a validação do acervo autenticado operacional continuam pendentes. Não ler nem enviar segredos pelo chat.

## Estado atual do acesso no PC de casa

Leia docs/ACESSO_LOCAL.md. Após pedido explícito do proprietário, GMM_LOCAL_ACCESS foi implementado e habilitado exclusivamente em 127.0.0.1:8877. Acervo abriu no Chrome habitual sem senha manual. Senha e chave originais preservadas; Host/Origin/CSRF e sessões mantidos, modo local recusado em origem pública/proxy. Rodada posterior: 60 aprovações direcionadas/regressões; comando npm.cmd run test:local-access disponível. Não repetir pedido de criação de credenciais ou login manual. Acesso privado do proprietário pelo trabalho/celular é etapa futura, não exposição pública; nenhuma rede externa foi liberada. Rede/publicação/worker continuam desligados.

## Pasta principal e documentação consolidada

Leia docs/ORGANIZACAO_PROJETO.md. Código, configuração privada, SQLite e acervo do serviço estão na raiz Golden Music Memories cadastrada no Codex. O onboarding inicial foi copiado para docs/historico com procedência e aviso de estado histórico; cinco relatórios de teste foram preservados em docs/evidencias/2026-10-24. Originais externos mantidos. IndexedDB permanece no Chrome e exige backup próprio. A tentativa anterior de movimentar o chat antigo não determinou a origem com segurança. Na continuidade de 24/10/2026, o novo chat Desenvolver Painel Golden Music (01a16f1b-6b24-723f-a1a0-d9398c86c018) foi confirmado no projeto ae4cf30a-914b-4878-ba9e-5b2e41fb16dd pela listagem oficial do Codex; o chat antigo permanece preservado e inativo. Não houve duplicação do aplicativo nem edição de metadados internos. Detalhes e pendências ficam no índice existente, sem novo relatório paralelo.


## Importador local autorizado — 24/10/2026

Nova prioridade implementada localmente: leia docs/IMPORTADOR_LOCAL.md. Usa yt-dlp/FFmpeg privados em .cache/import-tools, links individuais autorizados YouTube/YouTube Music, formatos sem recompressão silenciosa, cancelamento e biblioteca de fontes por hash associada às produções. Preserva IndexedDB, IDs, banco e acervo anteriores. Fontes não entram na fila de publicação. Nomes legíveis em novos anexos e exportações; originais preservados. Sem publicação, rede de entrada, OAuth ou flags de worker habilitados. Teste externo ainda depende de link autorizado; testes locais usam fonte simulada e mídia sintética. Backup deve incluir SQLite consistente e sources/, além do backup do navegador e demais arquivos. Continuidade nesta tarefa original conforme seleção explícita posterior do proprietário; não retomar desenvolvimento paralelo.

## V2.4 — montagem local de vídeo

Leia docs/MONTAR_VIDEO_LOCAL.md. Montar vídeo na ficha da produção usa FFmpeg local, capa, chamadas selecionadas com ordem automática e intervalos relativos, prévia real e exportação no acervo sem duplicar original. Vídeo H.264 recodificado; AAC preservado quando compatível. Artes finais Library ainda aguardam materialização Windows, listadas no guia; a interface aceita PNG local e indica faltantes. Não confundir testes com mídia sintética com homologação estética das oito artes. Publicação externa continua OFF. Mesma raiz e branch, sem commit/push/deploy.
