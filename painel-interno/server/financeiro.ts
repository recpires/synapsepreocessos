'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import { porEmpresa } from '@/lib/filtro-empresa'

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

function falha(contexto: string, e: unknown): { error: string } {
  return { error: `${contexto}: ${e instanceof Error ? e.message : String(e)}` }
}

/** Hoje em ISO, para cortar realizado de projetado sem depender do fuso. */
function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

// ── Tipos ────────────────────────────────────────────────────────────────────

export type RegraRateio = {
  id: string
  nome: string
  aplica_a: 'descricao' | 'categoria'
  padrao: string
  ativa: boolean
  observacao: string | null
  itens: { produto_id: string; produto_nome: string; percentual: number }[]
  soma: number
  valida: boolean
  /** Quanto essa regra alcança de despesa realizada. */
  alcance: number
}

export type CustoProduto = {
  produto_id: string
  produto_nome: string
  direto: number
  rateado: number
  total: number
}

export type PanoramaCustos = {
  produtos: CustoProduto[]
  semDono: number
  totalRealizado: number
  /** Média das despesas dos últimos 3 meses fechados. */
  burnMensal: number
  runwayMeses: number | null
  saldoTotal: number
}

// ── Rateio ───────────────────────────────────────────────────────────────────

export async function listarRegrasRateio(
  empresaId?: string
): Promise<Resultado<RegraRateio[]>> {
  try {
    await assertMembro()
    const sb = await createClient()

    const [{ data: regras, error: e1 }, { data: itens }, { data: produtos }, { data: despesas }] =
      await Promise.all([
        sb.from('rateio_regras').select('*').order('nome'),
        sb.from('rateio_itens').select('*'),
        sb.from('produtos').select('id, nome'),
        porEmpresa(sb.from('despesas').select('descricao, categoria, valor, produto')
          .lt('data', hojeISO()), empresaId),
      ])
    if (e1) return { error: `regras: ${e1.message}` }

    const nomeProduto = new Map((produtos ?? []).map(p => [p.id as string, p.nome as string]))
    const geral = (despesas ?? []).filter(d => (d.produto ?? 'Geral') === 'Geral')

    return {
      data: (regras ?? []).map(r => {
        const seus = (itens ?? []).filter(i => i.regra_id === r.id)
        const soma = seus.reduce((a, i) => a + Number(i.percentual), 0)

        const alcance = geral
          .filter(d =>
            r.aplica_a === 'descricao'
              ? d.descricao?.toLowerCase().includes(r.padrao.toLowerCase())
              : d.categoria === r.padrao
          )
          .reduce((a, d) => a + Number(d.valor), 0)

        return {
          id: r.id,
          nome: r.nome,
          aplica_a: r.aplica_a,
          padrao: r.padrao,
          ativa: r.ativa,
          observacao: r.observacao,
          itens: seus.map(i => ({
            produto_id: i.produto_id,
            produto_nome: nomeProduto.get(i.produto_id) ?? '?',
            percentual: Number(i.percentual),
          })),
          soma,
          valida: soma === 100,
          alcance: Math.round(alcance * 100) / 100,
        }
      }),
    }
  } catch (e) {
    return falha('listarRegrasRateio', e)
  }
}

export async function salvarRegraRateio(dados: {
  id?: string
  nome: string
  aplica_a: 'descricao' | 'categoria'
  padrao: string
  itens: { produto_id: string; percentual: number }[]
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    const nome = dados.nome.trim()
    const padrao = dados.padrao.trim()
    if (!nome || !padrao) return { ok: false, error: 'Informe o nome e o padrão da regra.' }

    const usados = dados.itens.filter(i => i.percentual > 0)
    if (usados.length === 0) return { ok: false, error: 'Distribua o custo em pelo menos um produto.' }

    const soma = usados.reduce((a, i) => a + i.percentual, 0)
    if (Math.abs(soma - 100) > 0.01) {
      return { ok: false, error: `Os percentuais somam ${soma}%. Ajuste para fechar em 100%.` }
    }

    let regraId = dados.id
    if (regraId) {
      const { error } = await sb.from('rateio_regras')
        .update({ nome, aplica_a: dados.aplica_a, padrao }).eq('id', regraId)
      if (error) return { ok: false, error: error.message }
      await sb.from('rateio_itens').delete().eq('regra_id', regraId)
    } else {
      const { data, error } = await sb.from('rateio_regras')
        .insert({ nome, aplica_a: dados.aplica_a, padrao }).select('id').single()
      if (error) return { ok: false, error: error.message }
      regraId = data.id
    }

    const { error: e2 } = await sb.from('rateio_itens').insert(
      usados.map(i => ({ regra_id: regraId, produto_id: i.produto_id, percentual: i.percentual }))
    )
    if (e2) return { ok: false, error: e2.message }

    revalidatePath('/financeiro/custos')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function removerRegraRateio(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb.from('rateio_regras').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/financeiro/custos')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ── Panorama de custos ───────────────────────────────────────────────────────

export async function obterPanoramaCustos(empresaId?: string): Promise<Resultado<PanoramaCustos>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const hoje = hojeISO()

    const [{ data: custos, error: e1 }, { data: produtos }, { data: despesas }, { data: contas }] =
      await Promise.all([
        sb.from('custo_por_produto').select('*').lt('data', hoje),
        sb.from('produtos').select('id, nome').order('ordem'),
        porEmpresa(sb.from('despesas').select('data, valor, produto').lt('data', hoje), empresaId),
        porEmpresa(sb.from('contas_bancarias').select('saldo_atual').eq('ativa', true), empresaId),
      ])
    if (e1) return { error: `custo_por_produto: ${e1.message}` }

    const porProduto = new Map<string, { direto: number; rateado: number }>()
    for (const c of custos ?? []) {
      const atual = porProduto.get(c.produto_id) ?? { direto: 0, rateado: 0 }
      if (c.origem === 'direto') atual.direto += Number(c.valor)
      else atual.rateado += Number(c.valor)
      porProduto.set(c.produto_id, atual)
    }

    const linhas: CustoProduto[] = (produtos ?? [])
      .map(p => {
        const c = porProduto.get(p.id) ?? { direto: 0, rateado: 0 }
        return {
          produto_id: p.id,
          produto_nome: p.nome,
          direto: Math.round(c.direto * 100) / 100,
          rateado: Math.round(c.rateado * 100) / 100,
          total: Math.round((c.direto + c.rateado) * 100) / 100,
        }
      })
      .filter(l => l.total > 0)
      .sort((a, b) => b.total - a.total)

    const totalRealizado = (despesas ?? []).reduce((a, d) => a + Number(d.valor), 0)
    const alocado = linhas.reduce((a, l) => a + l.total, 0)

    // Burn: média dos três meses fechados anteriores ao atual. Usar o mês
    // corrente distorceria, porque ele ainda não terminou.
    const agora = new Date()
    const chave = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const tresMeses = [1, 2, 3].map(n => chave(new Date(agora.getFullYear(), agora.getMonth() - n, 1)))
    const porMes = new Map<string, number>()
    for (const d of despesas ?? []) {
      const m = d.data.slice(0, 7)
      porMes.set(m, (porMes.get(m) ?? 0) + Number(d.valor))
    }
    const meses = tresMeses.map(m => porMes.get(m) ?? 0)
    const burnMensal = meses.reduce((a, v) => a + v, 0) / (meses.length || 1)

    const saldoTotal = (contas ?? []).reduce((a, c) => a + Number(c.saldo_atual), 0)

    return {
      data: {
        produtos: linhas,
        semDono: Math.round((totalRealizado - alocado) * 100) / 100,
        totalRealizado: Math.round(totalRealizado * 100) / 100,
        burnMensal: Math.round(burnMensal * 100) / 100,
        // Sem saldo cadastrado não dá para dizer runway — melhor null que zero.
        runwayMeses: saldoTotal > 0 && burnMensal > 0
          ? Math.round((saldoTotal / burnMensal) * 10) / 10
          : null,
        saldoTotal: Math.round(saldoTotal * 100) / 100,
      },
    }
  } catch (e) {
    return falha('obterPanoramaCustos', e)
  }
}

export async function listarProdutosSimples(): Promise<Resultado<{ id: string; nome: string }[]>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb.from('produtos').select('id, nome').order('ordem')
    if (error) return { error: `produtos: ${error.message}` }
    return { data: (data ?? []) as { id: string; nome: string }[] }
  } catch (e) {
    return falha('listarProdutosSimples', e)
  }
}

/** As maiores despesas ainda sem produto — a fila do que ratear em seguida. */
export async function listarSemDono(empresaId?: string): Promise<Resultado<
  { descricao: string; categoria: string; total: number; lancamentos: number }[]
>> {
  try {
    await assertMembro()
    const sb = await createClient()

    const [{ data: despesas, error }, { data: regras }, { data: itens }] = await Promise.all([
      porEmpresa(sb.from('despesas').select('descricao, categoria, valor, produto')
        .lt('data', hojeISO()), empresaId),
      sb.from('rateio_regras').select('id, aplica_a, padrao, ativa').eq('ativa', true),
      sb.from('rateio_itens').select('regra_id, percentual'),
    ])
    if (error) return { error: `despesas: ${error.message}` }

    // Só regras que fecham 100% realmente cobrem uma despesa.
    const soma = new Map<string, number>()
    for (const i of itens ?? []) {
      soma.set(i.regra_id, (soma.get(i.regra_id) ?? 0) + Number(i.percentual))
    }
    const validas = (regras ?? []).filter(r => soma.get(r.id) === 100)

    const coberta = (d: { descricao: string; categoria: string }) =>
      validas.some(r =>
        r.aplica_a === 'descricao'
          ? d.descricao?.toLowerCase().includes(r.padrao.toLowerCase())
          : d.categoria === r.padrao
      )

    const agrupado = new Map<string, { categoria: string; total: number; lancamentos: number }>()
    for (const d of despesas ?? []) {
      if ((d.produto ?? 'Geral') !== 'Geral') continue
      if (coberta(d)) continue
      const chave = d.descricao ?? '(sem descrição)'
      const atual = agrupado.get(chave) ?? { categoria: d.categoria, total: 0, lancamentos: 0 }
      atual.total += Number(d.valor)
      atual.lancamentos++
      agrupado.set(chave, atual)
    }

    return {
      data: [...agrupado.entries()]
        .map(([descricao, v]) => ({
          descricao,
          categoria: v.categoria,
          total: Math.round(v.total * 100) / 100,
          lancamentos: v.lancamentos,
        }))
        .sort((a, b) => b.total - a.total),
    }
  } catch (e) {
    return falha('listarSemDono', e)
  }
}
