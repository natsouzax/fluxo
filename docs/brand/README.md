# Fluxo â€” base oficial de identidade

**Estado: aprovada.** A base Ãºnica e a identidade verde da proposta 01, com o lettering da opÃ§Ã£o A. Novas telas e materiais devem seguir esta referÃªncia; propostas antigas e alternativas foram removidas.

## Assinatura

- SÃ­mbolo: arco/V arredondado inspirado no Ã­cone jÃ¡ existente no app.
- Nome: **FLUXO**, sempre em maiÃºsculas, Manrope ExtraBold (peso 800), conforme a opÃ§Ã£o aprovada.
- Lockup principal: sÃ­mbolo acima do nome. NÃ£o usar o antigo F como marca.
- Em papel claro, usar sÃ­mbolo e nome em verde profundo. Em fundo verde escuro, usar lima no sÃ­mbolo e texto claro.

## Paleta

| Uso | Claro | Escuro |
|---|---|---|
| Fundo | `#F6F5EF` | `#101610` |
| SuperfÃ­cie | `#FFFFFF` | `#18211A` |
| SuperfÃ­cie suave | `#E7EEDD` | `#202F25` |
| Texto principal | `#163D36` | `#EFF5E9` |
| Texto secundÃ¡rio | `#52645D` | `#B2C0B2` |
| Texto auxiliar | `#5E6C64` | `#89998B` |
| Lima da marca | `#D5F478` | `#D5F478` |
| Notas | `#EEE8F4` | `#2B2633` |
| Rotina | `#F7E9DB` | `#302A23` |

O Claro Ã© o padrÃ£o. Os dois modos estÃ£o aplicados em telas, navegaÃ§Ã£o, componentes, formulÃ¡rios e barras de sistema. A pessoa escolhe entre Claro e Escuro em Ajustes > AparÃªncia; a opÃ§Ã£o fica salva no perfil.

## Tipografia e movimento

A famÃ­lia Ã© Manrope variÃ¡vel, instalada em `../../assets/fonts/Manrope-Variable.ttf` sob a licenÃ§a SIL OFL 1.1 em `../../assets/fonts/OFL-Manrope.txt`. Usar peso 800 no nome da marca e pesos 400-700 na interface. Preservar legibilidade, nÃºmeros tabulares em valores financeiros e espaÃ§amento confortÃ¡vel.

Usar feedback de toque curto (120 ms) e transiÃ§Ãµes de contexto em torno de 220 ms. O app respeita a preferÃªncia do sistema por movimento reduzido. Evitar animaÃ§Ãµes contÃ­nuas e nÃ£o usar movimento para sugerir atualizaÃ§Ã£o de dados que nÃ£o ocorreu. Controles interativos usam alvos de toque com pelo menos 48 dp.

## Voz da marca

O usuÃ¡rio sugeriu como caminhos de texto "Segue o FLUXO", "O FLUXO da sua rotina" e "Mais FLUXO, menos foco". Ainda nÃ£o foi escolhida uma assinatura verbal final. Manter FLUXO em maiÃºsculas quando for o nome da marca.

## Modelação das telas do app

- [Painel de mockups navegável](app-mockups/index.html) e [guia da rodada 01](app-mockups/README.md) — cinco telas em Claro e Escuro, com imagens individuais em `app-mockups/images/`. Os mockups são a base de revisão da aplicação da identidade no app.

## Arquivos oficiais

- [Painel da identidade aprovada e modelaÃ§Ã£o Claro/Escuro](modos-claro-escuro.html) - referÃªncia visual para os dois temas.
- [Tokens pareados](themes-proposal.json) - cores e regras oficiais da interface.
- Marca vetorial: `assets/fluxo-arch-mark.svg`, `assets/fluxo-arch-mark-reverse.svg`, `assets/fluxo-arch-lockup.svg` e `assets/fluxo-arch-lockup-reverse.svg`.
- Fontes do app: `../../assets/fluxo-app-icon.svg`, `../../assets/fluxo-adaptive-foreground.svg`, `../../assets/fluxo-adaptive-background.svg`, `../../assets/fluxo-monochrome.svg`, `../../assets/fluxo-splash-lockup.svg` e os PNGs configurados em `app.json`.
- [Captura do app Claro no emulador](emulator-claro.png) e validaÃ§Ã£o visual, nao uma proposta alternativa.


## Aplicação dos mockups — 20/10/2026

As cinco abas, telas de acesso e detalhes seguem a base aprovada. O [registro de implementação](app-mockups/IMPLEMENTACAO.md) documenta a aplicação e as verificações. No app nativo, usar as [famílias Manrope estáticas](../../assets/fonts/README.md) registradas em App.tsx e os tokens compartilhados de tipografia; o arquivo variável continua como fonte original dos mockups.
