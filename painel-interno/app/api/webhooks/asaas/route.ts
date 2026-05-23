/**
 * Webhook do Asaas — recebe eventos de pagamento e popula a tabela `receitas`.
 *
 * Eventos tratados:
 *  - PAYMENT_RECEIVED / PAYMENT_CONFIRMED → insere/atualiza receita
 *  - PAYMENT_REFUNDED                     → marca receita como estornado
 *  - PAYMENT_DELETED                      → marca como cancelado
 *
 * Autenticação:
 *  - Asaas envia o header `asaas-access-token` configurado no painel.
 *  - Comparamos com a env var ASAAS_WEBHOOK_TOKEN.
 *
 * Identificação do produto (qual SaaS):
 *  - Use `externalReference` ao criar a cobrança no Asaas com o nome
 *    do produto: "Nero Barber", "Psi Aura", "Kubic Eng", etc.
 *  - Se não vier, cai em "Geral".
 *
 * Idempotência:
 *  - `origem_id = asaas:<payment.id>` é UNIQUE — reenvios não duplicam.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AsaasPayment = {
  id: string
  customer: string
  value: number
  netValue?: number
  paymentDate?: string
  confirmedDate?: string
  dateCreated?: string
  billingType?: string         // PIX, CREDIT_CARD, BOLETO, UNDEFINED
  externalReference?: string   // produto: "Nero Barber", "Psi Aura"...
  description?: string
  cycle?: string               // se presente, é recorrente
  subscription?: string
}

type AsaasEvent = {
  event: string
  payment?: AsaasPayment
  dateCreated?: string
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function mapFormaPagamento(billingType?: string): string | undefined {
  switch (billingType) {
    case 'PIX':         return 'PIX'
    case 'CREDIT_CARD': return 'Cartão'
    case 'BOLETO':      return 'Boleto'
    case 'TRANSFER':    return 'Transferência'
    case 'UNDEFINED':   return undefined
    default:            return billingType
  }
}

function parsePayment(body: AsaasEvent) {
  const p = body.payment
  if (!p?.id) return null

  const data = (p.paymentDate || p.confirmedDate || p.dateCreated || new Date().toISOString())
    .slice(0, 10)

  return {
    produto:         (p.externalReference?.trim() || 'Geral'),
    cliente:         null,                          // customer = id no Asaas; nome buscar via API se quiser
    cliente_id:      p.customer,
    valor:           p.netValue ?? p.value,         // usa netValue (descontada taxa Asaas) se disponível
    data,
    tipo:            (p.cycle || p.subscription) ? 'recorrente' : 'pontual',
    forma_pagamento: mapFormaPagamento(p.billingType),
    descricao:       p.description ?? undefined,
    origem:          'asaas',
    origem_id:       `asaas:${p.id}`,
    payload_raw:     body,
  }
}

export async function POST(req: NextRequest) {
  // ── Validação do token ──
  const token = req.headers.get('asaas-access-token')
  const expected = process.env.ASAAS_WEBHOOK_TOKEN
  if (!expected) {
    console.error('[webhook/asaas] ASAAS_WEBHOOK_TOKEN não configurado nas envs')
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
  }
  if (token !== expected) {
    console.warn('[webhook/asaas] token inválido')
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: AsaasEvent
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const supabase = adminClient()
  const event = body.event ?? ''

  // ── Eventos de criação/confirmação de pagamento ──
  if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
    const receita = parsePayment(body)
    if (!receita) return NextResponse.json({ ok: true, ignored: 'no payment payload' })

    const status = event === 'PAYMENT_CONFIRMED' ? 'confirmado' : 'recebido'

    const { error } = await supabase
      .from('receitas')
      .upsert({ ...receita, status }, { onConflict: 'origem_id' })

    if (error) {
      console.error('[webhook/asaas] erro ao upsert receita:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, event, payment: body.payment?.id })
  }

  // ── Estorno → marcar como estornado ──
  if (event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_REFUND_IN_PROGRESS') {
    const pid = body.payment?.id
    if (!pid) return NextResponse.json({ ok: true, ignored: 'no payment id' })

    const { error } = await supabase
      .from('receitas')
      .update({ status: 'estornado' })
      .eq('origem_id', `asaas:${pid}`)

    if (error) {
      console.error('[webhook/asaas] erro ao marcar estornado:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, event })
  }

  // ── Deletado / cancelado ──
  if (event === 'PAYMENT_DELETED') {
    const pid = body.payment?.id
    if (!pid) return NextResponse.json({ ok: true, ignored: 'no payment id' })

    const { error } = await supabase
      .from('receitas')
      .update({ status: 'cancelado' })
      .eq('origem_id', `asaas:${pid}`)

    if (error) {
      console.error('[webhook/asaas] erro ao cancelar:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, event })
  }

  // ── Eventos não tratados (overdue, awaiting risk analysis, etc.): só ack ──
  return NextResponse.json({ ok: true, ignored: event })
}

// Health check / verificação do webhook
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: 'asaas-webhook',
    method: 'POST',
    expects: 'header asaas-access-token + body com event/payment',
  })
}
