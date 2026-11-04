# Política de segurança

## Reportar uma vulnerabilidade

Abra uma [Security Advisory privada](https://github.com/natsouzax/fluxo/security/advisories/new)
ou envie e-mail para natanaplications@gmail.com. Evite publicar detalhes de falhas em issues públicas.
Retorno esperado em até 5 dias úteis.

## Assistente atual e segredos

O assistente usa regras locais por padrão. O cliente não chama o provedor de LLM diretamente, não
solicita chave de provedor ao usuário e não tem credencial de IA embutida. A integração direta com Anthropic
foi removida. Ajustes por perfil são migrados para descartar os campos anteriores de chave e permissão.
Essa migração não revoga uma credencial no fornecedor nem apaga registros globais legados sem dono.

O backend experimental em `server/` usa uma credencial do responsável somente em `server/.env`.
Está fixado no loopback, não autentica usuários de produção e não deve ser publicado. O app aceita
somente URLs locais predefinidas em desenvolvimento e exige permissão de contexto. Sem configuração
ou permissão, mantém o algoritmo local. Variáveis públicas do Expo, app.json e código
compilado não devem conter segredos. .gitignore ignora .env, credenciais e arquivos de assinatura.
Os identificadores EAS projectId e owner em app.json são públicos; Google Client ID está nulo.

Credenciais expostas devem ser revogadas e substituídas, sem envio pelo chat. `server/configure.ps1`
permite a entrada local mascarada. Por autorização explícita do responsável, a credencial de desenvolvimento
foi configurada no arquivo ignorado `server/.env` e validada em uma chamada real. O backend restringe modelo/preço, desativa retry do SDK, permite failover somente sob tetos de preço zero e limita
o volume de testes. Esses limites em memória reiniciam com o processo e não são controles de produção.

## Perfis e armazenamento

As stores de finanças, notas, agenda, chat e ajustes só são mostradas depois de carregar o perfil.
Gravações capturam o perfil de origem e são ordenadas por chave. Hidratações de sessões anteriores
não podem sobrescrever a sessão atual. Logout limpa a memória e invalida tarefas pendentes.
Dados globais antigos ficam preservados, sem atribuição automática a outro perfil.

O login continua mock: qualquer senha bem formada é aceita. A separação de perfis evita mistura
acidental, mas não impede alguém de entrar com o mesmo e-mail. Não há verificação de identidade,
backend, criptografia de aplicação para AsyncStorage ou bloqueio biométrico implementados.
Notas e conversas digitadas podem conter dados pessoais, mesmo com finanças de exemplo.

## Integrações

Open Finance usa dados de exemplo. Google tem código de OAuth e importação, desativado sem Client ID;
precisa de validação autenticada. Nenhum segredo de agregador bancário deve ser incluído no app.
Calendários já sincronizados no aparelho podem ser lidos com permissão e seleção explícita; os eventos
selecionados ficam no armazenamento local do perfil.
A comunicação externa opcional está descrita em [PRIVACY.md](PRIVACY.md).

Qualquer ativação futura de LLM deve preservar isolamento por usuário, autenticação real, limites de
uso, minimização de contexto e comportamento local quando o serviço estiver indisponível. Uma oferta
gratuita não autoriza envio de dados pessoais nem fallback para um modelo cobrado.

## Dependências

O diagnóstico de 20/10/2026 encontrou advisories em cadeias de Expo, Metro, Jest e navegação, incluindo
uma entrada crítica em shell-quote. A triagem por versão e caminho executado permanece pendente.
Não se deve assumir que tudo é somente build ou que toda entrada é explorável no aparelho.
Atualizações devem manter compatibilidade com o SDK; npm audit fix --force não foi executado.
