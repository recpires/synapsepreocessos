'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

/**
 * Seletor de empresa das telas financeiras.
 *
 * O estado mora na URL (`?empresa=<id>`) e não em contexto de React por dois
 * motivos: as páginas são Server Components e leem `searchParams` direto, sem
 * precisar de client wrapper; e o recorte fica compartilhável — o link que
 * você manda abre no mesmo corte que você estava vendo.
 */
export function SeletorEmpresa({
  empresas,
}: { empresas: { id: string; nome: string }[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pendente, iniciar] = useTransition()

  const atual = params.get('empresa') ?? ''

  // Uma empresa só não tem o que escolher, e a barra vira ruído.
  if (empresas.length < 2) return null

  function trocar(id: string) {
    const novo = new URLSearchParams(params.toString())
    if (id) novo.set('empresa', id)
    else novo.delete('empresa')
    iniciar(() => router.push(`${pathname}?${novo.toString()}`))
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-token border border-line bg-surface p-1 print:hidden">
      <span className="px-2 text-xs font-medium uppercase tracking-wide text-subtle">
        Empresa
      </span>
      <Aba ativo={atual === ''} pendente={pendente} onClick={() => trocar('')}>
        Todas
      </Aba>
      {empresas.map(e => (
        <Aba key={e.id} ativo={atual === e.id} pendente={pendente} onClick={() => trocar(e.id)}>
          {e.nome}
        </Aba>
      ))}
    </div>
  )
}

function Aba({
  ativo, pendente, onClick, children,
}: {
  ativo: boolean
  pendente: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={[
        'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
        ativo ? 'bg-accent text-accent-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
        pendente ? 'opacity-70' : '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
