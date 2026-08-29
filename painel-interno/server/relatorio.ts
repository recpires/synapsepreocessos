'use server'

import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import { porEmpresa } from '@/lib/filtro-empresa'

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

export type LinhaCategoria = {
  categoria: string
  valor: number
  pct: number
  anterior: number
  variacao: number | null
}

export type SerieMes = { mes: string; realizado: number; projetado: number }

export type Relatorio = {
  periodo: { inicio: string; fim: string; rotulo: string }
  anterior: { inicio: string; fim: string; rotulo: string }

  receita: number
  despesa: number
  resultado: number
  despesaAnterior: number
  variacaoDespesa: number | null

  categorias: LinhaCategoria[]
  serie: SerieMes[]

  recorrenteMensal: number
  maioresLancamentos: { data: string; descricao: string; categoria: string; valor: number }[]

  custoPorProduto: { nome: string; valor: number }[]
  semDono: number

  burnMensal: number
  saldoTotal: number
  runwayMeses: number | null

  /** Ressalvas que precisam aparecer no papel, não só na tela. */
  avisos: string[]
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function rotuloPeriodo(inicio: string, fim: string) {
  const [a1, m1] = inicio.split('-').map(Number)
  const f = new Date(fim + 'T00:00:00')
  f.setDate(f.getDate() - 1)
  const a2 = f.getFullYear()
  const m2 = f.getMonth() + 1
  if (a1 === a2 && m1 === m2) return `${MESES[m1 - 1]} de ${a1}`
  if (a1 === a2) return `${MESES[m1 - 1]} a ${MESES[m2 - 1]} de ${a1}`
  return `${MESES[m1 - 1]}/${a1} a ${MESES[m2 - 1]}/${a2}`
}

/** Desloca uma data ISO em N meses, mantendo o dia 1. */
function deslocarMes(iso: string, n: number) {
  const [a, m] = iso.split('-').map(Number)
  const total = (a * 12 + (m - 1)) + n
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}-01`
}

export async function montarRelatorio(
  inicio: string,
  fim: string,
  empresaId?: string
): Promise<Resultado<Relatorio>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const hoje = new Date().toISOString().slice(0, 10)

    // Período anterior de mesmo comprimento, para o comparativo.
    const meses = Math.max(
      1,
      Math.round(
        (new Date(fim).getTime() - new Date(inicio).getTime()) / (30.44 * 86_400_000)
      )
    )
    const antInicio = deslocarMes(inicio, -meses)
    const antFim = inicio

    const [
      { data: despesas, error: e1 },
      { data: receitas },
      { data: anteriores },
      { data: custos },
      { data: produtos },
      { data: contas },
      { data: todasDespesas },
    ] = await Promise.all([
      porEmpresa(sb.from('despesas')
        .select('data, descricao, categoria, valor, recorrente, periodicidade, produto')
        .gte('data', inicio).lt('data', fim).order('valor', { ascending: false }), empresaId),
      porEmpresa(sb.from('receitas').select('valor').gte('data', inicio).lt('data', fim)
        .in('status', ['recebido', 'confirmado']), empresaId),
      porEmpresa(sb.from('despesas').select('categoria, valor')
        .gte('data', antInicio).lt('data', antFim), empresaId),
      // `custo_por_produto` agrega despesas por produto e não carrega a
      // empresa. Fica consolidada até a view ganhar a coluna — o relatório
      // avisa quando está filtrado para o número não passar por segmentado.
      sb.from('custo_por_produto').select('*').gte('data', inicio).lt('data', fim),
      sb.from('produtos').select('id, nome'),
      porEmpresa(sb.from('contas_bancarias').select('saldo_atual').eq('ativa', true), empresaId),
      porEmpresa(sb.from('despesas').select('data, valor'), empresaId),
    ])
    if (e1) return { error: `despesas: ${e1.message}` }

    const linhas = despesas ?? []
    const despesa = linhas.reduce((a, d) => a + Number(d.valor), 0)
    const receita = (receitas ?? []).reduce((a, r) => a + Number(r.valor), 0)

    // ── Categorias, com comparativo ──
    const somaAnterior = new Map<string, number>()
    for (const d of anteriores ?? []) {
      somaAnterior.set(d.categoria, (somaAnterior.get(d.categoria) ?? 0) + Number(d.valor))
    }
    const somaAtual = new Map<string, number>()
    for (const d of linhas) {
      somaAtual.set(d.categoria, (somaAtual.get(d.categoria) ?? 0) + Number(d.valor))
    }
    const categorias: LinhaCategoria[] = [...somaAtual.entries()]
      .map(([categoria, valor]) => {
        const ant = somaAnterior.get(categoria) ?? 0
        return {
          categoria,
          valor: Math.round(valor * 100) / 100,
          pct: despesa > 0 ? Math.round((valor / despesa) * 1000) / 10 : 0,
          anterior: Math.round(ant * 100) / 100,
          variacao: ant > 0 ? Math.round(((valor - ant) / ant) * 1000) / 10 : null,
        }
      })
      .sort((a, b) => b.valor - a.valor)

    const despesaAnterior = [...somaAnterior.values()].reduce((a, v) => a + v, 0)

    // ── Série mensal, separando realizado de projetado ──
    const porMes = new Map<string, { realizado: number; projetado: number }>()
    for (const d of linhas) {
      const m = d.data.slice(0, 7)
      const atual = porMes.get(m) ?? { realizado: 0, projetado: 0 }
      if (d.data < hoje) atual.realizado += Number(d.valor)
      else atual.projetado += Number(d.valor)
      porMes.set(m, atual)
    }
    const serie: SerieMes[] = [...porMes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => ({
        mes,
        realizado: Math.round(v.realizado * 100) / 100,
        projetado: Math.round(v.projetado * 100) / 100,
      }))

    // ── Recorrente mensal equivalente ──
    const fator: Record<string, number> = { Semanal: 52 / 12, Quinzenal: 2, Mensal: 1, Anual: 1 / 12 }
    const maisRecente = new Map<string, { valor: number; periodicidade: string }>()
    for (const d of linhas) {
      if (!d.recorrente) continue
      maisRecente.set(d.descricao, {
        valor: Number(d.valor),
        periodicidade: d.periodicidade ?? 'Mensal',
      })
    }
    const recorrenteMensal = [...maisRecente.values()]
      .reduce((a, r) => a + r.valor * (fator[r.periodicidade] ?? 1), 0)

    // ── Custo por produto ──
    const nomeProduto = new Map((produtos ?? []).map(p => [p.id as string, p.nome as string]))
    const porProduto = new Map<string, number>()
    for (const c of custos ?? []) {
      porProduto.set(c.produto_id, (porProduto.get(c.produto_id) ?? 0) + Number(c.valor))
    }
    const custoPorProduto = [...porProduto.entries()]
      .map(([id, valor]) => ({ nome: nomeProduto.get(id) ?? '?', valor: Math.round(valor * 100) / 100 }))
      .sort((a, b) => b.valor - a.valor)
    const alocado = custoPorProduto.reduce((a, c) => a + c.valor, 0)

    // ── Burn e runway ──
    const agora = new Date()
    const chave = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const tres = [1, 2, 3].map(n => chave(new Date(agora.getFullYear(), agora.getMonth() - n, 1)))
    const mesGlobal = new Map<string, number>()
    for (const d of todasDespesas ?? []) {
      if (d.data >= hoje) continue
      const m = d.data.slice(0, 7)
      mesGlobal.set(m, (mesGlobal.get(m) ?? 0) + Number(d.valor))
    }
    const burnMensal = tres.reduce((a, m) => a + (mesGlobal.get(m) ?? 0), 0) / 3
    const saldoTotal = (contas ?? []).reduce((a, c) => a + Number(c.saldo_atual), 0)

    // ── Ressalvas ──
    const avisos: string[] = []
    if (receita === 0) {
      avisos.push(
        'Nenhuma receita registrada no período. A integração com o Asaas ainda não está ativa, ' +
        'portanto o resultado abaixo reflete apenas as saídas.'
      )
    }
    const semDono = Math.round((despesa - alocado) * 100) / 100
    if (semDono > 0 && despesa > 0) {
      avisos.push(
        `${Math.round((semDono / despesa) * 100)}% da despesa do período não tem produto atribuído ` +
        'nem regra de rateio, e por isso não aparece no custo por produto.'
      )
    }
    if (saldoTotal === 0) {
      avisos.push('Nenhuma conta bancária cadastrada — o runway não pôde ser calculado.')
    }
    const temFuturo = serie.some(s => s.projetado > 0)
    if (temFuturo) {
      avisos.push(
        'O período inclui lançamentos futuros gerados pelas séries recorrentes. ' +
        'Eles aparecem separados como projetado.'
      )
    }

    return {
      data: {
        periodo: { inicio, fim, rotulo: rotuloPeriodo(inicio, fim) },
        anterior: { inicio: antInicio, fim: antFim, rotulo: rotuloPeriodo(antInicio, antFim) },
        receita: Math.round(receita * 100) / 100,
        despesa: Math.round(despesa * 100) / 100,
        resultado: Math.round((receita - despesa) * 100) / 100,
        despesaAnterior: Math.round(despesaAnterior * 100) / 100,
        variacaoDespesa: despesaAnterior > 0
          ? Math.round(((despesa - despesaAnterior) / despesaAnterior) * 1000) / 10
          : null,
        categorias,
        serie,
        recorrenteMensal: Math.round(recorrenteMensal * 100) / 100,
        maioresLancamentos: linhas.slice(0, 10).map(d => ({
          data: d.data,
          descricao: (d.descricao ?? '').trim(),
          categoria: d.categoria,
          valor: Number(d.valor),
        })),
        custoPorProduto,
        semDono,
        burnMensal: Math.round(burnMensal * 100) / 100,
        saldoTotal: Math.round(saldoTotal * 100) / 100,
        runwayMeses: saldoTotal > 0 && burnMensal > 0
          ? Math.round((saldoTotal / burnMensal) * 10) / 10
          : null,
        avisos,
      },
    }
  } catch (e) {
    return { error: `montarRelatorio: ${e instanceof Error ? e.message : String(e)}` }
  }
}
