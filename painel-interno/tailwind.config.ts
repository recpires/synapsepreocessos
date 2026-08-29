import type { Config } from 'tailwindcss'

/** rgb(var(--x) / <alpha>) para o modificador de opacidade funcionar: bg-surface/60 */
const token = (nome: string) => `rgb(var(--${nome}) / <alpha-value>)`

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './types/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Superfícies
        ground:      token('ground'),
        surface:     token('surface'),
        'surface-2': token('surface-2'),
        'surface-3': token('surface-3'),
        line:        token('line'),
        'line-strong': token('line-strong'),

        // Texto
        fg:          token('fg'),
        muted:       token('fg-muted'),
        subtle:      token('fg-subtle'),

        // Acento
        accent: {
          DEFAULT: token('accent'),
          hover:   token('accent-hover'),
          fg:      token('accent-fg'),
          soft:    token('accent-soft'),
          text:    token('accent-text'),
        },

        // Semânticas — cor da informação, separada do acento da marca
        ok:   { DEFAULT: token('ok'),   soft: token('ok-soft'),   line: token('ok-line') },
        warn: { DEFAULT: token('warn'), soft: token('warn-soft'), line: token('warn-line') },
        crit: { DEFAULT: token('crit'), soft: token('crit-soft'), line: token('crit-line') },
        info: { DEFAULT: token('info'), soft: token('info-soft'), line: token('info-line') },

        // Mantido: já usado em algumas telas
        brand: { DEFAULT: '#7c3aed', light: '#8b5cf6', dark: '#6d28d9' },
      },
      borderRadius: {
        token: 'var(--raio)',
      },
    },
  },
  plugins: [],
}

export default config
