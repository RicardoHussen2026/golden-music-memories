# Pesquisa integrada ao catálogo — 2.13.0

## Entrega de 25/10/2026

O titular autorizou usar as informações de forma flexível e integrar a pesquisa. A aplicação local está concluída em `http://127.0.0.1:8877/painel.html#catalog`, versão **2.13.0**, interface **31709a4c3f0d**, backend **008a4a975a81**. A conferência anterior continua documentada em `VERIFICACAO_PESQUISA_165_CLIPES.md`; a decisão atual supera a espera por aplicação descrita naquele relatório.

Os **165 clipes** receberam pesquisa vinculada aos mesmos IDs/SHA-256. **162 anos e 162 gêneros** foram preenchidos. Houve 70 alterações textuais de título e 18 de artista, incluindo ajustes de grafia/capitalização. Não representam 88 erros históricos confirmados. A identificação da ficha 018 passou para **Céline Dion — Because You Loved Me — 1996**, conforme a proposta conferida.

| Referência | Clipes |
|---|---:|
| Anos 1960 | 4 |
| Anos 1970 | 26 |
| Anos 1980 | 50 |
| Anos 1990 | 71 |
| Anos 2000 | 11 |
| Ano a completar | 3 |
| Total | 165 |

As três fichas sem ano são 019 (título genérico), 104 (Heaven in Your Eyes / Nick Carter, proposta parcial) e 108 (GREASE, canção ainda não identificada). Os campos conhecidos foram aproveitados; não foi criado um ano para preencher lacunas. Permanecem utilizáveis e editáveis.

## Uso no painel

- Catálogo: filtros combináveis por **década, ano, gênero, coleção, busca, qualidade, duração e uso**. Limpar filtros volta à biblioteca completa.
- Informações: ano de referência e demais campos editáveis, observações opcionais. Não é obrigatório anexar uma justificativa para ajustar um ano.
- Pesquisa e fontes: informações documentais, estilos, referências consultadas e ressalvas ficam recolhidas nos detalhes. Ano musical, single e apresentação permanecem separados.
- Alterações manuais prevalecem na atualização da biblioteca, inclusive apagar ano/gênero. Campos que ainda correspondem à origem podem receber a referência pesquisada. Sincronizações repetidas não desfazem escolhas.
- Os cartões usam os estilos pesquisados quando disponíveis; a identificação antiga e a versão declarada continuam na ficha, sem repetir a atribuição antiga a Mabel como informação principal.

O ano é uma referência editorial para organizar o acervo, não uma certificação do MP4, show ou remaster. A importação não marca curadoria humana, direitos, qualidade audiovisual ou publicação como aprovados. Nomes, anos e gêneros podem ser refinados durante o uso normal.

## Implementação e preservação

`POST /api/clips/research` recebe pesquisa e fontes pelo serviço local existente. Valida vínculos e campos antes da transação e grava objetos `clip_research` / `clip_research_import` no armazenamento suportado, sem alteração do esquema SQLite. O recibo usa o conteúdo do pacote para evitar duplicação. O catálogo do serviço expõe os metadados, e a sincronização do navegador os concilia por campo.

Origem do pacote: `Golden_Pesquisa_165_Clipes_184_Origens_2026-10-25 (1).zip`, SHA-256 `fde96a48e08f901b3db1d32c292bd150b449770ff7f274873c43eff5fed91c33`. Recibo `4edb8e7e6d2cf7c5fddbd182c744d6d9cd5e70ec4ccc0bd0331f72e4d1bd2495`, aplicado em `2026-10-25T23:04:30.600Z`.

Foram preservados os 165 IDs/hashes/tamanhos e caminhos de mídia, as 184 origens, as 10 intros, as 4 produções e os 6 finais do serviço. A interface mantém 8 finais reunindo serviço/navegador e os 2 rascunhos de publicação existentes. Os metadados do acervo foram atualizados; montagens, capas e postagens antigas não foram reescritas. Nenhum clipe movido ou regenerado.

## Validação executada

- **20 testes Node aprovados:** 9 novos de integração/mesclagem/API, 2 de biblioteca/seleção e 9 de editorial/destinos. Os testes da API usam serviço e banco separados.
- Ensaio com o pacote completo em serviço isolado: 165 vínculos, 162 anos/gêneros, contagens por década, segunda importação sem mudanças, fonte/produção preservadas.
- Interface isolada: filtros das cinco décadas e pendentes, combinação ano/gênero/busca, fontes, edição manual e ano apagado persistindo após recarga. Uma primeira tentativa de inspeção leu a tela antes de o salvamento terminar; o ensaio definitivo aguardou o fechamento do formulário e passou.
- Responsividade em largura real de 390 px, largura do documento 375 px, sem transbordamento da página. Também conferida a apresentação desktop após ajuste dos filtros em três colunas.
- Ativação local após conferir ausência de jobs e formulário em edição. Comandos pelo Windows PowerShell antigo foram recusados por sua política local; os mesmos scripts foram executados no shell corrente, sem mudar políticas do sistema.
- Interface operacional: percorreu as sete páginas e comparou **165/165 IDs, títulos, artistas, anos e gêneros** com o serviço; todas as contagens por década conferem. Nenhum erro JavaScript capturado. Finais e rascunhos continuam acessíveis.
- `git diff --check` aprovado. Versão gerada por `npm run version:build` e conferida no backend e navegador carregados.

Evidências privadas: `.cache/integracao-pesquisa-2130/` contém recibo, inventários antes/depois, comparação entre UI/serviço, ensaio isolado e `catalogo-integrado.png`. A pesquisa completa permanece na pasta privada recebida e no armazenamento local por clipe; não foi copiada para catálogo público ou Git.

## Continuidade

Checkout: raiz Golden Music Memories, branch `desenvolvimento/validacao-local-p6`, alterações anteriores preservadas. A operação oficial de associação do chat retornou o projeto correto; a divergência histórica de listagem foi registrada. Somente este chat operou durante a implementação. Código: novos módulos `app/clip-metadata.js`, `app/clip-research-ui.js`, `server/runtime/clip-research.mjs` e `tests/clip-research.test.mjs`; ajustes em catálogo, biblioteca, HTTP, estilos, cache, geração de versão e documentação.

Trabalho concluído localmente; serviço de teste encerrado e painel operacional deixado no catálogo completo. Nenhuma tarefa de integração restante. Validação humana do uso e refinamento das três fichas incompletas podem acontecer depois, sem bloquear o painel. Não houve nova auditoria de segurança/backup, render musical, postagem externa, commit, push ou deploy nesta entrega.
