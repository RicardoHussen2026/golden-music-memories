# Golden Music Memories

**Nesta branch: V2.2, serviço de publicação preparado para configuração, sem deploy público.** Leia [configuração e limites da publicação](docs/PUBLICACAO_SERVIDOR.md). A V2.1 anterior foi preservada. Veja [relatório final e evidências](docs/RELATORIO_FINAL_UX_AUDITORIA.md). O link do site continua na versão publicada anterior.

Central de produção do canal musical nostálgico. Aplicação estática V2 com catálogo real, organização de produções, capas editáveis, revisão, acervo e backup.

- [Abrir aplicativo](https://ricardohussen2026.github.io/golden-music-memories/)
- [Continuidade em outro computador ou Work na nuvem](CONTINUIDADE.md)
- [Arquitetura e auditoria](docs/AUDITORIA_V2.md)
- [Testes e limitações](docs/VALIDACAO_V2.md)
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

Drive OAuth, banco compartilhado e renderização MP4 automática ainda não estão ativos. A V2.2 implementa o serviço opcional de publicação, mas conexões e envios reais continuam desativados. O site não publica vídeos nas redes. Nenhuma chave é necessária para usar os recursos locais. Não comite credenciais, backups pessoais ou músicas comerciais.

## Preservação

O guia e os materiais V1 permanecem em `00_comece_aqui.html`, `guia-v1.html`, `05_modelo_capa.html` e demais arquivos numerados. O vídeo demonstrativo é silencioso; o projeto editável continua no ZIP original. Metadados musicais não conferem autorização para usar gravações ou letras.

## Serviço de publicação opcional

Requer Node.js 24+. Execute `npm run service` para abrir o painel com API em http://127.0.0.1:8877/painel.html. Sem configuração, não conecta contas nem publica. Leia docs/PUBLICACAO_SERVIDOR.md antes de configurar. Novo endereço significa outro banco do navegador: transfira seu backup de forma explícita.

Testes adicionais: `npm run test:service` e `npm run test:service:ui`. Backup privado do serviço: `npm run service:backup -- CAMINHO_FORA_DO_PROJETO/backup.sqlite`.
