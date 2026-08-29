# Design system

Referência viva em **`/design`** — abre no painel e mostra tudo funcionando nos dois temas.

## A regra

Não escreva cor em hex nem use `gray-400`, `violet-600` e afins em código novo.
Use os tokens. Eles resolvem sozinhos no claro e no escuro.

## Tokens

Definidos em [`app/globals.css`](../../app/globals.css) e mapeados para utilitários
em [`tailwind.config.ts`](../../tailwind.config.ts).

| Superfície | Uso |
|---|---|
| `bg-ground` | Fundo da página |
| `bg-surface` | Cartões, barras, sidebar |
| `bg-surface-2` | Cabeçalho de tabela, hover, campos |
| `bg-surface-3` | Hover sobre `surface-2` |
| `border-line` | Bordas e divisórias |
| `border-line-strong` | Borda de campo, contorno ativo |

| Texto | Uso |
|---|---|
| `text-fg` | Texto principal |
| `text-muted` | Rótulo, texto secundário |
| `text-subtle` | Legenda, metadado |

| Acento | Uso |
|---|---|
| `bg-accent` | Botão primário, aba ativa |
| `hover:bg-accent-hover` | Hover do primário |
| `text-accent-fg` | **Texto em cima de `bg-accent`** |
| `bg-accent-soft` / `text-accent-text` | Destaque discreto |

> `text-accent-fg`, não `text-fg`, em cima de superfície de acento. `text-fg` no
> tema claro é quase preto — sobre o violeta fica ilegível. Foi exatamente esse
> erro que a migração do login introduziu e que o teste pegou.

| Semântica | Uso |
|---|---|
| `ok` · `bg-ok-soft text-ok border-ok-line` | Pago, vigente, no prazo |
| `warn` | Vencendo, em renovação |
| `crit` | Vencido, erro, bloqueado |
| `info` | Neutro informativo |

A semântica é separada do acento de propósito: o violeta diz "isto é da Synapse",
a semântica diz "isto precisa da sua atenção". Nunca troque uma pela outra.

## Componentes

```tsx
import { Button, Card, Metrica, Badge, Input, Tabela, Th, Td, Tr } from '@/components/ui'
```

| Componente | Observação |
|---|---|
| `Button` | `variante`: primario · secundario · fantasma · perigo. `carregando` mostra spinner e desabilita |
| `Card` · `CardHeader` · `CardBody` | Estrutura padrão de bloco |
| `Metrica` | Cartão de número. `inverterCor` para quando subir é ruim (despesa) |
| `Badge` | `tom`: neutro · ok · atencao · critico · info · acento. `ponto` para status em lista |
| `Input` · `Select` · `Textarea` | Rótulo, erro e dica embutidos, com `aria-describedby` |
| `Tabela` · `Th` · `Td` · `Tr` · `ThOrdenavel` | O contêiner rola no eixo X sozinho — a página nunca rola de lado |
| `PageHeader` · `Vazio` · `Erro` · `Skeleton` · `SkeletonTabela` | Estados de página |
| `TemaToggle` | `compacto` para a sidebar recolhida |

Números em coluna levam `numerica` no `Th`/`Td`, ou a classe `.tabular`.

## Temas

Três estados, não dois:

- **Sistema** (padrão) — nada carimbado no `<html>`, decide por `prefers-color-scheme`
- **Claro** — `data-theme="light"` no `<html>`
- **Escuro** — `data-theme="dark"`

A escolha vive no `localStorage` e é lida por `useSyncExternalStore`, então não há
`setState` em efeito nem divergência de hidratação. O `SCRIPT_ANTI_FLASH` roda no
`<head>` antes da primeira pintura — sem ele a tela pisca no tema errado.

O tema escuro reproduz exatamente os hex que o painel já usava (`#0a0a0f`,
`#111118`, `#1e1e2e`, `#2d2d3d`…). Migrar uma tela para os tokens não muda nada
visualmente no escuro; só destrava o claro.

## Estado da migração

Migrados: `Sidebar`, `PainelShell`, `SubNav`, `Feedback`, `app/login`.

As páginas de módulo ainda usam hex e `gray-*` direto — cerca de 550 ocorrências
de superfície e 647 de `text-gray-*`. Elas migram junto com a reescrita de cada
módulo nas Fases 02 a 05. Até lá, no tema claro essas telas continuam escuras.
