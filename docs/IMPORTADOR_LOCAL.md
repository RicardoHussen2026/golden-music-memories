# Importador local de materiais autorizados

**Confirmação humana em 25/10/2026:** Ricardo informou que usou o baixador e funcionou para o link testado, e está conferindo o vídeo/continuando a produção. URL/arquivo/hash não foram fornecidos nesta confirmação; não generalizar a todas as fontes. O teste técnico anterior recusado permanece como histórico abaixo. Não operar sua produção nem reiniciar/recarregar durante a conferência.

**Item 8, 25/10/2026:** [snapshot das fontes e recuperação composta](ARMAZENAMENTO_BACKUP.md) preparados/testados na V2.8.0; ativação operacional adiada durante teste do baixador. O ZIP do navegador continua separado do serviço; preservar configuração/chave privadamente.

## Atualização do item 7 - 25/10/2026, V2.7.2

Busca sem resultados explica a cobertura parcial do catálogo, sugere grafia/nome artístico/alias e permite Limpar busca e filtros no próprio aviso. Não cria resultados fictícios. Cadastro/busca/direitos e controles simplificados anteriores foram preservados.

Teste externo real pelo painel, com banco/perfil isolados: amostra técnica youtube-dl BaW_jenozKc, indicada pelos mantenedores em https://github.com/yt-dlp/yt-dlp/issues/5412 . A inspeção retornou failed com recusa da fonte ou exigência de autenticação/proteção antes de oferecer formatos. Não houve download externo, cookies/login/bypass nem repetição. A homologação real permanece pendente de material autorizado acessível; o erro não prova uma causa remota específica nem impede testes internos e próximas entregas.

Passaram 11 testes backend/automação de consulta, 17 verificações UI do importador com rede simulada e mídia sintética, 7 UI de busca vazia e regressões 22 de busca/12 catálogo/33 UX/10 versão. O remux local e cancelamento foram reais nas fixtures; não confundir com transferência YouTube real. Evidências .cache/item7/result.json, external.json, logs/capturas e .cache/item7-regression/. Nova verificação reproduzível: npm.cmd run test:search-empty; suíte existente: npm.cmd run test:source-import.

V2.7.2 ativa localmente em 127.0.0.1:8877, sem jobs na atualização, com sessão/SQLite/mídias preservados e flags externas desligadas. Nenhuma aba habitual recarregada. A pendência externa fica registrada enquanto segue item 8 de armazenamento/backup; os estados de versões anteriores abaixo são históricos.


Implementação local de 24/10/2026. Não publicada. Fonte real YouTube/YouTube Music ainda aguarda link com autorização verificável para homologação; os testes de interface usam resposta simulada e mídia sintética própria.

## Uso

1. Crie/abra uma produção no Catálogo. Em **Materiais e arquivos**, abra **Importar link / materiais locais**. O mesmo botão existe em **Acervo e programação**.
2. Cole um link HTTPS individual de YouTube ou YouTube Music. A consulta de formatos começa automaticamente após 650 ms sem edição. Texto de banda/música não é um link. Links de playlist são recusados; remova o parâmetro `list` para indicar apenas o vídeo. Editar a URL cancela a consulta anterior; Enter ou colar novamente permite repetir após erro.
3. Confira artista, música, produção e formatos oferecidos. O clique em Baixar inicia o download, sem caixa de confirmação adicional. Escolha vídeo com áudio ou um fluxo somente de áudio. Não há extração/recompressão automática de vídeo combinado para MP3.
4. **Baixar e associar à produção** inicia uma tarefa local. O progresso é do fluxo atual: pode reiniciar quando o downloader passa de vídeo para áudio; a junção ocorre no final. **Cancelar** encerra a árvore do processo e limpa somente os temporários daquela tarefa. Fechar o diálogo cancela uma consulta de formatos ainda pendente. Um download já iniciado continua; reabra para acompanhar ou cancelar explicitamente.
5. O material aparece com nome **Artista - Música - Tipo - V1.ext**. O link baixa uma cópia com esse nome para o local escolhido pelo navegador. **Exportar pacote para edição** inclui as fontes associadas, os anexos do navegador e o manifesto. Extraia e importe manualmente no CapCut; não é um projeto nativo do editor.

Os formatos são apresentados com resolução, fps, codecs, contêiner e bitrate quando disponíveis. A primeira opção de vídeo prioriza resolução, fps e bitrate; não garante ser a melhor escolha estética ou a mais compatível com seu editor. Áudio mantém seu codec/contêiner oferecido. Fluxos separados usam MKV e remux, sem recodificação; não há `--recode-video`, `--extract-audio`, MP3 obrigatório ou promessa de recuperar qualidade original. A compatibilidade do CapCut com cada codec deve ser conferida pelo usuário. Arquivos de áudio comprimido não são chamados de lossless.

## Armazenamento e compatibilidade

- IDs existentes não são migrados. Anexos antigos permanecem intactos; novos nomes legíveis são usados ao baixar/exportar e para novos anexos. Originais do computador não são renomeados.
- Fonte física: `.cache/publishing-private/sources/<SHA256>.<ext>`. Metadados e associações `source_blob`, `source_asset` e tarefas `source_job` ficam no SQLite existente. Uma fonte pode ter vários vínculos e nomes por produção, usando uma única cópia de bytes nessa biblioteca.
- Repetir a mesma fonte/formato reaproveita a cópia local já recebida; conteúdo de mesmo hash também é deduplicado após recebimento. Isso não representa uma nova consulta à revisão remota. Não há deduplicação global com arquivos do usuário, IndexedDB ou MP4 finais da biblioteca antiga.
- Materiais de fonte não são copiados para o IndexedDB nem classificados como vídeo pronto. Continuam com direitos de publicação pendentes. Consentimento de download não concede licença de monetização ou publicação.
- ZIP de edição e extração criam cópias adicionais e consomem memória/espaço. O pacote usa nome legível e sufixo curto de ID para evitar colisões; manifesto conserva ID completo, hash, origem e vínculo.
- Backup ZIP do navegador **não inclui** a biblioteca de fontes. O pacote de controle/transferência de máquina antigo também não a transfere. Preserve backup consistente de `publishing.sqlite` **e** a pasta `sources/`, além dos demais arquivos do serviço e chave. Não copie SQLite aberto diretamente. Fontes finalizadas são imutáveis nesta versão; restauração completa com dados do proprietário continua pendente.
- Reiniciar o serviço marca tarefas ativas como interrompidas, sem retomar downloads automaticamente. Temporários de uma interrupção abrupta podem permanecer em `sources/job-<UUID>/`; não os confundir com arquivos concluídos. Não há exclusão automática do acervo final.

## Dependências e limites

No PC de casa, as ferramentas foram colocadas somente em `.cache/import-tools/`, ignorada pelo Git: yt-dlp **2026.10.21**, FFmpeg/ffprobe **9.0.2 essentials**. SHA256 conferidos antes da execução; procedência em `provenance.json` nessa pasta. O Node 24 existente é usado como runtime JS. Não houve instalação global, mudança de PATH, firewall ou inicialização automática.

Fontes oficiais: [yt-dlp](https://github.com/yt-dlp/yt-dlp), [FFmpeg](https://ffmpeg.org/download.html), [build Windows indicado pelo FFmpeg](https://www.gyan.dev/ffmpeg/builds/). A comparação inicial do manifesto yt-dlp precisou tratar a resposta HTTP como bytes UTF-8; o hash local coincidiu com o manifesto antes de executar o binário.

O importador usa processos sem shell, argumentos fixos, configuração/plugins externos desativados, ambiente reduzido, limite de saída, tempo, espaço e tamanho. Links são normalizados para hosts YouTube permitidos e ID individual. Não lê cookies, senhas ou perfis do navegador; não solicita componentes remotos, não desativa certificados e não contorna DRM, idade, login, premium ou bloqueios. Recusas da fonte são exibidas e encerram a tentativa. Uma tarefa externa por vez.

A requisição explícita do usuário no importador permite o tráfego de entrada de mídia da fonte; não altera `GMM_ALLOW_NETWORK`, OAuth, publicação ou worker. Rotas mantêm sessão, Host, Origin/CSRF e conexão loopback, sem proxy. Nenhum endpoint público ou integração de conta foi aberto.

## Validação

Comando: `node --test tests/source-import.test.mjs` e `node tests/source-import-ui.cjs`.

Testes novos: URL inválida/host falso/lista/login, DRM/restrições/live, nomes seguros, argumentos de processo, cancelamento e limite de saída, autenticação/Host/Origin/CSRF, associação, hash/deduplicação, persistência após reinício, arquivos privados inacessíveis, interface, download legível, ZIP com bytes e manifesto, ausência de cópia no IndexedDB e de entrada na fila de publicação. FFmpeg gerou mídia sintética local; remux real com cópia de codecs conservou os hashes dos dois fluxos. A inspeção/download YouTube foi simulada nesses testes.

Evidências da interface em `.cache/source-import-ui/resultado.json` e `importador.png`. Regressões apropriadas: serviço HTTP/contratos, operações e acesso local; interface de operações/pacotes e acesso local. Não repetir toda a auditoria do catálogo.

Pendente: link autorizado para teste externo, compatibilidade do arquivo resultante no CapCut do proprietário e restauração completa das fontes em outro ambiente. Não declarar o download YouTube real homologado antes desses testes.

## Checkpoint final desta rodada

Implementação e documentação concluídas na branch desenvolvimento/validacao-local-p6. Passaram 5 testes novos de backend, 11 verificações novas de interface, 61 regressões de backend e 21 de interface (operações e acesso local). A nova cobertura inclui áudio AAC preservado byte a byte e cancelamento durante download com limpeza dos temporários. Evidências visuais foram inspecionadas. Nenhuma fonte externa foi baixada.

O serviço operacional na porta 8877 não foi reiniciado nesta rodada, respeitando a orientação de continuidade sem reinício. A interface mantém exportações antigas compatíveis e informa quando o backend ainda precisa carregar a atualização. Ativação operacional: parar o serviço existente com Ctrl+C, executar npm.cmd run service na mesma raiz e recarregar o painel. Fazer essa etapa no próximo ponto autorizado, sem encerrar o processo por métodos forçados ou alterar dados. O teste real aguarda o link autorizado pedido ao proprietário; não existe autorização de mídia fornecida nesta rodada.
## Ativação operacional confirmada — 24/10/2026

Após autorização explícita do proprietário, o serviço anterior foi encerrado normalmente por Ctrl+C no terminal original e a versão atual iniciou com npm.cmd run service na mesma raiz. Antes da parada não havia jobs, downloads nem tarefas operacionais ativos. SQLite conservou a máquina e a sessão existentes; nenhuma mídia ou produção foi apagada. Esta confirmação substitui a pendência de reinício registrada acima.

Saúde HTTP confirmada: versão 2.3.0, interface 4081db2ea6fd, backend 7339930eccad, sourceImportAvailable=true. Bind permanece exclusivamente 127.0.0.1:8877. Rede de publicação, publicação e worker permanecem desligados. No Chrome habitual, Acervo e programação abriu; Importar link / materiais locais mostrou o formulário, as ferramentas disponíveis e a produção existente do proprietário. Nenhum link foi enviado nem download externo iniciado pelo agente. A aba foi deixada aberta para o teste do proprietário, preservando sua aba anterior.

Próximo passo: colar o endereço HTTPS completo de um vídeo individual YouTube/YouTube Music autorizado e clicar Inspecionar link; então conferir formato, identificação e produção. A homologação com fonte real continua pendente do teste do proprietário.
## Simplificação da interface — 24/10/2026

Esta seção substitui as instruções antigas com o botão Inspecionar link. A consulta é automática, serializada e cancelável; resultados atrasados não substituem a URL atual. Não inicia download automaticamente.

A seção Direitos e comprovação, edição de licença por anexo, seletor de comprovantes, avisos da ficha e campos da preparação local foram retirados. Documentos e campos históricos permanecem intactos; salvar roteiro, rascunho ou marcar Finalizado localmente não concede direitos nem habilita publicação. A configuração de entrada automática do Drive que exigia declaração foi ocultada, sem alterar a política salva. Guardas técnicas e consentimentos de ações externas permanecem.

Limite da entrega: a revisão automática rejeitou remover a confirmação de autorização de download e aceitar apenas downloadRequested no backend, considerando redução persistente de controle sem consentimento específico. A tentativa rejeitada não foi aplicada. A alternativa concluída preserva a caixa Tenho autorização para baixar este conteúdo e a validação authorized===true ao iniciar download. Consulta de metadados usa inspectOnly e não concede autorização.

Validação desta rodada: testes de debounce, URL inválida, deduplicação de consultas, resposta fora de ordem, cancelamento durante POST, fechamento, repetição após erro; integração com mídia sintética; preservação de direitos/documentos históricos e salvamento comum; operações, pacotes e versão desktop/celular. Evidências em .cache/source-import-ui, .cache/simplification-ui, .cache/operations-ui e .cache/version-ui. Não houve download externo nesta rodada.

## Simplificação ativada — 24/10/2026

Serviço reiniciado normalmente após confirmar ausência de jobs/downloads ativos. Saúde confirmada em 127.0.0.1:8877: v2.3.0, interface aebca7711633, backend cf24fbe9e864, automaticSourceInspection=true. Bind exclusivamente loopback; networkEnabled, publishingEnabled e workerEnabled continuam false. Máquina e sessão SQLite preservadas; nenhuma mídia operacional alterada.

Passaram 92 verificações únicas desta rodada: 6 de consulta automática, 5 de importação/backend, 33 de operações/backend, 17 de importação/UI, 13 de operações/UI, 10 de versão/UI e 8 de simplificação/preservação/UI. Testes usam bancos temporários, navegador isolado e mídia sintética; não homologam download externo. Screenshots desktop/celular foram inspecionados.

No Chrome habitual foi aberta uma nova aba local, sem recarregar o formulário em uso, e confirmados o rodapé atual e Importar link sem botão Inspecionar. A produção real Curtis Mayfield permaneceu disponível, sem material baixado pelo agente. A aba atualizada ficou aberta para teste.

Para testar: abrir http://127.0.0.1:8877/painel.html, conferir Interface aebca7711633 no rodapé e acessar Acervo e programação → Importar link / materiais locais. Colar URL HTTPS de vídeo individual; aguardar os formatos; confirmar autorização para download, selecionar qualidade e Baixar e associar à produção. Não há download automático. Fechar cancela consulta pendente; download já iniciado continua até concluir ou ser cancelado explicitamente.

Pendência delimitada: confirmação explícita de download foi preservada após a revisão automática negar sua remoção e o relaxamento do backend. A rejeição não foi contornada. Controles de autorização para ações externas permanecem; publicação continua desativada. Nenhuma alteração de credencial, permissão de rede, push ou deploy.


## Atualização posterior: confirmação adicional removida — 24/10/2026

Após o proprietário autorizar especificamente a retirada da caixa Tenho autorização para baixar este conteúdo e da exigência correspondente no backend, a operação anteriormente negada foi reavaliada uma única vez e executada. Este registro substitui a pendência de aprovação descrita anteriormente, mantida apenas como histórico.

Fluxo atual: colar link → consulta automática → escolher formato/produção → Baixar e associar à produção. A caixa não existe mais; não há download automático. O frontend não envia authorized:true e o backend não exige essa declaração. Novos registros guardam downloadRequestedAt, sem criar authorizedAt ou aprovar direitos. Metadados históricos permanecem intocados, inclusive no reaproveitamento de arquivo existente. Validações de URL, formato, tamanho, processos, autenticação, Host/Origin/CSRF, loopback e restrições da fonte permanecem.

Passaram 38 verificações pertinentes: 11 de lógica/backend da importação, 17 de interface da importação e 10 do rodapé/versionamento. Cobrem clique explícito sem caixa, ausência de concessão fictícia, histórico preservado, deduplicação, cancelamento, pacote e proteção das rotas. Mídia sintética e provedores simulados; nenhum download externo pelo agente.

Serviço reiniciado normalmente, sem jobs ativos, em 127.0.0.1:8877. Versão efetiva: 2.3.0, interface f454d5afe3dd, backend 9142589ea0e3. Saúde e bind confirmados; networkEnabled, publishingEnabled e workerEnabled continuam false. Máquina/sessão SQLite preservadas. Chrome habitual confirmou formulário sem caixa em nova aba; a aba de capa que estava em edição não foi recarregada.

Sem bloqueio restante para esta alteração. Teste real com fonte autorizada e compatibilidade no CapCut continuam pendentes; retirar a caixa não concede ao agente autorização geral para baixar mídias futuras. Sem publicação, push, deploy ou mudança de credenciais.
