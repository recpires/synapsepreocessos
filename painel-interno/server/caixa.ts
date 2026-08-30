'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import { porEmpresa } from '@/lib/filtro-empresa'

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

export type Conta = {
  id: string
  empresa_id: string | null
  nome: string
  banco: string | null
  tipo: string
  saldo_atual: number
  atualizado_em: string
  ativa: boolean
}

export type Imposto = {
  id: string
  empresa_id: string | null
  competencia: string
  tipo: string
  valor: number
  vencimento: string
  pago_em: string | null
  guia_url: string | null
  observacao: string | null
}

export type Caixa = {
  contas: Conta[]
  impostos: Imposto[]
  saldoTotal: number
  /** Dias desde a atualização mais antiga entre as contas ativas. */
  saldoDesatualizadoHa: number | null
  burnMensal: number
  runwayMeses: number | null
  aPagar: number
  vencidos: number
}

function diasDesde(iso: string) {
  const hoje = Date.UTC(
    new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()
  )
  const [a, m, d] = iso.split('-').map(Number)
  return Math.round((hoje - Date.UTC(a, m - 1, d)) / 86_400_000)
}

export async function obterCaixa(empresaId?: string): Promise<Resultado<Caixa>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const hoje = new Date().toISOString().slice(0, 10)

    const [{ data: contas, error: e1 }, { data: impostos, error: e2 }, { data: despesas }] =
      await Promise.all([
        porEmpresa(sb.from('contas_bancarias').select('*').order('nome'), empresaId),
        porEmpresa(sb.from('impostos').select('*').order('vencimento'), empresaId),
        // Burn é o que saiu de fato; previsão vencida sem confirmação não conta.
        porEmpresa(sb.from('despesas').select('data, valor')
          .lt('data', hoje).eq('confirmado', true), empresaId),
      ])
    if (e1) return { error: `contas: ${e1.message}` }
    if (e2) return { error: `impostos: ${e2.message}` }

    const ativas = (contas ?? []).filter(c => c.ativa)
    const saldoTotal = ativas.reduce((a, c) => a + Number(c.saldo_atual), 0)

    // Saldo velho engana mais do que saldo ausente — a tela precisa avisar.
    const saldoDesatualizadoHa = ativas.length
      ? Math.max(...ativas.map(c => diasDesde(c.atualizado_em)))
      : null

    // Burn: média dos três meses fechados. O mês corrente ainda não terminou.
    const agora = new Date()
    const chave = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const tres = [1, 2, 3].map(n => chave(new Date(agora.getFullYear(), agora.getMonth() - n, 1)))
    const porMes = new Map<string, number>()
    for (const d of despesas ?? []) {
      const m = d.data.slice(0, 7)
      porMes.set(m, (porMes.get(m) ?? 0) + Number(d.valor))
    }
    const burnMensal = tres.reduce((a, m) => a + (porMes.get(m) ?? 0), 0) / 3

    const abertos = (impostos ?? []).filter(i => !i.pago_em)

    return {
      data: {
        contas: (contas ?? []).map(c => ({ ...c, saldo_atual: Number(c.saldo_atual) })) as Conta[],
        impostos: (impostos ?? []).map(i => ({ ...i, valor: Number(i.valor) })) as Imposto[],
        saldoTotal: Math.round(saldoTotal * 100) / 100,
        saldoDesatualizadoHa,
        burnMensal: Math.round(burnMensal * 100) / 100,
        runwayMeses: saldoTotal > 0 && burnMensal > 0
          ? Math.round((saldoTotal / burnMensal) * 10) / 10
          : null,
        aPagar: Math.round(abertos.reduce((a, i) => a + Number(i.valor), 0) * 100) / 100,
        vencidos: abertos.filter(i => i.vencimento < hoje).length,
      },
    }
  } catch (e) {
    return { error: `obterCaixa: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export async function salvarConta(dados: {
  id?: string
  empresa_id?: string | null
  nome: string
  banco?: string
  tipo: string
  saldo_atual: number
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    const nome = dados.nome.trim()
    if (!nome) return { ok: false, error: 'Dê um nome à conta.' }
    if (!Number.isFinite(dados.saldo_atual)) return { ok: false, error: 'Saldo inválido.' }

    // Toda gravação de saldo carimba a data: é o que permite avisar quando envelhece.
    const linha = {
      nome,
      empresa_id: dados.empresa_id || null,
      banco: dados.banco?.trim() || null,
      tipo: dados.tipo,
      saldo_atual: dados.saldo_atual,
      atualizado_em: new Date().toISOString().slice(0, 10),
    }

    const { error } = dados.id
      ? await sb.from('contas_bancarias').update(linha).eq('id', dados.id)
      : await sb.from('contas_bancarias').insert(linha)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/financeiro/caixa')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function salvarImposto(dados: {
  id?: string
  empresa_id?: string | null
  competencia: string
  tipo: string
  valor: number
  vencimento: string
  observacao?: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    if (!dados.competencia || !dados.vencimento) {
      return { ok: false, error: 'Informe a competência e o vencimento.' }
    }
    if (!(dados.valor > 0)) return { ok: false, error: 'O valor precisa ser maior que zero.' }

    const linha = {
      competencia: dados.competencia,
      empresa_id: dados.empresa_id || null,
      tipo: dados.tipo,
      valor: dados.valor,
      vencimento: dados.vencimento,
      observacao: dados.observacao?.trim() || null,
    }

    const { error } = dados.id
      ? await sb.from('impostos').update(linha).eq('id', dados.id)
      : await sb.from('impostos').insert(linha)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/financeiro/caixa')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function marcarImpostoPago(
  id: string,
  pago: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb
      .from('impostos')
      .update({ pago_em: pago ? new Date().toISOString().slice(0, 10) : null })
      .eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/financeiro/caixa')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
