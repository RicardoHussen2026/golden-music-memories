# Escopo autorizado — acervo pronto e programação (V2.3)

Base conferida em 24/10/2026: main e branch anterior em 772a2c918073dd163cd0e2108cb453d737c0c897, árvore limpa. Desenvolvimento isolado em desenvolvimento/acervo-programacao; a cópia do outro trabalho não é alterada.

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
