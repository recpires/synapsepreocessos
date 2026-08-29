'use client'

import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui'
import type { Fluxo as DadosFluxo } from '@/server/dre'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const brl0 = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const rotulo = (iso: string) => {
  const [, m] = iso.split('-').map(Number)
  return MES[m - 1]
}

export function Fluxo({ fluxo }: { fluxo: DadosFluxo }) {
  if (fluxo.meses.length === 0) {
    return <p className="text-sm text-subtle">Nenhum lançamento nos próximos meses.</p>
  }

  const L = 700, A = 190, base = A - 28
  const saldos = fluxo.meses.map(m => m.saldoAcumulado)
  const teto = Math.max(...saldos, 0)
  const piso = Math.min(...saldos, 0)
  const faixa = teto - piso || 1
  const y = (v: number) => base - ((v - piso) / faixa) * base
  const passo = L / Math.max(fluxo.meses.length - 1, 1)

  const linha = fluxo.meses.map((m, i) => `${i * passo},${y(m.saldoAcumulado)}`).join(' ')
  const zeroY = y(0)

  return (
    <div className="space-y-4">
      {!fluxo.temSaldo && (
        <p className="rounded-token border border-warn-line bg-warn-soft px-3 py-2 text-sm text-warn">
          Sem saldo bancário cadastrado, a curva parte do zero e mostra só a variação —
          não o caixa real. Informe o saldo em <strong>Caixa</strong> para o número virar decisão.
        </p>
      )}

      {fluxo.mesDoAperto && (
        <p className="rounded-token border border-crit-line bg-crit-soft px-3 py-2 text-sm text-crit">
          No ritmo atual, o caixa fica negativo em <strong>{fluxo.mesDoAperto}</strong>.
        </p>
      )}

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${L} ${A}`} className="w-full min-w-[520px]" role="img"
          aria-label="Saldo de caixa acumulado por mês">
          {/* Linha do zero — o que separa caixa positivo de negativo */}
          <line x1="0" x2={L} y1={zeroY} y2={zeroY}
            stroke="currentColor" opacity="0.25" strokeDasharray="4 3" />
          <polyline points={linha} fill="none" className="stroke-accent" strokeWidth="2.5" />
          {fluxo.meses.map((m, i) => (
            <g key={m.mes}>
              <circle cx={i * passo} cy={y(m.saldoAcumulado)} r="3"
                className={cn(m.saldoAcumulado < 0 ? 'fill-crit' : 'fill-accent')} />
              <text x={i * passo} y={A - 8} textAnchor="middle"
                className="fill-current text-[10px]" opacity={m.projetado ? 0.4 : 0.7}>
                {rotulo(m.mes)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="overflow-x-auto rounded-token border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-wide text-subtle">
              <th className="px-4 py-2 text-left font-medium">Mês</th>
              <th className="px-4 py-2 text-right font-medium">Entradas</th>
              <th className="px-4 py-2 text-right font-medium">Saídas</th>
              <th className="px-4 py-2 text-right font-medium">Líquido</th>
              <th className="px-4 py-2 text-right font-medium">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {fluxo.meses.map(m => (
              <tr key={m.mes} className={cn('border-b border-line', m.projetado && 'opacity-70')}>
                <td className="px-4 py-2">
                  <span className="flex items-center gap-2">
                    {m.mes}
                    {m.projetado && (
                      <Badge tom="neutro" className="px-1.5 py-0 text-[10px]">projetado</Badge>
                    )}
                  </span>
                </td>
                <td className="tabular px-4 py-2 text-right text-ok">
                  {m.entradas > 0 ? brl0(m.entradas) : '—'}
                </td>
                <td className="tabular px-4 py-2 text-right">{brl0(m.saidas)}</td>
                <td className={cn('tabular px-4 py-2 text-right', m.liquido < 0 ? 'text-crit' : 'text-ok')}>
                  {brl0(m.liquido)}
                </td>
                <td className={cn('tabular px-4 py-2 text-right font-medium',
                  m.saldoAcumulado < 0 && 'text-crit')}>
                  {brl(m.saldoAcumulado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
