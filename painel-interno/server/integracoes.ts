'use server'

import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'

/**
 * Saúde das integrações que alimentam o painel sozinhas.
 *
 * Integração morta não avisa: a tela mostra zero e zero parece "não houve
 * movimento". Foi assim que `receitas` ficou vazia por meses enquanto o
 * middleware devolvia redirect ao webhook do Asaas. O middleware foi
 * corrigido, mas em produção falta a variável — então a porta segue fechada,
 * agora com outro cadeado.
 *
 * Só devolve se a variável existe, nunca o valor.
 */
export async function statusAsaas(): Promise<{
  configurado: boolean
  recebidas: number
  ultima: string | null
}> {
  try {
    await assertMembro()
    const sb = await createClient()

    const { data } = await sb
      .from('receitas')
      .select('data')
      .eq('origem', 'asaas')
      .order('data', { ascending: false })
      .limit(1)

    const { count } = await sb
      .from('receitas')
      .select('id', { count: 'exact', head: true })
      .eq('origem', 'asaas')

    return {
      configurado: Boolean(process.env.ASAAS_WEBHOOK_TOKEN),
      recebidas: count ?? 0,
      ultima: data?.[0]?.data ?? null,
    }
  } catch {
    // Sem sessão a tela não deve quebrar por causa de um aviso.
    return { configurado: false, recebidas: 0, ultima: null }
  }
}
