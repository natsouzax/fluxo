# Política de Privacidade — Fluxo

**Última atualização:** 29 de julho de 2026

O Fluxo é um app de finanças pessoais, notas e rotina. Esta política descreve como o app trata seus
dados. Em resumo: **o Fluxo não tem servidor e não coleta nada sobre você.**

## Resumo

| | |
|---|---|
| Coletamos dados pessoais? | **Não** |
| Há servidor ou banco de dados nosso? | **Não** |
| Seus dados saem do aparelho? | Só se **você** configurar a IA — e apenas para a Anthropic |
| Há anúncios ou rastreadores? | **Não** |
| Vendemos ou compartilhamos dados? | **Nunca** |

## Onde seus dados ficam

Tudo que você cria no Fluxo — contas, transações, orçamentos, metas, notas, compromissos e o
histórico de conversa com a IA — fica **armazenado exclusivamente no seu aparelho**:

- **AsyncStorage** para dados de uso geral (finanças, notas, agenda, chat).
- **Android Keystore**, via [`expo-secure-store`](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/),
  para a chave de API da IA.

Não há conta em servidor nosso, não há sincronização em nuvem e não há backup do nosso lado.
**Se você desinstalar o app, esses dados são apagados junto e não podem ser recuperados.**

## Quando algum dado sai do aparelho

Somente em uma situação, e apenas se você optar por ela:

### Recurso de IA (opcional, desligado por padrão)

Se — e somente se — você configurar sua própria chave de API em **Ajustes → IA**, o app envia para
a [API da Anthropic](https://www.anthropic.com/legal/privacy) as informações necessárias para
responder sua pergunta: sua mensagem, mais um resumo do seu contexto financeiro (saldos, transações
recentes, orçamentos, metas e títulos de notas).

- Esse envio vai **direto do seu aparelho para a Anthropic**, por HTTPS. Não passa por nenhum
  servidor nosso — nós não temos servidor.
- A chave é sua, cadastrada por você, e fica só no seu aparelho.
- O tratamento desses dados pela Anthropic segue a
  [política de privacidade](https://www.anthropic.com/legal/privacy) e os
  [termos comerciais](https://www.anthropic.com/legal/commercial-terms) deles.
- **Sem chave configurada, o app funciona em modo offline e nada é enviado a lugar nenhum.**

### Google Calendar / Gmail (opcional, ainda não ativo)

O app tem o fluxo de OAuth do Google implementado, mas ele só funciona se um Client ID for
configurado. Quando ativo, o acesso é **somente leitura**, o token fica no aparelho, e os dados de
agenda são usados apenas para exibir seus compromissos na aba Rotina. Você pode revogar o acesso a
qualquer momento em [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

## O que o app NÃO faz

- Não coleta identificadores de publicidade, localização, contatos, fotos, câmera ou microfone.
- Não usa analytics, telemetria ou crash reporting de terceiros.
- Não exibe anúncios.
- Não vende, aluga nem compartilha dados com terceiros.
- Não se conecta a bancos. Os dados financeiros exibidos são **dados de exemplo** embutidos no app.

## Seus direitos (LGPD / GDPR)

Como não coletamos nem armazenamos seus dados, não temos nada seu para acessar, corrigir ou excluir.
Você tem controle direto e total:

- **Excluir tudo:** desinstale o app, ou use "Limpar dados" nas configurações do Android.
- **Excluir a chave da IA:** Ajustes → IA → apagar o campo → Salvar.
- **Revogar o Google:** [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

## Crianças

O Fluxo não é direcionado a menores de 13 anos e não coleta dados de ninguém, incluindo crianças.

## Alterações

Mudanças nesta política serão publicadas nesta página, com a data de atualização revisada. Alterações
relevantes serão comunicadas nas notas de versão do app.

## Contato

Dúvidas sobre privacidade: **natanaplications@gmail.com**

Questões de segurança: ver [SECURITY.md](SECURITY.md).
