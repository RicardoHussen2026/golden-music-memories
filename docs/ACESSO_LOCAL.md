# Acesso local sem senha — PC de casa

Estado de 24/10/2026. Esta orientação substitui a pendência anterior de login manual no PC de casa.

## Uso diário

Na pasta `C:\Users\RicardoPC\Documents\Codex\Golden Music Memories\golden-music-memories`, abra um terminal e execute:

```powershell
npm.cmd run service
```

Abra **http://127.0.0.1:8877/painel.html** no Chrome habitual. O acervo do serviço abre automaticamente, sem consultar ou digitar senha. Mantenha o terminal aberto; para encerrar, Ctrl+C e, se o npm perguntar se deseja finalizar o arquivo em lotes, responda S. Reabrir usa o mesmo comando e endereço. Não executar duas cópias ao mesmo tempo.

Em Configurações, **Pausar acesso nesta aba** encerra a sessão corrente e mantém esta aba pausada mesmo após recarga. **Retomar acesso local** volta a abrir o serviço sem senha. Outra aba pode entrar automaticamente; pausa por aba não é bloqueio de segurança do computador. Esta função não pausa a rotina de produção: para isso existe Pausar computador e rotina no acervo.

## Escopo e configuração

- `GMM_LOCAL_ACCESS=true` está habilitado apenas no `.env` privado deste PC. O padrão distribuído em `.env.example` é false.
- O servidor exige bind `127.0.0.1` e origem HTTP de mesma porta. Não aceita origem pública, hostname alternativo ou bind `0.0.0.0` com esse modo.
- A emissão da sessão exige POST da origem exata, Host exato e cabeçalho próprio da aplicação; sessão usa cookie HttpOnly/SameSite=Strict e expira em oito horas. O painel renova automaticamente a entrada quando necessário.
- Conexões não loopback, cabeçalhos de proxy, origem externa/nula e pedidos sem o controle CSRF são recusados. Nenhuma liberação de firewall, LAN, túnel, redirecionamento de porta ou internet foi realizada.
- Pessoas e programas com acesso ao próprio PC podem usar o serviço. Não existe separação de identidade por conta Windows. Acesso privado pelo computador do trabalho/celular é uma etapa posterior; não usar este modo como autenticação de servidor público ou túnel.
- A senha exclusiva e a chave criadas anteriormente foram preservadas integralmente. Não há necessidade de mostrar qualquer segredo para usar o painel. Guardar a chave original continua importante para recuperar backups cifrados e futuras conexões.
- Rede externa, publicação e worker permanecem desligados. O modo sem senha não configura OAuth, não conecta contas e não autoriza publicações.

Para voltar futuramente à entrada por senha, desabilitar explicitamente `GMM_LOCAL_ACCESS` e reiniciar. Sessões emitidas no modo local são recusadas quando esse modo está desabilitado; o fluxo tradicional de senha permanece implementado e testado. Essa mudança futura não foi aplicada nesta entrega.

## Verificação real

Após habilitar e reiniciar, `/api/health` confirmou modo local e cifragem configurados, com flags externas desligadas. O Windows confirmou o listener em **127.0.0.1:8877**. O Chrome habitual abriu **Acervo e programação sem formulário de senha**, mostrando zero arquivos, computador pausado, rotina pausada e simulação. Nenhum MP4 ou produção de teste foi colocado no banco operacional.

Testes executados após a alteração:

| Conjunto | Resultado |
|---|---:|
| `tests/local-access.test.mjs` | 2 testes aprovados, incluindo várias condições positivas/negativas |
| `tests/server.test.mjs` | 28 testes aprovados |
| `tests/local-access-ui.cjs` | 9 verificações aprovadas |
| `tests/server-ui.cjs` | 9 verificações aprovadas |
| `tests/operations-ui.cjs` | 12 verificações aprovadas |
| Total desta rodada | **60 aprovações** |

Cobertura nova: acesso sem senha, bind/origem restritos, Host externo, origem externa/nula, ausência de CSRF, proxy, cookie protegido, persistência após reinício, logout/revogação, desativação do modo local, pausa por aba, reabertura e ausência de erros JavaScript. O teste de interface foi ajustado para aguardar a transição da navegação; a execução final passou.

Reprodução dos testes específicos: `npm.cmd run test:local-access`. Usam bancos temporários e Chrome isolado, com chamadas externas bloqueadas. Evidência de interface: `.cache/local-access-ui/resultado.json` e `acervo-local.png`, ambos de teste. As 160 verificações anteriores constam em VALIDACAO_LOCAL_P6.md; não foram todas repetidas porque não houve mudança nos demais fluxos.

## Alterações e limites

Reutilizados HTTP/SQLite, sessões e interface existentes. Mudanças em configuração, sessão local, cliente de API, inicialização do painel, textos operacionais e versão do cache PWA. Incluídos testes direcionados e comando npm. IDs, dados de produção, arquivos e chave de cifragem foram preservados. Sem commit, push ou deploy.

Os launchers PowerShell continuam bloqueados pela política do Windows. O caminho validado é o comando Node/npm acima; nenhuma política foi alterada e nenhum atalho/startup automático foi criado.

Falta validar uma produção com material próprio/licenciado no CapCut e devolver seu MP4 final. Integrações reais e acesso privado por outros aparelhos continuam fora desta entrega. Agenda simulada não comprova publicação no YouTube/TikTok.
