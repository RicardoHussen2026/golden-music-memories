# Artes das chamadas — 2.15.1

Oito PNGs substituídos em `app/video-art/`, mantendo os mesmos nomes e chaves do seletor existente. Apenas imagens e metadados de versão foram alterados nesta etapa. Texto personalizado, escolha de PNG próprio, ordem, duração, posição, proporção, animação e publicação continuam iguais.

Artes: DEIXE SEU LIKE, SIGA O CANAL, INSCREVA-SE, ATIVE O SININHO, COMENTE, COMPARTILHE, SALVE O VÍDEO, ASSISTA ATÉ O FIM. Todas RGBA com transparência real, 1983 ou 1984 × 793 px, proporção aproximadamente 2,5:1. O compositor existente redimensiona proporcionalmente para a largura escolhida, sem esticar. A resolução excede a largura padrão da chamada no render Full HD.

## Direção e geração

Ferramenta integrada **image_gen**, oito chamadas individuais. Referência: imagem do titular `Botões Neon 3D para Redes Sociais.png`. Prompt base: criar um único botão 3D frontal recortado com transparência; cápsula preta brilhante, biséis dourados em camadas, texto branco condensado volumétrico muito legível e ícone colorido à esquerda, acabamento e reflexos refinados, margem transparente pequena, alvo 1986 × 792, sem cenário ou palavras adicionais. Após o primeiro botão, ele também serviu de referência para consistência.

Variações: like/azul-ciano/polegar; seguir/ciano-magenta/pessoa e sinal mais; inscrever/vermelho/play; sininho/amarelo-dourado/sino com arcos; comentar/roxo/balão com três pontos; compartilhar/turquesa/seta curva; salvar/verde/marcador; assistir/âmbar/duas setas. Textos exatos listados acima, com acentos conferidos visualmente. Não houve substituição por desenhos programáticos.

## Conferência e entrega

- Oito imagens abertas e conferidas visualmente; alfa 0–255 confirmado em todas.
- Dois MP4s sintéticos de 14 s, 1920×1080 e 1080×1920, produzidos por `videoArguments`/FFmpeg do aplicativo. Oito chamadas em cada um. Decodificação integral sem erro; duração exata 14 s; áudio AAC preservado por hash dos pacotes.
- Dezesseis quadros extraídos nos instantes das chamadas; amostras horizontal/vertical inspecionadas, texto legível, fundo recortado e proporção preservada. Aprovação estética final pelo titular permanece distinta da validação técnica.
- Catálogo visual e cópia dos oito PNGs em `acervo/ARTES_CHAMADAS_PREMIUM_2026-10-25/CATALOGO.html`. Originais gerados preservados em `.codex/generated_images`; imagens anteriores em `.cache/artes-v2151/antes/video-art`.
- Evidências: `.cache/artes-v2151/RESULTADO.json`, `youtube.mp4`, `tiktok.mp4` e dezesseis quadros. Script reprodutível `validar.mjs`, proveniência `origens.json` nessa pasta.
- Ativação local 2.15.1, interface `ab407846a8aa`, backend `02de875d45e7`, mesma origem 8877. Sem regenerar vídeos antigos nem alterar produções reais. Artes novas valem para próximas montagens. Rascunhos antigos que fixaram hash da arte precisam ser conferidos/salvos novamente antes de renderizar.

Próxima etapa autorizada: reforma de Meu acervo. Nenhuma postagem externa, commit, push ou deploy nesta entrega.
