# Entrega V2.3 — 24/10/2026

Base: `772a2c918073dd163cd0e2108cb453d737c0c897`. Branch: `desenvolvimento/acervo-programacao`. Escopo e ordem registrados em ESCOPO_ACERVO_PROGRAMACAO.md. A cópia do outro trabalho foi preservada.

## Resultado técnico

O fluxo implementado é: capas em lote no painel, edição e legenda manual no CapCut, MP4 finalizado no Drive, histórico manual por plataforma e programação recorrente no computador ativo.

| Entrega | Evidência | Validação / situação |
|---|---|---|
| Cinco produções, dez capas e pacotes CapCut | app/operations.js, app/backup.js | Navegador real: ZIP com cinco pacotes e dez imagens guardadas |
| Biblioteca de MP4 em disco | server/runtime/media.mjs | Recebimento em blocos, retomada, duplicidade, cabeçalhos, duração e áudio |
| Arquivos maiores que 500 MiB | config.mjs, media.mjs, store.mjs | Arquivo esparso de 501 MiB e leitura em faixas; sem benchmark real de upload grande |
| Drive OAuth próprio | providers.mjs, drive.mjs | Transporte simulado: conta esperada, state, tokens cifrados, upload, retomada, download e integridade |
| Estrutura Drive do proprietário | Conector Google Drive | Criada e relida na conta autorizada; sem compartilhamento público; não configura OAuth do app |
| Identificação automática do acervo pronto | Drive.associate, Drive.autoScan | ID de produção e sufixo de destino; consentimento prévio da pasta; sem revisão individual |
| Histórico por destino e reutilização explícita | MediaLibrary.records/record, Scheduler.candidates | Registro manual, arquivados, repetição, intervalo e independência TikTok/YouTube |
| Dias, horários, fuso, antecedência e falhas | server/runtime/scheduler.mjs | Dez slots diários, fuso, horário ambíguo, pausa, idempotência, políticas e simulação |
| YouTube | providers.mjs, worker.mjs | Adaptador real implementado; transporte externo testado por mocks; homologação real pendente |
| TikTok | providers.mjs, scheduler.mjs | Assistido implementado; correção de blocos entre 5 e 10 MiB; modo automático real bloqueado por elegibilidade |
| Principal/reserva | server/runtime/continuity.mjs | Duas instalações simuladas; pacote cifrado, destino, origem pausada, recusa de replay e restauração protegida |
| Painel e diagnóstico | app/operations.js, app/style.css | Desktop e 390 px, sem erro JavaScript, acervo e estado persistidos |
| Launcher Windows | scripts/setup-service.mjs e scripts/*service.ps1 | Configuração local privada, início oculto, detecção de duplicação, parada e reinício exercitados |
| Inicialização no login | scripts/install-startup.ps1 | Script entregue; não instalado no Windows durante esta entrega |
| Publicação do código | main / GitHub Pages | Commit, push e conferência de deploy fazem parte da finalização; resultado e SHA entregues no relatório da conversa |

## Testes

**269 verificações aprovadas** no conjunto validado:

- 189 verificações existentes de catálogo, produção, capas, arquivos, backup, UX e preparação.
- 28 testes existentes de servidor/publicação.
- 9 verificações existentes de interface do serviço.
- 31 testes novos de acervo, Drive, programação e continuidade.
- 12 verificações novas no Chrome para o fluxo de operação.

A regressão completa passou com 267 verificações no checkpoint principal. Os dois casos adicionais da auditoria (bloco TikTok e histórico arquivado) e as áreas afetadas foram reexecutados em testes direcionados; a suíte nova terminou com 31/31. Não somar reexecuções para inflar o total.

Comandos reproduzíveis:

```powershell
# Terminal 1
npm run dev
# Terminal 2
npm test
# Direcionados
npm run test:operations
npm run test:operations:ui
```

Ambiente: Windows, Node 24.19.0, Chrome headless, Playwright 1.62.1. Contextos de navegador e diretórios temporários isolados. A rede externa dos testes de interface foi bloqueada. Integrações de provedor utilizaram transporte injetado; não houve OAuth real ou postagem externa.

Os novos MP4 estruturais sintéticos testam metadados e controles; não comprovam reprodução, legenda, qualidade de áudio ou processamento real na plataforma. A fixture MP4 reproduzível anterior permanece nos testes de regressão. O teste acima de 500 MiB usa arquivo esparso e não envia 501 MiB a nenhum provedor.

## Achados corrigidos nesta rodada

- Vídeo recebido sem produção associada causava erro no resumo de estoque; agora permanece em edição e não entra na seleção.
- Simulações reservadas poderiam consumir a elegibilidade do modo real; a reserva passou a distinguir o modo.
- Pausa da rotina passou a bloquear novas etapas de upload automático, preservando consultas de resultados já aceitos.
- Falha do Drive deixou de impedir a execução de etapas independentes do processador.
- Bloco TikTok para arquivo entre 5 e 10 MiB deixou de exceder o próprio tamanho do vídeo.
- Publicações arquivadas com data/link passaram a continuar no histórico de uso.
- Verificação de integridade deixou de reler o vídeo inteiro a cada bloco de upload; mudanças de tamanho/data do arquivo invalidam a verificação.
- Handoff recusa arquivo parcial ou sem cópia Drive; restauração mantém pausa e conciliação obrigatórias.
- Exportação CapCut passou a preservar nomes únicos por versão de cada ativo.

## Prontidão real e pendências

**Comprovado neste computador:** geração das capas/pacotes, execução local, persistência, interface, algoritmos de fila/agenda/backup em contextos de teste e pastas reais no Drive pelo conector.

**Ainda necessário:** cliente OAuth Google próprio, consentimento/escopos, autorização Drive e YouTube pelo aplicativo, quotas/limites reais, um MP4 finalizado para homologação autorizada, espaço liberado e segundo computador. A chave e a senha locais foram criadas em .env ignorado pelo Git; nenhuma credencial de plataforma foi inserida.

**TikTok:** a pendência vai além da aprovação Developer. O uso pessoal pretendido não atende à elegibilidade de Direct Post consultada. O sistema oferece fluxo manual/assistido e bloqueia o automático real; não promete liberação futura apenas pela solicitação.

**Limites da continuidade:** troca manual e snapshots versionados; não há eleição distribuída, replicação de SQLite em funcionamento ou failover automático. Um backup antigo pode omitir operações recentes. A máquina de origem deve permanecer parada durante a recuperação e as plataformas precisam ser conferidas.

**Limites operacionais:** GitHub Pages serve o frontend; o serviço executa no computador. Native scheduling já aceito pelo YouTube continua no provedor. Notificações do navegador dependem de aba/permissão. Retenção de cache é explícita e protege a cópia final; não há expurgo automático de histórico.

Nenhuma contratação, publicação pública de teste ou intervenção no banco de outro projeto. Não foram ampliados os recursos para renderização, reconhecimento de letras ou tradução automática.
