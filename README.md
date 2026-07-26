# Fluxo

Finanças + notas + rotina, com uma IA que conhece seu contexto financeiro. Pensado como um
cruzamento entre o **My Finances** (controle de contas/orçamento), o **Pierre** (IA financeira
conversacional) e o **Notion** (notas e organização), com UI inspirada nos kits do **Revolut** e
**Wise**.

Este é um MVP em React Native (Expo), focado em Android.

## Rodando agora (teste real no celular)

Não há Android SDK/emulador configurado nesta máquina, então o caminho mais rápido para testar em
um aparelho real é o **Expo Go**:

1. Instale o app **Expo Go** na Play Store do seu Android.
2. Nesta pasta, rode:
   ```bash
   npm install
   npx expo start
   ```
3. Escaneie o QR code que aparece no terminal com o Expo Go.

O app abre direto com dados de exemplo (contas, transações, orçamentos, metas, notas e agenda já
populados), então dá para navegar por tudo sem configurar nada.

Se depois você instalar o Android Studio/emulador, `npm run android` funciona normalmente. Para
gerar um APK de verdade (fora do Expo Go), use o EAS Build (`npx eas build -p android`), que builda
na nuvem e não exige SDK local.

## O que já funciona no MVP

- **Início**: saldo total, carrossel de contas, gráfico de gastos por categoria, orçamentos com
  barra de progresso, transações recentes.
- **Contas e metas**: lista completa de contas conectadas e metas de poupança com progresso.
- **IA (Chat)**: copiloto financeiro. Sem chave de API, responde em modo offline com respostas
  básicas sobre saldo/orçamento; com uma chave da Anthropic configurada em Ajustes, conversa de
  verdade usando o Claude, com contexto real das suas contas, transações, orçamentos, metas e notas.
- **Notas**: criar, editar, apagar e marcar notas com tags — pensado para decisões e rotina ligadas
  às finanças (ex: vincular uma nota a uma meta).
- **Rotina (Agenda)**: lista de compromissos do dia, com destaque para eventos financeiros
  (vencimento de fatura etc). Pronto para receber eventos reais do Google Calendar assim que a
  conexão Google for configurada.
- **Ajustes/Conexões**: tela para guardar a chave da IA (fica só no aparelho, via Android
  Keystore/`expo-secure-store`) e gerenciar conexões de banco e Google.

Tudo isso já é "nativo funcional": estado persistido localmente (AsyncStorage/SecureStore), sem
backend necessário para o modo de exemplo.

## O que é mock hoje e por quê

Três integrações pedidas (bancos, Google, IA sem chave própria) dependem de credenciais que só o
dono do app pode gerar — por isso ficaram como uma camada bem definida, fácil de trocar, em vez de
uma tela quebrada:

### 1. IA (Claude)
Já é uma integração real (`src/services/aiService.ts`, chama a API da Anthropic diretamente do
app). Só falta você colar sua própria chave em **Ajustes → IA** (gere em
console.anthropic.com). Sem chave, o app cai num modo offline com respostas simples
(`offlineFallbackReply`).

> Observação de segurança: para produção de verdade, o ideal é a chave da IA ficar num backend seu
> (a chamada ao Claude sai do seu servidor, não do app), para não expor a chave se o APK for
> decompilado. Para o MVP/testes locais, guardar no SecureStore do próprio usuário é aceitável.

### 2. Bancos (Open Finance)
`src/services/openFinance.ts` define a interface que qualquer agregador precisa satisfazer
(`connect()` retornando contas + transações). Hoje só o `mockProvider` está ativo.

Para conectar bancos de verdade (Nubank, Inter, etc via Open Finance Brasil), o caminho comum é um
agregador como **Pluggy** ou **Belvo**:
- Eles exigem uma conta business (KYC da empresa, não só do dev).
- O client secret do agregador **não pode** ir dentro do app — é preciso um backend simples que
  gere o `connect_token` e repasse para o app (o app abre o widget de conexão do agregador com esse
  token).
- Depois disso, troque `mockProvider` por `pluggyProvider` em `openFinance.ts` e plugue o widget
  (ex: `react-native-pluggy-connect`).

### 3. Google (Calendar, Gmail, Drive)
`src/services/googleAuth.ts` já tem o fluxo OAuth real (via `expo-auth-session`) e chamadas prontas
para Calendar e Gmail. Falta só:
1. Criar um projeto no [Google Cloud Console](https://console.cloud.google.com/).
2. Ativar as APIs de Calendar, Gmail e Drive.
3. Criar um OAuth Client ID do tipo Android (usando o package `com.fluxo.app` e o SHA-1 da sua
   chave de assinatura/debug).
4. Colocar o client id em `app.json` → `expo.extra.googleOAuthClientId`.

Sem isso configurado, a tela **Conexões** mostra o botão do Google como "em breve" em vez de deixar
o usuário clicar em algo que vai falhar.

## Estrutura do projeto

```
src/
  theme/        # cores, espaçamento, tipografia (estilo Revolut/Wise)
  navigation/   # bottom tabs + stack raiz
  store/        # zustand: finanças, notas, agenda, chat, ajustes (com persistência local)
  data/         # tipos + dados de exemplo (contas, transações, orçamentos, metas)
  services/     # IA (Claude), Google OAuth/APIs, Open Finance (abstração)
  components/   # peças de UI reutilizáveis
  screens/      # telas do app
```

## Próximos passos sugeridos

1. Configurar a chave da Anthropic e usar o chat de verdade por alguns dias.
2. Decidir o agregador de Open Finance (Pluggy é o mais rápido de integrar) e montar o backend
   mínimo para gerar o `connect_token`.
3. Criar o OAuth Client ID do Google e testar a importação de agenda/Gmail.
4. Trocar os ícones/splash placeholder por uma identidade visual própria.
5. Se o volume de uso justificar, considerar rodar a chamada à IA por um backend em vez de direto
   do app (ver observação de segurança acima).
