'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/overview',   icon: '🏠', label: 'Visão Geral' },
  { href: '/produtos',   icon: '📦', label: 'Produtos' },
  { href: '/dev',        icon: '⚙️',  label: 'Desenvolvimento' },
  { href: '/pipeline',   icon: '📈', label: 'Pipeline' },
  { href: '/comercial',  icon: '💼', label: 'Comercial' },
  { href: '/marketing',  icon: '📣', label: 'Marketing' },
  { href: '/financeiro', icon: '💰', label: 'Financeiro' },
  { href: '/empresa',    icon: '🏢', label: 'Empresa' },
  { href: '/time',       icon: '👥', label: 'Time' },
  { href: '/processos',  icon: '📋', label: 'Processos' },
]

// Grupos: rotas filhas que destacam a aba pai no sidebar
const NAV_GRUPOS: Record<string, string[]> = {
  '/financeiro': ['/receitas', '/balanco'],
  '/empresa':    ['/documentos', '/contratos'],
  '/dev':        ['/testes'],
}

type Props = {
  open?: boolean
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

export default function Sidebar({ open = false, onClose, collapsed = false, onToggleCollapsed }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // No mobile (drawer aberto) ignora o "collapsed" — sempre expandido
  const showCollapsed = collapsed && !open

  return (
    <aside
      className={[
        // Base
        'bg-[#111118] border-r border-[#1e1e2e] flex flex-col transition-[width] duration-200 ease-out',
        // Largura: mobile sempre w-64, desktop varia
        'w-64',
        showCollapsed ? 'md:w-16' : 'md:w-56',
        // Mobile: drawer fixo deslizante
        'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : '-translate-x-full',
        // Desktop: sticky e sempre visível
        'md:sticky md:top-0 md:h-screen md:translate-x-0 md:flex-shrink-0 md:z-auto',
      ].join(' ')}
      aria-hidden={!open ? undefined : false}
    >
      {/* Logo + close (mobile) */}
      <div className={`border-b border-[#1e1e2e] flex items-center ${showCollapsed ? 'md:justify-center md:px-2 px-4' : 'px-4 justify-between'} py-4`}>
        <div className={`flex items-center gap-2.5 min-w-0 ${showCollapsed ? 'md:gap-0' : ''}`}>
          <Image src="/logo.png" alt="Synapse Code" width={28} height={28} className="rounded-lg flex-shrink-0" />
          <div className={showCollapsed ? 'md:hidden' : ''}>
            <div className="text-sm font-semibold text-white leading-tight">Synapse Code</div>
            <div className="text-[11px] text-gray-500">Painel Interno</div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="md:hidden p-1.5 -mr-1 rounded text-gray-500 hover:text-white hover:bg-[#1e1e2e] transition-colors text-xl leading-none"
          >
            &times;
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 ${showCollapsed ? 'md:px-1.5' : 'px-2'} py-3 space-y-0.5 overflow-y-auto`}>
        {NAV.map(item => {
          const filhas = NAV_GRUPOS[item.href] ?? []
          const active = pathname === item.href || filhas.some(f => pathname === f || pathname.startsWith(f + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={showCollapsed ? item.label : undefined}
              className={`flex items-center rounded-lg text-sm transition-colors ${
                showCollapsed ? 'md:justify-center md:px-0 md:py-2.5 gap-2.5 px-3 py-2.5' : 'gap-2.5 px-3 py-2.5'
              } ${
                active
                  ? 'bg-violet-600/20 text-violet-300 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-[#1e1e2e]'
              }`}
            >
              <span className="text-base leading-none flex-shrink-0">{item.icon}</span>
              <span className={showCollapsed ? 'md:hidden' : ''}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Toggle collapse — só desktop */}
      {onToggleCollapsed && (
        <div className={`hidden md:flex border-t border-[#1e1e2e] ${showCollapsed ? 'justify-center px-1' : 'justify-end px-3'} py-2`}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={showCollapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-label={showCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-[#1e1e2e] transition-colors"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform ${showCollapsed ? 'rotate-180' : ''}`}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className={`border-t border-[#1e1e2e] px-4 py-3 ${showCollapsed ? 'md:px-1 md:py-2' : ''}`}>
        {/* Desktop colapsado: só ícone de logout */}
        {showCollapsed && (
          <button
            onClick={handleLogout}
            title={`Sair (${email})`}
            aria-label="Sair"
            className="hidden md:flex items-center justify-center w-8 h-8 mx-auto rounded-lg text-gray-500 hover:text-red-400 hover:bg-[#1e1e2e] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}

        {/* Mobile sempre + Desktop expandido: email + link Sair */}
        <div className={showCollapsed ? 'md:hidden' : ''}>
          <div className="text-[11px] text-gray-600 truncate mb-2">{email}</div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </aside>
  )
}
