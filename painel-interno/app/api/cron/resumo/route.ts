import { NextRequest, NextResponse } from 'next/server'
import { autorizado, clienteAdmin } from '@/lib/cron'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/**
 * O cliente do cron não é tipado pelo schema, então o select embutido não sabe
 * que `produtos` é relação para um só. O PostgREST devolve objeto aqui, mas o
 * tipo inferido admite lista — aceitar as duas formas evita depender disso.
 */
type ProjetoResumo = {
  id: string
  nome: string
  fase_atual: string
  saude: string
  maturidade_pct: number
  produtos: { status: string } | { status: string }[] | null
}

function statusDoProduto(p: ProjetoResumo): string | null {
  const rel = p.produtos
  if (!rel) return null
  return Array.isArray(rel) ? rel[0]?.status ?? null : rel.status
}

/** Segunda-feira da semana corrente, em ISO. É a competência do resumo. */
function segundaDaSemana(): string {
  const d = new Date()
  const dia = d.getUTCDay() // 0 = domingo
  const recuo = dia === 0 ? 6 : dia - 1
  d.setUTCDate(d.getUTCDate() - recuo)
  return d.toISOString().slice(0, 10)
}

/**
 * Resumo semanal.
 *
 * Junta o que mudou de estado e o que exige ação, e grava em `resumos`. Hoje
 * fica só no painel; quando houver canal de envio, o corpo já está pronto em
 * Markdown e basta preencher `enviado_em` e `canal`.
 *
 * Roda de novo no mesmo dia sem duplicar: a competência é única e o upsert
 * reescreve a linha da semana.
 */
export async function GET(req: NextRequest) {
  const auth = autorizado(req)
  if (!auth.ok) return NextResponse.json({ error: auth.motivo }, { status: 401 })

  const sb = clienteAdmin()
  const competencia = segundaDaSemana()
  const hoje = new Date().toISOString().slice(0, 10)

  const seteDias = new Date()
  seteDias.setUTCDate(seteDias.getUTCDate() - 7)
  const desde = seteDias.toISOString().slice(0, 10)

  const [
    { data: vencimentos }, { data: projetos }, { data: erros },
    { data: propostas }, { data: despesas }, { data: receitas }, { data: contas },
  ] = await Promise.all([
    sb.from('vencimentos').select('*'),
    sb.from('projetos')
      .select('id, nome, fase_atual, saude, maturidade_pct, produtos(status)')
      .eq('arquivado', false),
    sb.from('projeto_erros')
      .select('projeto_id, codigo, titulo, severidade, status, detectado_em')
      .in('status', ['aberto', 'investigando']),
    sb.from('propostas').select('numero, titulo, status, valor_total, validade'),
    sb.from('despesas').select('valor').gte('data', desde).lt('data', hoje),
    sb.from('receitas').select('valor, status').gte('data', desde).lt('data', hoje),
    sb.from('contas_bancarias').select('saldo_atual').eq('ativa', true),
  ])

  const venc = (vencimentos ?? []).filter(v => !v.silenciado)
  const vencidos = venc.filter(v => v.severidade === 'vencido')
  const criticos = venc.filter(v => v.severidade === 'critico')

  const saiu = (despesas ?? []).reduce((a, d) => a + Number(d.valor), 0)
  const entrou = (receitas ?? [])
    .filter(r => r.status === 'recebido' || r.status === 'confirmado')
    .reduce((a, r) => a + Number(r.valor), 0)
  const saldo = (contas ?? []).reduce((a, c) => a + Number(c.saldo_atual), 0)

  // Projeto em pausa fica vermelho porque parou, não porque está atrasado —
  // é o estado esperado, não um alerta. Contá-lo enchia o resumo de todo mês
  // com os mesmos três nomes e escondia o que de fato mudou. A pausa vem de
  // `produtos.status` (SaaS próprio) ou da fase, para projeto de cliente que
  // não tem produto. `encerrado` sai pelo mesmo motivo.
  const pausado = (p: ProjetoResumo) =>
    p.fase_atual === 'pausado' ||
    p.fase_atual === 'encerrado' ||
    statusDoProduto(p) === 'pausado'

  const ativos = ((projetos ?? []) as unknown as ProjetoResumo[]).filter(p => !pausado(p))
  const emRisco = ativos.filter(p => p.saude === 'vermelho')

  // Erro crítico de projeto parado não é ação desta semana: ninguém vai
  // corrigir o que ninguém está tocando. Ele continua aberto na ficha do
  // projeto — some do resumo, não do sistema. O conjunto é de ativos, então
  // erro de projeto arquivado também não passa.
  const idsAtivos = new Set(ativos.map(p => p.id))
  const errosCriticos = (erros ?? []).filter(
    e => e.severidade === 'critica' && idsAtivos.has(e.projeto_id)
  )
  const propostasAbertas = (propostas ?? []).filter(
    p => p.status === 'enviada' || p.status === 'em_negociacao'
  )

  // O corpo é montado em seções; as vazias não entram, para o resumo não virar
  // uma lista de zeros que ninguém lê.
  const secoes: string[] = []

  secoes.push(
    `## Semana de ${competencia.split('-').reverse().join('/')}\n\n` +
    `Saiu **${brl(saiu)}** · Entrou **${brl(entrou)}**` +
    (saldo > 0 ? ` · Caixa **${brl(saldo)}**` : '')
  )

  if (vencidos.length || criticos.length) {
    const linhas = [...vencidos, ...criticos].slice(0, 8).map(v =>
      `- ${v.titulo} — ${v.dias < 0 ? `venceu há ${-v.dias}d` : `vence em ${v.dias}d`}` +
      (v.valor ? ` · ${brl(Number(v.valor))}` : '')
    )
    secoes.push(
      `## Precisa de ação\n\n${vencidos.length} vencido(s), ${criticos.length} nos próximos 7 dias.\n\n` +
      linhas.join('\n')
    )
  }

  if (errosCriticos.length) {
    secoes.push(
      `## Erros críticos abertos\n\n` +
      errosCriticos.slice(0, 5).map(e => `- \`${e.codigo}\` ${e.titulo}`).join('\n')
    )
  }

  if (emRisco.length) {
    secoes.push(
      `## Projetos em risco\n\n` +
      emRisco.map(p => `- ${p.nome} — ${p.fase_atual}, ${p.maturidade_pct}% de maturidade`).join('\n')
    )
  }

  if (propostasAbertas.length) {
    const total = propostasAbertas.reduce((a, p) => a + Number(p.valor_total), 0)
    secoes.push(
      `## Propostas em jogo\n\n${propostasAbertas.length} aberta(s), ${brl(total)} em negociação.\n\n` +
      propostasAbertas.slice(0, 5).map(p => `- \`${p.numero}\` ${p.titulo}`).join('\n')
    )
  }

  if (secoes.length === 1) {
    secoes.push('Nada exigindo ação esta semana.')
  }

  const corpo = secoes.join('\n\n')

  // O título precisa refletir tudo que o corpo mostra. A primeira versão olhava
  // só vencimentos e anunciava "semana sem pendência" com três projetos em
  // risco listados logo abaixo — quem lesse só o cabeçalho teria a impressão
  // contrária à dos dados.
  const titulo = [
    vencidos.length && `${vencidos.length} vencimento(s) atrasado(s)`,
    errosCriticos.length && `${errosCriticos.length} erro(s) crítico(s)`,
    criticos.length && `${criticos.length} vencimento(s) esta semana`,
    emRisco.length && `${emRisco.length} projeto(s) em risco`,
  ].filter(Boolean).slice(0, 2).join(' · ') || 'Semana sem pendência'

  const { error } = await sb.from('resumos').upsert(
    {
      competencia,
      titulo,
      corpo_md: corpo,
      dados: {
        saiu, entrou, saldo,
        vencidos: vencidos.length,
        criticos: criticos.length,
        erros_criticos: errosCriticos.length,
        // Mesma razão do `projetos_pausados`: o que foi silenciado fica
        // contado, para o zero acima não parecer ausência de dado.
        erros_criticos_pausados:
          (erros ?? []).filter(e => e.severidade === 'critica').length - errosCriticos.length,
        projetos_em_risco: emRisco.length,
        // Fica gravado para o zero em `projetos_em_risco` ser lido como
        // "nenhum ativo em risco", e não como "o cálculo quebrou".
        projetos_pausados: (projetos ?? []).length - ativos.length,
        propostas_abertas: propostasAbertas.length,
      },
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: 'competencia' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, competencia, titulo, secoes: secoes.length })
}
