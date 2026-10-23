# Pesquisa musical — continuidade

Implementação de 23/10/2026, incorporada à arquitetura estática existente. O índice é derivado dos registros do catálogo: não modifica IDs, metadados, reservas ou identidade canônica. Não exige rede, conta, biblioteca adicional ou alteração do IndexedDB.

## Contrato de `app/search.js`

- `createSearchIndex(songs)` cria o índice. Reconstruir depois de importar/editar o catálogo, não a cada tecla.
- `searchSongs(index, query, {limit=Infinity, fuzzy=true})` devolve `[{song, score, approximate}]`, ordenado por relevância. `song` é o próprio registro original; ações continuam recebendo seus IDs existentes.
- `suggestSongs(index, query, limit=6)` devolve a mesma estrutura para autocomplete; menos de dois caracteres não produz sugestões.
- `normalizeSearch(value)` normaliza caixa, acentos, espaços e pontuação mantendo letras não latinas. Também reconhece a-ha, a‐ha, a ha e aha.
- `parseSearchQuery(query)` separa termos, anos e décadas para inspeção. Não altera o texto armazenado.

Título e artista têm maior peso. Termos são combinados com AND e anos são exatos. `anos 80`, `anos80`, `80s`, `1980s` e `década de 80` selecionam 1980–1989. Um erro de edição ou transposição pode ser reconhecido em uma única palavra; palavras curtas, números e dois erros independentes não recebem aproximação. Resultados aproximados vêm depois dos resultados diretos e devem ser identificados na interface.

Campos adicionais, se existentes: `album`, `albums`, `releaseTitles`, `versionName`, `version`, `disambiguation`, `genre`, `genres`, `titleAliases`, `artistAliases`, `aliases` e `alternativeNames`. Aceitam strings, listas de strings ou listas com `name`/`title`. A busca não consulta aliases externos nem os inventa.

Gêneros têm um vocabulário pequeno de equivalências (por exemplo, românticas/balada/ballad). Quando a consulta é composta apenas por gênero conhecido e período, como `Rock anos 80`, o gênero precisa estar cadastrado: a palavra “rock” no título não classifica a música como rock. O catálogo distribuído tem gêneros vazios por decisão de licenciamento anterior. Ausência de resultados de gênero/álbum significa ausência de metadados correspondentes, não ausência de músicas daquele gênero no mundo. Curadoria pode preencher os campos com fonte autorizada.

O catálogo não representa toda a discografia. Os exemplos de busca não garantem resultados: `Queen 1975` não tinha correspondência na carga auditada. O registro de 1985 de a-ha tem título `1 Take On Me` na carga atual; o mecanismo preserva a referência e não corrige silenciosamente a fonte. O ano significa primeiro lançamento conhecido **daquela gravação**, podendo diferir da obra original.

Histórico recente, navegação por teclado, filtros operacionais e a manutenção da pesquisa ao abrir detalhes pertencem à interface. O módulo de busca não acessa nem grava preferências do navegador.

## Consulta externa e licenciamento

A [documentação oficial MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API), consultada em 23/10/2026, exige identificação do aplicativo e no máximo uma requisição por segundo. Ela descreve gratuidade para uso não comercial e encaminha uso comercial aos planos/contato. Como o canal tem finalidade de monetização, a consulta automática não é habilitada antes de validar as condições aplicáveis. A licença dos dados centrais CC0 é diferente das condições de acesso ao serviço; dados suplementares têm licença distinta. Consulte [Data License](https://musicbrainz.org/doc/About/Data_License).

`app/metadata.js` disponibiliza:

- `musicBrainzSearchURL(query)`: link para consulta manual no site oficial. Nenhuma rede é acionada pela função.
- `METADATA_CONFIGURATION`: consulta automática desativada e motivo legível.
- `normalizeMusicBrainzRecording(raw, checkedAt)`: valida MBID, título e artista; mantém fonte/MBID, primeiro lançamento da gravação, versão e títulos de lançamentos retornados. Não escolhe álbum original nem usa tags/gêneros suplementares. Ano ausente continua ausente; fora de 1970–2009 fica marcado como não importável no catálogo atual.
- `createMetadataClient({enabled, termsApproved, transport})`: contrato futuro com transporte injetado, sem `fetch`, sem segredo e desativado por padrão. Retorna `.search(query, {signal})`. O transporte recebe consulta e `{signal, userAgent}` e deve retornar `{recordings:[...]}`. A resposta limita a 25 registros e não é importada automaticamente.

O adaptador serializa solicitações, espaça inícios em pelo menos 1,1 segundo, mantém cache em memória por dez minutos, respeita cancelamento e propaga erros sem fabricar resultados. A fila é local à instância: o futuro servidor precisa limitar o conjunto de clientes/IP, implementar timeout e identificar o aplicativo no cabeçalho adequado. Não basta ligar `enabled` ou preencher uma variável para comprovar conexão, permissão ou contrato comercial. Não há transporte de produção configurado nesta etapa.

A importação final continua sendo explícita e deve chamar o mecanismo transacional já existente em `db.js`, que rejeita duplicatas e preserva gravações distintas. O operador revisa os dados na fonte antes de importar. Metadados não autorizam download de músicas, imagens, videoclipes ou letras; este módulo não faz nenhum desses downloads.

## Verificação reproduzível

```sh
node tests/search.cjs
```

Foram aprovadas **22 verificações locais** sem chamadas de rede: busca real entre 2.009 registros, AND, datas, décadas, acentos, a-ha, títulos parciais, aliases/álbuns/gêneros em fixtures isoladas, Unicode, aproximação conservadora, ausência de classificação inventada, gravações distintas, normalização de metadados, proteção contra resposta inválida, modo desabilitado, fila/intervalo/cache com transporte simulado, cancelamento e recuperação após falha. Na execução registrada, 20 pesquisas levaram 72 ms; é uma medição do ambiente local, não promessa de desempenho em outros dispositivos. A interface e seus filtros precisam também de testes de navegador; o teste deste módulo não substitui os testes de integração.
