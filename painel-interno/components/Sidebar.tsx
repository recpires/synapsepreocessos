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
  { href: '/time',       icon: '👥', label: 'Time' },
  { href: '/processos',  icon: '📋', label: 'Processos' },
  { href: '/documentos', icon: '🗂️', label: 'Documentos' },
  { href: '/testes',      icon: '🧪', label: 'Testes CRM' },
  { href: '/testes/nero',  icon: '💈', label: 'Testes Nero' },
  { href: '/testes/kubic', icon: '🏗️', label: 'Testes Kubic' },
]

export default function Sidebar() {
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
    <aside className="w-56 min-h-screen bg-[#111118] border-r border-[#1e1e2e] flex flex-col sticky top-0 h-screen flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#1e1e2e]">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Synapse Code" width={28} height={28} className="rounded-lg flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-white leading-tight">Synapse Code</div>
            <div className="text-[11px] text-gray-500">Painel Interno</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
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
