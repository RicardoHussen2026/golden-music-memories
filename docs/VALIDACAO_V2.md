# Validação V2 — 23/10/2026

## Resultado

**61 verificações automatizadas passaram**, em Chrome headless, com servidor local e contextos de banco isolados. A raiz do aplicativo também foi reaberta offline em uma verificação adicional direcionada. O comando reproduzível é `npm test` com o servidor em execução.

Os registros e métricas usados nos testes são fixtures de contextos descartados; não são dados reais de desempenho do canal e não foram inseridos no banco do operador. O catálogo distribuído contém metadados reais. As prévias de visão geral foram capturadas novamente com banco operacional vazio, exibindo zero produções e zero métricas.

Arquivos detalhados: testes-automatizados.json, testes-repertorio.json e testes-templates.json. As capturas em docs/preview-producao.png representam o fluxo em contexto de testes; as demais prévias mostram o início sem produções.

## Cobertura

| Requisito | Resultado |
|---|---|
| Navegar entre módulos e localizar música | Passou |
| Pesquisar por artista e ano | Passou |
| Selecionar cinco e retomar a seleção | Passou |
| Configurar e reservar lote de 15 | Passou |
| CSV de seleção para Canva Pro | Passou |
| Produções independentes e retomada após recarga | Passou |
| Capa PNG 1080×1920 | Passou; dimensões do PNG verificadas |
| Thumbnail 1280×720 | Passou; dimensões do PNG verificadas |
| Aprovar e preservar capa | Passou |
| Anexar material e registrar direitos independentes | Passou |
| Importar vídeos finais diferentes para TikTok e YouTube | Passou; hashes distintos |
| Revisão editorial explícita | Passou |
| ZIP de edição e manifesto | Passou; conteúdo do ZIP inspecionado |
| Registrar link, data, plataforma e métricas | Passou em contexto isolado, sem envio externo |
| Kanban, calendário e busca no acervo | Passou |
| Nova versão conserva arquivos e retorna direitos a pendentes | Passou |
| Exportar backup completo com arquivos e hashes | Passou |
| Restaurar em contexto de navegador independente | Passou |
| Backup corrompido recusado sem apagar dados | Passou |
| Integridade de vínculos | Passou na restauração |
| Responsividade a 390 px | Passou sem transbordamento do documento |
| Conteúdo importado tratado como texto | Passou; sem execução de payload no teste |
| Importação duplicada e lote inválido | Passou; sem gravação parcial |
| Importação e reserva concorrentes entre abas | Passou |
| Produção concorrente de uma mesma música | Passou; uma criação aceita |
| Cancelamento preserva histórico e libera reserva | Passou |
| Gravações reais distintas da mesma música | Passou; mantidas separadas |
| Fonte com nome opcional e mesmo identificador | Passou; duplicata recusada |
| Caracteres não latinos na identidade | Passou |
| Registro de uso anterior sem criar vídeo fictício | Passou |
| PWA offline depois da carga inicial | Passou |
| Erros JavaScript não tratados | Nenhum no fluxo verificado |

## Estado das entregas

**Concluído e testado localmente:** catálogo, seleção/reservas, persistência, produção parcial, capas por templates, upload/preview/download, direitos, pacote de edição, publicações manuais, Kanban/calendário, acervo, versões, metas, CSV Canva, backup e restauração.

**Concluído como fluxo assistido, sem API:** Canva Pro via CSV e retorno de arquivos; CapCut via ZIP; Drive via estrutura de pastas, exportação e upload manual. Essas operações não foram apresentadas como integrações OAuth ativas.

**Parcial:** detecção semântica de todas as grafias/colaborações/composições não é garantida. Identidade canônica, rótulos de versões, referências e confirmação do operador cobrem os casos implementados. Os 2.009 registros têm referência de fonte, mas zero revisão humana individual completa. Gêneros suplementares de licença não comercial não foram redistribuídos; podem ser preenchidos por curadoria autorizada.

**Aguardando ambiente e validação:** sincronização Google Drive, autenticação e banco Supabase dedicado. A proposta SQL não foi executada. Não há teste de RLS ou migração em PostgreSQL porque nenhum banco dedicado foi autorizado/configurado.

**Planejado, não implementado:** renderização MP4 automática dentro da V2, worker FFmpeg em lote, API de imagens/textos/transcrição, bancos de vídeo por API e uploads/agendamentos reais. A V1 possui o vídeo demonstrativo e o projeto Remotion, preservados.

## Limites operacionais

- Dados locais não são sincronizados automaticamente com outro computador. Use backup/restore enquanto não houver backend validado.
- Persistência depende da origem, cota e políticas do navegador; modo privado e limpeza de dados podem apagar o acervo local.
- Mídias grandes são limitadas a 500 MB por arquivo no upload da V2, além da cota real. A camada cloud é necessária para acervo pesado em escala; não use o repositório público para esse acervo.
- O catálogo não tem teto de 1.825 entradas. A versão local carrega seus metadados e pagina a apresentação; banco em nuvem/pesquisa no servidor serão necessários para volumes muito maiores.
- Publicação registrada no calendário não significa envio agendado na plataforma. Não houve postagem, mudança de hospedagem ou gasto de API.
- O código foi preparado em desenvolvimento/painel-v2 e a atualização para main/GitHub Pages foi autorizada. A V1 foi preservada; consulte o histórico Git para a revisão publicada.

## Recuperação e próximos testes

Guarde um backup antes de uma restauração ou troca de computador. O módulo confere checksums e referências e pede confirmação antes de substituir o banco. Para homologar nuvem, os testes seguintes devem cobrir OAuth revogado, falhas de upload, retomada idempotente, permissões entre usuários e restauração banco↔Drive, além de medir a primeira renderização FFmpeg antes de liberar fila grande.
