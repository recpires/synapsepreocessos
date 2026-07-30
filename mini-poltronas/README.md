# Mini Poltronas Original — Hero Section

Landing page premium (seção hero em viewport único, sem scroll) para a **Mini
Poltronas Original**, fabricante artesanal de mini poltronas de barbearia em
capitonê. Construída com **Vite + React + TypeScript + Tailwind CSS + Lucide
React**, inspirada em uma referência de e-commerce, porém elevada para uma
estética editorial de luxo (marfim + café + dourado champagne).

## Stack

- Vite 5 · React 18 · TypeScript
- Tailwind CSS 3 (paleta e fontes customizadas)
- lucide-react (ícones)
- Fontes Google: **Playfair Display** (títulos) + **Inter** (interface)

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + build de produção em dist/
npm run preview    # serve o build de produção
```

## Estrutura

```
mini-poltronas/
├── index.html            # fontes Google + meta tags
├── src/
│   ├── App.tsx           # hero completo (header + 2 layouts: desktop lg+ / compacto)
│   ├── index.css         # base, paleta, textura de fundo e sistema de animações
│   └── main.tsx
├── tailwind.config.js    # cores da marca + famílias de fonte
└── public/
    ├── favicon.svg
    └── img/
        ├── chair-black-seville.jpg   # trio inferior (centro / destaque)
        ├── chair-marron-croco.jpg    # trio inferior (esquerda)
        ├── chair-baby.jpg            # trio inferior (direita)
        ├── card-colete.jpg           # card de produto (esquerda)
        ├── card-vaibrasil.jpg        # card comemorativo (direita)
        └── poster-*.jpg              # artes originais (referência)
```

## Sobre as imagens

As imagens em `public/img/chair-*` e `public/img/card-*` foram recortadas a
partir das artes de divulgação enviadas, isolando as poltronas do texto de
marketing. Os `poster-*.jpg` são as artes completas originais, mantidas apenas
como referência. **Para produção, recomenda-se substituir por fotos de estúdio
com fundo limpo** — os componentes já usam `object-cover`, então basta trocar os
arquivos mantendo os nomes.

## Design

- **Paleta:** fundo marfim `#F3EFE6`, tinta `#171310`, café `#4A3B2E`, dourado
  champagne `#B0873A` / `#E6CE95`.
- **Tipografia:** título serifado de alto contraste (Playfair Display), interface
  em Inter.
- **Motivo da marca:** as 5 estrelas douradas aparecem no logo, no kicker e nos
  produtos.
- **Animações:** entrada escalonada — header → título (word-pop) → cards
  (slide) → fotos (photo-reveal) → estatísticas/CTA. Respeita
  `prefers-reduced-motion`.
- **Responsivo:** layout desktop (`lg+`) e layout compacto (tablet/mobile) por
  show/hide, com tipografia fluida via `clamp()`.
