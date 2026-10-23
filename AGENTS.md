# Instruções de continuidade

- Use português brasileiro por padrão.
- Leia CONTINUIDADE.md, README.md e docs/VALIDACAO_V2.md antes de alterar o projeto.
- Preserve a aplicação e os materiais existentes. Não recrie o projeto.
- Confira git status e não sobrescreva alterações do proprietário.
- O aplicativo é estático; IndexedDB guarda dados privados no navegador, fora do Git.
- Nunca comite credenciais, backups pessoais ou acervo operacional pesado.
- Não modifique bancos de outros projetos nem presuma que APIs estejam configuradas.
- Preserve operações transacionais e referências em backup/restauração.
- Execute testes proporcionais à mudança e registre limitações reais.
- Gastos, integrações com envio real, migrações e alterações de produção dependem da autorização pertinente do usuário.

- A V2.2 acrescenta serviço opcional em server/runtime/. Leia docs/PUBLICACAO_SERVIDOR.md antes de alterar publicação. A origem estática continua funcional; o banco local não foi migrado para nuvem.
- Não ativar as flags de rede/publicação/worker nem inserir credenciais reais como parte de testes. Preserve a separação entre simulação, rascunho manual e resultado confirmado.
