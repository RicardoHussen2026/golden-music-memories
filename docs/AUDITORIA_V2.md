# Auditoria e arquitetura — 23/10/2026

## Base preservada

O projeto publicado é o checkout `golden-music-memories-site`, vinculado ao repositório RicardoHussen2026/golden-music-memories. A pasta Golden-Music-Memories contém os entregáveis originais. A V1 era um guia HTML e um editor Canvas independente, com artes, vídeo silencioso e fontes Remotion. Não existiam cadastro operacional, upload, histórico de produções, banco ou sincronização.

Backup V1: `outputs/backups/Golden-Music-Memories_V1_2026-10-23.zip`, fora do repositório. Commit de referência: ca2243e081be789a157ec691bbc07b2ae91a907b. Desenvolvimento na branch `desenvolvimento/painel-v2`. `00_comece_aqui.html`, `05_modelo_capa.html`, vídeo e artes da V1 foram preservados. O antigo índice também permanece em `guia-v1.html`.

## Fundação implementada

Aplicação estática modular em HTML, CSS e JavaScript, compatível com a hospedagem atual. Sem dependência de API paga, instalação ou build para o uso diário. `app/db.js`: persistência e transações IndexedDB; `app/cover.js`: composição de capas; `app/backup.js`: ZIP, integridade e restauração; `app/main.js`: fluxo operacional. JSZip 3.10.1 foi incluído localmente com sua licença. O projeto aceita produção individual e lotes conforme a meta configurada.

IndexedDB versão 2 contém músicas, produções, ativos com Blobs, publicações, histórico, configurações e reservas. As operações críticas de importação, reserva e criação de produção são transacionais, evitando duplicação entre abas da mesma origem. BroadcastChannel atualiza os estados entre abas. Não há bloqueio distribuído entre computadores: isso exige backend compartilhado.

O banco local é por navegador e origem. Alterar de localhost para GitHub Pages não transfere os dados. Exporte um backup ZIP e restaure no destino. A aplicação pede persistência quando o operador solicita, mostra a cota estimada e trata falta de espaço; backups externos continuam necessários.

## Catálogo

2.009 registros reais consultados na API MusicBrainz, com MBID, artista, título, data informada e URL da gravação. Não é ranking de popularidade. O campo de ano representa o primeiro lançamento conhecido dessa gravação segundo a fonte comunitária, não uma certificação da composição original. Nenhuma entrada foi declarada como revisada editorialmente por uma pessoa. País ausente não foi inferido a partir do país de lançamento. Tags/gêneros comunitários suplementares não foram redistribuídos por terem licença diferente dos dados centrais CC0. Gênero fica disponível para curadoria/importação autorizada.

A consulta foi particionada por década e depois por ano para contornar a limitação de paginação da busca. Cache e importador foram preservados no ambiente de trabalho; o importador reproduzível está em `scripts/import_musicbrainz.py`. Músicas podem ser adicionadas por JSON/CSV ou formulário. O tamanho do catálogo não é limitado a 1.825. O crescimento continua sujeito à memória/cota do navegador; paginação visual de 30 registros não é limite do catálogo.

Fontes: https://musicbrainz.org/doc/MusicBrainz_API/Search/RecordingSearch e https://musicbrainz.org/doc/About/Data_License.

## Controle antirrepetição

Identidade canônica combina artista normalizado e título-base. Pontuação, acentos e rótulos comuns de versões/remasterizações são normalizados. A gravação conserva MBID e ano próprios. Registros exatamente iguais são ignorados na importação. Variantes semelhantes recebem marca de revisão; iniciar uma produção relacionada exige confirmação explícita de nova versão. O algoritmo não reconhece com certeza toda composição, erro de grafia ou colaboração: esses casos exigem curadoria, sem fusão automática.

Reservas retiram a música das sugestões de inéditas antes de haver vídeo final. Cancelamentos são mudanças de estado auditáveis, nunca exclusão de histórico. Produções com vídeo final ou publicação não são liberadas como inéditas pelo cancelamento comum. Uso anterior pode ser cadastrado sem inventar um arquivo de vídeo. TikTok e YouTube são registros independentes vinculados à mesma produção.

## Direitos, revisão e segurança

Gravação, composição, imagens, TikTok, YouTube e uso comercial são campos independentes; ativos também têm fonte, validade, território e situação. Nova versão retorna permissões a pendentes. Revisão editorial exige capa e vídeo final; anexar novos arquivos invalida a aprovação. A aprovação editorial não certifica direitos ou monetização.

Não há mecanismo de download de música comercial, DRM ou envio automático. O fluxo de publicação registra planejamento e fatos informados pelo operador. Para “publicada”, exige arquivo, data e URL (o cadastro histórico é a exceção explícita). URLs aceitas são HTTP/HTTPS, textos são escapados, arquivos HTML enviados não são executados em prévias, e tokens não são pedidos no frontend.

O backup contém manifestos e hashes SHA-256 dos arquivos. A restauração valida tabelas, identificadores, vínculos e hashes antes de substituir o banco em uma transação. Ela depende de confirmação, pois substitui os dados locais. SHA-256 verifica integridade, não autenticidade contra adulteração maliciosa de manifesto e arquivos em conjunto.

Arquivos de trabalho enviados ao painel permanecem no navegador: não são enviados ao GitHub. O vídeo demonstrativo da V1 já estava no repositório público e foi preservado; não será usado como acervo operacional para uploads futuros.

## Integrações e limitações

Canva Pro: CSV real para Criação em lote; importa-se a arte resultante como capa da produção. Sem API de Canva conectada ao aplicativo. Google Drive: estrutura de pastas e ZIPs para upload manual; sem OAuth ou sincronização real. CapCut Pro: pacote organizado com manifesto, sem simular formato proprietário ou API. Supabase: esquema relacional proposto, sem migração aplicada nem ambiente dedicado configurado. Projetos existentes de outros sistemas não foram alterados.

OpenAI: avaliada para roteiros e enriquecimento assistido, ainda sem chamadas ou gastos. Detalhes em AUTOMACAO_E_INTEGRACOES.md. Atualização autorizada para o GitHub Pages existente; a V1 permanece acessível nos materiais numerados e em guia-v1.html.

PWA: shell e catálogo disponíveis offline após carregamento inicial, sujeito à política do navegador. Vídeos grandes e ZIPs da V1 não são pré-carregados. O navegador deve oferecer suporte a IndexedDB, Canvas, Web Crypto e download de Blobs. A geração de MP4 dentro da V2 ainda é uma etapa futura; o painel atual recebe os vídeos finalizados do CapCut.
