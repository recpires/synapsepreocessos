/**
 * Configuração dos grupos de subnavegação.
 * Cada grupo aparece como uma barra de abas no topo da pagina pai e das filhas.
 */

export type SubNavTab = {
  href: string
  label: string
  icon?: string
}

export const SUBNAV = {
  financeiro: [
    { href: '/financeiro', label: 'Despesas',  icon: '💰' },
    { href: '/receitas',   label: 'Receitas',  icon: '💵' },
    { href: '/balanco',    label: 'Balanço',   icon: '📑' },
  ],
  empresa: [
    { href: '/empresa',    label: 'Documentos', icon: '🏢' },
    { href: '/documentos', label: 'Arquivos',   icon: '🗂️' },
    { href: '/contratos',  label: 'Contratos',  icon: '📝' },
  ],
  comercial: [
    { href: '/comercial', label: 'Comercial', icon: '💼' },
    { href: '/pipeline',  label: 'Pipeline',  icon: '📈' },
  ],
  dev: [
    { href: '/dev',    label: 'Desenvolvimento', icon: '⚙️' },
    { href: '/testes', label: 'Testes',          icon: '🧪' },
  ],
} as const satisfies Record<string, readonly SubNavTab[]>
