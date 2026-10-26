# Financeiro Golden Music Memories — 2.18.0

Solicitação: aba financeira exclusiva do canal, após terminar o baixador, seguida de commit, push e publicação do software. Nenhuma conta financeira, cobrança ou postagem social integra esta entrega.

## Uso

Entre em **Financeiro** no menu principal. Use **Nova receita** ou **Nova despesa**, informe descrição, valor em reais, categoria, plataforma e data. Comece como previsto quando ainda não recebeu/pagou. Depois use **Receber** ou **Pagar** para confirmar a data efetiva no mesmo registro.

- Receitas: monetização, publicidade/patrocínios, afiliados, vendas próprias, membros/assinaturas, apoio/contribuições, licenciamento de conteúdo próprio e outras receitas do canal.
- Afiliados: seleção explícita entre Amazon, Mercado Livre, Magalu e Shopee. O cadastro é gerencial; não implica participação, integração ou comissão garantida.
- Despesas: ferramentas digitais, campanhas, hospedagem/domínio, APIs/automações, produção, licenças, equipamentos, taxas e outros custos do canal. Campanhas podem ser identificadas por TikTok, Instagram, Facebook ou YouTube.
- Resumo: recebido, pago e saldo; a receber/a pagar e resultado previsto separados. O período usa data efetiva para liquidados e prevista para demais. Não representa saldo bancário nem inclui saldo inicial.
- Busca sem acentos e filtros de mês, situação, tipo, categoria, plataforma e arquivados. Lista paginada em 15 registros; CSV contém todos os registros filtrados.
- Detalhes: editar, cancelar por situação, repetir como novo lançamento previsto ou arquivar recuperavelmente. Restaurar em **Mais filtros → Arquivados**. Não há exclusão permanente.
- Referência livre permite identificar vídeo, campanha ou comprovante. Não há importação automática das métricas das publicações, evitando dupla contagem de receita.

## Implementação e preservação

Módulos `app/finance-model.js`, `finance-store.js` e `finance.js`; menu, roteamento, CSS e cache offline existentes. Sem dependências novas, API adicional ou migração do banco.

Um registro por lançamento em IndexedDB/settings, prefixo `finance:entry:`, escopo Golden e moeda BRL. Cálculos usam centavos inteiros. Gravação e histórico são transacionais; a revisão do registro impede sobrescrita silenciosa por outra aba. Os dados continuam privados no navegador e origem usados; o deploy não os transporta para outro computador/endereço.

O backup completo existente inclui os lançamentos automaticamente. O leitor agora valida revisão, valores, categorias, datas e marca de afiliados; a confirmação de restauração menciona expressamente o financeiro. CSV é relatório para consulta, não restauração. Cópias anteriores do código em `.cache/financeiro-v218/antes/`; originais operacionais e banco não foram copiados ou substituídos.

## Evidências de funcionamento

- Sete testes automatizados do financeiro: parser decimal, limites/datas, cálculo de realizado e previsto, filtros combinados, CSV, revisão/arquivamento e leitura de backup válido/inválido.
- Percurso pelo Chrome em `localhost:59908`, origem de teste isolada: criar receita, criar despesa prevista, liquidar no mesmo registro, selecionar afiliado, editar, arquivar/restaurar, buscar/filtrar e recarregar.
- Exemplo sintético: recebido 1.234,56; pago 234,56; saldo 1.000,00; comissão prevista 50,00 separada. CSV baixado e reaberto: três linhas e centavos 123456, 23456 e 5000.
- Duas abas: a segunda gravou 1.300,00; a primeira tentou gravar 999,00 com revisão antiga e recebeu conflito. Recarregar preservou 1.300,00.
- Formulário em largura efetiva de 390 px, documento 375 px, sem transbordamento horizontal. Valor `10.5` rejeitado com instrução de formato; `10,50` aceito. Retorno de Pago com data futura para Previsto funcionou após desabilitar o campo oculto.
- Evidências privadas: `.cache/financeiro-v218/formulario-mobile.png`, `filtros-mobile.png`, `financeiro-teste.csv` e captura operacional final.
- Regressão complementar: 29 testes de catálogo pesquisado, Meu acervo, financeiro (cinco casos naquela rodada), intros, miniaturas, montagem/áudio e publicações passaram. O conjunto financeiro final foi ampliado e passou separadamente com sete casos.

- Regressão do serviço: 79 testes aprovados (coleções, destinos, operações, persistência e contratos existentes), com simulações e mídia sintética isoladas.
- Ativação local: versão 2.18.0, interface b57a3b5a070d e backend ea74eacababd. 165 clipes, 20 produções, filas e saídas preservados; quatro arquivos anteriores conferidos por SHA-256.

## Limites

Registros gerenciais manuais em reais; sem banco, contabilidade fiscal, conversão automática, sincronização entre origens ou importação de comissões das plataformas. Nenhum lançamento fictício foi inserido no painel operacional. Validação visual em navegador redimensionado não equivale a teste em aparelho físico. Testes reais de downloads externos continuam com o proprietário, conforme sua orientação.

O GitHub Pages publica a interface estática. Serviço Node, FFmpeg, acervo e baixador continuam na operação local em `127.0.0.1:8877`. Situação de ativação/publicação final é registrada na lista oficial e em CONTINUIDADE.md.
