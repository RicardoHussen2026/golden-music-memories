# Montar vídeo local — V2.4

**Atualização incremental 25/10/2026 — 2.9.1 somente isolada:** Substituir clipe no Estúdio e Manter enquadramento original concluídos/testados, supersedendo as pendências anteriores abaixo. Troca conserva fonte/finais/histórico e campos, invalidando prévia exibida; conteúdo proporcional com margens simples sem crop/stretch/blur, resolução do preset e recodificação com overlays. Backend80/80, montagem28, histórico22 e versão10. Checkpoint2.9.0 preservado. Pacote acumulado em .cache/painel-next/workspace; relatório em docs/ENTREGA_MONTAGEM_HISTORICO.md. Não ativar/recarregar produção sem coordenação expressa. Raiz2.8 e operacional2.7.2 preservados.

## Pacote isolado 2.9.0 — preparado, ainda não operacional

As funções abaixo só estão em .cache/painel-next/workspace e dependem de aplicação/ativação segura após a produção atual. Não recarregar o painel habitual para tentar acessá-las. Evidências e limites: [ENTREGA_MONTAGEM_HISTORICO.md](ENTREGA_MONTAGEM_HISTORICO.md).

- Montar vídeo permite Criar / importar capa no próprio modal, com os templates existentes e sem perder clipe, destino, chamadas e tempos. Capa de proporção diferente avisa antes da montagem: criar/escolher outra ou aceitar explicitamente preservá-la inteira com faixas. Enquadramento do clipe não converte a capa.
- A última prévia concluída pode ser recuperada ao reabrir, e há escolha explícita em Reabrir prévia salva. Aprovar prévia e salvar no acervo promove o arquivo exato sem render novo. Baixar prévia e Baixar MP4 exportado usam nome musical. Prévia ainda não é publicação.
- Descartar prévia (recuperável) retira a prévia selecionada da lista normal e mantém os bytes/configurações/fontes. Prévias descartadas (recuperáveis) → Restaurar prévia reabre a mesma. Final já associado não usa Descartar prévia. Há ação separada Excluir vídeo gerado → conferir nome/ID, impacto nas publicações/vínculos compartilhados → Excluir para lixeira recuperável. Resultado publicado também pode ir para a lixeira; fonte, configurações, bytes, IDs, recibo e histórico permanecem. Tarefa ativa/reservada impede retirada até terminar; vínculos com outras produções exigem aceite explícito. Vídeos gerados na lixeira (recuperáveis) → Restaurar vídeo gerado devolve os mesmos IDs. Não libera espaço nem apaga postagem externa; não há purga permanente.
- TikTok/YouTube são botões consistentes, Outros destinos mantém os demais formatos. Isso prepara o formato/texto; não conecta contas ou envia vídeo.
- Para escolher outro clipe, o caminho existente é Montar vídeo → Clipe do acervo ou Ou importar clipe deste computador. A fonte anterior permanece. Alterar o formulário invalida a exibição da prévia anterior e os tempos são validados contra a nova duração ao montar; arquivos concluídos são preservados. Ação Substituir clipe diretamente no Estúdio, identificação clara de fontes do serviço e fluxo separado de desvincular/descartar ainda são complementos pendentes. Nenhuma troca/remoção real foi realizada. Complemento aprovado ainda pendente: Manter enquadramento original, preservando conteúdo sem corte, deformação ou desfoque; se o preset tiver outra proporção, margens simples informadas, sem prometer resolução nativa ou cópia de fluxo com overlays.

## Coletâneas locais - V2.7.0

Caminho: **Produções → Preparar coletânea** (também no topo de Acervo e programação). Usa o mesmo serviço local e FFmpeg da montagem individual. Não baixa músicas nem altera produções, fontes, configurações individuais ou vídeos publicados.

1. Abra Coletânea e confira o número de músicas com mídia local medida, separado dos metadados do catálogo. Nesta versão, a fonte precisa ser clipe de vídeo com áudio compatível com a montagem existente; áudio avulso sem clipe não entra. O serviço prioriza fontes locais; um final derivado só é alternativa da mesma música. Anexos de vídeo do navegador são recebidos uma vez quando usados. Dados de ano/gênero vêm do cadastro, podem estar desconhecidos e exigem conferência humana.
2. Escolha título, duração alvo em minutos, plataforma/formato e tema: ano informado, gênero informado ou variada sorteada. Clique **Preparar seleção**. A seleção não repete songId nem hash de arquivo. Limite local: 100 faixas e 12 horas; a meta não cria material ausente.
3. Confira as faixas, remova ou use Subir/Descer. Veja **Total previsto**, diferença para a meta e aviso de insuficiência. Por autorização provisória, conserva faixas inteiras, inclusive a última: pode exceder a meta; não corta nem estende. A decisão editorial definitiva sobre a última faixa continua pendente. É possível salvar uma seleção incompleta sem prometer atingir a meta.
4. Escolha a capa correspondente de cada produção. A abertura usa 3 s totais, com fade final de 0,35 s, e música desde o tempo zero de cada faixa. Fonte menor que 3 s, sem áudio ou sem capa pode permanecer no rascunho com aviso; bloqueia o render. Prepare/corrija o material na produção individual.
5. Em **Chamadas de cada faixa**, o padrão reaproveita a sequência/intervalos salvos na montagem individual (sem chamadas se não existir preset). Alternativas: nenhuma ou par Curtir + Seguir/Inscrever-se. Os tempos reiniciam em cada faixa; primeira chamada desde o início dela e próximas desde o início da anterior, sem deslocamento de capa. A validação existente recusa sobreposições e extrapolações. CTAs salvas e posições são preservadas. Não se introduz efeito sonoro.
6. Clique **Conferir e salvar seleção**. O backend mede as fontes e valida o total e o destino novamente. Shorts/Instagram acima de 180 s e TikTok acima do preset conservador de 3.600 s são recusados; escolha explicitamente outro destino ou seleção. Não há corte ou mudança silenciosa de proporção. Uma meta de 45 min não produz um Short de 45 min. Os demais presets seguem PUBLICACOES_PREPARACAO.md.
7. Só então **Montar único MP4**. O serviço normaliza cada faixa em sequência, mostra faixa/progresso e depois une o resultado. **Cancelar montagem** interrompe apenas esse trabalho e conserva a seleção. Fechar o diálogo não cancela o backend; reabra **Seleções e coletâneas salvas → Abrir seleção**. Em erro/cancelamento/interrupção, confira as fontes e use o mesmo botão novamente; uma seleção editada é um novo rascunho. Resultados concluídos são imutáveis.
8. Confira o player e use **Baixar único MP4**. Manifesto registra ordem, inícios, planos, hashes, total previsto e duração medida final. Resultado permanece como coletânea local, sem criar uma música fictícia, duplicar anexos no IndexedDB ou ingressar automaticamente na fila/publicação. Para postar, baixe e revise o arquivo no fluxo manual da plataforma.

Qualidade explícita: cada faixa é recodificada para H.264 CRF18, veryfast, 30 fps, yuv420p, 1920×1080 ou 1080×1920. Fonte inteira sobre fundo desfocado por padrão; recorte só quando previamente escolhido no preset individual. Áudio normalizado para AAC 256 kb/s, 48 kHz, estéreo e novamente codificado na união para evitar silêncio de priming AAC entre segmentos. Vídeo normalizado é copiado na união. Não há normalização de volume/loudness nem promessa de qualidade sem perda. Áudio é contínuo por concatenação, sem silêncio ou crossfade deliberadamente inserido; pausas da própria fonte permanecem. Não é validação de loudness das músicas reais.

Armazenamento: metadados/estados de coletânea usam objects do SQLite existente, sem migração de schema. MP4s em .cache/publishing-private/collections/UUID.mp4 (ou collections/ do GMM_DATA_DIR configurado); diretórios job-UUID temporários são removidos após terminar/cancelar/errar. Limite de arquivo e reserva de espaço configurados continuam aplicados. Rotas /api/collections exigem sessão, loopback, Host/Origin/CSRF e recusam proxy. Nenhuma API de postagem foi ativada.

Backup compatível: backup SQLite consistente inclui seleções/manifestos; para recuperar os vídeos/fontes também são necessários collections/, assembly/, sources/, media/, configuração/chave e backup separado do navegador. Um ZIP do navegador ou SQLite sozinho não contém esses MP4s. Teste de backup de metadados não homologa restauração integral operacional.

Verificação: npm.cmd run test:collections. Fixtures locais distintas por artista/faixa exercitam ordem, capas/CTAs reiniciadas, duração e áudio, originais intactos, falta de capa/acervo, duplicação/parâmetros/preset incompatível, cancelamento, erro seguro, persistência e backup de metadados. O teste longo usa a mesma função de concatenação com 32×18/1 fps: valida 45min20s, sem alegar render longo Full HD. Evidências finais e ativação estão na lista oficial; aprovação visual em coletânea real continua humana.


**Atualização V2.6.0:** o seletor Plataforma / preset de saída oferece destinos e formatos descritos em [PUBLICACOES_PREPARACAO.md](PUBLICACOES_PREPARACAO.md). Presets novos reutilizam os três formatos base existentes e a mesma pipeline; somente composições diferentes exigem render diferente. Não há corte automático para Shorts/Instagram. Um preset acima da duração permitida é recusado com instrução de escolha explícita. A preferência específica da plataforma é salva mesmo quando a exportação base é reaproveitada. Configurações e finais antigos permanecem preservados. A estrutura original e o histórico abaixo continuam como referência.

Módulo integrado à produção existente. Caminho: Produções → abrir produção → Materiais e arquivos → Montar vídeo. Mantém importador, acervo, IDs e dados anteriores. Publicação externa permanece desligada.

## Operação

1. Escolha clipe já associado no serviço (referência ao mesmo arquivo; sem novo upload), anexo do navegador ou arquivo local MP4/MKV/MOV/WebM. Anexo do navegador precisa ser recebido uma vez pelo serviço para o FFmpeg poder lê-lo. Uploads locais iguais reaproveitam o arquivo por hash.
2. Escolha TikTok ou YouTube Shorts (1080×1920), ou YouTube horizontal (1920×1080). O padrão mantém toda a imagem sobre fundo desfocado. Recorte é opcional, com ajuste horizontal/vertical e conferência no vídeo renderizado; não existe detecção automática de rosto.
3. Configurações explícitas já salvas são preservadas; não há regeneração de vídeos antigos. Se a abertura exceder um clipe curto, reduza o tempo ou escolha Sem capa. Escolha capa associada à produção ou Sem capa. A capa aparece na abertura pelo tempo escolhido (padrão 3 s totais) e some por fade nos últimos 0,35 s (2,65–3 s no padrão); o áudio não é atrasado nem interrompido. Baixar miniatura separada exporta a capa existente, sem confundir com o frame incorporado no MP4.
4. Adicione somente as chamadas desejadas, uma de cada vez. Ordem automática 1,2,3, com Subir/Descer/Remover. Primeiro início conta do começo do vídeo; os seguintes são intervalos desde o início da chamada anterior. Exemplo: 30, +10, +15 → 00:30, 00:40, 00:55. Duração visível é campo separado (padrão 3 s). O painel mostra o instante absoluto e recalcula ao remover/reordenar.
5. Distribuição automática é alternativa secundária. Validação recusa sobreposição, inversão de ordem e final além do clipe; não reduz tempos silenciosamente. Vídeos curtos podem exigir duração/início menores. Animação padrão combina fade e movimento suave de cerca de 0,35 s; modo direto é opcional. Tamanho/posição ficam recolhidos em cada chamada e a composição limita a arte às margens mantendo proporção. A escolha de posição para não cobrir rostos é manual, conferida na prévia.
6. Gerar prévia real renderiza o vídeo completo na resolução final com a mesma pipeline da exportação. Não é um simulador aproximado; leva o tempo do render. Confira o player. Exportar vídeo reaproveita essa prévia quando as configurações continuam iguais e salva/associa o MP4 ao acervo do serviço. Mudar opções produz outra montagem. Não há publicação automática.

## Qualidade, arquivos e segurança

FFmpeg existente; H.264 CRF18, veryfast, 30 fps, yuv420p, faststart. Vídeo recodificado em alta qualidade, sem promessa lossless. AAC é copiado quando compatível; outros codecs são convertidos para AAC 256 kb/s; fonte sem áudio gera vídeo silencioso identificado como tal. Não se acrescenta efeito sonoro.

Nome: Artista - Música - Destino - Vn.mp4. Mesmo fingerprint não cria outra versão por clique repetido. MP4 final fica em .cache/publishing-private/media, registrado no acervo e na produção via render_asset. Não é duplicado em IndexedDB. Pacote para edição inclui o final e manifesto por solicitação. Preview e arquivos recebidos ficam em assembly/; pastas job-UUID são temporárias e removidas ao concluir/errar/cancelar. Fechar formulário não cancela render já iniciado; reabra para acompanhar. Cancelar montagem encerra apenas seu processo. Recebimento cancelado remove apenas seu .part.

Configurações validadas são lembradas por produção no SQLite. Backup completo precisa de SQLite consistente, media/, sources/, assembly/, .env/chave e backup separado do navegador. Não copiar banco aberto diretamente. Restauração integral operacional com dados reais ainda não homologada.

Rotas autenticadas /api/assembly exigem loopback e mantêm Host, Origin/CSRF, sessão e bloqueio de proxy. Argumentos do FFmpeg são internos, sem shell, com validação de tipo, dimensões, duração, tamanho e espaço. Inputs são IDs de registros; não aceitam caminho arbitrário. Não houve download externo, configuração de conta ou ativação de rede/publicação.

## Artes finais — bloqueio delimitado

As oito opções estão disponíveis, mas os PNGs finais ainda não foram materializados no Windows. A Library localizou os arquivos; a tentativa com destino explicitamente local retornou apenas download_url, sem workspace_path. O único fluxo seguinte documentado exige helper/xattrs que já falhou neste PC com os.setxattr; ele não foi repetido nem contornado. Nenhuma arte final foi substituída por fixture. A UI indica a falta e permite selecionar o PNG local de cada chamada, ou trabalhar sem chamadas.

Próximo passo para integração das artes: salvar os oito PNGs em uma pasta local e informar o caminho, ou disponibilizar rota Library compatível com o executor Windows. Depois conferir pixels/transparência e copiar para app/video-art com os nomes do manifesto abaixo. Preserve proporção; SALVE O VÍDEO tem 1983×793, demais informadas 1986×792.

| Legenda | Nome local esperado | Library ID |
|---|---|---|
| DEIXE SEU LIKE | golden-deixe-seu-like.png | libfile_6ba2ae0c10708191bc8dafa4e0639d38 |
| SIGA O CANAL | golden-siga-o-canal.png | libfile_b041953b04b081918bc99177a4f52db8 |
| INSCREVA-SE | golden-inscreva-se.png | libfile_58706c7282908191a2647877d63f1ba9 |
| ATIVE O SININHO | golden-ative-o-sininho.png | libfile_bdf44fdb2890819181a2cbfee9f0ad6b |
| COMENTE | golden-comente.png | libfile_58cb1983905c819188381556f47da89a |
| COMPARTILHE | golden-compartilhe.png | libfile_1092acc5be548191890617f69ae6a7aa |
| SALVE O VÍDEO | golden-salve-o-video.png | libfile_e948310faca0819180ab39d2b372772b |
| ASSISTA ATÉ O FIM | golden-assista-ate-o-fim.png | libfile_768a3b8d7af08191aba1b60dfb3e3045 |

## Verificação

Comando npm.cmd run test:assembly. Renders reais sintéticos vertical/horizontal de 10 s, abertura e chamadas separadas, resolução/duração, hash do áudio AAC preservado, original intacto, preview promovida sem reencode, dedup por fingerprint, cancelamento/limpeza, erro/repetição, persistência e conversão Opus→AAC. Interface cobre seleção/ordem/tempos 30,+10,+15, remoção/reordenação, prévia, exportação, Range HTTP, sessão/Origin, nome, pacote sem IndexedDB duplicado e retomada. Frames de abertura, chamada 1, intervalo, chamada 2 e horizontal foram inspecionados; não representam aprovação estética das artes finais ausentes.

Amostras próprias em .cache/video-assembly-test/demonstracao-vertical.mp4 e demonstracao-horizontal.mp4. São barras/teste com tom sintético e textos DEMONSTRAÇÃO; não usam clipe privado nem música comercial. Interface em .cache/video-assembly-ui/{desktop,celular}.png e resultado.json. Não declarar entrega visual final com as oito artes antes da integração pendente.

## Ativação local e resultado — 24/10/2026

V2.4 ativa em http://127.0.0.1:8877/painel.html. Frontend efetivo 323247c0c636; backend e5a211950729. Serviço antigo encerrado normalmente por Ctrl+C; serviço novo iniciado por npm.cmd run service, mesma raiz/branch. Antes da parada, nenhum job de publicação, importação ou montagem estava ativo. Bind confirmado exclusivamente 127.0.0.1:8877. networkEnabled, publishingEnabled e workerEnabled continuam false. Credenciais/chave preservadas.

Passaram 93 verificações pertinentes: 4 testes de montagem/backend (com múltiplos renders reais e casos internos), 16 de montagem/UI, 11 de consulta/importação/backend, 17 de importação/UI, 35 de operações/acesso local/backend e 10 de versão/UI. Não são 93 renders nem prova de estética final. Cenários usam mídia sintética própria e bancos temporários. Regressões do catálogo não foram repetidas.

Inspeção visual: frames de abertura, Curtir, intervalo sem chamada, Seguir, horizontal e entrada suave. PNGs finais aprovados permanecem pendentes de materialização; o artefato de avaliação usa somente faixas DEMONSTRAÇÃO. Exemplo curto em .cache/video-assembly-test/preview.html, demonstracao-vertical.mp4 e demonstracao-horizontal.mp4. Evidências de interface em .cache/video-assembly-ui/.

Chrome habitual confirmou Montar vídeo na produção existente de Curtis Mayfield, com o clipe e a capa do navegador listados. Apenas abriu o formulário: não recebeu nem renderizou a mídia privada do proprietário. A abertura sincronizou os metadados da produção com o serviço, sem publicar ou alterar seus anexos. A aba de capa em edição foi preservada. A nova aba ficou disponível para avaliação.

Pendente: integrar os oito PNGs reais e avaliar sua estética/legibilidade em clipe escolhido pelo proprietário. A tentativa Library com destino Windows local retornou links, sem bytes locais; não foi repetido o helper de xattrs que já falhara com os.setxattr. Não houve negação nova de aprovação automática. A ação de materializar as artes permanece não concluída, aguardando arquivos locais ou rota Windows suportada. Nenhum registro/arquivo real foi removido, nenhum push/deploy feito.


## Entrega real concluída — artes finais e dois MP4s

ZIP original localizado em `C:\Users\RicardoPC\Downloads\Golden-Music-Memories-8-Botoes-CTA.zip`, preservado. CRC e inventário (oito PNGs e LEIA-ME) verificados; caminhos validados antes da extração. Artes finais integradas sem distorção em `app/video-art/`. Transparência real e pixels das oito artes conferidos. Inventário/hashes em `.cache/first-real-video/artes-finais-inventario.json`; a pendência anterior de transferência das artes está resolvida.

Fluxo real executado pelo painel na produção `6a190fbc-0418-4284-ae44-9f520c978e82`, sem render ad hoc dos finais. Fonte recebida uma vez; duas capas recebidas, sem reenvio do clipe ao trocar o destino. TikTok passou por Gerar prévia real e Exportar vídeo, reutilizando o render. YouTube horizontal gerado por Exportar vídeo. Ambas as versões V1 foram associadas ao acervo da produção. Nenhum render ativo ao concluir.

TikTok: job `162f9a82-a93c-45e0-922a-7a1c48faed2e`, mídia `aa555800-a546-450d-8351-cbbf140b10b8`, 1080×1920, 19.733.931 bytes. YouTube horizontal: job `61ac5e88-4c7f-4b25-9c7d-fd8bcb813f73`, mídia `b9caeda6-ecb0-4e2c-8ae6-4a9a3d56849d`, 1920×1080, 19.603.564 bytes. Os dois têm 220,300 s (fonte nominal 220,301 s), H264/AAC, áudio e vídeo iniciando em 0.000000. Imagem quadrada inteira sobre fundo desfocado. Abertura 1 s; Like30–33, Siga50–53, Comente70–73, fade/movimento suave 0,35 s. Siga também no YouTube, conforme pedido.

Validação: decodificação integral de ambos sem erros; fonte original preservada por SHA256; resolução/duração/codecs conferidos; áudio correlacionado com a fonte aos 5,35,75 s, melhor atraso 0 ms nos três trechos, correlação >0,9996. Opus convertido para AAC256kb/s, sem alegação lossless. Frames de abertura, dissolução, chamadas/entrada e intervalos sem chamadas inspecionados em ambas as versões: textos legíveis, sem recortar rostos. Evidências em `.cache/first-real-video/{tiktok,youtube}-validacao/resultado.json` e respectivos frames. Não substituir esses resultados por provas de elegibilidade comercial ou aprovação estética do proprietário.

Entrega única em `acervo/Entregas/The-Emotions-Cause-I-Love-You-1979/`, ignorada pelo Git:
- `The Emotions - Cause I Love You - TikTok - V1.mp4`
- `The Emotions - Cause I Love You - YouTube horizontal - V1.mp4`
- `POSTAGEM.txt`, `Capa-TikTok.png`, `Miniatura-YouTube.png`, `LEIA-ME.txt`, `VALIDACAO.json`
- `Golden-Music-Memories-Primeira-Publicacao.zip`

Rodapé: V2.4.0, interface `5561062f4f54`, backend `e5a211950729`. As artes mudaram o hash da interface, sem exigir interromper o serviço. Publicação/rede/worker continuam OFF; não houve postagem, push ou deploy. Original e rascunho de capa do proprietário preservados.

Bloqueio de entrega externa: a revisão automática negou a preparação do terceiro helper necessário ao fluxo de upload Library, com motivo “helper amplo para materializar downloads Library e ler credenciais ... escopo desnecessário”. O helper negado não foi criado/executado; os dois helpers auxiliares salvos parcialmente foram removidos sem execução. Não houve upload iniciado, credenciais lidas ou tentativa de contorno por outra rota. Library permanece não enviada, status negado na preparação; entrega local dos arquivos está concluída. Menor ação para o proprietário: abrir os MP4s na pasta acima para validar; se quiser tê-los no chat/Library, anexá-los manualmente. Não afirmar links Library criados.
