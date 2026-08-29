'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { assertMembro, assertAdmin } from '@/lib/auth/membro'
import {
  coletarNeroBarberAdmin, coletarKubicEngAdmin,
  coletarPsiAuraAdmin, coletarNexioAdmin,
  aplicarPlanoNero, aplicarPlanoKubic,
  type NeroAdminData, type KubicAdminData,
  type PsiAuraAdminData, type NexioAdminData,
} from '@/lib/produtos-admin'

// ─── Painel interno: cliente autenticado via cookies ─────────────────────────

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cookieStore.set(name, value, options as any)
            )
          } catch {}
        },
      },
    }
  )
}

// ─── Admin dos produtos ──────────────────────────────────────────────────────
//
// Tudo aqui é Server Action, chamável pelo navegador. A coleta em si mora em
// `lib/produtos-admin.ts`, que não é `'use server'` — este arquivo existe para
// pôr a guarda antes. As duas funções de escrita usam service role no banco de
// produção de outro produto, então exigem admin, não só membro.

export async function fetchNeroBarberAdmin(): Promise<{ data?: NeroAdminData; error?: string }> {
  try {
    await assertMembro()
    return coletarNeroBarberAdmin()
  } catch (e) { return { error: (e as Error).message } }
}

export async function fetchKubicEngAdmin(): Promise<{ data?: KubicAdminData; error?: string }> {
  try {
    await assertMembro()
    return coletarKubicEngAdmin()
  } catch (e) { return { error: (e as Error).message } }
}

export async function fetchPsiAuraAdmin(): Promise<{ data?: PsiAuraAdminData; error?: string }> {
  try {
    await assertMembro()
    return coletarPsiAuraAdmin()
  } catch (e) { return { error: (e as Error).message } }
}

export async function fetchNexioAdmin(): Promise<{ data?: NexioAdminData; error?: string }> {
  try {
    await assertMembro()
    return coletarNexioAdmin()
  } catch (e) { return { error: (e as Error).message } }
}

export async function updateNeroShopPlan(
  shopId: string,
  newPlanId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin()
    return aplicarPlanoNero(shopId, newPlanId)
  } catch (e) { return { ok: false, error: (e as Error).message } }
}

export async function updateKubicUserPlan(
  userId: string,
  newPlanId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin()
    return aplicarPlanoKubic(userId, newPlanId)
  } catch (e) { return { ok: false, error: (e as Error).message } }
}
