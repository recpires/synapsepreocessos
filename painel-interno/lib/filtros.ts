'use client'

import { useEffect, useState } from 'react'

/* ── Estado persistente em localStorage (sobrevive a edição/reload) ────────── */
export function usePersistido<T>(chave: string, inicial: T): [T, (v: T) => void] {
  const [valor, setValor] = useState<T>(inicial)

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(chave)
      if (salvo) {
        const parsed = JSON.parse(salvo)
        setValor(
          typeof inicial === 'object' && inicial !== null && !Array.isArray(inicial)
            ? { ...inicial, ...parsed }
            : parsed
        )
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  const set = (v: T) => {
    setValor(v)
    try { localStorage.setItem(chave, JSON.stringify(v)) } catch {}
  }

  return [valor, set]
}

/* ── Períodos pré-definidos + intervalo personalizado ─────────────────────── */
export type PeriodoPreset =
  | 'mes-atual' | 'mes-passado' | 'ultimos-3' | 'ano-atual'
  | 'proximos-12' | 'tudo' | 'custom'

export const PERIODO_LABEL: Record<PeriodoPreset, string> = {
  'mes-atual':   'Este mês',
  'mes-passado': 'Mês passado',
  'ultimos-3':   'Últimos 3 meses',
  'ano-atual':   'Este ano',
  'proximos-12': 'Próximos 12 meses',
  'tudo':        'Todo o período',
  'custom':      'Personalizado…',
}

const iso = (d: Date) => d.toISOString().slice(0, 10)
const inicioMes = (y: number, m: number) => iso(new Date(y, m, 1))
const fimMes = (y: number, m: number) => iso(new Date(y, m + 1, 0))

export function rangePeriodo(
  preset: PeriodoPreset,
  customDe?: string,
  customAte?: string,
): { de: string; ate: string } {
  const hoje = new Date()
  const y = hoje.getFullYear()
  const m = hoje.getMonth()
  switch (preset) {
    case 'mes-atual':   return { de: inicioMes(y, m), ate: fimMes(y, m) }
    case 'mes-passado': return { de: inicioMes(y, m - 1), ate: fimMes(y, m - 1) }
    case 'ultimos-3':   return { de: inicioMes(y, m - 2), ate: fimMes(y, m) }
    case 'ano-atual':   return { de: `${y}-01-01`, ate: `${y}-12-31` }
    case 'proximos-12': return { de: iso(hoje), ate: iso(new Date(y, m + 12, hoje.getDate())) }
    case 'custom':      return { de: customDe || '1900-01-01', ate: customAte || '2999-12-31' }
    case 'tudo':
    default:            return { de: '1900-01-01', ate: '2999-12-31' }
  }
}

/**
 * O que a janela de datas está escondendo.
 *
 * O filtro padrão é "Este ano", e nada na tela dizia que existia lançamento
 * fora dele. Três séries do Supabase viviam inteiras em 2027 — R$ 869,11 por
 * mês de projeção duplicada, invisíveis para quem foi procurar duplicata na
 * tela de despesas. Quem olhou concluiu que estava limpo, e estava certo sobre
 * o que via.
 *
 * Só conta o recorte de data. Categoria, tipo e busca também escondem linha,
 * mas ali quem filtrou sabe o que pediu; a janela temporal é a que vem ligada
 * por padrão.
 */
export function foraDaJanela(
  linhas: { data: string; valor: number | string }[],
  de: string,
  ate: string,
): { antes: number; depois: number; total: number } {
  let antes = 0, depois = 0, total = 0
  for (const l of linhas) {
    if (l.data >= de && l.data <= ate) continue
    if (l.data < de) antes++
    else depois++
    total += Number(l.valor) || 0
  }
  return { antes, depois, total }
}
