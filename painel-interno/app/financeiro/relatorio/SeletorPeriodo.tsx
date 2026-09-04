'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { periodoDoMes, periodoDoAno, deslocarMesRotulo, mesAtual } from '@/lib/periodo-relatorio'

/**
 * Escolha do período do relatório.
 *
 * Mora na barra de ação, que tem `print:hidden` — o PDF sai com o período
 * escrito na capa, não com o controle que o escolheu.
 *
 * Navega por query string em vez de guardar estado: o relatório de um mês
 * passa a ter URL própria, que dá para mandar para o contador sem explicar
 * quais botões apertar.
 */
export function SeletorPeriodo({ mes, ano }: { mes: string | null; ano: number }) {
  const router = useRouter()
  const params = useSearchParams()
  const [navegando, iniciar] = useTransition()

  const ir = (inicio: string, fim: string) => {
    const q = new URLSearchParams(params.toString())
    q.set('inicio', inicio)
    q.set('fim', fim)
    iniciar(() => router.push(`/financeiro/relatorio?${q}`))
  }

  const escolherMes = (valor: string) => {
    if (!valor) return
    const p = periodoDoMes(valor)
    ir(p.inicio, p.fim)
  }

  // Sem mês definido o relatório é do ano; as setas partem do mês corrente.
  const base = mes ?? mesAtual(new Date())

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => escolherMes(deslocarMesRotulo(base, -1))}
        disabled={navegando}
        aria-label="Mês anterior"
        className="rounded-token border border-line px-2 py-1 text-sm text-muted transition-colors hover:text-fg disabled:opacity-50"
      >
        ‹
      </button>

      <input
        type="month"
        value={mes ?? ''}
        onChange={e => escolherMes(e.target.value)}
        disabled={navegando}
        aria-label="Mês do relatório"
        className="rounded-token border border-line bg-ground px-2 py-1 text-sm text-fg disabled:opacity-50"
      />

      <button
        type="button"
        onClick={() => escolherMes(deslocarMesRotulo(base, 1))}
        disabled={navegando}
        aria-label="Próximo mês"
        className="rounded-token border border-line px-2 py-1 text-sm text-muted transition-colors hover:text-fg disabled:opacity-50"
      >
        ›
      </button>

      <button
        type="button"
        onClick={() => { const p = periodoDoAno(ano); ir(p.inicio, p.fim) }}
        disabled={navegando}
        className={`rounded-token border px-2.5 py-1 text-sm transition-colors disabled:opacity-50 ${
          mes ? 'border-line text-muted hover:text-fg' : 'border-accent text-accent'
        }`}
      >
        {ano} inteiro
      </button>
    </div>
  )
}
