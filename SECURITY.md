# Política de segurança

## Reportar uma vulnerabilidade

Abra uma [Security Advisory privada](https://github.com/natsouzax/fluxo/security/advisories/new)
no GitHub, ou mande um e-mail para **natanaplications@gmail.com**. Por favor, não abra uma issue
pública para falhas de segurança.

Retorno esperado em até 5 dias úteis.

## O que este repositório contém — e não contém

Este repositório é **público de propósito**, como portfólio. Nada aqui é segredo:

| Item | Onde vive | Está no repo? |
|---|---|---|
| Chave da API da Anthropic | `expo-secure-store` no aparelho do usuário | ❌ nunca |
| Google OAuth Client ID | `app.json` → `expo.extra.googleOAuthClientId` (nulo aqui) | ❌ nulo por padrão |
| Client secret de agregador Open Finance | backend próprio (ainda não existe) | ❌ nunca |
| Keystore de assinatura Android | EAS Build (nuvem) / máquina local | ❌ ignorado no git |
| EAS `projectId` e `owner` | `app.json` | ✅ são identificadores públicos, não credenciais |

O [.gitignore](.gitignore) bloqueia explicitamente `.env`, `google-services.json`,
`GoogleService-Info.plist`, keystores (`*.jks`, `*.keystore`, `*.p12`) e certificados.

## Modelo de ameaça conhecido

### A chave da IA fica no aparelho (aceito no MVP, não em produção)

O app chama a API da Anthropic **direto do dispositivo**, com a chave que o próprio usuário cola em
Ajustes. Ela é guardada via [`expo-secure-store`](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/),
que no Android usa o Keystore do sistema.

Isso é aceitável enquanto **a chave é do próprio usuário** — ele só pode vazar a si mesmo. **Não é
aceitável** num modelo em que o app usa uma chave minha: um APK pode ser decompilado, e o tráfego,
interceptado. A migração planejada é mover a chamada para um backend próprio, com o app autenticando
no backend em vez de carregar a chave (ver [Roadmap no README](README.md#roadmap)).

### Autenticação é mock

`src/store/authStore.ts` aceita qualquer e-mail/senha bem formados e guarda a sessão localmente.
**Não há backend, não há verificação, não há dado real de ninguém.** Está marcado como mock no
código e existe apenas para demonstrar o fluxo de telas. Precisa ser substituído por autenticação
de verdade antes de qualquer uso com dados reais.

### Dados financeiros são de exemplo

Contas, transações, orçamentos e metas vêm de `src/data/mockFinance.ts`. Nenhum banco real está
conectado, e o app não faz upload de nada para lugar nenhum — a persistência é local
(AsyncStorage/SecureStore).

## Dependências

`npm audit` reporta vulnerabilidades transitivas no toolchain do Expo (`@expo/config`,
`@expo/config-plugins`). São dependências de **build**, não vão para o bundle do app, e `npm audit
fix --force` quebra o Expo SDK 57. Serão resolvidas quando o Expo publicar as atualizações upstream.
