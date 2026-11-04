# Assistente local e futura IA administrada pelo Fluxo

Este documento descreve a etapa local anterior. A preparação posterior do backend opcional está em [OpenRouter em desenvolvimento](OPENROUTER-DEV.md).

Decisão do usuário em 20/10/2026: o Fluxo deverá ter uma credencial administrada pelo responsável
pelo produto. Por enquanto, usar algoritmo de texto sem IA; avaliar LLMs gratuitas para experimentar.

## Implementado agora

- O chat usa `src/services/localAssistant.ts`, sem rede, chave de API ou dependência de LLM.
- Consultas: saldo atual por moeda; gastos por categoria/período; orçamento atual; metas; agenda do dia; busca de notas por assunto ou tag; resumo e navegação.
- Períodos financeiros reconhecidos: hoje, ontem, amanhã (lançamentos já registrados), este mês e mês passado. Agenda reconhece hoje, ontem e amanhã.
- Continuações simples, como “e ontem?”, usam o assunto de uma pergunta anterior no histórico recente do mesmo perfil. O chat fornece até 20 mensagens anteriores ao motor.
- Pedidos de escrita não alteram registros nem recebem uma confirmação falsa de execução.
- O assistente não estima saldo histórico, projeção de gasto disponível ou relação causal entre hábitos e finanças. Pedidos fora das regras recebem esclarecimento ou exemplos.
- Ajustes não solicita chave pessoal nem oferece ativação de provedor de IA. A integração cliente→Anthropic foi removida.
- Migração dos ajustes por perfil descarta a chave pessoal e a permissão de contexto da versão anterior; preserva conexões e tema. Chaves globais legadas sem dono não são lidas ou apagadas automaticamente; não há revogação remota de credenciais.
- Não é preciso `.env`. Não existe backend de IA ou URL de serviço configurada nesta versão.

## Próxima arquitetura, ainda não implementada

Fluxo previsto: **aplicativo → backend autenticado do Fluxo → provedor de modelo**.
A credencial do responsável fica somente no ambiente do backend, nunca no app ou em EXPO_PUBLIC_*.
Os limites de uso são compartilhados pela conta do serviço; uma chave única não cria cota por usuário.

Uma integração deve preservar as respostas locais quando o modelo estiver indisponível e permitir
somente os provedores/modelos de custo aprovado. Não ativar cobrança, créditos pagos ou fallback pago.
Autenticação real, isolamento no servidor, limites por usuário e tratamento de contexto serão necessários
antes de disponibilizar esse endpoint a usuários. Nenhuma dessas proteções de servidor existe ainda.

## Opções gratuitas verificadas nas fontes oficiais

Consulta em 20/10/2026. Oferta pública não comprova disponibilidade, login ou cota na conta do usuário.

| Caminho | O que permite | Limites para esta decisão |
|---|---|---|
| Ollama com modelo local | Executar uma LLM na máquina, sem uma cobrança de API de inferência externa | Exige máquina ligada, modelo compatível com memória e licença adequada. Um celular precisaria alcançar um serviço protegido; não é um modelo já embutido no Fluxo. Ollama não foi encontrado no PATH desta sessão. |
| OpenRouter com modelos gratuitos | Experimentar modelos com preço zero via API, sujeito a disponibilidade | Exige conta, chave no backend e verificação de cotas e tratamento de dados. As quotas gratuitas são por conta e podem ser limitadas. Não há conta/chave/configuração do Fluxo validada. |
| Gemini Developer API, camada gratuita | Tokens gratuitos para determinados modelos e limites publicados | Os termos restringem o uso de API Clients disponibilizados a usuários no EEE, Suíça e Reino Unido a Paid Services. O tratamento de dados varia por região/plano. Não foi selecionado como caminho gratuito do app. |

Não foram instalados modelos, criados serviços, abertas portas ou conectados provedores. A entrega
atual é o motor local. Usar uma LLM será uma etapa separada, com credencial do responsável no backend.

Fontes oficiais:

- [Ollama: execução local e modo sem recursos de nuvem](https://docs.ollama.com/faq).
- [OpenRouter: limites de uso e modelos gratuitos](https://openrouter.ai/docs/api_reference/limits).
- [Gemini Developer API: preços e camada gratuita](https://ai.google.dev/gemini-api/docs/pricing).
- [Gemini API: termos de uso e restrições regionais](https://ai.google.dev/gemini-api/terms).

## Verificação manual

Inicie com `npx expo start --go` e use o login demonstrativo. Teste “qual meu saldo?”, “quanto gastei
hoje?”, “e ontem?”, “meus compromissos amanhã”, “buscar notas sobre viagem”, “minhas metas” e
“abrir rotina”. Confira que Ajustes não pede uma chave e que o chat identifica o modo local.

O login continua mock e os dados financeiros continuam de exemplo. O assistente está limitado às
regras implementadas; ele não compreende linguagem arbitrária como uma LLM.

## Verificação automatizada desta etapa

`npm run typecheck` passou; `npm test -- --runInBand --ci` passou com 9 suítes e 83 testes.
O bundle Android foi exportado com sucesso (1.152 módulos). Não houve validação visual em aparelho.
