'use server'

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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

// ─── Admin clients (service role — server only) ───────────────────────────────

function nbAdmin() {
  const url = process.env.NERO_BARBER_SUPABASE_URL
  const key = process.env.NERO_BARBER_SERVICE_ROLE_KEY
  if (!url || !key || key.startsWith('PREENCHER')) {
    throw new Error(
      'Configure NERO_BARBER_SERVICE_ROLE_KEY no .env.local → Supabase → NeroBarber-DB → Settings → API → service_role'
    )
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

function keAdmin() {
  const url = process.env.KUBIC_ENG_SUPABASE_URL
  const key = process.env.KUBIC_ENG_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configure KUBIC_ENG_SERVICE_ROLE_KEY no .env.local')
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type NeroPlan = {
  id: string; name: string; price: number; annual_price: number
  max_barbers: number; max_units: number; support_level: string
}
export type NeroShop = {
  id: string; name: string; city: string | null; uf: string | null
  current_plan_id: string; plan_name: string; plan_price: number
  subscription_status: string; trial_ends_at: string | null; created_at: string
}
export type NeroAdminData = {
  shops: NeroShop[]; plans: NeroPlan[]
  total_profiles: number; total_appointments: number; total_customers: number; mrr: number
}
export type KubicPlan = {
  id: string; slug: string; name: string; price: number; price_annual: number
  max_users: number; max_projects: number; is_active: boolean
}
export type KubicUser = {
  id: string; name: string; email: string; role: string; created_at: string
  sub_status: string | null; plan_id: string | null; plan_name: string | null
  plan_price: number | null; trial_end: string | null
}
export type KubicAdminData = {
  users: KubicUser[]; plans: KubicPlan[]; mrr: number
}

// ─── Nero Barber admin ────────────────────────────────────────────────────────

export async function fetchNeroBarberAdmin(): Promise<{ data?: NeroAdminData; error?: string }> {
  try {
    const sb = nbAdmin()
    const [
      { data: shops, error: e1 },
      { data: plans, error: e2 },
      { count: profiles },
      { count: appointments },
      { count: customers },
    ] = await Promise.all([
      sb.from('barbershops')
        .select('id, name, city, uf, current_plan_id, subscription_status, trial_ends_at, created_at')
        .order('created_at', { ascending: false }),
      sb.from('barber_plans')
        .select('id, name, price, annual_price, max_barbers, max_units, support_level')
        .order('price'),
      sb.from('profiles').select('*', { count: 'exact', head: true }),
      sb.from('appointments').select('*', { count: 'exact', head: true }),
      sb.from('shop_customers').select('*', { count: 'exact', head: true }),
    ])
    if (e1) return { error: `barbershops: ${e1.message}` }
    if (e2) return { error: `barber_plans: ${e2.message}` }
    const planMap = new Map((plans ?? []).map(p => [p.id as string, p]))
    const enrichedShops: NeroShop[] = (shops ?? []).map(s => ({
      id: s.id, name: s.name, city: s.city, uf: s.uf,
      current_plan_id: s.current_plan_id,
      plan_name: planMap.get(s.current_plan_id)?.name ?? s.current_plan_id,
      plan_price: Number(planMap.get(s.current_plan_id)?.price ?? 0),
      subscription_status: s.subscription_status,
      trial_ends_at: s.trial_ends_at, created_at: s.created_at,
    }))
    const mrr = enrichedShops
      .filter(s => s.subscription_status === 'active')
      .reduce((a, s) => a + s.plan_price, 0)
    return {
      data: {
        shops: enrichedShops,
        plans: (plans ?? []).map(p => ({
          id: p.id, name: p.name, price: Number(p.price), annual_price: Number(p.annual_price),
          max_barbers: p.max_barbers, max_units: p.max_units, support_level: p.support_level,
        })),
        total_profiles: profiles ?? 0,
        total_appointments: appointments ?? 0,
        total_customers: customers ?? 0,
        mrr,
      },
    }
  } catch (e: unknown) { return { error: (e as Error).message } }
}

export async function updateNeroShopPlan(
  shopId: string,
  newPlanId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await nbAdmin()
      .from('barbershops')
      .update({ current_plan_id: newPlanId })
      .eq('id', shopId)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: unknown) { return { ok: false, error: (e as Error).message } }
}

// ─── Kubic Eng admin ──────────────────────────────────────────────────────────

export async function fetchKubicEngAdmin(): Promise<{ data?: KubicAdminData; error?: string }> {
  try {
    const sb = keAdmin()
    const [
      { data: users, error: e1 },
      { data: subs, error: e2 },
      { data: plans, error: e3 },
    ] = await Promise.all([
      sb.from('User').select('id, name, email, role, createdAt').order('createdAt', { ascending: false }),
      sb.from('Subscription').select('id, userId, planId, status, trialEnd, customPrice'),
      sb.from('Plan').select('id, slug, name, price, priceAnnual, maxUsers, maxProjects, isActive').order('price'),
    ])
    if (e1) return { error: `User: ${e1.message}` }
    if (e2) return { error: `Subscription: ${e2.message}` }
    if (e3) return { error: `Plan: ${e3.message}` }
    const subMap = new Map((subs ?? []).map(s => [s.userId as string, s]))
    const planMap = new Map((plans ?? []).map(p => [p.id as string, p]))
    const enrichedUsers: KubicUser[] = (users ?? []).map(u => {
      const sub = subMap.get(u.id as string)
      const plan = sub ? planMap.get(sub.planId as string) : null
      return {
        id: u.id as string, name: u.name as string, email: u.email as string,
        role: u.role as string, created_at: u.createdAt as string,
        sub_status: sub ? sub.status as string : null,
        plan_id: sub ? sub.planId as string : null,
        plan_name: plan ? plan.name as string : null,
        plan_price: sub?.customPrice
          ? Number(sub.customPrice)
          : plan ? Number(plan.price) : null,
        trial_end: sub ? sub.trialEnd as string | null : null,
      }
    })
    const mrr = enrichedUsers
      .filter(u => u.sub_status === 'active')
      .reduce((a, u) => a + (u.plan_price ?? 0), 0)
    return {
      data: {
        users: enrichedUsers,
        plans: (plans ?? []).map(p => ({
          id: p.id as string, slug: p.slug as string, name: p.name as string,
          price: Number(p.price), price_annual: Number(p.priceAnnual),
          max_users: p.maxUsers as number, max_projects: p.maxProjects as number,
          is_active: p.isActive as boolean,
        })),
        mrr,
      },
    }
  } catch (e: unknown) { return { error: (e as Error).message } }
}

export async function updateKubicUserPlan(
  userId: string,
  newPlanId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await keAdmin()
      .from('Subscription')
      .update({ planId: newPlanId, updatedAt: new Date().toISOString() })
      .eq('userId', userId)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: unknown) { return { ok: false, error: (e as Error).message } }
}

// ─── Psi Aura admin ───────────────────────────────────────────────────────────

export type PsiAuraPlan = {
  id: string; name: string; price: number; yearlyPrice: number
}
export type PsiAuraClinic = {
  id: string; clinicName: string; email: string
  planId: string; planName: string; planPrice: number
  subscriptionStatus: string; subscriptionEndDate: string | null
  joinedAt: string; userCount: number
}
export type PsiAuraAdminData = {
  clinics: PsiAuraClinic[]; plans: PsiAuraPlan[]
  totalClinics: number; activeCount: number; pastDueCount: number; mrr: number
}

export async function fetchPsiAuraAdmin(): Promise<{ data?: PsiAuraAdminData; error?: string }> {
  try {
    const url = process.env.PSI_AURA_API_URL
    const key = process.env.PSI_AURA_ADMIN_KEY
    if (!url || !key) throw new Error('Configure PSI_AURA_API_URL e PSI_AURA_ADMIN_KEY no .env.local')

    const res = await fetch(`${url}/api/admin/saas-overview`, {
      headers: { 'X-Synapse-Key': key },
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`HTTP ${res.status}: ${text}`)
    }
    const json = await res.json()
    if (!json.success) throw new Error(json.message ?? 'Erro desconhecido')
    const d = json.data
    return {
      data: {
        clinics: (d.clinics ?? []).map((c: PsiAuraClinic) => ({
          id: c.id, clinicName: c.clinicName, email: c.email,
          planId: c.planId, planName: c.planName, planPrice: Number(c.planPrice),
          subscriptionStatus: c.subscriptionStatus,
          subscriptionEndDate: c.subscriptionEndDate ?? null,
          joinedAt: c.joinedAt, userCount: c.userCount,
        })),
        plans: (d.plans ?? []).map((p: PsiAuraPlan) => ({
          id: p.id, name: p.name, price: Number(p.price), yearlyPrice: Number(p.yearlyPrice),
        })),
        totalClinics: d.totalClinics ?? 0,
        activeCount: d.activeCount ?? 0,
        pastDueCount: d.pastDueCount ?? 0,
        mrr: Number(d.mrr ?? 0),
      }
    }
  } catch (e: unknown) { return { error: (e as Error).message } }
}
