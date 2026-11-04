# Fluxo

**Seu assistente pessoal para finanças, notas e rotina, começando pela conversa.**

Status: protótipo em desenvolvimento. Perfis novos começam sem dados de exemplo. O login é local neste
aparelho e ainda não valida identidade em um servidor. O assistente usa regras locais por padrão. Há
uma opção de OpenRouter via backend somente local, ativada explicitamente em desenvolvimento.

## Visão e funcionamento atual

A visão é gerir o fluxo da vida conectando finanças, compromissos e anotações por um assistente.
Nesta fase, o Fluxo consulta os registros disponíveis e abre as abas; ainda não registra despesas,
cria notas ou altera compromissos por conversa. Relações de causa entre rotina e gastos e projeções
financeiras não estão implementadas.

Depois do login ou da restauração de sessão, a primeira aba é **Fluxo**, com saudação, resumo dos dados,
atalhos e chat. A barra inferior mantém Fluxo, Finanças, Notas, Rotina e Ajustes.

| Pergunta | Comportamento local |
|---|---|
| “Quero ver minhas finanças” | Abre Finanças |
| “Qual meu saldo?” | Soma saldos disponíveis, mantendo moedas separadas |
| “Quanto gastei hoje?” | Soma saídas do dia nos registros disponíveis |
| “E ontem?” | Mantém o assunto financeiro da pergunta anterior e troca o período |
| “Como está meu orçamento?” | Calcula uso proporcional a partir das transações do mês |
| “Como está minha reserva?” | Mostra valores registrados e quanto falta para a meta |
| “Meus compromissos amanhã” | Lista os eventos registrados que se sobrepõem ao dia |
| “Buscar notas sobre viagem” | Busca em títulos, corpos e tags |
| “Faça um resumo do meu dia” | Reúne gastos do mês, agenda de hoje e quantidade de notas |
| “Registre uma despesa” | Explica a limitação; não altera os dados |

O motor é determinístico e limitado ao vocabulário implementado. Não deve ser apresentado como IA
generativa. Perguntas que ele não entende recebem exemplos do que é possível consultar.

## Rodando localmente

Requisitos: Node 22.13+ e Expo Go compatível com SDK 57 no Android.

```bash
npm ci
npx expo start --go
```

Para começar, toque em **Criar conta** e use seus próprios dados. O cadastro é armazenado localmente
neste aparelho; ainda não há autenticação de produção. Para um development build já instalado:
`npx expo start --dev-client`.

```bash
npm run typecheck
npm test -- --runInBand --ci
```

Não é necessário criar `.env` ou cadastrar uma chave para testar o assistente local.
Para IA opcional, veja [OpenRouter em desenvolvimento](docs/OPENROUTER-DEV.md).

## Arquitetura e dados

- `src/services/localAssistant.ts`: interpretação por regras e respostas sobre os dados locais.
- `src/services/assistantTypes.ts`: contrato de contexto, histórico e resposta do assistente.
- `src/services/assistantNavigation.ts`: destinos permitidos para pedidos explícitos de navegação.
- `src/services/remoteAssistant.ts`: backend local opcional, contexto reduzido e retorno ao modo local.
- `server/`: backend de desenvolvimento com AI SDK; credencial exclusivamente no ambiente do servidor.
- `src/domain/`: cálculos financeiros e seleção de eventos do dia.
- `src/store/`: estado Zustand; dados em AsyncStorage e ajustes em SecureStore.
- `src/store/profileStorage.ts`: separação por perfil, ordenação de gravações e invalidação de sessão.
- `src/data/financeMetrics.ts`: cálculos puros de saldo e gastos; perfis começam sem registros financeiros pré-carregados.
- `src/screens/` e `src/navigation/`: telas e navegação React Navigation.

Finanças, notas, agenda e histórico são persistidos no aparelho, sem criptografia de aplicação.
Os perfis evitam mistura acidental, mas não são uma barreira de autenticação. Logout limpa a memória
e mantém o perfil no disco. Não há backend de produção, sincronização em nuvem ou recuperação implementados.
Notas são gravadas enquanto se edita; o indicador confirma a operação de disco ou informa falha.

Registros globais da versão antiga, sem dono verificável, são preservados e não são importados
automaticamente. Ajustes por perfil são migrados para remover a antiga chave pessoal e a permissão
de envio à Anthropic. Não há mais integração direta com Anthropic no cliente. Essa remoção não revoga
chaves no fornecedor nem apaga registros globais legados sem proprietário.

## Integrações externas

Na tela **Conexões**, o usuário pode permitir acesso aos calendários do aparelho e escolher quais
mostrar na aba **Rotina**. Isso inclui calendários Google que já estejam sincronizados no telefone.
Os eventos são lidos em uma janela em torno do dia selecionado e podem ser atualizados pelo botão
de recarregar. O Fluxo não altera eventos do aparelho. A permissão requer uma nova build nativa
com `expo-calendar`; o recurso não funciona no Expo Go.

A conexão direta à API do Google continua experimental: o Client ID em `app.json` está nulo e o
OAuth nativo ainda não foi validado. O fluxo atual não renova o token; depois que ele expira, é
necessário reconectar. O Google não aceita redirecionamentos por esquema próprio para apps Android,
portanto configurar apenas o Client ID não basta para habilitar esse caminho no Android. O escopo
solicitado pela conexão direta agora é somente leitura do Calendar.

Perfis novos não carregam contas ou transações fictícias. Open Finance ainda não está configurado;
uma integração real exige backend e implementação adicional. Nenhum segredo de agregador deve ficar no app.

## IA experimental e direção para produção

A decisão do produto é usar uma credencial administrada pelo dono do Fluxo, sem pedir chave ao usuário.
O fluxo experimental é **app → backend local do Fluxo → OpenRouter → modelo gratuito**.
O responsável administra a chave em `server/.env`; a raiz `.env` contém somente a URL pública.
A configuração local foi validada com uma geração real gratuita. O backend não autentica usuários de
produção e só escuta no computador local. O cliente bloqueia a opção em builds de produção.

Opções gratuitas e critérios para experimentar estão em [Assistente local e IA futura](docs/ASSISTENTE-LOCAL.md).
Nenhum plano pago, fallback pago, download de modelo ou deploy foi ativado. Consultas conhecidas
continuam locais; somente perguntas não reconhecidas seguem para IA com permissão ativa. Falhas
retornam ao algoritmo local. Configuração e restrições em [OPENROUTER-DEV](docs/OPENROUTER-DEV.md).

## Verificação e pendências

O projeto tem testes de domínio, persistência de perfis, notas e interação do chat. Testes de componentes
simulam infraestrutura nativa e não substituem validação de teclado, layout, rolagem e Voltar no aparelho.

Continuam pendentes: autenticação real, entrada de dados financeiros pelo usuário, escrita por conversa,
sincronização, Open Finance, validação de Google, triagem de dependências e distribuição.
Veja [SECURITY.md](SECURITY.md) e [PRIVACY.md](PRIVACY.md).

## Stack

React Native 0.86 · Expo SDK 57 · TypeScript · Zustand · React Navigation 7 · AsyncStorage · SecureStore · Jest.

## Licença

[MIT](LICENSE) © Natan Souza
