# Armazenamento e recuperação local — V2.8.0

Registro inicial do item 8, 25/10/2026: código então preparado e testado em ambiente isolado, com ativação adiada durante o teste do baixador na 2.7.2. Esse estado inicial é histórico. Na release2.9.3, a atualização local e a verificação dos backups compostos foram concluídas; a cópia externa continua pendente. A lista única de execução permanece em [ORGANIZACAO_PROJETO.md](ORGANIZACAO_PROJETO.md).

## Destino externo identificado — consulta de 25/10/2026

A pasta existente **04_CONTROLE_E_BACKUPS**, dentro de Golden Music Memories no Drive da conta `ric.hussen@gmail.com`, foi confirmada por leitura de perfil, metadados e listagem. Estava vazia nessa consulta. A permissão retornada identifica essa conta como proprietária; nenhuma permissão pública foi retornada. O conector informa capacidade de compartilhar, mas não expôs separadamente capacidade de adicionar arquivos; nenhum envio foi testado. Não houve upload, novo compartilhamento ou alteração de acesso. Identificadores e metadados da consulta estão em `.cache/capas-verificacao/drive-leitura.json`, fora do Git.

Esse acesso do assistente não configura a integração do aplicativo: OAuth do painel continua não configurado. A cópia externa precisa de ação expressamente autorizada, definição dos componentes e tratamento privado da configuração/chave. Não enviar apenas o ZIP do navegador como se fosse backup integral, nem sincronizar SQLite aberto. A existência da pasta e a propriedade confirmada não comprovam uma cópia externa concluída.

## Onde ficam os dados

| Componente | Local e conteúdo | Como preservar |
|---|---|---|
| Navegador | IndexedDB da origem/perfil Chrome: catálogo privado, rankings, produções, anexos, capas, postagens, textos e histórico | Backup e arquivos → Baixar backup ZIP, no perfil e endereço usados diariamente |
| Serviço | Diretório privado configurado, normalmente `.cache/publishing-private/`: `publishing.sqlite`, `media/`, `sources/`, `assembly/`, `collections/`, identidade da instalação | Criar snapshot do serviço após ativação da V2.8.0 e enquanto não há trabalhos ativos |
| Configuração e ferramentas | Configuração `.env` e chave técnica originais, código deste projeto, ferramentas locais de importação/renderização e artes do aplicativo | Cópia privada separada; não colar chaves no painel/chat, não renovar a chave existente |
| Arquivos externos | Originais do usuário, Downloads, ZIPs exportados e projetos externos CapCut | Cópia própria em armazenamento externo; não entram automaticamente nos backups acima |

**A recuperação completa é composta.** O ZIP do navegador sozinho não contém o banco nem as mídias do serviço. O snapshot do serviço sozinho não contém IndexedDB, configuração/chave ou código/ferramentas. Esses componentes não são sincronizados pelo Git. Perfis/origens/portas diferentes têm bancos de navegador diferentes.

## Backup manual

1. Termine/cancele trabalhos pelo fluxo normal e aguarde o encerramento. Recebimentos ativos impedem o snapshot; o programa não os cancela para fazer backup. Não há agendamento automático.
2. Em **Backup e arquivos**, use **Baixar backup ZIP**. Ele captura as tabelas em uma transação IndexedDB e conserva IDs/vínculos. O manifesto informa versão, contagens, escopo e SHA-256 de cada anexo. Guarde o ZIP antes de qualquer restauração.
3. Abra o detalhe **Armazenamento e backup do serviço local**. **Ver uso de espaço** informa SQLite/WAL/SHM, fontes, entradas de montagem, vídeos, coletâneas, snapshots e espaço livre. O número do navegador é uma estimativa da origem, incluindo cache; não é a soma do disco nem apenas IndexedDB. Downloads e arquivos externos ficam fora da contagem do serviço.
4. Clique **Criar snapshot do serviço**. As alterações por API aguardam a conclusão; leituras de progresso continuam disponíveis. O snapshot usa a API de backup do SQLite aberto, sem copiar WAL isoladamente, e depois verifica os arquivos referenciados. Rede/worker precisam estar desativados, como na configuração local atual. A chave/configuração não são lidas para o manifesto.
5. Aguarde **Snapshot concluído**. A pasta privada mostrada contém `publishing.sqlite`, `manifest.json` e `blobs/`. O manifesto registra versão, esquema, contagens, caminhos lógicos e hashes; não inclui senha, chave ou tokens em texto. O SQLite é privado e pode conter informações sensíveis/cifradas; proteja a pasta inteira. Mídia somente remota é identificada como ausente do backup local, sem promessa de recuperação offline desse arquivo.
6. Copie a pasta concluída inteira e o ZIP do navegador para um armazenamento externo, com a configuração/chave guardadas privadamente. Snapshot no mesmo disco protege contra erro lógico, mas não contra falha desse disco. Nenhum envio ao Drive é realizado por este fluxo.

**Cancelar snapshot** encerra a cópia e conserva a pasta incompleta identificada por `INCOMPLETO.json`. Uma queda pode deixar uma pasta sem manifesto completo. Não restaurar pastas incompletas; nenhum arquivo do acervo ou backup anterior é removido automaticamente. Sem espaço suficiente, a operação falha preservando a origem. É possível guardar os componentes separadamente; não foi implementado um backup incremental entre gerações.

## Reutilização sem apagar arquivos

Novos ZIPs do navegador guardam bytes idênticos uma vez e mantêm referências por ID. Mesmo nome não significa mesmo conteúdo; anexos de mesmo nome com hashes diferentes continuam separados. Novos ZIPs usam schema 3 e requerem V2.8.0 ou posterior para restaurar. Backups schema 2 anteriores continuam legíveis pela versão nova, sem conversão destrutiva. Não houve migração ou exclusão de anexos existentes no IndexedDB.

Dentro de cada novo snapshot, bytes de mesmo SHA-256 são copiados uma vez para `blobs/`; nomes, versões e caminhos originais permanecem no manifesto e são reconstruídos na restauração. Não são hard links para a origem: mudar uma origem não altera o backup. Gerações anteriores continuam independentes e consomem espaço. O importador já reutiliza fontes por hash, entradas de montagem já compartilham arquivos e destinos podem apontar ao mesmo MP4. O cache temporário de envio da montagem agora usa a identidade do Blob, evitando tratar arquivos distintos de mesmo nome/tamanho/data como iguais. Nenhum arquivo existente foi removido para deduplicar.

## Conferir e restaurar sem sobrescrever a operação

Não restaure sobre o diretório operacional para testar. Na raiz principal, com Node 24, use:

```powershell
node scripts/restore-service.mjs verify "CAMINHO_DA_PASTA_DO_SNAPSHOT"
node scripts/restore-service.mjs restore "CAMINHO_DA_PASTA_DO_SNAPSHOT" "DIRETORIO_NOVO_INEXISTENTE"
```

O verificador confere SQLite, contagens, referências e hashes antes de criar o destino. O comando recusa destino existente e caminhos internos ao backup, revalida os bytes copiados e preserva qualquer restauração interrompida como incompleta. Reexecutar para o mesmo destino é recusado; use outro diretório novo, preservando o anterior. Não edite o manifesto para fazer um snapshot corrompido passar.

Na cópia restaurada, máquina e rotina ficam pausadas, sessões são removidas e tarefas de publicação não terminadas passam para conciliação. IDs, produções, mídias, fontes, presets/CTAs, coletâneas, registros já terminados e histórico são preservados. A identidade do snapshot não comprova exclusividade entre computadores. Configuração/chave originais precisam ser reaplicadas privadamente antes de usar dados cifrados; não inicie uma segunda operação concorrente.

Para o navegador, abra o aplicativo em **perfil de teste independente** e use **Restaurar backup** com o ZIP. Ele verifica referências/hashes antes da confirmação e substitui tabelas atomicamente. No uso real, essa confirmação substitui o IndexedDB daquele perfil/origem; faça backup antes. Só adote uma recuperação operacional após conferir os componentes, manter a origem parada e tratar a conciliação pelo fluxo existente. Esta rodada não restaurou nada sobre dados de Ricardo.

## Evidências e limites

Testes em `.cache/storage8/` e `.cache/storage8-regression/`, com bancos, diretórios e perfis Chrome temporários. Restauração composta conferiu a mesma produção entre navegador/serviço, rankings, textos, anexos, fontes, CTAs, coletâneas, hashes e IDs. Falta o exercício de recuperação com o acervo real e a cópia externa de responsabilidade do proprietário; não foi declarado que já existe backup integral operacional atualizado. A consulta externa do baixador do item 7 continua sem homologação de download; isso não bloqueia o fluxo de backup.
