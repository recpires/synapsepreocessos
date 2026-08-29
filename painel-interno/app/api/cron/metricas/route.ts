import { NextRequest, NextResponse } from 'next/server'
import { autorizado, clienteAdmin, competenciaAtual } from '@/lib/cron'
import {
  coletarNeroBarberAdmin, coletarKubicEngAdmin,
  coletarPsiAuraAdmin, coletarNexioAdmin,
} from '@/lib/produtos-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Coleta = {
  slug: string
  mrr: number
  clientes_ativos: number
  clientes_trial: number
  bruto: unknown
}

/**
 * Snapshot mensal das métricas dos SaaS.
 *
 * O painel lê MRR e clientes ao vivo, então só mostra o número de agora.
 * Sem histórico não existe curva nem churn. Este job congela um ponto por mês.
 *
 * Um produto que falha não derruba os outros: cada coleta é independente e a
 * resposta diz quais deram certo.
 */
export async function GET(req: NextRequest) {
  const auth = autorizado(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.motivo }, { status: 401 })
  }

  const competencia = competenciaAtual()
  const coletas: Coleta[] = []
  const falhas: { slug: string; erro: string }[] = []

  const nero = await coletarNeroBarberAdmin()
  if (nero.data) {
    const ativos = nero.data.shops.filter(s => s.subscription_status === 'active')
    coletas.push({
      slug: 'nero-barber',
      mrr: nero.data.mrr,
      clientes_ativos: ativos.length,
      clientes_trial: nero.data.shops.filter(s => s.subscription_status === 'trialing').length,
      bruto: {
        total_shops: nero.data.shops.length,
        profiles: nero.data.total_profiles,
        appointments: nero.data.total_appointments,
        customers: nero.data.total_customers,
      },
    })
  } else falhas.push({ slug: 'nero-barber', erro: nero.error ?? 'desconhecido' })

  const kubic = await coletarKubicEngAdmin()
  if (kubic.data) {
    coletas.push({
      slug: 'kubic-eng',
      mrr: kubic.data.mrr,
      clientes_ativos: kubic.data.users.filter(u => u.sub_status === 'active').length,
      clientes_trial: kubic.data.users.filter(u => u.sub_status === 'trialing').length,
      bruto: { total_users: kubic.data.users.length },
    })
  } else falhas.push({ slug: 'kubic-eng', erro: kubic.error ?? 'desconhecido' })

  const psi = await coletarPsiAuraAdmin()
  if (psi.data) {
    coletas.push({
      slug: 'psi-aura',
      mrr: psi.data.mrr,
      clientes_ativos: psi.data.activeCount,
      clientes_trial: 0,
      bruto: { total_clinics: psi.data.totalClinics, past_due: psi.data.pastDueCount },
    })
  } else falhas.push({ slug: 'psi-aura', erro: psi.error ?? 'desconhecido' })

  const nexio = await coletarNexioAdmin()
  if (nexio.data) {
    coletas.push({
      slug: 'crm-nexio',
      // O Nexio não expõe MRR; grava 0 e guarda a distribuição de planos no
      // bruto, para não inventar um número que não veio da fonte.
      mrr: 0,
      clientes_ativos: nexio.data.totalTenants - nexio.data.tenantsTrial,
      clientes_trial: nexio.data.tenantsTrial,
      bruto: {
        tenants: nexio.data.totalTenants,
        freelancer: nexio.data.tenantsFreelancer,
        agency_pro: nexio.data.tenantsAgencyPro,
        scale: nexio.data.tenantsScale,
        pipeline: nexio.data.valorTotalPipeline,
      },
    })
  } else falhas.push({ slug: 'crm-nexio', erro: nexio.error ?? 'desconhecido' })

  if (coletas.length === 0) {
    return NextResponse.json(
      { error: 'Nenhum produto respondeu.', falhas }, { status: 502 }
    )
  }

  const sb = clienteAdmin()
  const { data: produtos, error: eProd } = await sb.from('produtos').select('id, slug')
  if (eProd) return NextResponse.json({ error: eProd.message }, { status: 500 })

  const idPorSlug = new Map((produtos ?? []).map(p => [p.slug as string, p.id as string]))

  // Mês anterior, para calcular novos, cancelados e churn sem gravar
  // número que a série já consegue derivar sozinha.
  const ant = new Date(competencia + 'T00:00:00Z')
  ant.setUTCMonth(ant.getUTCMonth() - 1)
  const { data: anteriores } = await sb
    .from('metricas_saas')
    .select('produto_id, clientes_ativos')
    .eq('competencia', ant.toISOString().slice(0, 10))

  const ativosAntes = new Map((anteriores ?? []).map(a => [a.produto_id, a.clientes_ativos]))

  const linhas = coletas
    .filter(c => idPorSlug.has(c.slug))
    .map(c => {
      const produto_id = idPorSlug.get(c.slug)!
      const antes = ativosAntes.get(produto_id)
      const delta = antes === undefined ? null : c.clientes_ativos - antes
      return {
        produto_id,
        competencia,
        mrr: c.mrr,
        clientes_ativos: c.clientes_ativos,
        clientes_trial: c.clientes_trial,
        novos: delta !== null && delta > 0 ? delta : 0,
        cancelados: delta !== null && delta < 0 ? -delta : 0,
        churn_pct: antes && antes > 0 && delta !== null && delta < 0
          ? Math.round((-delta / antes) * 1000) / 10
          : null,
        bruto: c.bruto,
        coletado_em: new Date().toISOString(),
      }
    })

  const { error } = await sb
    .from('metricas_saas')
    .upsert(linhas, { onConflict: 'produto_id,competencia' })
  if (error) return NextResponse.json({ error: error.message, falhas }, { status: 500 })

  return NextResponse.json({
    ok: true,
    competencia,
    gravados: linhas.length,
    mrr_total: Math.round(linhas.reduce((a, l) => a + l.mrr, 0) * 100) / 100,
    falhas,
  })
}
