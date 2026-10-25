# Documento histórico consolidado

Cópia preservada em 24/10/2026. Origem: C:\Users\RicardoPC\Documents\Codex\2026-10-24\task\ONBOARDING_GOLDEN_MUSIC_MEMORIES.md.

O conteúdo abaixo retrata a inspeção inicial, anterior à execução local e ao acesso automático sem senha. Pendências antigas não devem ser repetidas automaticamente. Para o estado atual, consulte ../ACESSO_LOCAL.md e ../../CONTINUIDADE.md. Original externo preservado; texto histórico integral a seguir.

---

# Golden Music Memories — onboarding para continuidade

Inspeção em 24/10/2026, no computador **DESKTOP-P6N6RDF**, usuário Windows RicardoPC. Documento produzido fora do repositório. Não autoriza instalação, edição do código, restauração de bancos, conexão de contas, sincronização ou publicação.

## 1. Identidade, objetivo e ponto de partida

- Projeto Codex: **Golden Music Memories**, ID `ae4cf30a-914b-4878-ba9e-5b2e41fb16dd`, conforme registro confirmado pela conversa de origem.
- E-mail do projeto e do canal do YouTube, confirmado pelo proprietário: **goldenmusicmemories79@gmail.com**. Este registro é contexto de identidade; não altera contas, credenciais, e-mail esperado do Drive, OAuth ou configurações do aplicativo.
- Raiz local confirmada: `C:\Users\RicardoPC\Documents\Codex\Golden Music Memories\golden-music-memories`.
- Aplicativo oficial: https://ricardohussen2026.github.io/golden-music-memories/
- Remote `origin` lido de `.git/config`: `https://github.com/RicardoHussen2026/golden-music-memories.git`.
- Versão declarada no `package.json`, documentação recente e rodapé publicado: **2.3.0 / V2.3**. O título da página ainda usa “Central de produção V2”; isso, sozinho, não indica versão antiga.
- A raiz contém fontes, catálogo, assets, dependências locais distribuídas, testes e documentação. Não é pasta vazia nem somente uma pasta de resultados exportados.

O produto é uma central pessoal de produção e organização de conteúdo musical nostálgico dos anos 1970, 1980, 1990 e 2000. O objetivo declarado pelo usuário é desenvolver uma operação que possa gerar receita por monetização no TikTok, YouTube e, posteriormente, outros canais viáveis. A meta desejada de até cinco vídeos diários por plataforma é uma meta operacional, não uma capacidade ou receita demonstrada.

O trabalho deve evoluir o painel existente e preservar acervo, IDs, versões e histórico. Não retomar IA Fácil, copiar sua arquitetura ou reconstruir o Golden Music Memories. Um produto voltado ao público é **fase posterior**, fora da implementação atual. O endereço GitHub Pages já é publicamente acessível, mas isso não equivale a um serviço multiusuário: os dados de trabalho são locais ao navegador e o backend foi concebido para um operador.

## 2. Como interpretar as evidências

- **Intenção/documentação:** comportamento e motivação registrados nos documentos do projeto ou pelo usuário.
- **Implementação encontrada:** arquivos, funções e validações lidos nesta inspeção. Presença no código não comprova execução correta de todo o fluxo.
- **Verificado agora:** leitura de arquivos, contagens, análise de sintaxe e navegação observada no Chrome desta máquina.
- **Validação histórica:** relatórios anteriores incluídos no repositório; não são resultados novos deste PC ou deste checkout.

Não se comprovou igualdade byte a byte entre checkout e deploy. Origem, versão, navegação, contagem e amostra do catálogo são coerentes. Branch, commit atual e alterações locais permanecem sem confirmação.

## 3. Evolução e razões documentadas

| Etapa | O que foi construído | Razão registrada |
|---|---|---|
| V1 | Guia HTML, editor Canvas, imagens, vídeo demonstrativo silencioso e fontes Remotion | Lançamento do canal e identidade visual; materiais foram preservados |
| V2 | Aplicação estática modular, IndexedDB, catálogo, produções, capas, direitos, arquivos, histórico e backups | Transformar os materiais iniciais em operação organizada, compatível com a hospedagem existente e sem API paga obrigatória |
| V2.1 | Pesquisa mais completa, interface compacta, rascunhos por produção/plataforma e preparação simulada de publicação | Facilitar retomada e busca; distinguir planejamento, simulação e resultado externo; preservar os registros já existentes |
| V2.2 | Serviço Node/SQLite, autenticação, OAuth, transferências retomáveis, fila e adaptadores | Tirar credenciais e execução persistente do frontend; separar recebimento do arquivo de autorização de execução |
| V2.3 | MP4 prontos em disco/Drive, capas em lote, política por destino, agenda e transferência manual entre PCs | Receber vídeos finalizados no CapCut e organizar estoque/programação sem ampliar o produto para renderização, tradução ou transcrição automática |

Fontes: `docs/AUDITORIA_V2.md`, `docs/IMPLEMENTACAO_UX_PUBLICACOES.md`, `docs/PUBLICACAO_SERVIDOR.md`, `docs/ESCOPO_ACERVO_PROGRAMACAO.md`, `docs/ENTREGA_ACERVO_PROGRAMACAO.md` e as seções mais recentes de `CONTINUIDADE.md`. São razões documentadas, não reconstrução presumida do histórico Git.

Documentos antigos descrevem o estado de sua entrega. Por exemplo, a ausência de transporte real na V2.1 foi parcialmente superada pelo código V2.2/V2.3, mas **configuração e homologação real continuam sendo etapas distintas**. Priorizar README, continuidade mais recente e documentação V2.3; consultar documentos antigos como histórico.

## 4. Arquitetura e fronteiras de dados

```text
Painel estático (HTML/CSS/JavaScript)
  ├─ catálogo público distribuído em data/catalog.json
  ├─ IndexedDB deste navegador/origem: produções, mídias, histórico e configurações
  ├─ Canvas: capas; JSZip: pacotes e backups
  └─ /api na mesma origem, somente quando servido pelo backend apropriado
       └─ Node 24+ / SQLite privado / MP4 no disco
            ├─ biblioteca, fila, agenda, controle de computador
            └─ Drive/YouTube/TikTok: configuração e autorização próprias

CapCut: montagem, legendas e finalização externas; retorna MP4 pronto.
Canva: CSV e retorno manual de artes; sem API Canva conectada ao painel.
```

O IndexedDB chama-se `golden-music-memories-v2`, versão 2. Stores: `songs`, `productions`, `assets`, `publications`, `history`, `settings` e `reservations`. Ativos incluem Blobs. Transações protegem importação, reservas e criação; BroadcastChannel comunica abas da mesma origem. Isso não sincroniza computadores.

O backend usa SQLite e arquivos privados, normalmente em `.cache/publishing-private`. O painel no GitHub Pages não hospeda esse processo. `app/service.js` chama `/api` na origem atual: não há ligação automática do site público ao localhost. As origens GitHub Pages, porta 8765 e porta 8877 têm bancos de navegador separados.

Há três objetos de recuperação diferentes:

1. **ZIP do navegador:** registros e Blobs do IndexedDB; manifesto e SHA-256; restauração validada e substituição transacional após confirmação.
2. **Backup SQLite do serviço:** estado privado do backend; requer preservação separada da chave e dos MP4 referenciados.
3. **Controle cifrado para continuidade:** metadados/fila, com pausa e conciliação; não substitui o ZIP do navegador nem transporta todos os MP4. Conexões precisam ser revalidadas.

Git copia o código e o catálogo distribuído. Não recupera esses bancos, acervo pessoal ou credenciais.

## 5. Mapa funcional

| Recurso | Finalidade no fluxo | Implementação/dependências | Situação e lacunas |
|---|---|---|---|
| Hoje e metas | Orientar trabalho diário e retomada | `main.js`, preferências, produções, publicações | Tela verificada. Exibe metas 5/5 e zero produções/finais no navegador observado; não é prova de ausência em outros PCs/perfis |
| Catálogo | Encontrar música, artista, gravação e ano | `data/catalog.json`, `catalog.js`, IndexedDB | 2.009 registros confirmados; nenhum sem título/artista/ano. Busca e navegação verificadas no site |
| Pesquisa e filtros | Reduzir tempo de escolha e localizar material já usado | `search.js`, normalização, índice ponderado, combinação de termos, aproximação conservadora, sugestões; filtros em `catalog.js` | Busca “Take On Me” retornou cinco registros iguais à amostra local. Não foi revalidada toda a matriz de filtros |
| Cadastro e curadoria | Corrigir metadados e ampliar repertório | Formulário, JSON/CSV, `validateSong`, `importSongs`, consulta manual MusicBrainz | Código presente. Catálogo declara zero curadoria humana completa. Cliente automático de metadados está desativado por padrão |
| Favoritos, seleção e reservas | Separar intenção de produção e evitar repetição entre abas | `reserveSongs`, `releaseSong`, identidade canônica e histórico | Código transacional encontrado; não se selecionaram músicas nesta inspeção. Variantes não são reconhecidas com perfeição |
| Produção individual/lote | Vincular música, etapa, datas, notas e versões | `atomicProduction`, `main.js`, IDs UUID | Tela vazia verificada. Formulários internos e criação não foram exercitados com dados do usuário |
| Estúdio de capas | Manter identidade e produzir formatos por destino | Canvas em `cover.js`, sete fundos oficiais, estilos adicionais, rascunhos | Renderização da capa cassete e miniaturas dos sete templates verificadas. Exportação e aprovação não executadas agora |
| Capas em lote | Preparar até cinco produções com dois formatos cada | `operations.js::batchCovers`, Canvas, JSZip, IndexedDB | Código gera duas capas por produção e ZIP com pacotes; não depende de OAuth para essa geração. Não foi executado nesta rodada |
| Arquivos de produção | Associar áudio, clipe, imagem, fundo, projeto, licença e finais | `processUploads`, Blobs, hash, versão e papel do arquivo | Limite no navegador: 500 MiB por arquivo. Finais exigem MP4. Uploads não testados nesta inspeção |
| Direitos e revisão | Registrar fonte, validade, território e decisão por uso/destino | Campos de gravação/composição/visual/TikTok/YouTube/comercial e direitos por ativo | Código distingue revisão editorial e direitos; nenhuma opção concede licença ou monetização. Alterações de mídia/licença invalidam aprovação no fluxo individual |
| Pacote CapCut | Levar arquivos, textos e identificação para montagem externa | `backup.js::editingPackage`, pastas padronizadas e manifesto | ZIP não é projeto proprietário do CapCut. Edição, tradução, legendas e renderização ficam no editor externo |
| Canva | Facilitar criação externa em lote | CSV com ID/música/artista/ano/década/marca | Fluxo assistido, sem conexão API comprovada; exportação não executada agora |
| Vídeos finais | Manter versões TikTok e YouTube associadas corretamente | Ativos com papel `tiktok`/`youtube`, hash e produção | Apenas demonstrativo e fixture de teste no repositório; nenhum acervo real importado no navegador observado |
| Meu acervo | Recuperar finais e criar novas versões sem apagar anteriores | `main.js::archive`, filtros e `createProduction(previous)` | Tela e estado vazio verificados. Nova versão copia vínculos/arquivos com novos IDs e direitos pendentes; não foi criada |
| Publicações manuais | Guardar texto, arquivo, data, link e desempenho por destino | `publicationDialog`, lista/Kanban/calendário | Tela verificada. Salvar planejamento não envia. Métricas são manuais: views, likes, comments, shares; não há receita automática demonstrada |
| Uso anterior e repostagem | Preservar o que já foi usado e controlar reutilização | Cadastro histórico, nova versão, registros por plataforma, política `reuseDays` no serviço | Repostagem é decisão explícita; agenda usa inéditos por destino por padrão. Não usar novo ID para apagar histórico |
| Preparação/simulação de envio | Ensaiar falha, retomada e estados sem chamar redes sociais | `publishing.js`, `publications.delivery`, módulos de simulação em `server/` | Código presente; simulação não representa publicação e não deve inventar links/métricas. Não executada nesta inspeção |
| Serviço de publicação | Receber MP4 e executar tarefas persistentes com autorização | `service.js`, `http.mjs`, `contracts.mjs`, `store.mjs`, `worker.mjs` | Servidor opcional; arquivos presentes. `.env` e `.cache` ausentes nesta raiz; não iniciado nem configurado nesta rodada |
| Biblioteca de MP4 grandes | Gerir arquivos em disco, medir duração/dimensões/áudio e retomar blocos | `media.mjs`, hashes, faixas e espaço livre | Limite padrão do serviço: 10 GiB; reserva padrão 1 GiB. Teste histórico de 501 MiB foi esparso, não benchmark de vídeo real grande |
| Drive operacional | Guardar MP4, importar prontos e confirmar cópia antes de liberar cache | `drive.mjs`, OAuth próprio, versões/hashes, uploads retomáveis | Código presente. Pastas conhecidas no contexto não configuram OAuth do aplicativo. Não conectado, sincronizado ou testado agora |
| Programação recorrente | Escolher acervo elegível por destino, horários, fuso e estoque | `scheduler.mjs`, consentimento de rotina, intervalos, décadas, idempotência | Rotina padrão desativada e em simulação; cinco horários YouTube, TikTok desativado. A tela publicada confirma ausência do serviço nesta origem |
| YouTube via serviço | Upload retomável, processamento, visibilidade e agendamento confirmado | `providers.mjs`, OAuth, worker, configuração de conta | Transporte real existe no código; testes históricos usaram mocks. Homologação real e mídia autorizada pendentes |
| TikTok via serviço | Fluxo assistido, com finalização pelo usuário | Adaptador em `providers.mjs`, aprovação/elegibilidade configuráveis | Direct Post/automação real estão bloqueados no código para este painel pessoal; não presumir liberação futura. Caminho manual preservado |
| Backup e continuidade | Evitar perda e transferir operação com rastreabilidade | `backup.js`, `continuity.mjs`, backup SQLite, chave cifrada | Tela de backup verificada; nenhum backup exportado/restaurado. Transferência de PC é manual, com origem pausada e conciliação |
| PWA e armazenamento | Abrir shell offline e informar cota | `sw.js`, manifest, IndexedDB, Storage API | 24 arquivos do shell presentes. Offline não revalidado agora. Cota exibida no navegador: ~10 GiB; não confundir com disco livre |
| Diagnóstico e launcher | Mostrar serviço, contas, filas, espaço e executar em Windows | `operations.js`, `continuity.mjs`, scripts de inicialização | Scripts existem; não instalados/executados nesta inspeção. Avisos dependem de permissão/aba; serviço depende de PC ligado |

### Observações importantes do código

- Catálogo contém metadados de gravações, não uma lista de 2.009 canções únicas aprovadas nem arquivos de áudio. Distribuição: 514/498/490/507 por década. O ano vem da gravação na fonte comunitária; não é garantia do ano original da composição.
- A busca por “Take On Me” mostrou variantes de 1984, 1985, 1996, 2004 e 2009, incluindo título “1 Take On Me”. Confirmar gravação/versão antes de padronizar; não fundir automaticamente registros diferentes.
- Estados de produção: música selecionada → capa em preparação → aguardando materiais → em edição → pronto para revisão → pronto para publicar → publicado → arquivado → disponível para nova versão. A progressão administrativa não substitui as verificações do arquivo ou um recibo externo.
- O backend mantém tarefa recebida e autorização separadas, revisões e chaves de idempotência. Edição local posterior não cancela automaticamente uma tarefa remota já aceita.
- Em `batchCovers`, encontrei gravação de novos ativos sem a mesma invalidação explícita de `production.approval` feita pelo upload individual. É uma **hipótese de regressão a verificar em teste isolado**, não um erro confirmado por reprodução. Evitar aplicar lote a produção já aprovada antes de verificar esse caso.
- Navegar para fora de Estúdio de capas chama `saveCoverDraft()` automaticamente. A inspeção visual saiu dessa tela sem editar campos; portanto, o próprio aplicativo pode ter persistido o rascunho padrão no IndexedDB. Não foi uma aprovação de capa ou criação de produção. Não se tentou desfazer isso para evitar outra alteração de estado.

## 6. Fluxo completo a homologar com o proprietário

1. **Selecionar música:** pesquisar, conferir artista/ano/versão e consultar histórico de uso. Selecionar reserva a identidade canônica. A quantidade de registros não substitui curadoria.
2. **Criar produção:** preservar ID e versão; definir destino, data e notas. Produzir uma unidade antes de medir um lote de cinco.
3. **Preparar capa:** usar template existente, título/artista/ano coerentes, formato vertical ou horizontal. Guardar como ativo da produção; conferir legibilidade no destino.
4. **Associar mídia:** importar somente materiais fornecidos/autorizados, cadastrar papel e fonte. Arquivar comprovações e distinguir áudio da plataforma de MP3 autorizado para incorporar ao arquivo.
5. **Editar externamente:** exportar pacote e montar no CapCut. O painel não corta, traduz, transcreve, sincroniza letra nem renderiza o MP4 do fluxo atual.
6. **Trazer final:** importar MP4 específico por destino no painel, ou usar biblioteca do serviço para arquivo grande. Conferir áudio, duração, imagem, textos e vínculo da versão.
7. **Revisar e preservar:** registrar revisão editorial e direitos; guardar cópia recuperável. Não tratar a marcação de um formulário como prova externa de autorização.
8. **Registrar plataforma:** preparar título/descrição/hashtags e arquivo. O registro manual só relata planejamento ou fato informado. Confirmar resultado real antes de registrar publicação realizada.
9. **Reutilizar:** consultar histórico por destino, criar versão quando houver nova edição e respeitar política de reutilização; não apagar o registro anterior para torná-lo “inédito”.
10. **Fazer backup/continuidade:** ZIP de navegador mais proteção do serviço/MP4 quando aplicável. Antes de mudar de origem ou PC, preservar backups e definir qual máquina é a operadora.

Nesta rodada só foram verificadas navegação, consulta e prévia de capa. Nenhuma produção foi criada, nenhum material importado, nenhum final revisado, nenhuma integração conectada e nenhum vídeo publicado.

## 7. Monetização e futuro produto público

O guia existente já distingue peças de reconhecimento visual de conteúdo com contribuição original do canal, como pesquisa, roteiro, narração e comentário. Esse é contexto editorial documentado; não foi feita aqui uma nova pesquisa comercial nem confirmação atual de regras, requisitos numéricos ou elegibilidade da conta.

Para o próximo piloto, o objetivo é demonstrar uma peça de qualidade e direitos adequados ao destino. Catálogo, licença preenchida, capa e duração não garantem elegibilidade de monetização. Receitas, aprovação e prazos não foram estimados. Requisitos atuais de cada programa devem ser conferidos antes de uma decisão comercial ou postagem que dependa deles.

Outros canais e um produto para usuários externos ficam em backlog posterior. A implementação atual possui várias validações explícitas para `youtube`/`tiktok`; acrescentar outro canal exigiria revisar modelo, direitos, campos, formatos, histórico e eventualmente adaptadores. O backend de um operador e o IndexedDB local não são, por si, uma plataforma pública com contas, isolamento e colaboração.

## 8. Estado concreto deste PC

- Node instalado: **24.20.0**. Chrome e CapCut disponíveis; CapCut estava aberto, mas seu projeto ativo não foi inspecionado.
- Disco C: aproximadamente **249,6 GiB livres** na medição desta inspeção. A documentação histórica menciona ~4,9 GB em outro contexto; não transportar essa medição para este PC.
- Sem `.env`, `.cache` ou `node_modules` na raiz inspecionada. Não se procuraram segredos em outros locais. Ausência desses diretórios não prova que jamais exista serviço/configuração em outra pasta ou ambiente.
- Demonstrativo `02_video_adicionar_audio.mp4` e `tests/fixtures/youtube-teste.mp4`. Sem MP3/clipes de trabalho/projeto CapCut dentro da raiz. Fontes Remotion estão compactadas em `09_projeto_video_editavel.zip` e não foram extraídas nem executadas.
- Fontes do painel prontas para edição; operação local com dados reais ainda precisa de homologação e eventual recuperação do acervo.
- Site publicado abriu; telas Hoje, Catálogo, Produções, Estúdio de capas, Meu acervo, Publicações, Backup, Configurações e Acervo e programação inspecionadas. Zero produções e vídeos finais no banco observado. A capa padrão e as sete miniaturas carregaram.
- A tela Acervo e programação exibiu: “Este endereço está servindo apenas o painel estático. Abra a versão com serviço de publicação.”

## 9. Evidências, limites e bloqueios

### Verificações realizadas agora

- Identidade do computador e existência da raiz associada.
- Leitura de instruções, documentação, estrutura e módulos centrais; configuração `origin` lida sem executar outra consulta Git.
- 2.009 registros JSON, sem título/artista/ano ausentes; contagem por década conferida.
- 59 referências locais estáticas extraídas de HTML/CSS/imports sem arquivo ausente; 24 entradas do shell PWA presentes. Essa inspeção não cobre todo caminho construído dinamicamente.
- `node --check` nos 10 módulos JavaScript de `app/` sem erro de sintaxe. Não é teste funcional.
- ZIP Remotion listado/lido em memória, sem extração.
- Navegação e renderização no site oficial; busca de amostra comparada ao arquivo local.

### Evidência histórica preservada

`docs/VALIDACAO_ACERVO_PROGRAMACAO.json` registra 269 verificações consolidadas, Node 24.19.0/Chrome/Playwright na entrega, sem OAuth real, uploads reais ou posts públicos de teste. O relatório informa que parte das integrações usa transporte simulado e que o teste maior que 500 MiB foi esparso. `secondPhysicalComputerTested` era falso. Não se reexecutou essa suíte nem se apresentou esse total como novo resultado.

### Bloqueios desta sessão

| Ação/alvo | Resultado e motivo | Consequência |
|---|---|---|
| `git status --short --branch` na raiz local | Negado pelo comando: `Permission denied` | Sem confirmação de branch, HEAD e alterações locais. Não houve retry ou contorno dessa consulta |
| Abrir `http://127.0.0.1:8765/painel.html` | Chrome: `ERR_CONNECTION_TIMED_OUT`; consulta HTTP: socket proibido pelas permissões | Sem validação visual da cópia local. O servidor estático, previamente lido, iniciou e foi encerrado |
| Ler o site pela ferramenta web | URL não acessível pela ferramenta | Leitura visual realizada normalmente no Chrome; não usar essa falha como prova de site fora do ar |

Não houve instalação, edição de fontes, clone/pull/push, deploy, configuração de credenciais, sincronização, migração ou publicação. A única entrega de arquivo desta inspeção é este documento, fora da raiz do projeto. A navegação normal do aplicativo pode persistir preferências/rascunhos no navegador, conforme comportamento descrito acima.

## 10. Próximo trabalho, em ordem e com critério de término

1. **Confirmar base e origem operacional.** Resolver o acesso necessário a status Git e prévia local pelos meios autorizados; confirmar branch/alterações antes de editar. Escolher site, 8765 ou 8877 e identificar se há backup real do navegador do outro PC. Não trocar origem e presumir sincronização.
2. **Executar um piloto completo.** Uma música curada, uma produção, mídia autorizada, capa, pacote CapCut, MP4 de retorno e registro por destino. Critério: arquivos vinculados corretamente, recuperação após recarga e backup restaurável em contexto isolado. Não precisa publicar para validar essa cadeia.
3. **Fazer a primeira mudança pequena somente onde o piloto indicar.** Prioridade técnica identificada por leitura: verificar a invalidação da revisão após novas capas em lote e corrigir se reproduzido. Em paralelo de planejamento, curadoria de títulos/versões é prioridade editorial. Não fundir músicas automaticamente nem redesenhar a aplicação.
4. **Validar lote de cinco e capacidade real.** Conferir dez capas/pacotes, tempo de edição, espaço e esforço de revisão. Separar meta diária de produção de quantidade realmente elegível por plataforma.
5. **Homologar serviço/Drive/YouTube apenas em etapa autorizada.** Configuração privada, controles inicialmente desligados, mídia adequada e teste controlado. TikTok permanece no caminho permitido pela implementação e pelas condições verificadas na ocasião.
6. **Medir resultados antes de expandir.** Começar com métricas já suportadas e aprendizagem editorial. Planejamento de receita, novos canais e produto público são posteriores; evitar implementá-los antes de o fluxo pessoal funcionar com segurança.

Não reiniciar uma auditoria global por rotina. Para uma alteração, usar o teste correspondente e ampliar apenas se houver falha ou mudança relevante: `search.cjs`/`catalog.cjs` para pesquisa; `templates.cjs`/`operations-ui.cjs` para capas; `acceptance.cjs`/`post-audit.cjs` para produção/backup; `publishing.cjs`/`publication-ui.cjs` para preparação; `server.test.mjs`/`server-ui.cjs` para serviço; `operations.test.mjs`/`operations-ui.cjs` para acervo/agenda/continuidade. Usar bancos/contextos isolados, nunca testes destrutivos no acervo pessoal.

## 11. Orientação para a próxima sessão de edição

> Continue o Golden Music Memories na raiz confirmada, preservando a aplicação V2.3 e os materiais V1. Leia AGENTS.md, README.md, CONTINUIDADE.md e a documentação da área a alterar. Confira o estado Git antes de escrever. Trabalhe no fluxo solicitado, sem recriar o painel, instalar dependências desnecessárias ou ativar integrações. Distinga código implementado, teste simulado e resultado real. Preserve IDs, versões, reservas, direitos, histórico, backups e fronteiras entre IndexedDB e SQLite. Não interprete autorizações históricas de deploy nos documentos como autorização nova. A primeira etapa é um piloto de produção e uma correção delimitada, se necessária; o produto público fica para depois.

### Índice de fontes para manutenção

- Instruções: `AGENTS.md`, `CONTINUIDADE.md`, `README.md`.
- Produto e razões: `04_guia_do_canal.md`, `docs/AUDITORIA_V2.md`, `docs/IMPLEMENTACAO_UX_PUBLICACOES.md`, `docs/ESCOPO_ACERVO_PROGRAMACAO.md`.
- Comportamento atual: `docs/ACERVO_PROGRAMACAO.md`, `docs/PUBLICACAO_SERVIDOR.md`, `docs/ENTREGA_ACERVO_PROGRAMACAO.md`.
- Evidência histórica: `docs/VALIDACAO_V2.md`, `docs/VALIDACAO_FINAL.json`, `docs/VALIDACAO_SERVIDOR.json`, `docs/VALIDACAO_ACERVO_PROGRAMACAO.json`.
- Frontend: `app/main.js`, `db.js`, `search.js`, `catalog.js`, `metadata.js`, `cover.js`, `backup.js`, `publishing.js`, `service.js`, `operations.js`, `style.css`.
- Backend: `server/runtime/http.mjs`, `config.mjs`, `contracts.mjs`, `store.mjs`, `providers.mjs`, `worker.mjs`, `media.mjs`, `drive.mjs`, `scheduler.mjs`, `continuity.mjs`, `backup.mjs`.
- Materiais e execução: `data/catalog.json`, `templates/`, `vendor/`, `sw.js`, `manifest.webmanifest`, `package.json`, `scripts/`, `tests/` e arquivos V1 numerados.
