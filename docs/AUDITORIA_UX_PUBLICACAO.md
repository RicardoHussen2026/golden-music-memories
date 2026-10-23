# Auditoria de UX e preparação de publicações

Data: 23/10/2026. Referência inicial: `97d54cb`, entrega V2 com templates. Desenvolvimento incremental em `desenvolvimento/ux-publicacoes`. A aplicação pública não deve ser atualizada nesta etapa.

## Escopo recebido e método

O arquivo fornecido com o prompt unificado foi lido integralmente. O conteúdo recebido termina na seção 15.1 com o item incompleto “Declara”. Não há texto disponível depois desse ponto; não se atribuem requisitos ao trecho ausente.

Foram lidos AGENTS.md, CONTINUIDADE.md, README.md, docs/VALIDACAO_V2.md, docs/AUTOMACAO_E_INTEGRACOES.md, docs/TEMPLATES.md e db/README.md. Nenhum desses documentos obrigatórios estava ausente. A classificação abaixo foi confrontada com `app/main.js`, `app/db.js`, `app/backup.js`, `app/cover.js`, `app/style.css`, entradas HTML, service worker e scripts de teste. Relatórios antigos descrevem a revisão anterior; não comprovam as alterações desta etapa.

No início da auditoria, a referência Git era `97d54cb`. O arquivo novo `app/search.js` já pertencia ao desenvolvimento coordenado desta etapa; não foi descartado. Arquivos pessoais, banco do navegador do operador e APIs autenticadas não foram usados nos testes. As validações usam contextos isolados e dados de teste explicitamente identificados.

## Matriz inicial, antes das melhorias

“Funcional” nesta matriz identifica um fluxo concreto existente no código e coberto pela suíte anterior, quando indicada. A validação da nova revisão é registrada separadamente, após sua execução.

| Recurso | Estado inicial | Evidência no código e limite |
|---|---|---|
| Arquitetura modular estática | Implementado e funcional | ES modules em app/, HTML equivalente index/painel, servidor local sem build; GitHub Pages compatível. |
| Persistência local | Implementado e funcional | IndexedDB `golden-music-memories-v2`, versão 2, sete stores; Blobs em assets; operações críticas transacionais. |
| Catálogo de metadados reais | Implementado e funcional | data/catalog.json, importSongs, referências MusicBrainz; 2.009 registros na base distribuída. Não contém áudio. |
| Curadoria e favoritos | Implementado e funcional | favorite, curate-song, song-info, importSongs; curadoria depende da conferência do operador. |
| Pesquisa musical básica | Implementado parcialmente | filteredSongs usa includes sobre título/artista/ano/gênero concatenados. Caixa e acentos normalizados; sem tokens independentes, ranking, aproximação ou álbum. |
| Autocomplete e histórico de busca | Inexistente | Sem lista de sugestões, histórico persistido ou controle de setas/Enter no campo de pesquisa. |
| Filtros | Implementado parcialmente | Década, favorito, não utilizada e situação de repertório; faltam intervalo, álbum, versão, arquivos e situação por plataforma. |
| Listas compactas | Implementado parcialmente | Alternativa de tabela existe, mas cards são padrão; tabela não mostra década e status operacional de forma completa. |
| Consulta externa no painel | Apenas planejado | Importador Python e importação JSON/CSV existem; não há consulta de metadados na interface. |
| Reservas e antirrepetição | Implementado e funcional | canonicalKey, reserveSongs, atomicProduction e histórico; testes concorrentes existentes. Não é lock distribuído entre máquinas. |
| Produção individual/lote e retomada | Implementado e funcional | createProduction, autosave, metas configuráveis, arquivos por produção. Preserva produções independentes. |
| Sete templates oficiais | Implementado e funcional | TEMPLATES, presets, Canvas, fundos oficiais, exportação e testes/templates.cjs. Estilos anteriores preservados. |
| Recuperar capa já aprovada | Existente, mas com defeitos | coverConfig é armazenada no ativo; ação cover-production redefine defaults/cassette em vez de recuperar a versão anterior. |
| Arquivos e versões | Implementado e funcional | uploadFiles, hash, papel de ativo, limites de tamanho/cota, previews e clone de produção. |
| Direitos e revisão | Implementado parcialmente | Campos e aprovação editorial existentes; novos uploads invalidam aprovação. Alterar direitos da produção/ativo não invalida approval no código inicial. |
| Publicações e métricas manuais | Implementado e funcional | Registros por plataforma, arquivo final, URL/data, métricas do operador, calendário e Kanban. Nenhum envio externo. |
| Rascunho de publicação por produção | Implementado parcialmente | Abrir pelo módulo Publicações edita o ID existente. Abrir pela produção inicia novo registro, permitindo rascunhos redundantes. |
| Worker, tarefas persistidas e idempotência de envio | Inexistente | Não há servidor de publicações nem fila de envio na referência inicial. |
| OAuth e adaptadores YouTube/TikTok | Apenas planejado | Documentação de condições; nenhuma conexão ou implementação executável inicial. |
| Modo de simulação de publicações | Inexistente | Testes anteriores registram fatos manuais em banco isolado; não simulam protocolo de servidor/provedor. |
| Acervo e histórico | Implementado e funcional | archive, pubsOf, novas versões e cancelamento auditado; vídeos finais separados por plataforma. |
| Backup e restauração | Implementado e funcional | ZIP com Blobs/SHA-256; validação de IDs/vínculos antes de transação de substituição. Testes de corrupção/recuperação existentes. |
| PWA offline | Implementado e funcional | Cache de shell, catálogo e fundos; testes offline. Primeiro carregamento e quota de navegador continuam necessários. |
| Canva, CapCut e Drive | Implementado parcialmente | CSV, ZIP e estrutura reais, manuais. Sem conexão OAuth/sincronização/upload remoto. |
| Montagem automática MP4 na V2 | Apenas planejado | V1 possui projeto/vídeo demonstrativo; V2 importa finais, não renderiza vídeo. |
| Acessibilidade | Implementado parcialmente | Labels na maioria dos campos, diálogo nativo, foco visível e live status. Modal sem nome acessível explícito; importador de catálogo sem label; navegação não marca aria-current. |

## Achados que orientaram a evolução

1. **Busca por combinação:** texto concatenado não implementa interseção de termos independentes. Consultas como “artista ano” e palavras fora de ordem podem falhar; a busca deve dar preferência a título/artista e recusar semelhanças excessivamente vagas.
2. **Densidade e navegação:** nove destinos de navegação, grandes cards, avisos repetidos e ferramentas secundárias abertas ocupam a área útil. Quatro áreas principais com ferramentas secundárias recolhidas e lista padrão reduzem deslocamento sem retirar funções.
3. **Metadados ausentes:** o catálogo não oferece gênero/álbum verificados para todos os registros. Filtros não podem preencher essas lacunas por adivinhação. “Sem resultados” deve ser distinguido de prova de inexistência da música.
4. **Retomada de capas:** os dados para recuperar a edição existem no ativo aprovado. Usá-los evita recriar a capa manualmente e preserva a identidade dos templates.
5. **Revisão desatualizada:** aprovação precisa ser invalidada ou revalidada quando direitos/arquivo/textos que componham a solicitação mudarem. Envio futuro deve validar um snapshot íntegro, com hash real do arquivo, versão e vínculo à plataforma.
6. **Publicações independentes:** manter os IDs de publicações existentes e não criar um segundo cadastro paralelo. Simulações precisam de marcador explícito e jamais devem incrementar métricas/publicações reais.
7. **Rótulos e estados:** status técnicos em inglês aparecem nas publicações; diálogos/importação precisam de nomes acessíveis e campos de busca precisam de navegação por teclado.
8. **Indicadores:** “Músicas disponíveis” inicialmente exibe o total do catálogo; produções canceladas também entram em algumas contagens. O indicador deve seguir disponibilidade operacional real.
9. **Continuidade:** checksum comprova integridade de bytes contra o manifesto, não autoria/licença. O campo hash do ativo restaurado deve coincidir com os bytes antes de qualquer envio futuro. Git não sincroniza IndexedDB.

## Proteções de escopo

Sem deploy público, alteração de hospedagem, conexão de contas, credenciais reais, aplicação de migração remota, execução de postagem ou gasto. Mudanças de persistência devem manter nome do banco, IDs, reservas e stores anteriores. A simulação será explicitamente local, com resultados separados de publicação real. Configuração de variáveis de ambiente não comprova conexão ou autorização de uma plataforma.

## Verificação desta etapa

Em 23/10/2026, `node tests/ux.cjs` concluiu **33 verificações com sucesso**, em Chrome headless, servidor local, banco isolado e acesso externo bloqueado pelo contexto de testes. Nenhum erro JavaScript não tratado foi observado. O relatório detalhado fica em `.cache/qa-ux/resultado.json`; screenshots desktop 1440 px e celular 390 px ficam na mesma pasta e foram inspecionadas visualmente. O relatório é gerado localmente por execução, sem substituir os resultados históricos da V2.

Cobertura efetiva: pesquisa por título/artista/ano combinados, caixa/espaços, pequeno erro de digitação, ausência de correspondência, IDs únicos, lista compacta, década e ano simultâneos, filtros recolhidos/expandidos, limpeza com uma ação, retorno da ficha mantendo busca, nome acessível do diálogo, datalist nativo, histórico com Enter, abertura da ficha por teclado e fechamento por Escape, identidade da música na produção, preenchimento automático da capa, sete templates preservados, duas capas/configurações preservadas, recuperação da mais recente, edição de rascunho anterior sem duplicação entre plataformas, ausência de transbordamento horizontal no celular e pesquisa offline após primeira carga.

As verificações detectaram e motivaram a correção de dois problemas reais durante a implementação: identificador duplicado no filtro de materiais e escolha de capa por ordem UUID em vez da ordem de criação. A ordenação dos ativos passou a considerar criação/versão, e o teste guarda duas capas diferentes antes de verificar a retomada. O teste aguarda a conclusão das operações assíncronas da interface; as capturas finais aguardam o aviso transitório desaparecer.

Capturas e dados desses testes são isolados; não representam publicações, métricas nem acervo real do canal. A suíte anterior continua necessária para verificar os fluxos preservados. Testes simulados não substituem homologação OAuth e upload em ambiente externo autorizado. Não foi executada uma certificação WCAG integral ou teste com leitor de tela real. A auditoria global posterior solicitada pelo usuário deve ocorrer depois do marco de conclusão da implementação principal, separadamente desta validação funcional.
