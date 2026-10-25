# Especificação funcional — estado local e decisões atuais

**Organização por canção — 25/10/2026:** apresentação local 2.9.9 mantém gravações/edições por ID, com uma entrada principal e versões subordinadas somente para relação revisada. Caso Take On Me confirmado para apresentação; diferença 1984/1985 e incertezas de edição preservadas. Agrupar não significa fundir identidades nem alterar ano original, obra, direitos ou mídia. Modo separado/restaurado é auditável e reversível. Outros 40 grupos suspeitos continuam separados/revisáveis; novas importações não herdam confirmação por título semelhante. Contadores distinguem resultados/grupos e gravações. Seleção, histórico e avisos de repostagem consideram a relação conhecida sem apagar registros. Detalhe de uso, provas e limitações em RANKINGS_CATALOGO.md.

**Atualização incremental 25/10/2026 — 2.9.1 somente isolada:** Substituir clipe no Estúdio e Manter enquadramento original concluídos/testados, supersedendo as pendências anteriores abaixo. Troca conserva fonte/finais/histórico e campos, invalidando prévia exibida; conteúdo proporcional com margens simples sem crop/stretch/blur, resolução do preset e recodificação com overlays. Backend80/80, montagem28, histórico22 e versão10. Checkpoint2.9.0 preservado. Pacote acumulado em .cache/painel-next/workspace; relatório em docs/ENTREGA_MONTAGEM_HISTORICO.md. Não ativar/recarregar produção sem coordenação expressa. Raiz2.8 e operacional2.7.2 preservados.

Adendo de 24/10/2026. Reutiliza o escopo existente; a especificação V2.3 abaixo fica preservada como histórico. A sequência de execução e os estados de entrega pertencem somente a [ORGANIZACAO_PROJETO.md](ORGANIZACAO_PROJETO.md). Requisito aprovado não significa função implementada ou validada.

## Adendo 25/10/2026 — montagem, histórico e catálogo

Pacote 2.9.0 somente isolado, sem ativação operacional: capa compatível com destino ou aceitação explícita de faixas, criação no modal, recuperação/salvar de prévia, descarte recuperável da tentativa, exclusão separada de vídeo gerado para lixeira recuperável (inclusive publicado, mantendo arquivo/IDs/histórico/referências) e nome musical. Montagem e preparação de postagem compartilham TikTok/YouTube e lista de outros destinos. Complemento Substituir clipe no Estúdio e Manter enquadramento original permanecem pendentes; escolher nova fonte não autoriza excluir a antiga. Manter enquadramento original deve preservar conteúdo proporcional sem crop/stretch/blur, usando margens simples se o preset tiver outra proporção; não promete resolução nativa ou streamcopy com overlays.

Histórico por música/plataforma/conta reutiliza estruturas existentes, MP4 e hashes quando conhecidos, sem reconhecimento de áudio ou banco paralelo. Conta/canal explicitamente escolhido nos novos registros manuais; legado sem conta permanece identificado. Aviso inicial editável de 7 dias (não uma regra ideal universal), por plataforma/conta, última data/link e decisão explícita de repostagem recente. Correções preservam antes/depois/motivo. Não bloquear arbitrariamente a publicação externa; abrir upload/baixar/exportar não registra fato publicado, nem resultado incerto de API. Cooldown/pausa da rotina permanecem anteriores. Detalhes/testes em ENTREGA_MONTAGEM_HISTORICO.md.

Catálogo deve distinguir metadados de mídia real, produção iniciada de render em andamento e Filtrar por década de Ordenar por. Top 10/30 só filtra vínculos documentados com fonte/mercado/ano, mostrando cobertura parcial; Top 50 depende de expansão além do levantamento Top 30 e permanece indisponível. Pesquisa/ampliação do acervo continua PARCIAL e visível: 850 posições em staging, 2.009 registros e zero músicas novas aplicadas. Não promover relevância da busca a ranking, nem GB a mundial. Esta rodada não pesquisa/insere metadados operacionais.

## Finalidade e arquitetura atuais

Painel de Produção Golden Music Memories: selecionar músicas nostálgicas, preparar capas e materiais, montar/editar vídeos, guardar finais e preparar/registrar postagens por destino. Monetização é objetivo do proprietário, sem garantia de elegibilidade. Site para acesso de outras pessoas é fase posterior. Catálogo contém metadados, não áudios/clipes; a contagem de mídia real é separada.

Frontend estático com IndexedDB por origem/perfil, serviço Node 24 com SQLite e arquivos privados persistentes. Operação atual em loopback 127.0.0.1:8877, sem formulário de senha manual, mantendo proteções técnicas. Acesso privado em outros aparelhos é futuro e não autoriza abrir rede. Drive e plataformas exigem configuração/validação específicas; calendário local não prova publicação por API.

## Fluxo individual implementado e limites

- Catálogo → produção → template/capa → materiais existentes ou importação local → montagem no painel ou edição externa no CapCut → MP4 associado → preparação/registro por plataforma. ZIP de edição inclui materiais/manifesto/orientações; não é projeto nativo CapCut.
- Importador local para link individual YouTube/YouTube Music: inspeção automática ao colar, escolha do formato e ação explícita de baixar, validação técnica e deduplicação. Sem contornar DRM/acesso ou extrair cookies. Remux preserva fluxos quando possível; não recupera qualidade original. Homologação externa real continua separada dos testes simulados.
- Montagem local V2.4: fonte existente reaproveitada, TikTok/Shorts 1080×1920 e YouTube horizontal 1920×1080, imagem inteira em fundo desfocado por padrão, recorte manual opcional. Capa associada na abertura com duração ajustável, áudio imediato e thumbnail separada. Exportação MP4 preserva o original, mantém associação e versão legível. H.264 exige recodificação; áudio é copiado quando compatível ou convertido para AAC de forma informada.
- Oito artes finais disponíveis: DEIXE SEU LIKE, SIGA O CANAL, INSCREVA-SE, ATIVE O SININHO, COMENTE, COMPARTILHE, SALVE O VÍDEO, ASSISTA ATÉ O FIM. Nenhuma obrigação de usar todas. Seleção recebe automaticamente ordem 1,2,3; remover/reordenar recalcula a sequência.
- Primeira chamada: tempo absoluto desde o início do vídeo. Próximas: intervalo desde o início da chamada anterior, com campo “Após a anterior (s)” e instante absoluto calculado. Exemplo 30,+20,+20 resulta em 00:30,00:50,01:10. Duração visível é separada. Recusar sobreposição, inversão ou extrapolação; não ajustar a intenção silenciosamente. Transição suave ou modo direto opcional, sem som extra. Posição/tamanho proporcionais e conferência visual manual, sem prometer detecção automática de rostos.
- Prévia renderizada pela mesma pipeline; MP4 final salvo/associado, sem publicação. Piloto The Emotions — Cause I Love You: dois formatos validados pelo proprietário e publicados por ele. Isso não homologa rotina de publicação por APIs.

## Preparação editorial — implementada e testada localmente

Melhorar os formulários existentes Preparar TikTok/Preparar YouTube: título, descrição, ícones discretos, hashtags relevantes, edição/cópia e persistência vinculada à produção. Reutilizar POSTAGEM.txt e fatos confirmados; não inventar ano, álbum, gênero, ranking, licença, versão oficial/remasterizada. Para Cause I Love You/The Emotions, 1979 é ano confirmado do álbum Come Into Our World, sem confirmação auditiva da gravação específica. Não propagar 1996 em revisão do catálogo.

Modelos locais sem API paga; regenerar não deve substituir edição manual inesperadamente. Padrão editorial: 3–5 hashtags relevantes TikTok e 3 YouTube, sem promessa de alcance ou limite técnico universal. Respeitar título YouTube até 100 caracteres e descrição até 5.000; sem #FYP genérico ou #Shorts para vídeo horizontal/longo. Estado preciso, arquivos e testes restantes ficam na lista oficial/checkpoint.

Entrega técnica concluída na retomada: edição/cópia/persistência, confirmação explícita de campos ao regenerar, proteção entre abas e preservação de referências de MP4 e recibos. Foram aprovados 6 testes de lógica, 32 verificações de UI e regressões pertinentes, registrados na lista oficial. Avaliação editorial pelo proprietário permanece pendente; não bloqueia melhorias independentes. Build 2.5.0 gerada e testada isoladamente; sem reinício do serviço operacional, publicação ou integração nova.

## Capa de abertura — implementada para novas montagens

O proprietário confirmou **3 segundos com transição suave**, mantendo a música desde o início. A decisão substitui a proposta de 2,5 segundos e vale por música nas futuras coletâneas. Implementação concluída no item 2: padrão de 3 s totais incluindo fade final de 0,35 s, sem atraso de áudio ou deslocamento das CTAs. Presets explícitos são preservados; não foram alterados materiais publicados nem regeneradas entregas. Capa maior que o clipe exige ajuste explícito ou Sem capa. Testes reais e limites constam na lista oficial. Coletâneas V2.7 aplicam a mesma regra no início de cada música. O padrão de 1 s em registros antigos descreve a entrega anterior.

## Destinos de postagem — entrega V2.6.0

YouTube comum/TikTok preservados; acrescentados Shorts, Facebook horizontal/vertical, Instagram Reels, Rumble e Odysee como presets e preparação/registro manual. Plataforma e formato ficam separados no registro; inferência de legados sem reescrita ou alteração de versão do IndexedDB. Referências ao mesmo MP4 podem atender postagens distintas; composições iguais reutilizam a exportação base. Limites de presets e avisos não concedem elegibilidade, licença ou aprovação de conta. Shorts até 180 s, sem cortes ou recorte automático. Instagram usa preset conservador até 180 s; não é limite universal. Tabelas e fontes oficiais em PUBLICACOES_PREPARACAO.md. Novos destinos não ativam APIs ou rotina do serviço. YouTube Music exige decisão de distribuição própria, sem upload genérico fictício.

## Coletâneas - implementação local V2.7.0

O proprietário escolhe duração alvo e seleção por gênero/ano informado ou variada sorteada. Usa somente fontes locais realmente medidas, uma música por songId/hash, com revisão e ordenação e total efetivo antes do render. Metadados sem mídia não entram; dados desconhecidos não são inventados. Acervo insuficiente é informado e pode gerar rascunho menor, sem prometer completar a meta ou baixar arquivos.

Cada música usa sua capa por 3 s totais com fade final de 0,35 s, áudio desde o início e chamadas reiniciando no início da faixa segundo a sequência/intervalos salvos. Resultado é único MP4, fontes/individuais/publicados preservados. Render sequencial com progresso/cancelamento/retomada da seleção; normalização H.264/AAC explícita, com perda de geração e sem ajuste de volume prometido. Presets recusam total incompatível, sem corte ou recorte automático. Limites locais de 100 faixas/12 h e arquivo/espaço configurados são técnicos, não garantias de plataforma.

**Decisão ainda pendente:** regra editorial definitiva para a última música. A orientação da coordenação nesta etapa autorizou provisoriamente conservar todas as faixas inteiras, mostrar excesso/falta e continuar as partes independentes. Não implementar corte automático enquanto não houver decisão. Isso atualiza o estado anterior de recurso não implementado, sem transformar a sugestão histórica em decisão definitiva. Uso, armazenamento e backup em MONTAR_VIDEO_LOCAL.md; resultados finais e pendências na lista oficial.

## Preservação e integrações futuras

Item 6 parcial:750 posições anuais britânicas e 100 de referência histórica documentadas; estas últimas não substituem escolha editorial do Top 100 geral. Dois vínculos existentes confirmados por Recording ID e edição single aplicados ao catálogo distribuído, com backup e idempotência; zero músicas novas. Compatibilidade 1960–2009 implementada sem mudar anos/IDs anteriores. Mesclagem no navegador é explícita, com backup, preservando o perfil habitual. Quarentena 2004 e 25 anos anuais pendentes preservados. Fontes/evidências/processo em RANKINGS_CATALOGO.md; estado único na lista oficial.

Preservar histórico, favoritos, IDs e produções na expansão de rankings: conciliar título/artista/aliases/versões e IDs verificados, inserir apenas ausentes, usar associações para várias listas. Não fundir covers, regravações ou registros distintos por semelhança textual. Anos 1960–1969 e rankings 1960–2009 são expansão pendente; Top 100 geral é lista separada.

Atalhos TikTok/YouTube implementados no item 3 junto da preparação e download do MP4; abrem páginas oficiais em nova aba por gesto explícito, sem enviá-lo/preencher/publicar por si. Conferir a conta/canal continua responsabilidade do operador. Outros destinos permanecem no item 4. Armazenamento/backup, Drive e integrações reais têm validação e autorização próprias. Rotina externa não está autorizada a publicar nesta etapa. Nenhuma autorização histórica de deploy abaixo vale como instrução atual de commit/push/publicação.

---

## Histórico preservado: escopo V2.3

# Escopo autorizado — acervo pronto e programação (V2.3)

Base conferida em 24/10/2026: main e branch anterior em 772a2c918073dd163cd0e2108cb453d737c0c 897, árvore limpa. Desenvolvimento isolado em desenvolvimento/acervo-programacao; a cópia do outro trabalho não é alterada.

Fluxo: cinco capas no painel → edição, tradução e finalização manual no CapCut → MP4 prontos no Drive → registro de postagens manuais → programação do acervo elegível. Sem montagem, transcrição ou tradução automática, Oracle, Colab ou contratação.

## Ordem e critérios de aceitação

1. Conferir base, preservar dados e registrar este escopo.
2. Implementar e testar por dependências; distinguir simulação de resultado externo.
3. Preservar IDs e IndexedDB; serviço é autoridade da fila, acervo remoto e programação.
4. Serviço local independente da aba, credenciais privadas, execução externa desligada por padrão.
5. Gerar lote de cinco capas nos dois formatos, preservando templates.
6. Exportar pacote CapCut com identificação, textos e orientações por plataforma.
7. Diferenciar capa/quadro, miniatura e chamadas por plataforma.
8. Receber MP4 final sem alterar sua duração ou conteúdo.
9. OAuth próprio do Drive, conta ric.hussen@gmail.com configurável.
10. Criar/reutilizar pasta e subpastas do projeto, sem tornar arquivos públicos.
11. Transferências retomáveis, integridade e deduplicação.
12. Importação em lote e associação explícita a produções/versões.
13. Separar material em edição, pronto e histórico por destino.
14. Registro manual com link/data/plataforma e importação dos registros existentes.
15. Inéditos por destino por padrão; reutilização somente por política explícita.
16. Seleção com intervalo por artista, décadas e preferências.
17. Medir o MP4 real, limite configurável acima de 500 MiB, sem cortes.
18. YouTube: upload retomável, processamento e agendamento nativo confirmado.
19. TikTok assistido; Direct Post pessoal indisponível, não presumir aprovação futura.
20. Fila persistente, idempotência, recuperação e conciliação de resposta ambígua.
21. Agenda recorrente, cinco horários por plataforma por padrão; dias/fuso/período/pausa.
22. Política de horários perdidos e ausência/falha de conteúdo.
23. Previsão de estoque e preparação antecipada dos envios.
24. Modos manual/automático: consentimento da rotina, sem revisão humana por vídeo no automático; verificações técnicas permanecem.
25. Cache, retenção, diagnósticos de espaço e backups consistentes; preservar a última cópia.
26. Principal/reserva com transferência manual, origem pausada e reconciliação antes da retomada; sem promessa de failover automático.
27. Diagnóstico de configuração, contas, arquivos, agenda, máquina, erros e alertas.
28. Navegação e painel operacional, acessibilidade, celular e estados honestos.
29. Inicialização/instalação/atualização e recuperação documentadas para os dois PCs.
30. Testar lote, durações, transferências, interrupções, duplicação, agenda e recuperação, além das regressões.
31. Homologar somente integrações configuradas e autorizadas; registrar credenciais/mídia/segundo PC pendentes.
32. Auditar a entrega e corrigir os achados.
33. Commit, push e deploy; confirmar o SHA publicado. GitHub Pages entrega o painel; o serviço roda no computador.
34. Entregar matriz de código, testes simulados, validação real e pendências externas.
35. Sem custos ou postagem pública de teste; funcionalidades extras ficam fora desta entrega.

## Autoridade e preservação

O IndexedDB mantém catálogo, capas e produções existentes. A exportação explícita de metadados associa esses IDs ao acervo do serviço. SQLite guarda biblioteca, políticas, registros por destino, tarefas e eventos. MP4 grandes usam cache privado em disco; Drive é a cópia externa. Cada instalação mantém seu banco local, nunca um SQLite aberto simultaneamente em uma pasta sincronizada. Backups e credenciais não entram no Git.

## Pendências conhecidas no início

Não foram fornecidos OAuth próprio Google/TikTok, MP4 real para homologação nem acesso ao segundo PC. Autorização do conector Drive desta conversa não configura OAuth do aplicativo. TikTok Direct Post não é elegível apenas por ser solicitado para uma ferramenta pessoal. O espaço local será medido novamente; a intenção de liberá-lo não comprova disponibilidade.
