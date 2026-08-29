'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Badge, Input } from '@/components/ui'
import type { LinhaRentabilidade } from '@/server/dre'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function Rentabilidade({ linhas }: { linhas: LinhaRentabilidade[] }) {
  // O custo/hora vem do servidor com o padrão; recalcular aqui deixa testar
  // cenários sem gravar nada.
  const [custoHora, setCustoHora] = useState(120)

  const comCusto = linhas.map(l => {
    const custoHoras = l.horas * custoHora
    const margem = l.recebido - l.custoAlocado - custoHoras
    return {
      ...l,
      custoHoras,
      margem,
      margemPct: l.recebido > 0 ? Math.round((margem / l.recebido) * 1000) / 10 : null,
    }
  }).sort((a, b) => b.margem - a.margem)

  const semDado = comCusto.every(l => l.recebido === 0 && l.custoAlocado === 0 && l.horas === 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-40">
          <Input
            rotulo="Sua hora"
            type="number"
            min={0}
            step={10}
            value={custoHora}
            onChange={e => setCustoHora(Number(e.target.value) || 0)}
            dica="Só simula — não grava."
          />
        </div>
      </div>

      {semDado && (
        <p className="rounded-token border border-line bg-surface-2 px-3 py-2 text-sm text-muted">
          Nenhum projeto tem receita, despesa ou hora apontada ainda. A margem aparece quando
          você ligar lançamentos a projetos — o campo <code>projeto_id</code> já existe em
          despesas e receitas.
        </p>
      )}

      <div className="overflow-x-auto rounded-token border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-wide text-subtle">
              <th className="px-4 py-2 text-left font-medium">Projeto</th>
              <th className="px-4 py-2 text-right font-medium">Contratado</th>
              <th className="px-4 py-2 text-right font-medium">Recebido</th>
              <th className="px-4 py-2 text-right font-medium">Custo</th>
              <th className="px-4 py-2 text-right font-medium">Horas</th>
              <th className="px-4 py-2 text-right font-medium">Margem</th>
            </tr>
          </thead>
          <tbody>
            {comCusto.map(l => (
              <tr key={l.projeto_id} className="border-b border-line">
                <td className="px-4 py-2">
                  <Link href={`/projetos/${l.projeto_id}`} className="text-fg hover:text-accent">
                    {l.nome}
                  </Link>
                  {l.empresa && <div className="text-[11px] text-subtle">{l.empresa}</div>}
                </td>
                <td className="tabular px-4 py-2 text-right text-muted">
                  {l.contratado > 0 ? brl(l.contratado) : '—'}
                </td>
                <td className="tabular px-4 py-2 text-right">
                  {l.recebido > 0 ? brl(l.recebido) : '—'}
                </td>
                <td className="tabular px-4 py-2 text-right">
                  {l.custoAlocado > 0 ? brl(l.custoAlocado) : '—'}
                </td>
                <td className="tabular px-4 py-2 text-right text-muted">
                  {l.horas > 0 ? `${l.horas}h · ${brl(l.custoHoras)}` : '—'}
                </td>
                <td className="px-4 py-2 text-right">
                  {l.recebido === 0 && l.custoAlocado === 0 && l.horas === 0 ? (
                    <span className="text-subtle">—</span>
                  ) : (
                    <span className="flex items-center justify-end gap-2">
                      <span className={cn('tabular font-medium',
                        l.margem < 0 ? 'text-crit' : 'text-ok')}>
                        {brl(l.margem)}
                      </span>
                      {l.margemPct !== null && (
                        <Badge tom={l.margemPct < 0 ? 'critico' : l.margemPct < 20 ? 'atencao' : 'ok'}
                          className="px-1.5 py-0 text-[10px]">
                          {l.margemPct}%
                        </Badge>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
