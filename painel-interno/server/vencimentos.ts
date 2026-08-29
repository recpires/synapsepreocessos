'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

export type Severidade = 'vencido' | 'critico' | 'atencao' | 'ok'
export type OrigemVencimento =
  | 'contrato' | 'dominio' | 'ssl' | 'imposto' | 'proposta' | 'projeto'

export type Vencimento = {
  origem: OrigemVencimento
  entidade_id: string
  titulo: string
  detalhe: string | null
  vence_em: string
  valor: number | null
  link: string
  dias: number
  severidade: Severidade
  silenciado: boolean
}

export type PainelVencimentos = {
  itens: Vencimento[]
  vencidos: number
  criticos: number
  atencao: number
  /** Soma do que tem valor e vence nos próximos 30 dias. */
  aPagar30: number
}

export async function obterVencimentos(): Promise<Resultado<PainelVencimentos>> {
  try {
    await assertMembro()
    const sb = await createClient()

    const { data, error } = await sb
      .from('vencimentos')
      .select('*')
      .order('vence_em')
    if (error) return { error: `vencimentos: ${error.message}` }

    const itens = (data ?? []).map(v => ({
      ...v,
      valor: v.valor === null ? null : Number(v.valor),
    })) as Vencimento[]

    // Silenciado não entra nas contagens — se entrasse, silenciar não serviria
    // para nada.
    const ativos = itens.filter(i => !i.silenciado)

    return {
      data: {
        itens,
        vencidos: ativos.filter(i => i.severidade === 'vencido').length,
        criticos: ativos.filter(i => i.severidade === 'critico').length,
        atencao: ativos.filter(i => i.severidade === 'atencao').length,
        aPagar30: Math.round(
          ativos
            .filter(i => i.dias <= 30 && i.valor !== null)
            .reduce((a, i) => a + (i.valor ?? 0), 0) * 100
        ) / 100,
      },
    }
  } catch (e) {
    return { error: `obterVencimentos: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export async function silenciar(
  origem: string,
  entidadeId: string,
  ate: string | null,
  motivo?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const membro = await assertMembro()
    const sb = await createClient()

    const { error } = await sb.from('alertas_silenciados').upsert(
      {
        origem,
        entidade_id: entidadeId,
        silenciado_ate: ate,
        motivo: motivo?.trim() || null,
        criado_por: membro.nome,
      },
      { onConflict: 'origem,entidade_id' }
    )
    if (error) return { ok: false, error: error.message }

    revalidatePath('/vencimentos')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function reativar(
  origem: string,
  entidadeId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb
      .from('alertas_silenciados')
      .delete()
      .eq('origem', origem)
      .eq('entidade_id', entidadeId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/vencimentos')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
