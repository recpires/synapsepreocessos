'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

export type Documento = {
  id: string
  area: string
  titulo: string
  slug: string
  conteudo_md: string
  tags: string[]
  origem: string | null
  atualizado_por: string | null
  updated_at: string
}

export type ItemLista = Omit<Documento, 'conteudo_md'> & { tamanho: number }

export async function listarConhecimento(): Promise<Resultado<ItemLista[]>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb
      .from('conhecimento')
      .select('id, area, titulo, slug, tags, origem, atualizado_por, updated_at, conteudo_md')
      .order('area')
      .order('titulo')
    if (error) return { error: `conhecimento: ${error.message}` }

    return {
      data: (data ?? []).map(d => {
        const { conteudo_md, ...resto } = d as Documento
        return { ...resto, tamanho: conteudo_md?.length ?? 0 }
      }),
    }
  } catch (e) {
    return { error: `listarConhecimento: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export async function obterDocumento(slug: string): Promise<Resultado<Documento>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb
      .from('conhecimento').select('*').eq('slug', slug).single()
    if (error || !data) return { error: `documento ${slug}: ${error?.message ?? 'não encontrado'}` }
    return { data: data as Documento }
  } catch (e) {
    return { error: `obterDocumento: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export async function salvarDocumento(
  id: string,
  conteudo_md: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const membro = await assertMembro()
    const sb = await createClient()

    const { error } = await sb.from('conhecimento').update({
      conteudo_md,
      atualizado_por: membro.nome,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/conhecimento')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
