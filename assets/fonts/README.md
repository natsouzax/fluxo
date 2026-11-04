# Manrope no FLUXO

A família aprovada continua sendo Manrope, licenciada em `OFL-Manrope.txt`.

O arquivo variável original tem eixo `wght` de 200 a 800 e valor padrão 200. No teste Android com carregamento em runtime, os pesos intermediários não reproduziram a referência visual. O app carrega instâncias estáticas pelo `useFonts` em `App.tsx` e usa os nomes explícitos nos estilos:

| Arquivo / família registrada | Peso |
|---|---|
| Manrope-Regular | 400 |
| Manrope-Medium | 500 |
| Manrope-SemiBold | 600 |
| Manrope-Bold | 700 |
| Manrope-ExtraBold | 800 |

As instâncias foram derivadas do próprio `Manrope-Variable.ttf` com FontTools 4.67.0, `instantiateVariableFont(font, {'wght': peso}, inplace=False, updateFontNames=True)`. Foram verificados o peso OS/2 e a ausência do eixo variável em cada resultado. FontTools foi usado apenas como ferramenta temporária, sem dependência adicionada ao app.

O original variável permanece para os mockups HTML. Novos componentes nativos devem usar os tokens de `src/theme/theme.ts` ou uma das famílias estáticas registradas, sem depender de `fontWeight` para selecionar o arquivo.
