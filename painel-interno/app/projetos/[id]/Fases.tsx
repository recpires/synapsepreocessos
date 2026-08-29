'use client'

import { cn } from '@/lib/cn'
import { Badge, Vazio } from '@/components/ui'
import type { ProjetoFase, StatusFase } from '@/types/projetos'

const TOM: Record<StatusFase, 'ok' | 'acento' | 'critico' | 'neutro'> = {
  concluida: 'ok', em_andamento: 'acento', bloqueada: 'critico', nao_iniciada: 'neutro',
}

const LABEL: Record<StatusFase, string> = {
  concluida: 'Concluída', em_andamento: 'Em andamento', bloqueada: 'Bloqueada', nao_iniciada: 'Não iniciada',
}

const dia = (d: string | null) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : null)

/** Dias de desvio entre o fim real (ou hoje, se aberta) e o fim previsto. */
function desvio(f: ProjetoFase): number | null {
  if (!f.fim_prev) return null
  const referencia = f.fim_real ?? new Date().toISOString().slice(0, 10)
  if (!f.fim_real && f.status === 'nao_iniciada') return null
  const ms = new Date(referencia).getTime() - new Date(f.fim_prev).getTime()
  return Math.round(ms / 86_400_000)
}

export function Fases({ projetoId, fases }: { projetoId: string; fases: ProjetoFase[] }) {
  void projetoId

  if (!fases.length) {
    return (
      <Vazio
        titulo="Nenhuma fase definida"
        descricao="Quando uma proposta é aceita, os itens de escopo viram as fases automaticamente. Para projeto próprio, defina à mão."
      />
    )
  }

  return (
    <ol className="space-y-3">
      {fases.map(f => {
        const d = desvio(f)
        const atrasada = d !== null && d > 0 && f.status !== 'concluida'
        return (
          <li key={f.id} className="flex gap-3">
            <span
              className={cn(
                'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full',
                f.status === 'concluida' ? 'bg-ok'
                  : f.status === 'em_andamento' ? 'bg-accent'
                  : f.status === 'bloqueada' ? 'bg-crit' : 'bg-line-strong'
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-fg">
                  <span className="tabular mr-1.5 text-subtle">{f.ordem}.</span>
                  {f.nome}
                </span>
                <Badge tom={TOM[f.status]} className="px-1.5 py-0 text-[10px]">{LABEL[f.status]}</Badge>
              </div>

              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full bg-accent" style={{ width: `${f.pct}%` }} />
              </div>

              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-subtle">
                <span className="tabular">{f.pct}%</span>
                {f.fim_prev && <span>previsto {dia(f.fim_prev)}</span>}
                {f.fim_real && <span>real {dia(f.fim_real)}</span>}
                {d !== null && d !== 0 && (
                  <span className={cn('tabular', atrasada ? 'text-crit' : d < 0 ? 'text-ok' : '')}>
                    {d > 0 ? `+${d}d` : `${d}d`}
                  </span>
                )}
              </div>

              {f.entregaveis && <p className="mt-1 text-xs text-muted">{f.entregaveis}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
