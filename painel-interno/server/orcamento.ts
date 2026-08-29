'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import { porEmpresa } from '@/lib/filtro-empresa'

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

export type LinhaOrcamento = {
  categoria: string
  previsto: number
  realizado: number
  desvio: number
  /** Percentual do previsto já consumido. null quando não há previsto. */
  consumo: number | null
}

export type Orcamento = {
  ano: number
  mes: number
  linhas: LinhaOrcamento[]
  totalPrevisto: number
  totalRealizado: number
  /** Categorias com gasto no mês que ninguém orçou. */
  semPrevisao: string[]
}

export async function obterOrcamento(
  ano: number, mes: number, empresaId?: string
): Promise<Resultado<Orcamento>> {
  try {
    await assertMembro()
    const sb = await createClient()

    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const fim = mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, '0')}-01`

    const [{ data: previstos, error: e1 }, { data: despesas, error: e2 }] = await Promise.all([
      sb.from('orcamentos').select('categoria, valor_previsto').eq('ano', ano).eq('mes', mes),
      porEmpresa(sb.from('despesas').select('categoria, valor')
        .gte('data', inicio).lt('data', fim), empresaId),
    ])
    if (e1) return { error: `orcamentos: ${e1.message}` }
    if (e2) return { error: `despesas: ${e2.message}` }

    const realizado = new Map<string, number>()
    for (const d of despesas ?? []) {
      realizado.set(d.categoria, (realizado.get(d.categoria) ?? 0) + Number(d.valor))
    }
    const previsto = new Map<string, number>()
    for (const o of previstos ?? []) {
      previsto.set(o.categoria, Number(o.valor_previsto))
    }

    // União das duas pontas: categoria orçada sem gasto também precisa aparecer.
    const categorias = [...new Set([...previsto.keys(), ...realizado.keys()])].sort()

    const linhas: LinhaOrcamento[] = categorias.map(categoria => {
      const p = previsto.get(categoria) ?? 0
      const r = Math.round((realizado.get(categoria) ?? 0) * 100) / 100
      return {
        categoria,
        previsto: p,
        realizado: r,
        desvio: Math.round((r - p) * 100) / 100,
        consumo: p > 0 ? Math.round((r / p) * 100) : null,
      }
    })

    return {
      data: {
        ano, mes, linhas,
        totalPrevisto: Math.round(linhas.reduce((a, l) => a + l.previsto, 0) * 100) / 100,
        totalRealizado: Math.round(linhas.reduce((a, l) => a + l.realizado, 0) * 100) / 100,
        semPrevisao: linhas.filter(l => l.previsto === 0 && l.realizado > 0).map(l => l.categoria),
      },
    }
  } catch (e) {
    return { error: `obterOrcamento: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export async function salvarOrcamento(
  ano: number,
  mes: number,
  valores: { categoria: string; valor_previsto: number }[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    const positivos = valores.filter(v => v.valor_previsto > 0)
    const zerados = valores.filter(v => v.valor_previsto <= 0).map(v => v.categoria)

    if (positivos.length) {
      const { error } = await sb.from('orcamentos').upsert(
        positivos.map(v => ({ ano, mes, categoria: v.categoria, valor_previsto: v.valor_previsto })),
        { onConflict: 'ano,mes,categoria' }
      )
      if (error) return { ok: false, error: error.message }
    }

    // Previsto zerado = sem orçamento para a categoria, não orçamento de zero.
    if (zerados.length) {
      const { error } = await sb.from('orcamentos')
        .delete().eq('ano', ano).eq('mes', mes).in('categoria', zerados)
      if (error) return { ok: false, error: error.message }
    }

    revalidatePath('/financeiro/orcamento')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Média realizada por categoria nos últimos N meses fechados — base para orçar. */
export async function sugerirOrcamento(
  meses = 3
): Promise<Resultado<{ categoria: string; media: number }[]>> {
  try {
    await assertMembro()
    const sb = await createClient()

    const agora = new Date()
    const primeiroDoMesAtual = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1))
    const inicio = new Date(primeiroDoMesAtual)
    inicio.setUTCMonth(inicio.getUTCMonth() - meses)

    const { data, error } = await sb
      .from('despesas')
      .select('categoria, valor')
      .gte('data', inicio.toISOString().slice(0, 10))
      .lt('data', primeiroDoMesAtual.toISOString().slice(0, 10))
    if (error) return { error: `despesas: ${error.message}` }

    const soma = new Map<string, number>()
    for (const d of data ?? []) {
      soma.set(d.categoria, (soma.get(d.categoria) ?? 0) + Number(d.valor))
    }

    return {
      data: [...soma.entries()]
        .map(([categoria, total]) => ({ categoria, media: Math.round((total / meses) * 100) / 100 }))
        .sort((a, b) => b.media - a.media),
    }
  } catch (e) {
    return { error: `sugerirOrcamento: ${e instanceof Error ? e.message : String(e)}` }
  }
}
