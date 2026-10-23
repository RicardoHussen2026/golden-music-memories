# Família oficial de templates

O cassete aprovado continua como base oficial, ID `cassette`, fundo `06_fundo_original.png`. Nenhuma arte V1 foi substituída.

| ID | Modelo | Composição |
|---|---|---|
| premium-vinyl | Vinil clássico premium | Macro de toca-discos, título serifado superior, filete âmbar |
| premium-cassette | Cassete retrô alternativo | Cassete em pé e fita solta, título em pilha, luz de recorte |
| premium-neon | Neon anos 80 / synthwave | Sintetizador, arcos neon ciano/âmbar, tipografia Verdana |
| premium-stage | Palco e luzes musicais | Microfone à direita, título na lateral esquerda, refletores |
| premium-romance | Memória afetiva vintage | Rádio, carta e rosa à esquerda, título deslocado à direita |
| premium-minimal | Minimalista premium | Textura preta, arcos dourados discretos, título central em altura |

Selecione um card em Estúdio de capas. Edite música, artista, ano, fonte, tamanho, cores e posições. A troca aplica a composição do modelo e usa seu fundo oficial; um fundo próprio anterior continua guardado no acervo e pode ser reenviado. A capa aprovada guarda `coverConfig` e um PNG versionado na produção. A prévia pode mostrar margens; a exportação não inclui essas linhas. Os modelos exportam PNG/JPG vertical 1080×1920 ou horizontal 1280×720; o foco de composição é vertical.

Implementação: `TEMPLATES`, `templatePreset`, `templateBackground` e `drawCover` em `app/cover.js`; seleção e persistência em `app/main.js`. Textos são desenhados no Canvas, separados do fundo. Fundos em `templates/*.png`, incluídos no cache offline. Estilos locais anteriores preservados. Não há chamada de IA ao usar o editor.

## Criação dos fundos

Seis fundos originais foram gerados em 23/10/2026 com a ferramenta de geração de imagens desta sessão. Não são fotos de artistas nem capas de álbuns. São fundos sem tipografia; revisão humana continua recomendada antes da publicação. A ferramenta entregou 941×1672; o Canvas compõe e exporta no tamanho final. Não há promessa de exclusividade de imagens geradas por IA.

Direção comum dos prompts: fotografia vertical 9:16 dark premium, preto profundo, ouro/âmbar e contraste frio petróleo; elegância musical nostálgica; área negativa para texto; sem palavras, logotipos, rostos ou capas comerciais.

- Vinil: disco preto em toca-discos sofisticado, macro em três quartos, foco inferior direito, luz âmbar e petróleo, metade superior livre.
- Cassete alternativo: cassete translúcido em pé no inferior direito, fita desenrolada na base, contraluz quente e recorte frio; composição diferente do cassete original deitado.
- Neon: sintetizador analógico no terço inferior, arcos geométricos ciano/âmbar, magenta contido, atmosfera synthwave elegante, área superior escura.
- Palco: palco vazio, microfone vintage metálico à direita, refletores âmbar e névoa, bokeh azul petróleo, sem rostos.
- Memória: rádio de madeira escura, carta sem escrita e rosa seca no inferior esquerdo, janela noturna chuvosa, direita superior escura.
- Minimalista: papel preto texturizado, arcos dourados discretos no inferior direito, pequeno botão metálico, amplo espaço negativo.

## Verificação

`tests/templates.cjs` percorre a seleção real no painel, edita os campos, exporta os sete PNGs, verifica dimensões, persistência após recarga, JPG, aprovação com configuração e arquivo, responsividade e disponibilidade offline. `docs/familia-templates.png` mostra exportações reais do editor; os arquivos de teste são isolados do acervo do operador.
