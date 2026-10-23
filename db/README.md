# Banco em nuvem — proposta, não integração ativa

O núcleo V2 usa IndexedDB e não depende deste SQL. `schema-proposto.sql` é uma proposta de 17 tabelas relacionais, FKs com proprietário, restrições, índices e RLS. Não foi executada nem validada contra PostgreSQL. Não há credenciais no projeto.

Antes de transformar o esquema em migração aplicada: escolher/criar ambiente dedicado de homologação com autorização, gerar o arquivo pelo CLI Supabase, adaptar importação do backup, testar constraints/RLS com dois usuários e falhas parciais, testar restauração, revisar exposição do schema à Data API e só então migrar. A homologação de outros projetos existentes não foi alterada.

O Google Drive deverá guardar os arquivos; o banco terá referências e hashes. Arquivos e tokens não devem virar colunas de texto base64 ou constantes públicas. O schema privado `gmm` precisa de política de exposição explícita se for usado pela Data API. Atualização de `updated_at`, retenção do log e transações de sincronização deverão ser fechadas na migração de homologação.
