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
  { href: '/comercial',  icon: '💼', label: 'Comercial' },
  { href: '/pipeline',   icon: '📈', label: 'Pipeline' },
  { href: '/marketing',  icon: '📣', label: 'Marketing' },
  { href: '/financeiro', icon: '💰', label: 'Financeiro' },
  { href: '/receitas',   icon: '💵', label: 'Receitas' },
  { href: '/balanco',    icon: '📑', label: 'Balanço' },
  { href: '/time',       icon: '👥', label: 'Time' },
  { href: '/processos',  icon: '📋', label: 'Processos' },
  { href: '/documentos', icon: '🗂️', label: 'Documentos' },
  { href: '/contratos',  icon: '📝', label: 'Contratos' },
  { href: '/empresa',    icon: '🏢', label: 'Empresa' },
  { href: '/testes',     icon: '🧪', label: 'Testes' },
]

type Props = {
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ open = false, onClose }: Props) {
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

  return (
    <aside
      className={[
        // Base
        'w-64 md:w-56 bg-[#111118] border-r border-[#1e1e2e] flex flex-col',
        // Mobile: drawer fixo deslizante
        'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : '-translate-x-full',
        // Desktop: sticky e sempre visível
        'md:sticky md:top-0 md:h-screen md:translate-x-0 md:flex-shrink-0 md:z-auto',
      ].join(' ')}
      aria-hidden={!open ? undefined : false}
    >
      {/* Logo + close (mobile) */}
      <div className="px-4 py-4 border-b border-[#1e1e2e] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Synapse Code" width={28} height={28} className="rounded-lg flex-shrink-0" />
          <div>
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
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-violet-600/20 text-violet-300 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-[#1e1e2e]'
              }`}
            >
              <span className="text-sm leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1e1e2e]">
        <div className="text-[11px] text-gray-600 truncate mb-2">{email}</div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
