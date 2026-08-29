'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { moverProjetoDeFase } from '@/server/projetos'
import {
  FASES_KANBAN, FASE_LABEL, FASE_WIP, SAUDE_LABEL,
  type ProjetoCard, type FaseProjeto, type Saude,
} from '@/types/projetos'

const COR_SAUDE: Record<Saude, string> = {
  verde: 'bg-ok', amarelo: 'bg-warn', vermelho: 'bg-crit',
}

export function Kanban({ projetos }: { projetos: ProjetoCard[] }) {
  const [lista, setLista] = useState(projetos)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [alvo, setAlvo] = useState<FaseProjeto | null>(null)
  const [, iniciarTransicao] = useTransition()

  function soltar(fase: FaseProjeto) {
    setAlvo(null)
    const id = arrastando
    setArrastando(null)
    if (!id) return

    const projeto = lista.find(p => p.id === id)
    if (!projeto || projeto.fase_atual === fase) return

    const anterior = lista
    // Move na hora e desfaz se o servidor recusar — arrastar tem que parecer instantâneo.
    setLista(atual => atual.map(p => (p.id === id ? { ...p, fase_atual: fase } : p)))

    iniciarTransicao(async () => {
      const r = await moverProjetoDeFase(id, fase)
      if (!r.ok) {
        setLista(anterior)
        toast.error(r.error ?? 'Não foi possível mover o projeto.')
      }
    })
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {FASES_KANBAN.map(fase => {
        const daFase = lista.filter(p => p.fase_atual === fase)
        const limite = FASE_WIP[fase]
        const estourou = limite !== undefined && daFase.length > limite

        return (
          <div
            key={fase}
            onDragOver={e => { e.preventDefault(); setAlvo(fase) }}
            onDragLeave={() => setAlvo(a => (a === fase ? null : a))}
            onDrop={() => soltar(fase)}
            className={cn(
              'flex w-56 flex-shrink-0 flex-col gap-2 rounded-token p-1.5 transition-colors',
              alvo === fase ? 'bg-accent-soft' : 'bg-transparent'
            )}
          >
            <div className="flex items-baseline justify-between border-b-2 border-line-strong px-1.5 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {FASE_LABEL[fase]}
              </span>
              <span
                className={cn('tabular text-xs', estourou ? 'font-semibold text-warn' : 'text-subtle')}
                title={limite ? `Limite de ${limite} em andamento` : undefined}
              >
                {daFase.length}{limite ? ` / ${limite}` : ''}
              </span>
            </div>

            {daFase.map(p => (
              <article
                key={p.id}
                draggable
                onDragStart={() => setArrastando(p.id)}
                onDragEnd={() => { setArrastando(null); setAlvo(null) }}
                className={cn(
                  'cursor-grab rounded-token border border-line bg-surface p-2.5 transition-opacity active:cursor-grabbing',
                  arrastando === p.id && 'opacity-40'
                )}
              >
                <Link href={`/projetos/${p.id}`} className="block">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn('h-2 w-2 flex-shrink-0 rounded-full', COR_SAUDE[p.saude])}
                      title={SAUDE_LABEL[p.saude]}
                    />
                    <h3 className="truncate text-sm font-semibold text-fg">{p.nome}</h3>
                  </div>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full bg-accent" style={{ width: `${p.maturidade_pct}%` }} />
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-subtle">
                    <span className="tabular">{p.maturidade_pct}%</span>
                    {p.erros_criticos > 0 && (
                      <Badge tom="critico" className="px-1.5 py-0 text-[10px]">
                        {p.erros_criticos} crítico{p.erros_criticos > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {p.erros_criticos === 0 && p.erros_abertos > 0 && (
                      <span>{p.erros_abertos} aberto{p.erros_abertos > 1 ? 's' : ''}</span>
                    )}
                    {p.responsavel && <span>{p.responsavel}</span>}
                  </div>
                </Link>
              </article>
            ))}

            {daFase.length === 0 && (
              <p className="px-1.5 py-4 text-center text-[11px] text-subtle">Vazio</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
