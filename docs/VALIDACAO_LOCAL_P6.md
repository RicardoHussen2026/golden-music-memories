**Atualização posterior nesta mesma data:** acesso local sem senha implementado, habilitado e verificado no Chrome habitual. A pendência de login manual descrita na primeira rodada abaixo foi substituída. Consulte [ACESSO_LOCAL.md](ACESSO_LOCAL.md) para o estado atual, comandos e 60 verificações direcionadas posteriores. Senha e chave originais preservadas; acesso pela rede/internet não habilitado.

# Painel de Produção Golden Music Memories — PC de casa

Validação em 24/10/2026, DESKTOP-P6N6RDF. Sem hospedagem, publicação ou configuração de plataformas externas.

## Resultado concreto

O painel e o serviço Node abriram no Chrome em **http://127.0.0.1:8877/painel.html**. O serviço foi encerrado e reaberto no mesmo endereço; `/api/health` retornou HTTP 200. O perfil habitual mostrou 2.009 músicas, zero produções e zero vídeos finais. Os dados dos testes foram criados em contextos de navegador isolados e diretórios temporários, não no perfil habitual.

**Prontidão parcial para uso diário:** catálogo, produções, capas, anexos, pacotes CapCut e backup do navegador disponíveis. A configuração privada foi criada após autorização específica. Falta o proprietário entrar no serviço; o acervo autenticado desta instalação ainda não foi validado. A API confirmou `authenticationConfigured=true`, `encryptionConfigured=true`, `networkEnabled=false`, `publishingEnabled=false` e `workerEnabled=false`. Não chamar essa instalação de integralmente pronta para operação autenticada.

## Pasta e alterações

- Projeto: `C:\Users\RicardoPC\Documents\Codex\Golden Music Memories\golden-music-memories`.
- Node instalado: 24.20.0. Versão do painel: 2.3.0.
- Git inicialmente limpo em `main`; branch local criada: `desenvolvimento/validacao-local-p6`.
- Instaladas 15 dependências do lockfile com `npm.cmd ci --ignore-scripts --no-audit --no-fund`. Sem instalação global, alteração do lockfile ou navegador adicional.
- Nenhuma alteração final de código funcional. Um ajuste de confirmação HTTP do launcher foi preparado, mas retirado porque o Windows bloqueou a execução de PowerShell; não foi entregue como validado.
- Criado o armazenamento padrão do serviço em `.cache/publishing-private`, fora do Git. `.env` foi criado após autorização, com senha e chave geradas localmente, sem imprimir seus valores. Não foram inseridos registros de teste nesse banco operacional.
- Esta documentação registra a rodada. Nenhum commit, push, deploy, tarefa automática no Windows ou alteração de firewall/política de execução foi feito.

## Como abrir, parar e reabrir

Abra um terminal na pasta do projeto e execute:

```powershell
Set-Location -LiteralPath 'C:\Users\RicardoPC\Documents\Codex\Golden Music Memories\golden-music-memories'
npm.cmd run service
```

Espere aparecer a linha com `http://127.0.0.1:8877/painel.html` e abra esse endereço no Chrome habitual. O sufixo `.cmd` seleciona o executável npm do Windows, sem depender do wrapper PowerShell npm.ps1. Esse comando de execução da aplicação foi testado e autorizado, sem mudar a política do sistema.

Mantenha esse terminal aberto. Fechar somente a aba do Chrome não encerra o serviço. Para parar, use **Ctrl+C no terminal que executa o serviço**. Para reabrir, repita o comando e use o mesmo endereço. Não inicie duas cópias simultâneas. Erro de porta ocupada exige conferir o terminal já aberto, não trocar automaticamente de porta.

Use sempre **127.0.0.1, porta 8877, no mesmo perfil do Chrome**. `localhost`, porta 8765, outro navegador e GitHub Pages possuem bancos de navegador separados. Não faça migração ou restauração sobre dados reais sem backup explícito.

Os comandos `service:start` e `service:stop` usam scripts `.ps1` e **não estão homologados neste PC**: a política do Windows impediu a execução. Não foi usado ExecutionPolicy Bypass, desbloqueio ou alteração de política.

## Testes executados nesta rodada

| Conjunto existente | Aprovados | Evidência e limite |
|---|---:|---|
| `server.test.mjs` + `operations.test.mjs` | 59 | SQLite, reinício, blocos, integridade, backup, controle cifrado, restauração, fila, agenda e proteção HTTP. Provedores externos simulados. |
| `search.cjs` | 22 | Busca por título/artista/ano, normalização e consulta de metadados com transporte simulado. |
| `catalog.cjs` | 12 | Filtros e estados do catálogo com fixtures isoladas. |
| `acceptance.cjs` | 31 | Fluxo de produção no Chrome, capas PNG vertical/horizontal, anexos, dois MP4 existentes, revisão, ZIP de edição, registro manual, acervo, versões, backup ZIP, restauração em segundo contexto e rejeição de backup corrompido. |
| `templates.cjs` | 15 | Sete modelos, PNG/JPG, persistência de configurações, fundos offline e tela estreita. |
| `server-ui.cjs` | 9 | Login temporário de teste, transferência local, recibo, simulação, conciliação, fuso e celular. |
| `operations-ui.cjs` | 12 | Cinco produções, dez capas, cinco ZIPs CapCut, importação de MP4 estrutural, associação, histórico por destino, agenda simulada, pausa, recarga e celular. |
| **Total** | **160** | Todos aprovados na execução final de cada conjunto. |

Os dois testes HTTP inicialmente falharam com `connect EACCES` sob sandbox. A execução explicitamente aprovada fora desse isolamento permitiu os mesmos testes; os 59 passaram. Isso não exigiu alteração no firewall ou código de rede.

Não foram repetidos todos os conjuntos históricos do repositório; estes cobrem as prioridades de execução local desta rodada. Os relatórios antigos não foram sobrescritos. O executor auxiliar da tarefa redirecionou apenas caminhos de saída dos testes; manteve fixtures e asserções originais.

Evidências desta execução: `C:\Users\RicardoPC\Documents\Codex\2026-10-24\task\golden-local-qa`:

- `docs/testes-automatizados.json`, `docs/testes-templates.json`.
- `cache/server-ui/resultado.json`, `cache/operations-ui/resultado.json`.
- PNGs de interface desktop/celular e família de templates.
- `cache/qa-v2/backup.zip`, `edicao.zip`, capas e CSV: **amostras de teste**, não backups pessoais.

## O que a evidência não comprova

- Os MP4 do fluxo principal são as amostras existentes no projeto. O teste operacional também usa MP4 estrutural sintético: comprova cabeçalhos/recebimento/agenda, não qualidade audiovisual nem edição no CapCut.
- O ZIP CapCut foi gerado e inspecionado; não é um projeto proprietário do CapCut. Não foi aberto/renderizado no editor nesta rodada.
- Registros de postagem e agenda simulada não enviam vídeo ao TikTok/YouTube. Nenhuma publicação real, conexão OAuth ou transferência real para Drive ocorreu.
- O teste acima de 500 MiB usa arquivo esparso/estrutural; não mede upload sustentado de um vídeo real de 10 GiB.
- A estimativa de cota do Chrome foi 10 GB, com aproximadamente 16,4 MB usados na origem consultada; isso é uma estimativa do navegador, não garantia de retenção permanente. A permissão de armazenamento persistente não foi alterada.
- O serviço local não centraliza automaticamente dados entre casa, trabalho e celular. Hospedagem permanece fora desta fase.

## Dados e recuperação

1. **Navegador:** músicas, produções, capas, anexos e registros locais ficam no IndexedDB. Use Fazer backup e guarde o ZIP fora do navegador. A restauração substitui dados após confirmação: teste com perfil isolado primeiro.
2. **Serviço:** SQLite, arquivos de mídia e controles ficam em `.cache/publishing-private`. O ZIP do navegador não substitui esse backup. O comando `npm.cmd run service:backup -- CAMINHO_PRIVADO_FORA_DO_PROJETO\backup-unico.sqlite` gera cópia consistente e recusa sobrescrever um arquivo existente.
3. O backup SQLite não inclui os MP4 externos ao banco; preserve também a pasta de mídia. Nunca abra um SQLite operacional dentro de pasta sincronizada entre dois computadores.
4. Quando criada, a configuração `.env` e sua chave devem ser guardadas privadamente e separadas do Git. Não enviar segredos pelo chat.

## Validações pendentes do proprietário

1. **Concluído após autorização:** configuração criada com `npm.cmd run service:setup`, preservando o SQLite existente. Serviço reiniciado; HTTP 200, autenticação e cifragem configuradas. Nenhum segredo foi exibido. `.env` confirmado fora do versionamento e ignorado pelo Git.
2. **Pendente do proprietário:** entrar com a senha obtida localmente e confirmar o acervo autenticado. Não colocar senha Google/TikTok nesse formulário.
3. Realizar uma produção com material próprio/licenciado, montar no CapCut, devolver o MP4 e validar o resultado audiovisual. Meta de cinco vídeos por plataforma continua meta, não capacidade comprovada.
4. Decidir posteriormente sobre integração com plataformas. Não é necessário para usar catálogo, capas, pacotes e registros manuais.

## Bloqueios e situação

| Ação/alvo | Motivo | Situação |
|---|---|---|
| HTTP loopback e consulta Git sob sandbox | EACCES/confinamento de execução | Resolvido com execução específica aprovada; sem mudança de sistema. |
| Executar `scripts/start-service.ps1` no Windows | Política de execução de scripts desabilitada | Negado pelo Windows; não contornado. Ajuste experimental retirado. Execução direta da aplicação via `npm.cmd run service` validada. |
| Criar `.env` com senha/chave local | Confirmação específica recebida posteriormente | Concluído, sem exibir segredos. Login do proprietário ainda pendente. |
| OAuth/publicações/Drive reais | Sem configuração e consentimento próprios do aplicativo | Não testados; flags desligadas. |

## Configuração privada: criação concluída, entrada do proprietário pendente

Não há iniciador `.cmd` próprio na raiz ou em `scripts/`. O comando `npm.cmd` usado neste guia é o executável do npm instalado no Windows, não um launcher novo do Golden. Os iniciadores próprios existentes são PowerShell e permanecem bloqueados. Nenhum atalho ou início automático foi criado.

O painel atual **só permite entrar e sair do serviço**. Não possui tela para criar senha, trocar senha ou recuperar acesso por e-mail. A configuração inicial precisa ocorrer localmente no arquivo `.env`; não é necessário transmitir nenhum segredo pelo chat.

A configuração já foi criada nesta rodada com autorização específica; não é necessário repetir o setup. Para referência e recuperação, o procedimento existente é:

1. Parar o serviço no terminal com Ctrl+C.
2. Na pasta do projeto, executar `npm.cmd run service:setup`. O configurador cria `.env` apenas se ele ainda não existir. Gera uma senha aleatória exclusiva e uma chave de cifragem aleatória; não imprime os valores. Executá-lo novamente preserva o arquivo existente, não troca nem recupera senhas.
3. O proprietário abre `.env` em um editor local, por exemplo `notepad .env`, sem compartilhar a tela ou o conteúdo. `GMM_OPERATOR_PASSWORD` é a senha usada para entrar no serviço. `GMM_ENCRYPTION_KEY` é a chave técnica de cifragem/recuperação; não é senha de login e nunca deve ser digitada no formulário do painel.
4. Guardar a senha e uma cópia privada da configuração em um gerenciador de senhas ou backup pessoal protegido, fora do repositório público. Preservar a chave original separadamente dos backups do banco.
5. Reabrir com `npm.cmd run service`. No painel: **Configurações → Entrar no serviço**. Digitar somente a senha de `GMM_OPERATOR_PASSWORD`.

**Senha escolhida versus gerada:** o configurador existente gera a senha automaticamente. Se o proprietário preferir escolher outra, é necessário editar somente `GMM_OPERATOR_PASSWORD` no arquivo local, com senha exclusiva de pelo menos 16 caracteres e sintaxe válida de `.env`, e reiniciar o serviço. Isso não é feito pelo formulário de login. A opção mais simples é conservar a senha gerada e guardá-la no gerenciador.

**Recuperação:** se esquecer a senha e ainda tiver acesso ao arquivo local, poderá consultar `GMM_OPERATOR_PASSWORD` ou alterá-la localmente e reiniciar. Se perder `.env`, deve recuperar sua cópia privada, especialmente a chave original. Uma chave nova não decifra tokens ou pacotes de controle cifrados com a anterior. Não apagar SQLite, mídia ou IndexedDB para recuperar login. A troca da senha não implementa revogação automática das sessões existentes: o código mantém sessões no SQLite com validade de oito horas; existe Sair do serviço para a sessão atual.

Após autorização específica, o configurador criou os segredos localmente e o serviço foi reiniciado. Apenas indicadores booleanos de configuração foram conferidos; valores secretos não foram exibidos nem enviados pelo chat. Nenhum login com a senha operacional foi executado pelo assistente. O proprietário deve abrir o arquivo local e usar somente a senha no painel; não compartilhar o conteúdo. Google, YouTube, TikTok e Drive não foram conectados. Não foi criada outra chave nem uma cópia adicional de segredos.
