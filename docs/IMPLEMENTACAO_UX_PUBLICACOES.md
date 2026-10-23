# Implementação principal — 23/10/2026

Base recuperável: `97d54cb45151418f67bfeb772210339b0874c602`, branch `recuperacao/antes-ux-publicacoes-20261023`. Desenvolvimento em `desenvolvimento/ux-publicacoes`. Sem alteração de main ou deploy público nesta etapa.

O arquivo recebido do prompt mestre termina literalmente em “Declara”, item 15.1. Foi aplicado todo o conteúdo disponível e viável sem credenciais. Não foram presumidas instruções ausentes.

## Entrega integrada

- Pesquisa local indexada por título, artista, ano, década, álbum, gênero, versão e aliases cadastrados; combinação AND, normalização, aproximação conservadora, relevância, sugestões nativas por teclado e histórico recente.
- Lista compacta por padrão, alternativa em cards, filtros básicos e painel avançado recolhível, indicadores ativos e limpeza única. Filtros de materiais, situação e plataformas usam registros existentes.
- Quatro áreas principais: Hoje, Catálogo, Produções e Meu acervo. Ferramentas secundárias preservadas. Formulários e margens compactados, foco visível e diálogos nomeados.
- Sete templates preservados; recuperação da configuração aprovada mais recente e edição de versões anteriores. Ordenação de ativos usa data e versão, não a ordem de UUIDs.
- Rascunhos por plataforma reaproveitados ao retomar. Preview do arquivo final, opções editoriais de YouTube/TikTok e pacotes manuais permanecem no fluxo.
- Preparação persistida em `publications.delivery`; direitos, arquivo, hash e revisão validados. Estados de simulação, falhas, repetição, cancelamento, idempotência e conflitos independentes por plataforma. Simulações não criam links, métricas ou estados de publicação real.
- Componentes de servidor testáveis: recebimento autenticado simulado, persistência em disco, autorização explícita, processamento independente; contratos de YouTube retomável, OAuth simulado e limitações TikTok. Nenhum listener público, transporte real ou conta conectada.

## Verificação da implementação principal

A suíte original (61 verificações) e as novas suítes passaram: pesquisa (22), UX (33), publicação/servidor (24), interface de publicação (10). Total: **150 verificações**. Os testes usam contextos descartáveis, fixtures e transporte simulado. Os relatórios de V2 anteriores continuam identificados por arquivo; novas evidências ficam em `.cache/` e são consolidadas no relatório final.

A matriz inicial está em `AUDITORIA_UX_PUBLICACAO.md`. Contratos e condições externas estão em `PESQUISA.md` e `PUBLICACOES_PREPARACAO.md`. O banco conserva nome e versão 2; nenhuma migração destrutiva foi necessária. Os backups existentes continuam no formato schema 2 e incluem os novos campos de publicações/configurações.

## Limitações deliberadas

Álbum/gênero/aliases ausentes no catálogo não foram inventados; os filtros funcionam quando esses campos estão cadastrados. MusicBrainz oferece consulta manual e contrato normalizador desativado por padrão; uso automatizado comercial precisa de validação das condições. Upload real, OAuth real, agendamento efetivo, Drive automático, render MP4 e APIs pagas permanecem desativados ou futuros. O horário planejado do formulário usa o fuso do dispositivo e é convertido para UTC na preparação.

A auditoria global posterior só começa após o commit recuperável desta implementação.
