# Fluxo

**Finanças, notas e rotina num app só — com uma IA que enxerga seu contexto financeiro.**

Um app React Native (Expo) que cruza o controle de contas de um **My Finances**, o copiloto
conversacional do **Pierre** e a organização em notas do **Notion**, com a linguagem visual dos kits
do **Revolut** e do **Wise**.

[![CI](https://github.com/natsouzax/fluxo/actions/workflows/ci.yml/badge.svg)](https://github.com/natsouzax/fluxo/actions/workflows/ci.yml)
![Expo SDK 57](https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white)
![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Status:** MVP funcional, em preparação para a Play Store. Os dados financeiros são de exemplo —
> ver [O que é real e o que é mock](#o-que-é-real-e-o-que-é-mock).

---

## A ideia

A maioria dos apps de finanças responde "quanto você gastou". Poucos respondem **"e daí?"**.

O Fluxo parte do princípio de que decisão financeira não acontece numa planilha isolada: ela depende
do que você anotou, do que vence essa semana e de quanto sobra até o fim do mês. Por isso as três
partes — **finanças**, **notas** e **agenda** — compartilham o mesmo estado, e a IA recebe as três
como contexto na mesma chamada.

Perguntar "posso viajar em março?" cruza saldo, orçamento, metas e os compromissos já marcados.

---

## Telas

| Início | Copiloto IA | Notas | Rotina |
|---|---|---|---|
| Saldo consolidado, carrossel de contas, gastos por categoria, orçamentos com progresso animado | Chat com contexto financeiro real injetado no system prompt | Notas com tags, ligadas a decisões e metas | Compromissos do dia com destaque para eventos financeiros |

> 📸 _Screenshots a adicionar — rode `npx expo start` e veja no Expo Go._

---

## Rodando localmente

Requisitos: Node 20+ e o app **Expo Go** no Android.

```bash
git clone https://github.com/natsouzax/fluxo.git
cd fluxo
npm install
npx expo start
```

Escaneie o QR code com o Expo Go. O app abre já populado com dados de exemplo — dá para navegar por
tudo sem configurar nada.

**Conta de teste:** o login vem pré-preenchido (`teste@fluxo.app` / `fluxo123`). É só tocar em Entrar.

```bash
npm run typecheck   # tsc --noEmit
npm test            # 24 testes (Jest + jest-expo)
```

Para gerar um APK real, sem Expo Go:

```bash
npx eas build -p android --profile preview
```

---

## Arquitetura

```
src/
  theme/        # design tokens: cores, espaçamento, tipografia, raios
  navigation/   # bottom tabs + stack raiz + stack de auth, com navigationRef
  store/        # Zustand: finanças, notas, agenda, chat, auth, ajustes, drawer
  data/         # tipos do domínio + seed data (contas, transações, orçamentos)
  services/     # IA (Claude), Google OAuth, Open Finance (interface trocável)
  components/   # UI reutilizável (cards, botões, animações)
  screens/      # telas, incluindo o fluxo de autenticação
```

### Decisões que valem comentar

**Zustand com persistência seletiva por sensibilidade.** Cada store escolhe o storage conforme o que
guarda: finanças, notas, agenda e chat vão para `AsyncStorage`; **ajustes vão para
`expo-secure-store`**, porque guardam a chave da API — no Android isso significa Keystore do sistema,
não texto plano.

**A camada de Open Finance é uma interface, não uma integração.** `src/services/openFinance.ts`
define o contrato (`connect()` devolvendo contas + transações) e hoje só o `mockProvider` o
implementa. Trocar por Pluggy ou Belvo é substituir uma implementação, não reescrever as telas — o
resto do app só conhece o contrato.

**O contexto da IA é montado a partir do estado vivo.** `buildSystemPrompt()` serializa saldo,
transações recentes, orçamentos, metas e notas a cada pergunta. Não há RAG nem embeddings: para o
volume de um usuário pessoal, mandar o snapshot inteiro é mais simples, mais barato e mais preciso.

**O histórico do chat é saneado antes de virar request.** A Messages API exige que a primeira
mensagem seja `user`, e o chat abre com uma saudação do assistente. `toApiHistory()` descarta o que
vem antes do primeiro turno do usuário e funde turnos consecutivos do mesmo papel — [coberto por
testes](src/services/__tests__/aiService.test.ts).

---

## O que é real e o que é mock

Honestidade sobre o estado do MVP:

| Área | Estado |
|---|---|
| Navegação, telas, animações, tema | ✅ Real |
| Persistência local (AsyncStorage + SecureStore) | ✅ Real |
| Notas — criar, editar, apagar, tags | ✅ Real |
| Orçamentos, metas, agregação de gastos | ✅ Real (sobre dados de exemplo) |
| **Chat com IA** | ✅ **Integração real** com a API da Anthropic. Sem chave, cai num modo offline com respostas básicas |
| Google Calendar / Gmail | 🟡 OAuth implementado, precisa de um Client ID do Google Cloud |
| Contas e transações bancárias | 🔴 Dados de exemplo (`src/data/mockFinance.ts`) |
| Autenticação | 🔴 Mock — aceita qualquer e-mail/senha válidos, sem backend |

As três lacunas dependem de credenciais que só o dono do app pode gerar. Em vez de deixar telas
quebradas, cada uma virou uma camada bem delimitada e fácil de trocar.

### Ativando a IA de verdade

1. Gere uma chave em [console.anthropic.com](https://console.anthropic.com).
2. No app: **Ajustes → IA → colar a chave → Salvar**.

A chave fica só no seu aparelho, no SecureStore. O app passa a usar o Claude com contexto real das
suas contas, transações, orçamentos, metas e notas.

### Conectando bancos (Open Finance)

Agregadores como **Pluggy** ou **Belvo** exigem conta business (KYC de empresa) e — crucialmente —
o client secret **não pode** ficar no app. É preciso um backend mínimo que gere o `connect_token` e
o repasse. Com isso pronto, troque `mockProvider` por `pluggyProvider` em `openFinance.ts`.

### Conectando o Google

Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/), ative as APIs de
Calendar/Gmail/Drive, gere um OAuth Client ID do tipo Android (package `com.fluxo.app` + SHA-1 da sua
chave de assinatura) e coloque em `app.json` → `expo.extra.googleOAuthClientId`. Sem isso, a tela de
Conexões mostra o Google como "em breve" em vez de um botão que falha.

---

## Segurança

Ver [SECURITY.md](SECURITY.md) para o modelo de ameaça completo. Resumo:

- **Nenhuma credencial neste repositório.** Chaves ficam no aparelho do usuário via SecureStore.
- A chave da IA sair do dispositivo é uma **limitação aceita do MVP**, não um descuido — funciona
  porque a chave é do próprio usuário. Migrar para um backend está no roadmap.
- Autenticação e dados bancários são mock. Nenhum dado real de ninguém passa por aqui.

## Privacidade

O app **não tem servidor e não coleta nada**. Tudo fica no aparelho (AsyncStorage + Keystore). O
único dado que sai do dispositivo é a pergunta enviada à API da Anthropic — e só se o usuário
configurar a própria chave. Política completa em [PRIVACY.md](PRIVACY.md).

Para a **Data Safety** da Play Store, isso corresponde a: nenhum dado coletado, nenhum dado
compartilhado, sem rastreadores, sem anúncios.

---

## Roadmap

- [ ] Backend próprio para a chamada da IA (tirar a chave do dispositivo)
- [ ] Autenticação real substituindo o mock
- [ ] Integração Open Finance via Pluggy, com o backend do `connect_token`
- [ ] Google Calendar populando a aba Rotina
- [ ] Identidade visual própria — ícone e splash ainda são placeholder
- [ ] Publicação na Play Store

---

## Stack

React Native 0.86 · Expo SDK 57 · TypeScript · Zustand · React Navigation 7 ·
expo-secure-store · expo-auth-session · react-native-chart-kit · date-fns · Jest

## Licença

[MIT](LICENSE) © Natan Souza
