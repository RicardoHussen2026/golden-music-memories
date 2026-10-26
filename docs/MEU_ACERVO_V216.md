# Meu acervo — reforma local 2.16.0

Disponível em **http://127.0.0.1:8877/painel.html#archive**. Interface carregada `2fa70874fd87`; backend ativo `f2c881119958`. Esta versão reúne Baixador YouTube 2.15.0, artes das chamadas 2.15.1 e a reforma de Meu acervo. Sem publicação web ou em plataformas sociais nesta etapa.

## Problemas comprovados e correções

| Achado e causa | Correção aplicada |
|---|---|
| Dez players criados na lista, repetindo grandes blocos e controles | Cartões compactos com imagem da capa vinculada, quando disponível; vídeo só é aberto ao clicar em Ver vídeo. Oito itens por página, sem esconder versões |
| Busca reagia somente em `change`, ao sair do campo | Busca ao digitar, atraso de 120 ms, sem perder foco; combina palavras em qualquer ordem e desconsidera acentos |
| Ausência de separação entre individuais/coletâneas, formato e ordenação | Atalhos Todos/Individuais/Coletâneas com contagem; filtros combináveis de plataforma, formato, postagem e década; ordenação por data, música, artista ou duração |
| Filtro de publicados podia comparar `undefined === undefined` e associar registros sem vínculo | Exige referência explícita por arquivo, mídia, job ou coletânea. Rascunho não conta como publicado |
| Preparar postagem não priorizava sempre o arquivo clicado diante de um rascunho anterior | Arquivo escolhido no acervo agora é selecionado explicitamente, tanto para IndexedDB quanto para mídia do serviço; demais campos do rascunho preservados |
| Muitos controles na tela estreita | Filtros secundários recolhidos inicialmente no celular, com contador dos filtros ativos; botões e cartões adaptados à largura, sem rolagem horizontal da página |

Nome completo do arquivo e origem ficam em **Ver vídeo → Informações do arquivo**. Baixar MP4, Preparar postagem e Ver produção permanecem acessíveis. A postagem mantém Baixar miniatura e Escolher miniatura. Não foram removidos arquivos, versões, IDs, links ou funções consolidadas.

## Validação executada

- `node --test tests/final-library.test.mjs tests/posting-thumbnail.test.mjs`: **6 testes aprovados**, incluindo vínculo real de publicação, pesquisa combinada, ordenação, versões, paginação, ausência de metadados e disponibilidade dos arquivos do navegador quando o serviço está indisponível. O cenário de indisponibilidade é estrutural; o serviço operacional não foi derrubado para simular uma falha.
- Chrome operacional: busca `alphaville japan` encontrou apenas Big in Japan enquanto o foco continuava na busca; combinações de YouTube/vertical retornaram estado vazio coerente, com opção de limpar. Página 2 mostrou os dois arquivos restantes; Todos=10, Individuais=9, Coletâneas=1.
- Vídeo Big in Japan abriu sob demanda em 1080×1920, 239,533333 s, sem erro de reprodução; tempo avançou e fechar pausou o vídeo. **Ver produção** fechou o diálogo e abriu a produção correta. Não houve nova renderização de conteúdo real nesta reforma.
- Preparação do arquivo de navegador Take On Me selecionou seu ID exato. Preparação do arquivo de serviço The Emotions selecionou `media:b9caeda6-ecb0-4e2c-8ae6-4a9a3d56849d`, correspondente ao cartão. Coletânea de uma hora abriu sua preparação com MP4 e miniatura. Não foram salvos registros de teste nem feita postagem externa.
- Download real pela nova lista: The Emotions, YouTube horizontal V1, **19.603.564 bytes**, SHA-256 `f932954d05dca314ff013cfe7ada1382e1e403f9766f2814145009ec3a61faf9`, idêntico ao arquivo registrado no serviço.
- API: oito finais do serviço, oito durações e oito capas vinculadas disponíveis; os dois finais legados do navegador mantêm apresentação neutra quando não há capa exata vinculada. Não se inventa capa nem duração ausente.
- Desktop de 1146 px: dez players antes, **zero na lista depois**. Altura inicial caiu de 3903 para 2190 px, com oito itens na primeira página e dois na segunda. É redução da superfície inicial e dos players montados, não medição de LCP ou velocidade de rede.
- Emulação de 390×844: largura documental 375 px, sem transbordamento horizontal; filtros recolhidos, cartões/botões conferidos. Não é teste em aparelho físico.
- Console da aba final sem erros capturados. Sintaxe JS e `git diff --check` sem falhas de conteúdo; avisos de normalização LF/CRLF existentes no Windows.
- Comparação operacional: **165 clipes, 20 produções e dez finais na interface**. Produções, publicações existentes, configurações/mídia coletiva, fila, jobs e saídas preservados. Quatro entregas anteriores novamente verificadas por hash. Reinício somente após filas sem trabalho ativo, incluindo o baixador.

## Evidências e continuidade

`app/final-library.js` concentra apresentação, filtros e prévia; `app/style.css` contém estilos locais da seção; `app/main.js` conecta o módulo e seleciona o arquivo da postagem. `server/runtime/http.mjs` acrescenta metadados de duração, capa e faixas à consulta existente, sem migrar nem escrever o acervo.

Evidências privadas em `.cache/acervo-v216/`: `testes.txt`, `ui-final.json`, `desktop.png`, `mobile.png`, `api-metadata.json`, `download.json`, `antes-ativacao.json`, `depois-ativacao.json`. Versões anteriores dos arquivos tocados em `antes/`; não é cópia de banco aberto. Estado Git anterior preservado, sem commit/push/deploy.

Implementação, testes proporcionais e disponibilização local concluídos. Avaliação visual humana permanece com o titular; teste real do Baixador YouTube também é manual por solicitação expressa. Falhas de edição dos vídeos antigos não são corrigidas por uma reforma de navegação: o acabamento do conteúdo continua dependendo da revisão da produção. Nenhuma receita ou elegibilidade para monetização é presumida.

O fluxo de localizar, conferir, baixar e preparar postagem está funcional nos percursos executados e ficou mais curto. Não há bloqueio técnico conhecido nesta entrega; não se afirma cobertura de todos os navegadores, aparelhos físicos ou futuros tamanhos de biblioteca. Nenhuma operação mutante pendente neste chat.
