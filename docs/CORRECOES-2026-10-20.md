# Correções e entrada pelo assistente Fluxo

Este registro descreve a etapa anterior. A decisão posterior de usar somente texto local e retirar a chave pessoal está em [Assistente local](ASSISTENTE-LOCAL.md).

Branch: `fix/fluxo-assistant-and-data`, baseada em `458b644`. Sem commit, push ou publicação.

## Os seis pontos

1. **Separação dos perfis:** finanças, notas, agenda, chat e ajustes usam chaves por e-mail normalizado no armazenamento local. Logout limpa a memória, fecha o menu e invalida requisições. Carregamentos e gravações atrasados mantêm o proprietário original. A área principal só abre depois de carregar as stores do perfil.
2. **Chat interrompido:** somente mensagens são persistidas; `isSending` sempre volta falso ao carregar. O timeout também cobre a leitura do corpo HTTP e os requests são cancelados ao desmontar o chat ou alterar chave/permissão. Respostas de uma sessão anterior são ignoradas.
3. **Consistência financeira:** totais e orçamentos exibidos derivam das transações do mês local atual, incluindo categorias sem orçamento no total. Novas transações atualizam o saldo da conta em centavos, com sinal correto, validação e proteção contra duplicidade por ID. Os saldos iniciais e importados são snapshots, não são recalculados a partir de um histórico possivelmente parcial. A conexão demonstrativa substitui contas e transações juntas.
4. **Privacidade:** README, PRIVACY e SECURITY descrevem histórico, contexto financeiro, trechos de notas e agenda enviados à Anthropic. A chave é armazenada no perfil e enviada no cabeçalho de autenticação. Uma permissão de contexto, desligada por padrão, controla chamadas de IA junto com a chave. Corpos brutos de erro não são lidos ou logados. Histórico tem limites de mensagens e caracteres.
5. **Agenda do dia:** lista somente eventos que se sobrepõem ao dia local atual; trata corretamente datas de dia inteiro com fim exclusivo e eventos que atravessam meia-noite. O relógio atualiza ao retomar o app e a cada 30 segundos. O status Google só é marcado conectado depois de importar os eventos.
6. **Notas:** cada edição inicia a persistência, sem depender de Voltar ou desmontagem. O ID do rascunho é estável; a interface distingue salvando, salvo no aparelho e falha. Gravações são ordenadas por chave e uma exclusão não dispara salvamento no desmontar. Não é possível garantir o último caractere se o sistema encerrar o processo antes de concluir a operação de disco; o indicador só confirma após a gravação.

## Primeira tela

Após login ou restauração da sessão, a aba inicial é **Fluxo**. Ela apresenta o assistente, o nome do perfil, saldo, saídas do mês, quantidade de compromissos do dia e notas. Dados financeiros demonstrativos são identificados como exemplo.

Atalhos aparecem abaixo do resumo; a barra inferior mantém Fluxo, Finanças, Notas, Rotina e Ajustes. O resumo não dispara uma chamada à IA. A abertura começa na saudação mesmo com histórico salvo; novas mensagens fazem o chat acompanhar o fim da conversa.

Pedidos explícitos são roteados localmente para destinos permitidos:

- “Quero ver minhas finanças” → Finanças.
- “Quero organizar minha rotina” → Rotina.
- “Abrir minhas notas” → Notas.
- “Abrir ajustes” → Ajustes.

Perguntas comuns, pedidos negados e pedidos com múltiplas áreas permanecem no chat. O roteamento é por regras para pedidos explícitos; não é um classificador geral por modelo. A IA recebe também a agenda quando a permissão está ativa, mas ainda não tem ferramentas de escrita. Não foi implementado registro de despesas por conversa nesta etapa.

## Validação

- `npm run typecheck`: passou.
- `npm test -- --runInBand --ci`: **9 suítes e 70 testes passaram**.
- Testes incluem isolamento de todos os domínios e chave, restauração de sessão, hidratação atrasada, gravações de A que terminam após login B, chat interrompido, resposta atrasada de IA, bloqueio de envio sem consentimento, filtros de mês/dia, duplicidade de transações, nota salva antes de sair do editor, falha/retry de disco e exclusão sem recriação.
- `git diff --check`: passou.
- Exportação Android final: passou, 1.152 módulos e bundle Hermes, em `C:/Users/natan/AppData/Local/Temp/fluxo-final-20261020-005454`.
- Revisão React aplicada a hooks, encerramento de efeitos, estado derivado, destinos de navegação tipados e rótulos de acessibilidade. Testes de componentes simulam navegação e a lista nativa; não substituem interação no aparelho.

## Teste manual pendente

1. `npx expo start --go`, usando Expo Go compatível com SDK 57.
2. Entrar no perfil de exemplo e conferir Fluxo como aba inicial, saudação, atalhos e barra inferior.
3. Digitar os quatro pedidos acima e conferir os destinos. Perguntar “quanto gastei?” e conferir que permanece no chat.
4. Criar e editar nota, aguardar “Salvo no aparelho”, encerrar sem sair do editor e reabrir. Conferir conteúdo e ausência de duplicação.
5. Criar nota em A, sair e entrar em B. A nota de A deve ficar ausente; retornar a A deve restaurá-la.
6. Testar teclado, rolagem, botão físico Voltar e acessibilidade em Android. IA autenticada e OAuth Google exigem credenciais e validação separada.

## Limites preservados

Login continua demonstrativo: qualquer senha bem formada é aceita, e entrar com o mesmo e-mail acessa o mesmo perfil. Separar registros locais não é comprovação de identidade, criptografia ou proteção contra alguém com acesso ao aparelho. Finanças continuam de exemplo; AsyncStorage continua sem criptografia de aplicação.

Dados globais da versão anterior não tinham proprietário verificável. Eles foram preservados nas chaves antigas, sem importação automática, para evitar exposição ao perfil errado. Chaves e permissão de IA precisam ser configuradas no perfil atual. A migração de dados legados requer identificar o dono.

Não foram atualizadas as dependências ou resolvidos os advisories do diagnóstico. Não foi gerado/instalado APK, validada a aparência em aparelho, feita chamada autenticada à Anthropic, conectado Google ou implementado backend. O CI passou a usar Node 24, compatível com o SDK 57; o README foi alinhado ao mínimo Node 22.13+.
