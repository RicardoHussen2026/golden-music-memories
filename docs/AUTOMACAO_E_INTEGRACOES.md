> Registro das etapas anteriores. A implementação atual de publicação com serviço está em [PUBLICACAO_SERVIDOR.md](PUBLICACAO_SERVIDOR.md); conexões e execução externa continuam desativadas.

# Evolução audiovisual e integrações — 23/10/2026

## O que funciona sem API

Catálogo, normalização, reservas, prevenção de duplicidade, metas, capas Canvas, upload local, organização, pacotes CapCut, direitos, revisão, calendário manual, métricas manuais, acervo, versionamento e backup/restauração. Custos incrementais de API: zero. O armazenamento usa a cota do navegador. Não há contratação, alteração de hospedagem ou envio automático.

## Canva Pro

No catálogo, selecione o lote e clique “CSV para Canva Pro”. O CSV usa UTF-8 e colunas ID, MUSICA, ARTISTA, ANO, DECADA e MARCA. No Canva, escolha um template editável da marca, conecte as colunas na função Criação em lote e exporte as artes. No painel, abra a produção e anexe o PNG com o tipo Capa. O ID ajuda a conciliar os arquivos. A associação automática de ZIPs de centenas de artes a partir de nomes ainda é futura; hoje a importação ocorre na produção escolhida.

A assinatura Pro existente pode ser aproveitada. Ela não garante que toda API de automação da Canva esteja habilitada à conta. Uma integração direta exigirá OAuth, permissões, verificação dos endpoints e teste de acesso, antes de ser apresentada como conectada.

## Google Drive como biblioteca principal planejada

No módulo Backup, baixe a estrutura GOLDEN_MUSIC_MEMORIES com catálogo/controle, quatro décadas, templates e backups. Os pacotes de produção incluem as subpastas 01_CAPAS a 08_LICENCAS_E_COMPROVANTES. A pasta de cada produção inclui identificador, artista, música, ano e versão. IDs, hashes e versão ficam no manifesto para a futura conciliação Drive↔banco.

Enquanto não houver autenticação configurada, faça upload dos ZIPs ou pastas extraídas no Drive. Isso mantém uma cópia externa organizada, mas não é sincronização. Para continuidade entre computadores, restaure o backup no navegador de destino. Evite editar a mesma base em dois computadores desconectados e depois sobrescrever uma cópia sem conciliação.

A integração futura deve usar OAuth com escopo mínimo de acesso aos arquivos criados pelo aplicativo, refresh tokens protegidos em backend e tabela de referências de pasta/arquivo/revisão. Credenciais de serviço administrativas não podem ir no GitHub público ou JavaScript do navegador. É preciso definir conta/pasta dedicada e ambiente de homologação; nenhuma pasta remota foi criada nesta etapa. O espaço contratado no Drive precisa ser conferido pelo proprietário.

## FFmpeg / montagem MP4

Recomendação para a próxima etapa: worker local, aproveitando o renderizador Remotion existente quando houver animação específica, e FFmpeg para cenas, escala/corte, sobreposição, transições, narração e legendas de autoria ou uso autorizado. A documentação oficial descreve filtros e seleção de áudio/legendas: https://ffmpeg.org/ffmpeg-filters.html e https://www.ffmpeg.org/ffmpeg.html.

Contrato planejado do job: production_id, versões dos ativos com hashes, duração, formato, roteiro, legenda autorizada, trilha autorizada opcional e destino. Fluxo: rascunho → validação dos arquivos/licenças → prévia → revisão explícita → render → validação do MP4 → importação no acervo. O worker deve recusar ativos não aprovados, manter logs e permitir retomada por item. Quantidade e concorrência configuráveis, sem obrigar lote de cinco. Renderizar primeiro um item e depois medir CPU, memória, tempo e tamanho antes de aumentar a fila.

FFmpeg local não exige tarifa por chamada; usa o computador, energia e disco existentes. Hospedar renderização adiciona custos variáveis de CPU, armazenamento e tráfego, ainda não orçados nem autorizados. FFmpeg no navegador pode consumir muita memória e exigir cabeçalhos de isolamento que não são configuráveis livremente no GitHub Pages; por isso não deve ser a primeira opção para lote grande. O site atual não foi migrado e o render automático da V2 não está implementado.

## IA / OpenAI

Usos de maior retorno: rascunho editorial por lote e transformação de fatos fornecidos em roteiro. Preenchimentos simples de título/hashtag e normalização básica já funcionam localmente. Curiosidades devem manter fontes verificáveis e revisão humana; IA não certifica ano, licença, popularidade ou monetização.

Arquitetura proposta: endpoint autenticado no backend, chave em variável de ambiente/gestor de segredos, limite de custo por execução e por mês, deduplicação/cache por música+versão+instrução, limite de tokens e revisão antes de aprovar. Sem chave no frontend ou repositório. Orientação oficial: https://developers.openai.com/api/reference/overview e https://developers.openai.com/api/docs/guides/production-best-practices.

Não foi selecionado um plano pago nem feita chamada. Antes da ativação, definir credencial do projeto, modelo e preço vigente, teto mensal em reais/dólares e orçamento por lote. Texto, geração de imagens e transcrição têm cobrança e requisitos diferentes. A aprovação para avaliar a API não foi tratada como autorização para gastar.

## Bancos de vídeo licenciados

Pexels é uma candidata de API; requer chave e cumprimento das condições de atribuição e uso. A documentação consultada informa limites padrão de 200 requisições/hora e 20 mil/mês, com condições de aprovação para ampliações: https://help.pexels.com/hc/en-us/articles/900005852323-How-do-I-get-unlimited-requests. Conferir novamente no momento da implementação. Nenhuma chave foi solicitada ou chamada autenticada realizada.

O painel deve armazenar autor, URL da página, licença, data e comprovante com cada ativo. Licença de paisagem/objeto não autoriza música, retrato de artista ou videoclipe comercial. API de banco não deve ser usada como extrator de clipes musicais alheios.

## YouTube Data API

Tecnicamente viável para upload com OAuth 2.0 e escopo youtube.upload. Agendamento usa status.publishAt e exige vídeo privado ainda não publicado. Definir explicitamente privacyStatus=private, sem depender do padrão. Fontes: https://developers.google.com/youtube/data/reference/rest/v3/videos/insert e https://developers.google.com/youtube/data/reference/rest/v3/videos.

Na documentação consultada, a cota específica de uploads é de 100 chamadas/dia, com uma unidade no bucket de uploads por videos.insert. Revalidar no projeto Google Cloud; não usar números antigos de cota como orçamento. Auditoria, consentimento OAuth e políticas do cliente continuam relevantes: https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits.

Requisitos antes de desenvolver envio real: projeto Cloud dedicado, tela de consentimento, credencial OAuth, canal autorizado e armazenamento seguro dos tokens. Um teste deve começar privado, somente após autorização, e verificar processamento e status. Nenhum upload foi executado; não há conexão automática ativa.

## TikTok Content Posting API — restrição relevante

A diretriz oficial de Direct Post exige aplicação destinada a um público amplo e classifica como uso não aceitável uma ferramenta limitada ao envio para contas administradas pelo próprio desenvolvedor/equipe. Para este painel pessoal, não se deve prometer aprovação de um publicador Direct Post. Clientes sem auditoria têm restrições de usuários e visualização privada. Fonte oficial: https://developers.tiktok.com/docs/en/content-sharing-guidelines.

Mesmo para aplicações elegíveis, são necessários consentimento explícito antes do envio, informação atual da conta, campos editáveis, opções de privacidade permitidas, limites por criador e acompanhamento do processamento. Credenciais precisam permanecer protegidas. A avaliação de Upload API/rótulos disponíveis e de eventual fornecedor aprovado deve ser feita separadamente; não há garantia de auditoria ou de postagem pública.

Recomendação atual: pacote de vídeo e metadados + revisão + envio manual pelo TikTok. Nenhum contorno de auditoria, login ou consentimento será implementado. O painel já registra revisão editorial e invalida aprovação ao receber novos arquivos.

## Ordem de evolução e decisões pendentes

1. Usar e validar a V2 local com backups; aprovar a atualização do site quando desejado.
2. Definir pasta/conta Drive e ambiente dedicado de dados para sincronização entre computadores.
3. Implementar e testar Drive com conciliação idempotente por ID/hash e backup externo.
4. Adicionar worker FFmpeg local e medir o primeiro MP4 antes de ativar lotes.
5. Avaliar OpenAI com chave de backend e teto de gasto aprovado; manter fallback manual/local.
6. Implementar YouTube somente após OAuth e teste privado autorizado. Manter TikTok manual enquanto o uso não atender às políticas de integração.

Não é necessário contratar serviço, trocar hospedagem ou comprar domínio para usar o núcleo atual. Novos custos só poderão ser apresentados com volume, preços vigentes e limite aprovado; nenhuma estimativa genérica foi apresentada como orçamento fechado.
