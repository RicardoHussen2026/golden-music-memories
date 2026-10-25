# Golden Music Memories

**Acervo 2.9.5 — 25/10/2026:** conciliação implementada e aplicada no Chrome habitual: 2.009 → **2.011 registros**, com backup anterior e posterior verificados. Novos: Will You Love Me Tomorrow / The Shirelles (1960, mono) e Only the Lonely (Know the Way I Feel) / Roy Orbison (1960). Repetição do lote adicionou zero; recarga da aba confirmou persistência. Todos os campos dos 2.009 registros anteriores, produções, anexos, publicações e reservas foram preservados. Fila separada com 1.498 pendências; nenhum candidato incerto foi promovido. Serviço local alinhado: interface0d6031f842fa/backend6493c1c0bc6a, zero jobs antes/depois, SQLite íntegro. Publicação do software em andamento; público ainda2.9.4 até confirmação do deploy. Detalhes em docs/RANKINGS_CATALOGO.md. Estados anteriores abaixo são históricos.

**Publicação2.9.4 concluída —25/10/2026:** commit6687a748fcf1f875e95ef9c65932b43d64446c31 enviado por fast-forward às branches main e desenvolvimento/validacao-local-p6. Pages40169442979: build/deploy/report-build-status success. Navegador público confirmou interface9b2a38a5bd70 e seis hashes das artes; backend local9598edb61b77 alinhado. Nenhum vídeo publicado, backup externo enviado ou dado privado incluído no Git.

**Artes2.9.4 —25/10/2026:** seis fundos correspondentes do ZIP do titular substituídos com backup privado das anteriores; IDs/templates preservados, Vinil clássico intacto e rádio duplicado não instalado duas vezes. Ativa localmente em8877, interface9b2a38a5bd70/backend9598edb61b77, saúde200.15 verificações templates, sete exportações horizontais proporcionais e10 versão passaram; hashes dos dois MP4 aprovados/contagens preservados. Publicação do software autorizada em andamento; não publica mídias privadas ou vídeos nas redes. Detalhes em docs/TEMPLATES.md e lista oficial.

**Estado vigente — 2.9.3, 25/10/2026:** atualização local ativada, interface f9d9661f28f4/backend 190352994787, saúde200, SQLite íntegro e contagens preservadas. CPU adaptativa com opção conservadora/fallback testados; AMF desligado. Renders existentes reaproveitados sem exigir nova montagem por mudança de CPU. TikTok V3 e YouTube horizontal V2 com fundo desfocado concluídos e aprovados; amostra de movimento estático é opcional e separada. Backups do serviço23arquivos e navegador8anexos verificados, configuração protegida à parte. publicação do software concluída e conferida no GitHub Pages (commit48f1c60; build/deploy40167149794 aprovados). Pages oferece a interface estática, sem hospedar Node ou dados privados; detalhes em docs/DESEMPENHO_RENDER.md e lista oficial. Os estados anteriores abaixo são históricos, preservados para rastreabilidade.

**Release 2.9.2 — 25/10/2026:** frontend e backend locais ativados após confirmação do proprietário, sem jobs ativos; interface 65153bfb9a0d/backend 70f8f9368ab6, HTTP 200, contagens preservadas e SQLite íntegro. Frontend público 2.9.2 publicado e conferido: commit de software9fd42d0, GitHubPages build/deploy aprovados. Busca/filtro/capa horizontal e oito recursos HTTP200 verificados no endereço público. Não é hospedagem do serviço Node. As duas capas V1/V2 solicitadas foram movidas pela UI para lixeira recuperável; arquivos, IDs, fontes, MP4 e histórico preservados. Não foi feita nova edição/render do vídeo real salvo pelo proprietário. Backups compostos privados fora do Git; deploy não os inclui.


**Atualização incremental 25/10/2026 — 2.9.1 somente isolada:** Substituir clipe no Estúdio e Manter enquadramento original concluídos/testados, supersedendo as pendências anteriores abaixo. Troca conserva fonte/finais/histórico e campos, invalidando prévia exibida; conteúdo proporcional com margens simples sem crop/stretch/blur, resolução do preset e recodificação com overlays. Backend80/80, montagem28, histórico22 e versão10. Checkpoint2.9.0 preservado. Pacote acumulado em .cache/painel-next/workspace; relatório em docs/ENTREGA_MONTAGEM_HISTORICO.md. Não ativar/recarregar produção sem coordenação expressa. Raiz2.8 e operacional2.7.2 preservados.

**Estado local em 25/10/2026:** backend operacional 2.7.2; frontend raiz 2.8.0 preservado. Pacote de montagem/visual e histórico 2.9.0 preparado/testado somente em área isolada, sem ativação durante uso de Ricardo. Consulte a [lista oficial](docs/ORGANIZACAO_PROJETO.md), a [entrega isolada](docs/ENTREGA_MONTAGEM_HISTORICO.md) e o [backup composto](docs/ARMAZENAMENTO_BACKUP.md). As seções V2.3 abaixo são históricas.

**V2.3: capas em lote, biblioteca de MP4 finalizados no CapCut, Google Drive, histórico por destino e programação recorrente no serviço local.** Leia o [guia de acervo e programação](docs/ACERVO_PROGRAMACAO.md) e o [relatório de entrega](docs/ENTREGA_ACERVO_PROGRAMACAO.md). Leia [configuração e limites da publicação](docs/PUBLICACAO_SERVIDOR.md). O deploy do painel não executa o servidor, conecta contas ou ativa uploads. Veja [relatório final e evidências](docs/RELATORIO_FINAL_UX_AUDITORIA.md).

Central de produção do canal musical nostálgico. Aplicação estática V2 com catálogo real, organização de produções, capas editáveis, revisão, acervo e backup.

- [Abrir aplicativo](https://ricardohussen2026.github.io/golden-music-memories/)
- [Continuidade em outro computador ou Work na nuvem](CONTINUIDADE.md)
- [Arquitetura e auditoria](docs/AUDITORIA_V2.md)
- [Testes e limitações](docs/VALIDACAO_V2.md)
- [Rankings: fontes, staging e limites do levantamento](docs/RANKINGS_CATALOGO.md)
- [Família oficial de templates](docs/TEMPLATES.md)
- [Plano de automação e integrações](docs/AUTOMACAO_E_INTEGRACOES.md)

## Executar

Requer Node.js para a prévia local. Não há build nem dependências para servir o aplicativo.

```sh
git clone https://github.com/RicardoHussen2026/golden-music-memories.git
cd golden-music-memories
npm run dev
```

Abra http://127.0.0.1:8765/painel.html. Use HTTP local ou HTTPS; não abra apenas o arquivo HTML. O GitHub Pages publica a raiz de `main`.

Para testar, com o servidor ativo: `npm ci` e `npm test`. O Windows usa Chrome instalado; Linux usa Chromium do Playwright (`npx playwright install chromium`, se necessário). Configurações opcionais: `GMM_BASE_URL` e `GMM_BROWSER_CHANNEL`. Consulte CONTINUIDADE.md antes de desenvolver.

## Recursos implementados

Catálogo de 2.009 metadados reais de gravações MusicBrainz entre 1970 e 2009, busca e importação, favoritos, reservas com prevenção de repetição e criação de produções em lote configurável. Sete templates oficiais — base preservada e seis extensões — com textos editáveis e exportação PNG/JPG em 1080×1920 e 1280×720. Os estilos anteriores continuam disponíveis.

Arquivos versionados, direitos independentes, revisão editorial, finais distintos para TikTok e YouTube, registro manual de publicação e métricas, Kanban, calendário, acervo, novas versões, ZIP para edição no CapCut, CSV para Canva e estrutura para Drive manual. Backup completo com arquivos e validação de integridade. PWA offline após a primeira carga concluída.

**Os dados e arquivos pessoais ficam no navegador (IndexedDB). Não são sincronizados pelo GitHub.** Para mudar de computador, baixe o backup ZIP pelo painel, guarde de forma privada e restaure no outro navegador. Localhost e site público são origens separadas.

A V2.3 implementa OAuth e transferências Drive, agenda recorrente, cache em disco e transferência manual do controle entre computadores. Contas reais continuam dependendo de configuração e homologação. Renderização e legendas são finalizadas externamente no CapCut. O site não publica vídeos nas redes. Nenhuma chave é necessária para usar os recursos locais. Não comite credenciais, backups pessoais ou músicas comerciais.

## Preservação

O guia e os materiais V1 permanecem em `00_comece_aqui.html`, `guia-v1.html`, `05_modelo_capa.html` e demais arquivos numerados. O vídeo demonstrativo é silencioso; o projeto editável continua no ZIP original. Metadados musicais não conferem autorização para usar gravações ou letras.

## Serviço de publicação opcional

Requer Node.js 24+. Execute `npm run service` para abrir o painel com API em http://127.0.0.1:8877/painel.html. Sem configuração, não conecta contas nem publica. Leia docs/PUBLICACAO_SERVIDOR.md antes de configurar. Novo endereço significa outro banco do navegador: transfira seu backup de forma explícita.

Testes adicionais: `npm run test:service` e `npm run test:service:ui`. Backup privado do serviço: `npm run service:backup -- CAMINHO_FORA_DO_PROJETO/backup.sqlite`.
