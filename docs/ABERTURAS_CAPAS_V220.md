# Capas, aberturas e motor de download — 2.20.0

Entrega acumulada de 26/10/2026. O fluxo aprovado de montagem foi preservado. A 2.20 reúne o motor Python documentado em [BAIXADOR_PYTHON_V219.md](BAIXADOR_PYTHON_V219.md) e as ferramentas abaixo. Código reversível pelo Git; arquivos de teste e mídia privada permanecem fora do repositório.

## Como usar

1. Na produção, use **Criar capa** ou **Criar abertura**. No menu Ferramentas também estão **Estúdio de capas** e **Aberturas**.
2. No Estúdio de capas, mantenha o editor atual ou desça a **Minhas capas**: nomeie e carregue PNG/JPG/WebP, clique **Guardar capa pronta**. Para reutilizar uma arte criada no editor, use **Guardar arte do editor na biblioteca**. Escolha a produção e **Usar na produção**. Cada capa tem download separado.
3. Em Aberturas, escolha a produção e o modo: criar com os templates existentes, carregar imagem/vídeo próprio ou editar uma abertura da biblioteca. Ajuste texto, estilo, cores e posição para templates; formato, duração, trecho, enquadramento e fades para a saída. O zoom suave aplica-se a imagens. Clique **Gerar e guardar abertura**, confira o MP4 e **Usar esta abertura na produção**.
4. Abra **Montar vídeo** na produção. Capa e abertura ficam disponíveis nos seletores existentes. Escolha o destino compatível, clipe, duração e chamadas. As opções **Sem capa** e **Sem intro** continuam disponíveis.
5. Dentro da montagem, **Criar / importar capa** oferece também capas da biblioteca. **Criar / carregar / editar abertura** recebe arquivo próprio, cria abertura da capa escolhida ou salva uma variante da abertura selecionada sem trocar clipe, capa, destino ou chamadas.
6. Gere a prévia, confira e exporte como antes. Downloads de vídeo e miniatura das postagens continuam separados. As dez aberturas originais permanecem disponíveis.

## Limites e armazenamento

- Geração local com o FFmpeg já instalado, sem API paga nem novas dependências de produção. Saída de abertura H.264/yuv420p, 30 fps, 1920×1080 ou 1080×1920, silenciosa, 1–30 segundos. A política de áudio da montagem individual/longa permanece a anterior.
- Imagem até 20 MB; vídeo até 500 MB. Vídeos aceitos: MP4/MKV/MOV/WebM, sujeitos à sondagem real. O trecho precisa caber na fonte. A imagem inteira é preservada por padrão; recorte central é explícito.
- Um vídeo/imagem pronto não possui camadas de texto recuperáveis. Templates criados no painel guardam sua configuração para novas versões; arquivos prontos podem ser reutilizados ou transformados em variantes por trecho/formato/fades.
- Originais e variantes anteriores são mantidos. Cancelamento não apaga fontes. Geração interrompida pelo serviço fica identificada, sem entrar na seleção de aberturas prontas.
- Biblioteca geral no serviço local, registros `artwork` e diretório `artworks`. Capas usadas na produção também são copiadas para o IndexedDB do navegador, seguindo o modelo existente. Git não transfere essa biblioteca nem os dados privados. O mecanismo existente de recuperação integral inclui as novas referências; não foi executado backup operacional nesta entrega.
- A biblioteca exige o serviço local. Publicar os arquivos do site no Pages não instala Python/FFmpeg no servidor público nem expõe o acervo.

## Evidências executadas

- 19 testes específicos do baixador (15 Node + 4 Python), documentados no relatório próprio, sem baixar conteúdo externo.
- 45 testes Node finais: nova biblioteca, serviço, armazenamento, capas, montagem, intros e coletâneas. Incluem geração real horizontal/vertical, sondagem, hash do original, download por bytes e HTTP Range, cortes inválidos, cancelamento, referências e recuperação em diretório isolado. O teste de intros também executa 20 verificações internas de áudio/imagem/tempo, sem contar essas verificações como testes Node adicionais.
- UI isolada: capa do editor salva e aplicada; capa pronta de 640×360 carregada; abertura de template gerada em 1920×1080/3 s e reproduzida até o fim; abertura própria de vídeo gerada em 1080×1920/1 s; biblioteca com busca/paginação e seleção na produção.
- Variante criada dentro de Montar vídeo conservou capa, clipe local, YouTube horizontal, capa de 1 s e like aos 3–4 s. Prévia de 5 s concluída, reproduzida até o fim sem erro e salva no acervo de teste. FFprobe: H.264 1920×1080, AAC 48 kHz, ambos 5 s. Decodificação integral aprovada; tira de quadros conferiu capa, abertura, clipe e chamada. A fonte sintética de 640×360 foi ampliada pelo preset, sem alegação de detalhe Full HD nativo.
- Layout conferido em desktop e viewport real de 390 px, sem transbordamento horizontal da página. Isso não substitui teste em aparelho físico.
- Dados de teste exclusivamente em `.cache/artworks-v220/` e origem isolada `localhost`; operação em `127.0.0.1:8877` preservada. Capturas: `aberturas-desktop.png`, `aberturas-mobile.png`, `montagem-5s.png`.

Comandos de regressão:

```powershell
npm run test:artworks
node --test --test-concurrency=1 tests/server.test.mjs tests/storage-backup.test.mjs tests/cover-opening.test.mjs tests/video-assembly.test.mjs tests/intros.test.mjs tests/collections.test.mjs
```

Falhas iniciais de execução restrita foram resolvidas executando os testes de servidor/FFmpeg no ambiente local permitido. Um teste de contagem foi corrigido para considerar o arquivo parcial preservado após cancelamento. A execução final dos 45 testes passou.

## Situação da entrega

Implementação e validação isolada concluídas. Interface `8a1d5df164e2` e backend `d190d0a5f925`, versão 2.20.0, ativados e conferidos em 127.0.0.1:8877. UI carregou Aberturas com dez originais e Baixador com motor pronto. Preservados 165 clipes, 20 produções, histórico, fila, jobs, saídas e quatro hashes de entregas. Nenhuma arte fictícia entrou na operação real. Evidência: `.cache/artworks-v220/after-activation.json`. Software 89b3459f2fb347b4b55c00a8a43875cd673dba90 enviado às branches main e desenvolvimento/validacao-local-p6; Pages 40270319471 concluído com success. Doze arquivos públicos conferidos por SHA-256 e navegador público confirmou 2.20.0 / 8a1d5df164e2. Python/FFmpeg, bibliotecas e dados permanecem no serviço local. Evidência pública: `.cache/artworks-v220/public-hashes.json`. A aba pública informa que a biblioteca requer o serviço local; nenhuma geração remota foi alegada. Serviço de teste encerrado, sem operação mutante pendente. Avaliação estética humana e teste externo do baixador ficam com o titular, conforme solicitado. Nenhuma postagem nas redes foi realizada.
