# Família oficial de templates

O cassete aprovado continua como base oficial, ID `cassette`, fundo `06_fundo_original.png`. Em25/10/2026 o titular autorizou substituir as artes correspondentes pelo pacote fotográfico; os IDs e as composições editáveis foram preservados. As artes anteriores continuam recuperáveis no backup privado da troca.

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

## Conferência complementar de artes recebidas — 25/10/2026

### Substituição autorizada e ativada localmente — 2.9.4

Após a conferência inicial abaixo, o titular autorizou a troca das artes correspondentes. A correspondência foi feita pela composição visual e pelo motivo representado, não apenas pelo nome do arquivo:

| Arte recebida | Arquivo do aplicativo substituído | Modelo preservado |
|---|---|---|
| GMM_07_CASSETE_DEITADA.png | 06_fundo_original.png | cassette |
| GMM_09_CASSETE_EM_PE.png | templates/cassette-alt.png | premium-cassette |
| GMM_10_SINTETIZADOR_VINTAGE.png | templates/neon.png | premium-neon |
| GMM_04_MICROFONE_VINTAGE.png | templates/stage.png | premium-stage |
| GMM_05_RADIO_VINTAGE.png | templates/romance.png | premium-romance |
| GMM_13_VINIL_DOURADO.png | templates/minimal.png | premium-minimal |

O motivo de vinil dourado do pacote corresponde ao fundo Minimalista existente. O toca-discos do Vinil clássico não tem equivalente no ZIP, portanto `templates/vinyl.png` permanece intacto. O rádio12 é idêntico ao05 e não foi instalado uma segunda vez. As seis artes novas têm1080×1920; as anteriores e seus hashes estão guardados em `.cache/artes-294/anteriores`, com mapa de recuperação em `substituicoes.json`, sem apagar fontes ou versões.

A renderização existente mantém a proporção, com preenchimento e recorte no horizontal, sem esticar. O editor agora informa esse comportamento e orienta usar fundo horizontal próprio para preservar a composição inteira. A alternativa de composição inteira demonstrada no piloto continua proposta, não implementação. IDs, tipografia e posições editáveis foram mantidos. Capas já exportadas/aprovadas e MP4 não são regravados pela troca dos fundos; ao reeditar um template, conferir a prévia e salvar nova versão.

Validação atual:15 verificações de templates passaram, cobrindo sete exportaçõesPNG, edição/JPG, persistência, aprovação em dados isolados, celular e offline. Sete exportações horizontais1280×720 tiveram proporção de desenho conferida sem stretch e inspeção visual.10 verificações de versão passaram. Serviço local8877 reiniciado após zerojobs, sem recarregar abas habituais; frontend2.9.4/interface9b2a38a5bd70 e backend2.9.4/9598edb61b77 correspondem, saúde200 e SQLite íntegro/contagens preservadas. Seis hashes servidos e hashes dos dois MP4 aprovados conferidos. Evidências em `.cache/artes-294/`; galeria atual em `familia-templates.png`. Site público continua2.9.3, sem commit/push/deploy nesta etapa.

### Recepção inicial e piloto — histórico anterior à autorização de troca

O pacote `GMM_CAPAS_ESTILO_FOTOGRAFICO_1080x1920.zip` foi encontrado em Downloads e conferido sem alterar os originais: sete PNGs 1080×1920, todos decodificados pelo FFmpeg, com hashes correspondentes aos arquivos extraídos. São seis imagens distintas: `GMM_05_RADIO_VINTAGE.png` e `GMM_12_RADIO_VINTAGE.png` têm bytes idênticos. Nenhuma duplicata foi removida. São artes de identidade Golden com instrumentos e espaço para texto, não capas históricas vinculadas a gravações. O pacote não inclui documento de procedência/licença; aparência fotográfica não comprova origem ou direitos.

Um piloto isolado reutilizou `drawCover` e textos fictícios, sem dados operacionais: vertical 1080×1920 e duas composições horizontais 1280×720. O preenchimento horizontal direto de uma arte 9:16 mostra somente cerca de 31,64% de sua altura; é o recorte previsto pelo preenchimento, não defeito de codificação. A proposta alternativa conserva a imagem inteira à direita, com fundo derivado desfocado e texto à esquerda. Essa composição existe somente no piloto; o editor não foi modificado e nenhuma arte/template atual foi substituído. Avaliação visual humana precede eventual adoção.

Evidências privadas fora do Git: `.cache/capas-verificacao/`, com manifesto/hash, resultado de sete decodificações, comparativo visual e três exportações do piloto. As artes podem servir à identidade Golden, miniaturas e fundos de capas; não devem ser associadas automaticamente como capa de álbum.

O acervo histórico é outro conjunto. Os índices recebidos descrevem a consolidação V3 e caminhos `capas/<decada>s/<sha256>.<ext>`, mas os binários correspondentes não foram localizados nos locais autorizados verificados do projeto e Downloads. Não foi acessada a outra tarefa de pesquisa. A conferência documental anterior não foi refeita nem os números do relatório V2 tratados como validação de imagens V3. Para avançar, disponibilizar o diretório `capas/` correspondente ao índice atual em local autorizado; `MANIFESTO_IMAGENS.csv`, `RESUMO_ACERVO.json` e evidências/revisões da mesma entrega permitem a conciliação completa. Até lá, vínculos, dimensões, integridade e aplicação das capas históricas continuam pendentes.
