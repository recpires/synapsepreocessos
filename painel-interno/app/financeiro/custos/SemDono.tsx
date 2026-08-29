'use client'

import { useState } from 'react'
import { Badge, Button } from '@/components/ui'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type Item = { descricao: string; categoria: string; total: number; lancamentos: number }

export function SemDono({ itens }: { itens: Item[] }) {
  const [todos, setTodos] = useState(false)

  if (itens.length === 0) {
    return <p className="text-sm text-subtle">Toda despesa realizada tem produto ou regra. Nada na fila.</p>
  }

  const total = itens.reduce((a, i) => a + i.total, 0)
  const visiveis = todos ? itens : itens.slice(0, 8)

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        <span className="tabular font-medium text-fg">{brl(total)}</span> em{' '}
        {itens.length} descriç{itens.length === 1 ? 'ão' : 'ões'} sem dono.
      </p>

      <ul className="divide-y divide-line">
        {visiveis.map(i => (
          <li key={i.descricao} className="flex items-center justify-between gap-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm text-fg">{i.descricao.trim()}</span>
              <span className="flex items-center gap-1.5 text-[11px] text-subtle">
                <Badge tom="neutro" className="px-1.5 py-0 text-[10px]">{i.categoria}</Badge>
                {i.lancamentos} lançamento{i.lancamentos > 1 ? 's' : ''}
              </span>
            </span>
            <span className="tabular flex-shrink-0 text-sm text-fg">{brl(i.total)}</span>
          </li>
        ))}
      </ul>

      {itens.length > 8 && (
        <Button tamanho="sm" variante="fantasma" onClick={() => setTodos(v => !v)}>
          {todos ? 'Mostrar só os maiores' : `Ver todas as ${itens.length}`}
        </Button>
      )}
    </div>
  )
}
