import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

/**
 * Autorização das rotas de cron.
 *
 * A Vercel envia `Authorization: Bearer $CRON_SECRET` nos jobs agendados.
 * Sem a variável configurada a rota recusa tudo — melhor um cron que não roda
 * do que um endpoint aberto que qualquer um dispara.
 */
export function autorizado(req: NextRequest): { ok: true } | { ok: false; motivo: string } {
  const esperado = process.env.CRON_SECRET
  if (!esperado) {
    return { ok: false, motivo: 'CRON_SECRET não configurado no ambiente.' }
  }
  const recebido = req.headers.get('authorization')
  if (recebido !== `Bearer ${esperado}`) {
    return { ok: false, motivo: 'Header Authorization ausente ou incorreto.' }
  }
  return { ok: true }
}

/** Cliente com service role: cron não tem sessão, então não passa por RLS. */
export function clienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || key.startsWith('PREENCHER')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente — o cron não consegue gravar.')
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Primeiro dia do mês corrente, que é a competência do snapshot. */
export function competenciaAtual(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}
