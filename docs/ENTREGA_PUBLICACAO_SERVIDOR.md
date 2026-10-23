# Entrega V2.2 — publicação preparada para configuração

Data: 23/10/2026. Base preservada: `d8d0aaf`, branch `desenvolvimento/ux-publicacoes`. Implementação isolada em `desenvolvimento/publicacao-servidor`.

O painel existente foi estendido com um serviço opcional de publicação. Não houve configuração de contas, publicação de vídeos, contratação de infraestrutura, aplicação de migrações remotas nem atualização do site público.

| Recurso | Implementação | Validação nesta etapa | Pendência para operação real |
|---|---|---|---|
| Catálogo, capas, produção, direitos, acervo e backup local | Preservados | 189 verificações de regressão existentes aprovadas | Uso diário do operador |
| API autenticada e persistência SQLite | Implementadas | HTTP, autenticação, proteção de origem e reinício | Senha de operador e ambiente privado |
| Transferência do navegador ao servidor | Implementada, em blocos, SHA-256 e confirmação | Interrupção, retomada, corrupção, concorrência e idempotência | Validar volume e espaço com acervo real |
| Autorização de tarefas | Separada do recebimento; vinculada a arquivo, texto, destino e direitos | Contratos e fluxo completo no navegador | Operador aprovar cada tarefa real |
| Processador independente do navegador | Implementado com persistência, lease e retentativas | Reinício e aquisição exclusiva entre duas conexões SQLite | Configurar processo e disponibilidade do servidor |
| YouTube OAuth e tokens | Implementados no servidor | Troca, confirmação de canal, cifragem, renovação, recusa e revogação com transporte simulado | Aplicativo, credenciais e consentimento real |
| YouTube upload e acompanhamento | Implementados com sessão retomável | Interrupção, consulta de posição, sessão expirada e visibilidades simuladas | Primeiro teste privado autorizado |
| YouTube agendamento, reagendamento e retirada | Implementados; alteração remota exige permissão específica | Respostas simuladas, preservação de opções e falha ambígua | Escopo apropriado e homologação na conta |
| TikTok upload assistido | Adaptador implementado; exige finalização no aplicativo | Inicialização, transferência e estado aguardando usuário simulados | Elegibilidade, aprovação de video.upload, HTTPS e autorização |
| TikTok Direct Post e agendamento automático | Indisponíveis neste painel pessoal | Bloqueio explícito | Não há promessa de aprovação; conferir políticas para outro enquadramento legítimo |
| Conciliação, histórico e antirrepetição | Reutilizam IDs e publicações existentes | Recibos não alteram métricas manuais; edição posterior gera conflito | Conciliação operacional com contas reais |
| Backup do servidor | Implementado, consistente e privado | Cópia SQLite e recusa de sobrescrita | Destino privado e guarda separada da chave |
| Drive, renderização MP4 e IA | Permanecem nos fluxos/planos anteriores | Não foram apresentados como ativos | Fora desta implementação |

## Evidências de teste

- Suíte de regressão existente: 189 verificações aprovadas, abrangendo catálogo, produção, capas, direitos, backup, offline, UX e simulações anteriores.
- `node --test tests/server.test.mjs`: 28 testes aprovados. Há múltiplas asserções em cada caso; a contagem não é uma afirmação de cobertura total de todos os cenários das plataformas.
- `node tests/server-ui.cjs`: 9 verificações adicionais aprovadas em navegador isolado, incluindo integração HTTP, transferência, autorização, simulação, recuperação, conflito e fuso.
- Sintaxe dos módulos e `git diff --check`: sem erros.
- Nenhum transporte real de Google/TikTok foi executado. Os testes das APIs externas usam respostas injetadas e credenciais fictícias mantidas em memória.

## Limites práticos

O servidor e o painel usam a mesma origem nesta versão. Trocar a porta/domínio exige transferir o backup do navegador. O serviço é para um operador e não substitui uma futura sincronização em nuvem.

Uma tarefa recebida e aprovada contém uma cópia fixa. Editar a produção local não cancela essa tarefa. Consulte/cancele no servidor antes de substituir uma peça; agendamentos já aceitos pelo YouTube devem ser removidos pelo fluxo correspondente ou no Studio. A conciliação preserva resultados e sinaliza alterações locais.

Mesmo com o painel fechado, o processamento futuro depende de o serviço continuar ligado. Vídeo enviado, processado, privado, não listado e publicado são estados distintos. Upload TikTok para a caixa de entrada exige ação do usuário.

As flags, aplicativos e conexões continuam desativados/não configurados. O próximo passo é seguir [o guia de configuração e homologação](PUBLICACAO_SERVIDOR.md), começando pelo YouTube com teste privado autorizado.
