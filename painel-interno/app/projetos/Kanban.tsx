'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { moverProjetoDeFase } from '@/server/projetos'
import {
  FASES_KANBAN, FASES_FORA_DO_QUADRO, FASE_LABEL, FASE_WIP, SAUDE_LABEL, estaPausado,
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

  /** Volta o projeto para a fase em que ele estava trabalhando de fato. */
  function retomar(p: ProjetoCard) {
    const destino: FaseProjeto = p.maturidade_pct >= 90 ? 'operacao' : 'desenvolvimento'
    const anterior = lista
    setLista(atual => atual.map(x => (x.id === p.id ? { ...x, fase_atual: destino } : x)))
    iniciarTransicao(async () => {
      const r = await moverProjetoDeFase(p.id, destino)
      if (r.ok) toast.success(`${p.nome} voltou para ${FASE_LABEL[destino]}.`)
      else {
        setLista(anterior)
        toast.error(r.error ?? 'Não foi possível retomar.')
      }
    })
  }

  const cartao = (p: ProjetoCard, foraDoQuadro = false) => {
    const pausado = estaPausado(p)
    return (
      <article
        key={p.id}
        draggable
        onDragStart={() => setArrastando(p.id)}
        onDragEnd={() => { setArrastando(null); setAlvo(null) }}
        className={cn(
          'cursor-grab rounded-token border border-line bg-surface p-2.5 transition-opacity active:cursor-grabbing',
          foraDoQuadro && 'w-56 flex-shrink-0',
          arrastando === p.id && 'opacity-40',
          // Pausado continua visível, mas apagado: some do resumo como risco e
          // não deve competir por atenção com o que está andando.
          pausado && 'opacity-60'
        )}
      >
        <Link href={`/projetos/${p.id}`} className="block">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'h-2 w-2 flex-shrink-0 rounded-full',
                pausado ? 'bg-surface-3' : COR_SAUDE[p.saude]
              )}
              title={pausado ? 'Pausado' : SAUDE_LABEL[p.saude]}
            />
            <h3 className="truncate text-sm font-semibold text-fg">{p.nome}</h3>
          </div>

          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full bg-accent" style={{ width: `${p.maturidade_pct}%` }} />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-subtle">
            <span className="tabular">{p.maturidade_pct}%</span>
            {pausado && !foraDoQuadro && (
              <Badge tom="neutro" className="px-1.5 py-0 text-[10px]">pausado</Badge>
            )}
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

        {/* Atalho para quem não quer arrastar. Fora do Link para o clique não
            navegar junto. */}
        {foraDoQuadro && p.fase_atual === 'pausado' && (
          <button
            type="button"
            onClick={() => retomar(p)}
            className="mt-2 text-[11px] text-accent-text hover:underline"
          >
            retomar projeto
          </button>
        )}
      </article>
    )
  }

  return (
    <div className="space-y-4">
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

              {daFase.map(p => cartao(p))}

              {daFase.length === 0 && (
                <p className="px-1.5 py-4 text-center text-[11px] text-subtle">Vazio</p>
              )}
            </div>
          )
        })}
      </div>

      {/*
        Pausado e encerrado ficam fora das colunas de propósito — não são etapa
        de trabalho —, mas precisam de um lugar no quadro. Sem isto, arrastar um
        card para lá o fazia desaparecer sem volta: o projeto continuava no
        banco e sumia da única tela onde se mexe nele.
      */}
      {FASES_FORA_DO_QUADRO.map(fase => {
        const daFase = lista.filter(p => p.fase_atual === fase)
        const vazio = daFase.length === 0
        const ativo = alvo === fase

        // Há duas pausas diferentes, e a tela se contradiria calada se não
        // dissesse qual é qual: esta faixa é a da fase; o selo no card vem do
        // produto estar desligado, e o projeto continua na coluna onde parou.
        const pausadosPorProduto = fase === 'pausado'
          ? lista.filter(p => p.produto_pausado && p.fase_atual !== 'pausado').length
          : 0

        return (
          <section
            key={fase}
            onDragOver={e => { e.preventDefault(); setAlvo(fase) }}
            onDragLeave={() => setAlvo(a => (a === fase ? null : a))}
            onDrop={() => soltar(fase)}
            className={cn(
              'rounded-token border border-dashed p-3 transition-colors',
              ativo ? 'border-accent bg-accent-soft' : 'border-line',
              vazio && !ativo && 'opacity-70'
            )}
          >
            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                {FASE_LABEL[fase]}
              </span>
              <span className="tabular text-xs text-subtle">{daFase.length}</span>
              {!vazio && fase === 'pausado' && (
                <span className="text-[11px] text-subtle">
                  arraste de volta para uma coluna, ou use “retomar”
                </span>
              )}
            </div>

            {vazio ? (
              <p className="text-[11px] text-subtle">
                Solte um card aqui para {fase === 'pausado' ? 'pausar' : 'encerrar'}.
                {pausadosPorProduto > 0 && (
                  <> {pausadosPorProduto} projeto(s) aparecem com selo{' '}
                  <em>pausado</em> nas colunas: a pausa deles vem do produto estar
                  desligado, não da fase, e por isso continuam onde pararam.</>
                )}
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto">
                {daFase.map(p => cartao(p, true))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
