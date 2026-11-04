# OpenRouter gratuito — preparação de desenvolvimento

A credencial foi configurada em `server/.env` por autorização explícita do responsável.
O `.env` da raiz contém somente `EXPO_PUBLIC_FLUXO_API_URL=http://127.0.0.1:8787`.
Ambos são ignorados pelo Git; a chave permanece fora do código e do bundle do app.
Chamadas reais curtas sem dados pessoais retornaram HTTP 200. O roteador selecionou
`dots-studio/dots-3-note-preview:free`. No teste visual pelo AVD, o app abriu e as consultas locais
funcionaram, mas perguntas abertas ainda caíram no modo local. O serviço gratuito retornou HTTP 429
durante parte da sessão; após liberar failover entre provedores gratuitos, um pedido curto direto
voltou a funcionar. A confirmação do caminho app → backend → resposta generativa permanece pendente.

## Configuração pelo responsável

1. A configuração local atual já está pronta. Os passos abaixo servem para reinstalar ou trocar a credencial.
2. Na raiz do projeto, execute `./server/configure.ps1`. O prompt é mascarado e grava a chave nova em `server/.env`, sem exibi-la. O script não valida a chave no provedor.
3. O script também cria `.env` na raiz a partir do exemplo público, se ainda não existir. Esse arquivo contém somente `EXPO_PUBLIC_FLUXO_API_URL`, nunca a chave.
4. Para Android Emulator, configure a URL pública como `http://10.0.2.2:8787`. Para Android por USB, use `http://127.0.0.1:8787` e execute `adb reverse tcp:8787 tcp:8787` com o aparelho autorizado para depuração. ADB não foi encontrado no PATH desta sessão; esse passo exige Android SDK Platform Tools instalado.
5. Em instalação nova, execute `npm ci --prefix server`; depois `npm start --prefix server`.
6. Em outro terminal, execute `npx expo start --go` e recarregue completamente o app após alterar `.env`.
7. Em Ajustes, leia a descrição e ative “Permitir esse envio e usar IA experimental”. A opção só aparece com URL local permitida e cliente de desenvolvimento.

Alternativa ao script: copie `server/.env.example` para `server/.env` e edite a chave em um editor
local. Ambos os `.env` são ignorados pelo Git. A configuração não revoga a chave antiga.

## Escopo e restrições

O backend Node com AI SDK fica em `server/`, separado das dependências do app. Está fixado em
`127.0.0.1:8787`, sem opção de abrir na rede. Bloqueia Origin de navegadores e Host desconhecido.
O login do app ainda é mock: o backend não autentica usuários de produção e não deve ser publicado.
A configuração local foi validada com uma chamada real; testes automatizados usam provedor simulado.

- Consultas reconhecidas e navegação continuam locais, mesmo com a opção ativa.
- Perguntas não reconhecidas podem usar OpenRouter após consentimento.
- A chave do responsável vai somente do backend ao OpenRouter por HTTPS.
- Usa exclusivamente `openrouter/free`, com tetos de preço de prompt, completion e request iguais a zero, `allow_fallbacks: true` para tentar outro provedor gratuito quando o primeiro responder 429, `data_collection: deny` e `maxRetries: 0`. O teto zero impede selecionar opções pagas.
- Não troca para modelo pago. Se nenhum provedor gratuito atender às restrições, o app retorna ao algoritmo local.
- Há limite local de 3 chamadas por minuto, 30 por janela de 24 horas e uma requisição ativa. Contadores em memória reiniciam com o processo; não substituem limites da conta ou controles de produção.
- Resposta limitada a 400 tokens; timeout do provedor de 20 segundos e do cliente de 25 segundos. Não há ferramentas de escrita/execução; saída é somente texto.
- Falhas retornam texto genérico. Credenciais, mensagens, contexto e corpos de erro não são registrados pelo código do servidor. OpenRouter e provedores têm suas próprias políticas de dados.

## Contexto transmitido

Pergunta de até 4.000 caracteres, até 6 mensagens anteriores do usuário (até 1.000 caracteres cada),
saldos agregados por moeda, saída do mês, até 8 orçamentos, 4 metas, títulos de 4 notas e títulos/horários
de 4 compromissos de hoje. Respostas locais anteriores que possam citar notas não são encaminhadas.
Não são enviados nomes/e-mails do perfil, nomes das contas, corpos de notas ou listas de transações
como campos de contexto. Textos digitados pelo usuário podem conter dados pessoais.

## Verificação

`npm test --prefix server` verifica HTTP local, bloqueios, limites, validação, ausência de retry e teto zero com failover gratuito
e o pedido real montado pelo SDK com fetch simulado. `npm run typecheck` e `npm test -- --runInBand --ci`
verificam aplicativo, consentimento, minimização, falhas e sessões. Os testes automatizados não usam chave real ou geração remota.

Resultado nesta etapa: 90 testes do app e 8 testes do backend passaram; typecheck, análise de sintaxe
PowerShell e bundle Android passaram. A configuração real passou no health check e na geração
via HTTP local. Continua pendente a conexão do dispositivo ao backend e a validação visual em aparelho.

Fontes: [roteador gratuito](https://openrouter.ai/docs/guides/routing/routers/free-router),
[filtros de preço/privacidade](https://openrouter.ai/docs/guides/routing/provider-selection),
[coleta de dados](https://openrouter.ai/docs/guides/privacy/data-collection).
