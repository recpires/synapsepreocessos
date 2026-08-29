'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { salvarMaturidade } from '@/server/projetos'
import type { CamadaMaturidade, NotaMaturidade } from '@/types/projetos'

function corDaNota(nota: number) {
  if (nota >= 80) return 'bg-ok'
  if (nota >= 50) return 'bg-warn'
  return 'bg-crit'
}

export function Maturidade({
  projetoId,
  camadas,
  notas,
  fallbackPct,
}: {
  projetoId: string
  camadas: CamadaMaturidade[]
  notas: NotaMaturidade[]
  fallbackPct: number
}) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [salvando, iniciar] = useTransition()

  // Nota mais recente de cada camada. `notas` já vem ordenado por data desc.
  const ultimas = useMemo(() => {
    const m = new Map<string, NotaMaturidade>()
    for (const n of notas) if (!m.has(n.camada)) m.set(n.camada, n)
    return m
  }, [notas])

  const [rascunho, setRascunho] = useState<Record<string, number>>(() =>
    Object.fromEntries(camadas.map(c => [c.camada, ultimas.get(c.camada)?.nota ?? 0]))
  )

  const avaliado = ultimas.size > 0
  const pesoTotal = camadas.reduce((a, c) => a + Number(c.peso), 0)
  const previa = pesoTotal
    ? Math.round(camadas.reduce((a, c) => a + (rascunho[c.camada] ?? 0) * Number(c.peso), 0) / pesoTotal)
    : 0

  function salvar() {
    iniciar(async () => {
      const r = await salvarMaturidade(
        projetoId,
        camadas.map(c => ({ camada: c.camada, peso: Number(c.peso), nota: rascunho[c.camada] ?? 0 }))
      )
      if (r.ok) {
        toast.success(`Maturidade atualizada para ${r.maturidade_pct}%.`)
        setEditando(false)
        router.refresh()
      } else {
        toast.error(r.error ?? 'Não foi possível salvar a avaliação.')
      }
    })
  }

  if (!camadas.length) {
    return <p className="text-sm text-subtle">A rubrica de camadas não foi carregada.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="tabular text-2xl font-semibold text-fg">
          {editando ? previa : avaliado ? previa : fallbackPct}%
        </span>
        <Button tamanho="sm" variante={editando ? 'secundario' : 'fantasma'} onClick={() => setEditando(v => !v)}>
          {editando ? 'Cancelar' : avaliado ? 'Reavaliar' : 'Avaliar'}
        </Button>
      </div>

      {!avaliado && !editando && (
        <p className="text-xs text-subtle">
          Ainda sem avaliação por camada — este número veio do acompanhamento manual.
          Avaliar substitui o palpite por nota com peso e evidência.
        </p>
      )}

      <ul className="space-y-2.5">
        {camadas.map(c => {
          const nota = editando ? (rascunho[c.camada] ?? 0) : (ultimas.get(c.camada)?.nota ?? 0)
          return (
            <li key={c.camada}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate text-muted" title={c.ajuda ?? undefined}>{c.camada}</span>
                <span className="tabular flex-shrink-0 text-subtle">
                  peso {Number(c.peso).toFixed(1)} · {nota}%
                </span>
              </div>
              {editando ? (
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={rascunho[c.camada] ?? 0}
                  onChange={e => setRascunho(r => ({ ...r, [c.camada]: Number(e.target.value) }))}
                  aria-label={c.camada}
                  className="mt-1 w-full accent-accent"
                />
              ) : (
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div className={cn('h-full', corDaNota(nota))} style={{ width: `${nota}%` }} />
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {editando && (
        <Button tamanho="sm" carregando={salvando} onClick={salvar} className="w-full">
          Salvar avaliação
        </Button>
      )}
    </div>
  )
}
