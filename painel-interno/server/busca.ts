'use server'

import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'

export type ResultadoBusca = {
  tipo: string
  id: string
  titulo: string
  detalhe: string | null
  link: string
}

export async function buscar(
  termo: string
): Promise<{ data?: ResultadoBusca[]; error?: string }> {
  try {
    await assertMembro()

    // Menos de 2 caracteres devolveria meio banco.
    const limpo = termo.trim()
    if (limpo.length < 2) return { data: [] }

    const sb = await createClient()
    const { data, error } = await sb.rpc('buscar', { termo: limpo })
    if (error) return { error: error.message }

    return { data: (data ?? []) as ResultadoBusca[] }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
