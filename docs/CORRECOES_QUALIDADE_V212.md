# Correções de qualidade e produtividade — 2.12.0

Entrega de 25/10/2026, autorizada pelo titular após a [auditoria 2.11.0](AUDITORIA_QUALIDADE_V211.md). Implementa os sete defeitos, as oito melhorias e os campos de acompanhamento do ponto comercial C01 no aplicativo existente.

**Estado:** concluído e ativado localmente em `http://127.0.0.1:8877/painel.html`. Interface e serviço conferidos após a atualização. Interface `41edf6226113`, backend `04af5835f763`. Aprovação editorial humana de vídeos reais permanece por produção. Nenhuma postagem externa, integração nova ou promessa de receita.

## O que mudou e como foi verificado

| Item | Entrega | Evidência / alcance |
|---|---|---|
| F01 | Preparação usa o destino escolhido agora, inclusive quando reutiliza o mesmo MP4 | Teste real e UI: gerar para YouTube, selecionar Facebook, reutilizar e abrir Facebook; ID do render preservado |
| F02 | Meu acervo reúne finais do navegador, serviço e coletâneas; indicadores e produções reconhecem final local | UI e API encontraram os dois finais sintéticos; sem copiar MP4 para IndexedDB. Finalizado e pronto para rotina continuam distintos |
| F03 | Ano ausente é omitido da capa | Quadro de capa extraído do MP4 Full HD e inspecionado, sem ANO; não se inventou ano no catálogo |
| F04 | Seleção, título, ordem e configuração têm rascunho persistente | Recarga e reabertura conservaram Alfa/Beta, ordem Beta/Alfa, título, capa/intro/chamada e corte 30–35 s |
| F05 | Modo longo limpa e recompõe controles próprios; campos ocultos respeitam hidden | UI: Sem intro coerente, chamadas disponíveis e campos de fonte individual efetivamente ocultos |
| F06 | Coletâneas entram em Publicações e no histórico das músicas participantes | Registro isolado de conta, URL, data, revisão e métricas; nova postagem por destino e histórico de alterações; teste de vínculo por faixa |
| F07 | Progresso e mensagem do formulário são independentes; limite de título visível | Erro de 128 caracteres no YouTube permaneceu nas atualizações periódicas; salvamento posterior válido |
| M01 | Rótulos de qualidade nativa, alerta de ampliação, filtro e comparação de dois clipes | Cálculos verificados; comparação mostra os originais proporcionais e resolução. Exportar Full HD não transforma fonte SD em detalhe nativo |
| M02 | Medição integral dos selecionados e ajuste opcional de áudio por fonte/trecho | Render sintético real com duas passagens, alvo −16 LUFS / −1,5 dBTP e limitador; saída medida dentro da tolerância do teste; original com hash preservado |
| M03 | Aviso de duração por preset e seleção explícita de entrada/saída | UI: 185 s avisa incompatibilidade com Instagram; trecho 30–35 s gera amostra real de 5 s. Fonte original preservada |
| M04 | Amostras de até 8 s, prévia aproximada do enquadramento/chamadas, galeria de capas, linha do tempo e padrões pessoais por destino | Amostras individual/longa renderizadas; amostra não pode ser aprovada como final; teste também após a primeira música com chamada personalizada |
| M05 | Versão, qualidade, duração e uso visíveis; edição de ano com evidência; miniatura em nova importação | Teste de miniatura real e preservação de variantes. Não é pesquisa nem revisão automática de todos os 165 metadados |
| M06 | Capítulos só são rotulados como válidos com 00:00, ao menos três marcas e intervalos mínimos de 10 s | Teste de capítulos válidos/inválidos. Caso contrário entrega lista de faixas; sem criar capítulos em conta externa |
| M07 | Métricas manuais ampliadas e comparação por destino, formato, período e moeda | Retenção, horas, CTR, seguidores, receita efetiva e esforço; validação de limites; vazio permanece desconhecido. Não houve importação de resultados reais |
| M08 | Catálogo é a entrada principal; fluxo anterior identificado, fila serial local, padrões pessoais, nomes legíveis e guia atualizado | Fila concluiu exportação real; reinício pausa e exige retomada; legado mantido; nenhum processamento infinito prometido |
| C01 | Objetivo comercial, formato, contribuição própria e resultado informado pela plataforma | Campos disponíveis em postagem individual/longa. Decisão editorial e elegibilidade continuam dependentes do titular e da plataforma |

## Uso recomendado

1. No **Catálogo**, filtre e escolha **Publicar** para um clipe, ou selecione músicas e **Montar sequência**. A seleção e a ordem são salvas neste navegador.
2. Escolha plataforma, enquadramento e os itens desejados. Capa, intro e cada chamada são opcionais. A sequência longa usa uma capa e uma intro somente no começo, mantendo os clipes completos e sem intervalos adicionados.
3. Em **Qualidade e edição**, confira resolução e duração. Para publicação curta, selecione entrada/saída no clipe individual. Se desejar, marque o ajuste de volume; o processamento mede a fonte antes de alterar o derivado.
4. Use a galeria de capas, a composição aproximada e a linha do tempo para preparar. Gere uma **amostra de até 8 s** no ponto que pretende conferir. A amostra não substitui a revisão do vídeo final completo.
5. Gere/revise o vídeo completo, ou envie para a **fila de montagens**. O PC precisa continuar ligado; a fila é local e processa uma montagem por vez. Após reiniciar o serviço, retome os itens pausados explicitamente.
6. Abra o final em **Meu acervo**, prepare textos e baixe o MP4. O atalho **Abrir envio** leva à plataforma; salvar no painel não faz upload.
7. Depois da postagem manual, registre conta, URL, data efetiva e revisão. Preencha métricas realmente informadas pela plataforma, período, moeda e esforço de produção. Compare formatos equivalentes em **Publicações**.

Os padrões pessoais guardam abertura, chamadas, enquadramento e áudio por destino. Capas específicas e pontos de corte permanecem no rascunho daquela produção, evitando aplicar um corte de outra música por engano.

## Verificações executadas

- Suítes de destinos, abertura/capa, montagem, coletâneas e enquadramento original: **14 testes Node aprovados**, incluindo FFmpeg real, cancelamento e concatenação representativa acima de 45 min.
- Suítes editoriais e de histórico/repostagem aprovadas, junto das novas verificações de qualidade. Execuções repetidas não são somadas como cobertura nova.
- Suítes de intros e biblioteca aprovadas: intros realizou 20 verificações internas; biblioteca inclui sequência de 20 fontes sintéticas, prefixo único, chamadas entre faixas e ausência de silêncio adicionado de 30 ms. Raster reduzido dessa fixture não representa 20 músicas reais Full HD exportadas.
- `tests/quality-workflow.test.mjs`: **5 testes Node aprovados** na revisão final; incluem medições reais, cortes, amostras, reaproveitamento de destino, miniatura, fila, retomada após reinício, registros e histórico por faixa.
- Percurso UI isolado em `127.0.0.1:55669`: rascunho retomado, sequência, amostra, publicação, métricas, acervo, troca de destino, corte curto e padrão pessoal. Viewport 390×844 sem transbordamento horizontal; não é aparelho físico.
- Render Full HD longo de duas fontes sintéticas de 8 s: **22,921354 s**, capa de 3 s + intro de 3,9 s no começo; H.264 1920×1080, AAC 48 kHz. Amostra longa 8,02 s e individual curta 5 s.
- API nova de inspeção da fonte retornou duração/resolução; reprodução parcial HTTP 206 com 256 bytes conferida. JavaScript e diff verificados.

Evidências privadas em `.cache/qualidade-2120/`: `api-final.json`, `acervo-integrado.png`, `montagem-mobile.png`, `capa-sem-ano.png`, fixture de serviço e checkpoint `STOP.md`. Fixtures são material sintético isolado; não pertencem ao acervo musical operacional.

## Conferência da ativação

Serviço reiniciado pelo launcher do próprio projeto somente depois de confirmar ausência de montagens/importações/envios ativos e formulário aberto. Origem, configuração e chave mantidas. Backend carregado `04af5835f763`; Chrome confirmou `v2.12.0 · Interface 41edf6226113`.

Inventário antes/depois por API: **165 IDs/hashes de clipes, 10 intros, 4 IDs de produção e 6 IDs/hashes de finais do serviço iguais**. A comparação usa metadados existentes; não foi uma nova leitura integral dos bytes de todo o acervo. Meu acervo mostrou **8 finais**, reunindo os 6 do serviço e 2 do navegador. Os dois rascunhos anteriores de publicação permaneceram na UI. As dez intros também responderam HTTP 206 para reprodução parcial de vídeo. Nenhuma fixture entrou no ambiente operacional. Não houve exceções de console no percurso operacional conferido. Evidências: `operational-before.json`, `operational-after.json`, `painel-operacional-2120.png`.

## Limites e continuidade

Os 165 clipes e as dez intros existentes são preservados. Esta etapa não aplica normalização em massa, não classifica anos/gêneros automaticamente e não revisa a identidade musical de cada arquivo. A pesquisa de metadados conduzida em outro chat foi explicitamente solicitada sem alterar o projeto; sua entrega terá conciliação própria.

A medição técnica de áudio não substitui a audição editorial. A composição no navegador é aproximada; a amostra e o final renderizados são a referência para animações, cortes e transições. Nenhuma conta teve receita ou elegibilidade presumida. O painel oferece acompanhamento manual; roteiro/narração automática, Drive e postagem programada externa continuam fora desta entrega.

Segurança e backup não fizeram parte desta implementação. Nenhuma operação dessas áreas foi executada. Configuração/origem operacional permanecem em `127.0.0.1:8877`. Não houve commit, push, deploy público ou postagem de vídeo nesta rodada.

Checkout: `C:\Users\RicardoPC\Documents\Codex\Golden Music Memories\golden-music-memories`, branch `desenvolvimento/validacao-local-p6`, HEAD inicial `c774d015fd6bbb501778c2c582f7f16b8059755a`. Alterações preexistentes preservadas. Associação oficial do chat retornou o projeto correto; a listagem ainda reportava projeto nulo, divergência registrada sem editar metadados internos.
