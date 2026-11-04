# Política de Privacidade — Fluxo

Atualização: 20 de outubro de 2026.

O Fluxo é um protótipo de finanças, notas e rotina. Usa regras no aparelho por padrão. Existe uma
opção experimental via backend no computador de desenvolvimento e OpenRouter, desligada por padrão.
Não há backend de produção ou sincronização em nuvem implementados.

## Armazenamento local

Finanças, notas, compromissos e histórico de conversa ficam no AsyncStorage, separados por perfil local.
Os ajustes e estados de conexão ficam no SecureStore. Nome, e-mail e sessão demonstrativa ficam no
AsyncStorage. Finanças, notas, agenda e histórico não têm criptografia de aplicação.

O login é demonstrativo e não comprova identidade nem valida senha em servidor. Entrar com o mesmo
e-mail acessa o mesmo perfil. Sair limpa a memória e mantém os registros do perfil no disco; não exclui dados.

Registros globais antigos, sem proprietário verificável, permanecem nas chaves locais legadas sem
importação automática. A migração dos ajustes por perfil remove os antigos campos de chave pessoal
e permissão de envio a um provedor de IA. O app não usa as credenciais antigas. Isso não revoga
uma chave no fornecedor nem remove registros legados globais sem proprietário.

Não há backup próprio, exportação ou recuperação implementados. Limpeza de dados, desinstalação,
backup e restauração dependem também do sistema operacional; não conte com recuperação pelo Fluxo.

## Assistente local

O assistente consulta registros do perfil e parte do histórico para entender continuações simples.
Ele pode calcular totais, consultar metas, buscar notas, listar compromissos e abrir abas. Não grava
alterações por conversa. Abrir o app ou usar consultas reconhecidas não aciona uma API de IA.

Não há campo para cadastrar chave de provedor no app. A credencial do responsável é configurada
somente em `server/.env` no computador de desenvolvimento.

## IA gratuita opcional em desenvolvimento

A opção só aparece em desenvolvimento com URL local permitida configurada. Após ler a descrição
em Ajustes e ativar a permissão, perguntas não reconhecidas são enviadas ao backend local, OpenRouter
e provedor gratuito selecionado. Acompanham a pergunta: até 6 mensagens suas anteriores (até 1.000
caracteres cada), saldos por moeda, gasto do mês, até 8 orçamentos, 4 metas, títulos de 4 notas e
títulos/horários de 4 compromissos de hoje.

Corpos de notas, listas de transações e respostas locais anteriores que possam citar notas não são
encaminhados como contexto. Mensagens digitadas pelo usuário podem conter dados pessoais. O código
solicita `data_collection: deny`, mas isso não elimina o tratamento de metadados pelo OpenRouter e
demais envolvidos. Aplicam-se as respectivas políticas: https://openrouter.ai/privacy e
https://openrouter.ai/docs/guides/privacy/data-collection.

O app comunica-se por HTTP com o backend restrito ao computador local via emulador ou encaminhamento
USB. O backend usa HTTPS para o OpenRouter. Não há transmissão automática ao abrir o app, ferramentas
de escrita ou armazenamento de conversas no servidor do Fluxo. Desligar a opção em Ajustes interrompe
novos envios, mas não apaga dados já transmitidos. Falhas retornam ao modo local.

## Google opcional

Se você escolher calendários já sincronizados no aparelho, o Fluxo pede permissão de calendário e
salva uma cópia dos eventos selecionados no perfil local. Essa leitura não envia eventos ao Google
nem altera os calendários. Os eventos podem ser usados pelo assistente local.

O código de OAuth exige Client ID configurado pelo responsável pelo app; atualmente está nulo.
Se habilitado, a comunicação de autorização e de importação ocorre diretamente com o Google,
por HTTPS, usando token obtido no login. O código solicita apenas leitura do Calendar. O token fica
no armazenamento seguro do perfil; não há renovação de token.
Eventos importados ficam no perfil local e podem ser consultados pelo assistente local.

Você pode revogar permissões em https://myaccount.google.com/permissions.

## Outros fluxos

- Os dados bancários são de exemplo; nenhum banco real está conectado.
- Não há anúncios, rastreadores, analytics ou crash reporting implementados.
- O código não solicita microfone, câmera, localização ou identificadores de publicidade.
- Não há venda ou aluguel de dados implementados.
- Notas, mensagens e compromissos podem conter informações pessoais digitadas pelo usuário.

## Controle dos dados

Você pode editar ou excluir notas no app. Para excluir todos os dados locais no Android, use
“Limpar dados” nas configurações do sistema. Não há exclusão completa dentro do app implementada.
A revogação de um serviço externo deve ser feita no respectivo fornecedor. O Fluxo não mantém cópia
em backend, nem consegue apagar dados que tenham sido transmitidos a fornecedores em versões anteriores.

## Alterações e contato

Mudanças de processamento ou integrações serão documentadas nesta política. Esta descrição deve ser
reavaliada antes de publicação e sempre que serviços externos forem ativados.

Privacidade: natanaplications@gmail.com. Segurança: ver SECURITY.md.
