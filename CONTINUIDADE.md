# Continuidade do Golden Music Memories

Leia este documento antes de iniciar uma nova sessão. **Evolua o repositório existente; não recrie o projeto.**

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

Branch desenvolvimento/ux-publicacoes: consulte docs/IMPLEMENTACAO_UX_PUBLICACOES.md, docs/PESQUISA.md e docs/PUBLICACOES_PREPARACAO.md. Nenhum deploy autorizado nesta etapa. A base publicada continua 97d54cb. Após o checkpoint principal, executar a rodada em docs/PROXIMA_ETAPA_AUDITORIA.md.

## Estado final da rodada 2.1

Implementação principal e auditoria posterior concluídas. Leia docs/RELATORIO_FINAL_UX_AUDITORIA.md e docs/VALIDACAO_FINAL.json: 189 verificações passaram. Branch desenvolvimento/ux-publicacoes, checkpoint principal 98fb962. Main/site permanecem 97d54cb: nenhum deploy autorizado nesta etapa. O código da branch inclui app/search.js, catalog.js, metadata.js, publishing.js e componentes simulados em server/. A auditoria posterior já foi executada, não deve ser repetida automaticamente. Rascunhos por produção ficam em settings (coverDraft:<ID>), com fallback compatível; o banco continua versão2.

## Estado mais recente: V2.2 — publicação com servidor

Branch desenvolvimento/publicacao-servidor, baseada em d8d0aaf. Leia docs/PUBLICACAO_SERVIDOR.md e docs/VALIDACAO_SERVIDOR.json. O núcleo e o IndexedDB continuam compatíveis. app/service.js integra a interface; server/runtime/ contém HTTP, SQLite, OAuth, transferências, worker e adaptadores com transporte real implementado e desativado por padrão. O SQL local não aplica o esquema Supabase proposto.

O serviço requer Node 24+, abre em 8877 e não depende de credenciais para servir o painel. Autenticação do operador, chave de cifragem e provedores são configuração posterior. Nenhuma conta conectada, upload externo ou deploy nesta etapa. TikTok Direct Post pessoal continua bloqueado; existe adaptador de upload assistido condicionado à elegibilidade e aprovação.

Não substituir este trabalho pela versão estática antiga. Preservar IDs, hashes, dados privados e tarefas recebidas. O ZIP local não recupera o banco do serviço: usar o backup SQLite próprio, com chave guardada separadamente. Mudanças locais não revogam tarefas imutáveis já autorizadas; consultar/cancelar no servidor e conferir agendamentos externos antes de substituí-las.
