# Miniaturas nas postagens — 2.14.1

Ativo localmente em 127.0.0.1:8877. Interface20fa6070e489/backend449bbfc257d0. Nenhuma publicação externa, renderização de vídeos ou alteração dos originais nesta etapa.

## Entrega

- Preparação individual e coletiva: Baixar MP4 e Baixar miniatura disponíveis. A miniatura usa a capa vinculada ao render concluído, inclusive arquivos antigos.
- Escolher miniatura permite selecionar PNG/JPG/WebP local quando não há capa vinculada ou para baixar outra imagem. Seleção manual vale enquanto o formulário estiver aberto; não altera o vídeo nem substitui a capa original.
- Erros e ausência de capa são informados; o botão é bloqueado durante a preparação e reabilitado ao concluir/falhar. Trocar o MP4 individual limpa a seleção manual para não carregar capa do vídeo anterior.
- O download mantém formato, resolução e bytes da imagem original. Não promete aceitação de qualquer imagem em qualquer destino; a capa horizontal do caso solicitado foi verificada com1280×720 e1.392.271bytes.

## Verificação

Teste Node de integração aprovado: três rotas (render, mídia e coletânea), bytes/MIME/nome, ausência de capa e ausência de nova renderização. Percursos Chrome da coletânea Flashback80 e individual Big in Japan concluídos; imagens efetivamente presentes em Downloads, decodificadas e SHA-256 idênticos às capas anteriores. Escolha manual e segundo download também conferidos. A notificação de download da ferramenta não detectou o evento blob; a existência e o hash no disco confirmam a transferência.

Viewport390px sem transbordamento horizontal (documento375px, diálogo330px, conteúdo286px); nenhum teste em celular físico. Zero erros no console da aba. Serviço reiniciado somente com fila/jobs vazios.165clipes/20produções, mídia/configurações da coletânea, jobs/finais e registros existentes do serviço preservados. Formulários anteriores não recarregados.

Evidências: `.cache/miniaturas-v2141/DOWNLOADS.json`, capturas, antes/depois de ativação e cópia dos arquivos de código anteriores em `antes/`. Relatórios antigos não substituem estas verificações. Revisão humana e upload noYouTube não realizados.
