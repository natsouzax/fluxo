# Mockups da aplicação FLUXO — rodada 01

Painel visual navegável que orienta a identidade aprovada nos cinco espaços principais do app. As telas de referência têm conteúdo demonstrativo; o aplicativo usa os dados reais de cada perfil. A primeira aplicação está registrada em [IMPLEMENTACAO.md](IMPLEMENTACAO.md), com capturas do app em `validacao/`.

## Arquivos

- `index.html` — painel navegável e editável. Abra no navegador; use Claro/Escuro e selecione uma tela na navegação lateral. “Visão geral” retorna às cinco telas. O arquivo contém HTML, CSS e o código de interação, sem dependências.
- `images/visao-geral-claro.png` e `images/visao-geral-escuro.png` — pranchas completas para comparar os temas.
- `images/chat-claro.png`, `finance-claro.png`, `notes-claro.png`, `routine-claro.png`, `settings-claro.png` — telas individuais no modo Claro.
- Os mesmos nomes terminados em `-escuro.png` — versões individuais no modo Escuro.

## Direção aplicada

- Assinatura aprovada: arco/V arredondado + FLUXO em Manrope ExtraBold, caixa alta.
- Cores e geometrias conforme `../themes-proposal.json`.
- Navegação inferior comum, superfícies calmas e acento lima para ações e estados ativos.
- Fluxo: conversa e assistente; Finanças: saldo, orçamento e registros; Notas: notas recentes e assuntos; Rotina: calendário e compromissos; Ajustes: aparência, conexões e assistente.

Comece pelas duas pranchas gerais. Depois abra o painel e escolha uma tela para olhar isoladamente. Ao revisar, indique a tela e o elemento concreto (por exemplo: “Finanças, o saldo ocupa espaço demais”).
