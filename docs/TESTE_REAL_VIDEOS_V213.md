# Ensaio real de dois vídeos — 25/10/2026

Escopo executado: texto anexado pelo titular, com confirmação de uso do acervo atual. Produzir TikTok e YouTube de uma hora, verificar os arquivos e apontar melhorias; mudanças de código ficaram como propostas. Serviço local 2.13.0 e origem 127.0.0.1:8877 preservados.

Entrega privada local: `acervo/ENTREGAS_TESTE_REAL_2026-10-25/`. Abrir `RELATORIO_TESTE_REAL.md` para a avaliação completa; `ABRIR_ENTREGA.html` reúne links e players locais. A tentativa de abertura automática do HTML foi recusada pela política do navegador de teste para `file://`; a página não teve inspeção visual renderizada. Links e arquivos são verificados no disco. Os vídeos nativos reproduziram no painel por HTTP local.

| Item | Medição |
|---|---|
| TikTok_Alphaville_Big_in_Japan.mp4 | 239,533333 s; 1080×1920; 120.968.523 bytes |
| Capa_TikTok_Big_in_Japan.png | 1080×1920; 3.280.796 bytes |
| YouTube_Flashback_80_1_Hora.mp4 | 3600,000000 s; 1920×1080; 1.771.065.766 bytes |
| Thumbnail_YouTube_Flashback_80.png | 1280×720; 1.392.271 bytes |

TikTok renderizado em 133,875 s; YouTube em 1833,299 s. Duas amostras separadas antes dos finais. Cópia YouTube ajustada externamente de 3600,010351 s para 3600 s por remux de 23,134 s, sem recodificação: todos os pacotes codificados de áudio/vídeo preservados por hash. O final nativo da coleção continua no painel; para a duração exata, usar a cópia da pasta de entrega.

Validação técnica integral sem erro de decodificação. Revisão visual por amostragem: 16 quadros TikTok; 69 quadros YouTube mais 12 adicionais; duas capas e amostras. Áudio: 32 comparações com as fontes, aproximadamente 4,6–5 ms de desvio. Imagem: 18 comparações, até um quadro de diferença. Não houve audição subjetiva humana integral, postagem externa ou teste em celular físico.

**Não declarar sucesso editorial completo.** A sequência mantém as bordas das fontes. Foram confirmados 9,546 s iniciais sem áudio audível, uma passagem com 8,633 s de imagem muito escura e outra com 7,129 s de silêncio. O painel não aceita cortes por faixa na sequência atual. Remover pretos indiscriminadamente poderia cortar áudio/cenas intencionais. Tratamento de bordas é prioridade alta. Meta de pico exibida -1,5 dBTP; finais medidos em -1,0 dBTP, com loudness -16,0/-16,1 LUFS.

Foram corrigidos manualmente o campo de áudio do rascunho TikTok, o nome de entrega da thumbnail e a duração externa do YouTube. Download do Chrome retornou ERR_BLOCKED_BY_CLIENT; obtenção pela API local e verificação de bytes/hash garantiram acesso aos arquivos, sem alteração de proteção do navegador. Q01–Q11 detalham as melhorias ainda propostas.

Ponto de parada: sem render ativo; código, versão e flags operacionais iguais. Comparação antes/depois: 165 registros de clipes e 10 intros iguais; quatro produções anteriores iguais; 15 fontes preservadas por SHA-256. Há 15 novas produções deste ensaio, um rascunho TikTok com vídeo associado, uma coleção nativa final, amostras e rascunho de coleção preservados. A produção/formulário do usuário em outra aba não foi alterada. Evidências e scripts em `.cache/teste-real-20261025/`. Não tratar este registro como autorização para implementar propostas ou postar vídeos.
