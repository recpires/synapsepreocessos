﻿﻿/**
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
    { href: '/financeiro/dre',       label: 'DRE',       icon: '📊' },
    { href: '/financeiro/custos',    label: 'Custos',    icon: '🧮' },
    { href: '/financeiro/orcamento', label: 'Orçamento', icon: '🎯' },
    { href: '/financeiro/caixa',     label: 'Caixa',     icon: '🏦' },
    { href: '/financeiro/empresas',  label: 'Empresas',  icon: '🏢' },
    { href: '/financeiro/dividas',   label: 'Dívidas',   icon: '🔻' },
    { href: '/financeiro/relatorio', label: 'Relatório', icon: '📄' },
  ],
  empresa: [
    { href: '/empresa',    label: 'Documentos', icon: '🏢' },
    { href: '/documentos', label: 'Arquivos',   icon: '🗂️' },
    { href: '/contratos',           label: 'Contratos', icon: '📝' },
    { href: '/contratos/templates', label: 'Templates', icon: '🧾' },
  ],
  comercial: [
    { href: '/comercial',               label: 'Pipeline',      icon: '💼' },
    { href: '/comercial/propostas',     label: 'Propostas',     icon: '📨' },
    { href: '/comercial/precificacao',  label: 'Precificação',  icon: '🏷️' },
    { href: '/comercial/precificacao/servicos', label: 'Serviços', icon: '✂️' },
  ],
  dev: [
    { href: '/dev',    label: 'Desenvolvimento', icon: '⚙️' },
    { href: '/testes', label: 'Testes',          icon: '🧪' },
  ],
} as const satisfies Record<string, readonly SubNavTab[]>
