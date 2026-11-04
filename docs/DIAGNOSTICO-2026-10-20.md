# Fluxo — diagnóstico de entrada

Este documento registra o estado anterior às correções. Veja [o resultado da implementação](CORRECOES-2026-10-20.md) para o estado atualizado.

Data: 20/10/2026. Base inspecionada: `master`, commit `458b644`. Análise do código e verificações locais; sem correções de implementação, sem publicação e sem chamadas autenticadas a serviços externos.

## Visão e estágio

A visão relatada pelo usuário é integrar finanças, rotina e notas para gerir o fluxo da vida por conversa com IA. O código atual é um protótipo local navegável, com notas editáveis, dados financeiros de exemplo, agenda principalmente demonstrativa e um chat de consulta. Ainda não demonstra o ciclo completo de registrar algo por conversa, persistir uma alteração correta e refletir seu impacto em outras áreas.

O README chama o projeto de MVP funcional em preparação para a Play Store. Essa descrição excede a evidência encontrada para a visão atual. Ter telas e testes unitários passando não comprova prontidão de produto.

## Como funciona

`index.ts` registra `App.tsx`; o app carrega `RootNavigator`, que escolhe autenticação ou navegação principal a partir do Zustand. As telas leem e alteram stores locais. Finanças, notas, agenda, autenticação e chat usam AsyncStorage; ajustes, incluindo a chave da Anthropic, usam SecureStore.

Não há backend ou banco remoto implementado neste repositório. As stores usam chaves globais no aparelho, sem separação por usuário. Os domínios estão em stores distintos: a integração entre eles precisa de chamadas explícitas; compartilhar Zustand não cria relações ou regras automaticamente.

| Área | Implementação observada | Limite atual |
|---|---|---|
| Início/contas | Resumo financeiro e contas | Perfis iniciam vazios; cadastro manual e integração bancária ainda não disponíveis |
| Notas | Criar, editar, excluir, tags; salva ao sair do editor | Sem salvamento contínuo ou backup implementado |
| Rotina | Lista ordenada de eventos persistidos | Sem interface de criação/edição; sem filtro por dia |
| IA | Requisição HTTP à Anthropic com dados e histórico | Retorna texto; não registra despesas, notas ou eventos |
| Sem chave de IA | Respostas por expressões regulares | Não é inferência por modelo |
| Autenticação | Atualiza estado local | Não verifica senha com servidor |
| Recuperação de senha | Exibe estado de sucesso local | Não envia e-mail |
| Bancos | Contrato de provider e mock | Pluggy é placeholder; não integra banco real |
| Google | OAuth e busca de até 10 próximos eventos | Client ID nulo; integração não validada; sem renovação/sincronização contínua |

O `FinanceSnapshot` do chat contém contas, transações, orçamentos, metas e notas. **Não contém agenda.** O prompt inclui até 15 transações e até 10 notas, com 140 caracteres do corpo de cada nota, além do histórico enviado. Não há tools ou mecanismo de execução de ações. Gmail tem função de busca definida, sem uso encontrado na interface; Drive aparece nos escopos, sem fluxo implementado.

## Verificações executadas

- `npm run typecheck`: passou.
- `npm test -- --runInBand --ci`: 3 suítes, 31 testes passaram.
- `npx expo export --platform android --output-dir <pasta temporária>`: passou; 1.146 módulos empacotados e bundle Hermes gerado. Isso não equivale a compilar/instalar um APK ou testar no aparelho.
- `npx expo install --check`: apontou 12 pacotes fora das versões recomendadas, incluindo Expo, React Native, módulos Expo, jest-expo e @types/jest.
- `npm audit --json`: 67 entradas de vulnerabilidade: 12 moderadas, 54 altas, 1 crítica. Essas contagens incluem propagação entre dependências; não representam 67 ataques comprovados ao app.
- Ambiente observado: Node 24.19.0 e npm 11.17.0.

Os testes cobrem formatação, helpers financeiros, dados de exemplo, normalização de histórico e resposta offline. Não há testes das stores, telas, ciclo de autenticação, requisição real de IA, OAuth ou persistência após interrupção. Nenhuma validação interativa em aparelho foi realizada nesta análise.

A documentação exata do SDK 57 informa Node mínimo 22.13.x. README e CI usam Node 20: precisam de alinhamento. Fonte: https://docs.expo.dev/versions/v57.0.0/

## Problemas e riscos com evidência

| Prioridade | Evidência | Impacto / reprodução a validar |
|---|---|---|
| Alta antes de dados pessoais | `authStore.logout` só limpa usuário e flag; demais stores e ajustes têm chaves globais | Entrar como A, criar nota, sair e entrar como B mantém os mesmos dados e chave de IA. Login atual não é barreira de segurança. |
| Alta | `chatStore` persiste `isSending`, sem `partialize` ou reset de hidratação | Encerrar durante envio e reabrir pode restaurar `true`, bloqueando novos envios. Risco deduzido do código; precisa de reprodução em aparelho. |
| Alta | `financeStore.addTransaction` incrementa orçamento, sem atualizar saldo, validar conta/valor, evitar duplicidade ou considerar mês | Ao conectar um fluxo de escrita, saldo e gasto podem divergir. A política de saldo de conta precisa ser definida antes de corrigir. |
| Alta | Home soma `budgets.spent` para “gasto do mês”; gráfico agrega todas as saídas sem filtrar mês | Indicadores não usam a mesma fonte nem período. Seeds também não conciliam: Alimentação no orçamento = 611,65; nas transações = 371,65. |
| Alta para a promessa do produto | Chat não recebe agenda e não dispõe de ações | Uma resposta dizendo que anotou um gasto ou criou compromisso não provaria que houve alteração. |
| Alta antes de distribuição | `npm audit` inclui `shell-quote` crítico e cadeias de Expo, Metro, Jest e navegação | Fazer triagem por advisory, versão e caminho executável. Não assumir que tudo é build, nem que tudo é explorável no aparelho. Não executar correção forçada que rebaixe o SDK. |
| Média | `AgendaScreen` apenas ordena todos os eventos; seeds são persistidos | Cabeçalho exibe hoje, mas a lista pode conter eventos antigos/futuros; eventos demonstrativos não se renovam todo dia após persistidos. |
| Média | Google marcado conectado antes de concluir importação; token não é persistido/renovado; não há sincronização recorrente | Pode mostrar conectado após falha de importação ou muito tempo sem atualizar. |
| Média | Conexão bancária extrai apenas `accounts` do retorno | Transações do provider são ignoradas; substituir provider não basta para integrar os dados com consistência. |
| Média | Notas salvam apenas no desmontar do editor | Matar o processo enquanto edita pode perder o rascunho. Testar botão voltar, gesto, background e encerramento. |
| Média | `aiService` limpa timeout depois do `fetch`, antes da leitura do corpo | Os 45 segundos não cobrem toda a leitura/parsing da resposta. |
| Média | Histórico de chat cresce e é enviado sem limite | Aumento de custo, latência, volume de dados e eventual limite de contexto. |
| Média | Notas entram no system prompt sem delimitação de confiança | Conteúdo de nota pode influenciar instruções da IA. Hoje o impacto é sobre respostas, pois não há ferramentas de escrita. |

## Segurança e documentação

SecureStore para a chave e HTTPS na chamada da IA são escolhas presentes no código. O serviço também traduz falhas HTTP em mensagens mais simples. Isso não protege o conjunto completo de dados:

- Finanças, notas, agenda e chat ficam em AsyncStorage; não há criptografia de aplicação ou bloqueio biométrico implementado para esses dados.
- `aiService.ts` registra o corpo bruto de erro em `console.warn`; isso pode expor conteúdo devolvido pela API nos logs. Não foi demonstrado vazamento real nesta análise.
- O contexto enviado à IA inclui saldos, transações, metas, orçamentos, trechos de corpos de notas e histórico. O README diz que só a pergunta sai; PRIVACY menciona títulos das notas. As descrições não correspondem ao payload.
- Google solicita leitura de Calendar, Gmail e Drive embora só Calendar tenha consumo na interface. O escopo deve ser justificado por recurso concreto.
- Não há exportação/backup e exclusão completa dentro do app implementados. Logout não apaga dados.
- O identificador fixo `claude-sonnet-5` e o fluxo OAuth não foram validados com credenciais. Não classificar a integração real como funcionando só porque o código compila.

## Como testar localmente

1. Conferir `node --version`; usar versão compatível com SDK 57 (mínimo 22.13.x).
2. Em instalação limpa, usar `npm ci` para respeitar o lockfile.
3. Rodar `npm run typecheck` e `npm test -- --runInBand --ci`.
4. Para tentar com Expo Go compatível com SDK 57: `npx expo start --go`; Android e computador na mesma rede. A conta demonstrativa da tela é `teste@fluxo.app` / `fluxo123`; não é uma conta real em servidor.
5. O projeto também inclui expo-dev-client. Se usar build de desenvolvimento já instalado, iniciar com `npx expo start --dev-client`. OAuth com scheme próprio deve ser validado em build apropriado, não presumido a partir do Expo Go.
6. Para IA sem chave, testar “qual meu saldo?” e “como estão meus gastos?”. São respostas offline determinísticas. Não é necessário inserir chave pessoal para explorar as telas.

Roteiro manual:

- Criar nota, voltar, reabrir, editar tags, excluir; reiniciar app e conferir persistência.
- Criar nota identificável como usuário A, sair e entrar como B; observar compartilhamento atual.
- Perguntar “registre R$ 35 de almoço” e comparar transações antes/depois. Hoje não há execução dessa ação, independentemente do texto retornado.
- Encerrar o app durante envio; reabrir e tentar outra mensagem.
- Abrir Rotina no dia seguinte; conferir data de cada evento versus cabeçalho.
- Com chave de teste própria, validar sucesso, chave inválida, sem rede e resposta lenta. Essas verificações não foram executadas aqui.

## Sequência de decisões para o usuário

Não iniciar todas as integrações simultaneamente. Antes de implementar, definir um caso que prove a visão: uma frase real do dia a dia, quais registros altera, o que precisa perguntar, como confirmar o resultado e como desfazer um erro.

Ordem proposta para discutir, sem decisões técnicas tomadas pelo usuário:

1. **Recorte:** qual resultado faria usar o Fluxo diariamente? Qual ligação concreta entre rotina e finanças demonstra isso?
2. **Base confiável:** ambiente/CI compatíveis; política de dados por usuário; estados transitórios; fonte e período dos totais; triagem de dependências e revisão da documentação de privacidade.
3. **Um fluxo completo:** entrada por conversa, extração estruturada, validação, autorização adequada à ação, gravação e atualização da interface. Primeiro estabelecer contrato e invariantes; depois implementar.
4. **Teste do valor:** usar o recorte com dados controlados e comparar registros e resultados esperados. Medir erros e correções, além de verificar se a pessoa volta a usar.
5. **Expansão:** escolher backend/autenticação/sincronização e integrações a partir das necessidades demonstradas. Banco automático, voz, Gmail e publicação dependem de decisões posteriores.

Pergunta de partida: “Qual frase você quer dizer ao Fluxo, qual mudança deve acontecer nos dados e como você saberá que ele acertou?”
