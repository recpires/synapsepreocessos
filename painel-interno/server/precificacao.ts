'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import { calcular, type Entradas } from '@/types/precificacao'

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

export type SimulacaoSalva = {
  id: string
  nome: string
  produto_id: string | null
  produto_nome: string | null
  entradas: Entradas
  observacao: string | null
  created_at: string
}

export async function listarSimulacoes(): Promise<Resultado<SimulacaoSalva[]>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb
      .from('precificacoes')
      .select('id, nome, produto_id, entradas, observacao, created_at, produtos(nome)')
      .order('created_at', { ascending: false })
    if (error) return { error: `precificacoes: ${error.message}` }

    return {
      data: (data ?? []).map(linha => {
        // O join vem como objeto ou array de um elemento, dependendo de como o
        // PostgREST infere a relação. Normaliza os dois casos.
        const { produtos, ...resto } = linha as unknown as Omit<SimulacaoSalva, 'produto_nome'> & {
          produtos: { nome: string } | { nome: string }[] | null
        }
        const p = Array.isArray(produtos) ? produtos[0] : produtos
        return { ...resto, produto_nome: p?.nome ?? null }
      }),
    }
  } catch (e) {
    return { error: `listarSimulacoes: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export async function salvarSimulacao(dados: {
  id?: string
  nome: string
  produto_id?: string | null
  entradas: Entradas
  observacao?: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const membro = await assertMembro()
    const sb = await createClient()

    const nome = dados.nome.trim()
    if (!nome) return { ok: false, error: 'Dê um nome à simulação.' }

    // O resultado é recalculado aqui, não recebido do cliente: gravar o que o
    // navegador mandou permitiria salvar número que a fórmula não produz.
    const linha = {
      nome,
      produto_id: dados.produto_id || null,
      entradas: dados.entradas,
      resultado: calcular(dados.entradas),
      observacao: dados.observacao?.trim() || null,
      created_by: membro.nome,
      updated_at: new Date().toISOString(),
    }

    const { error } = dados.id
      ? await sb.from('precificacoes').update(linha).eq('id', dados.id)
      : await sb.from('precificacoes').insert(linha)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/comercial/precificacao')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function removerSimulacao(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb.from('precificacoes').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/comercial/precificacao')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
