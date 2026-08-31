'use server'

import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import { porEmpresa } from '@/lib/filtro-empresa'

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Primeiro dia do mês, N meses a partir de um YYYY-MM. */
function mesISO(ano: number, mes: number) {
  return `${ano}-${String(mes).padStart(2, '0')}-01`
}

// ── DRE ──────────────────────────────────────────────────────────────────────

export type LinhaDRE = {
  rotulo: string
  valor: number
  /** 'entrada' soma, 'saida' subtrai, 'resultado' é subtotal. */
  natureza: 'entrada' | 'saida' | 'resultado'
  /** Percentual sobre a receita bruta. Null quando não há receita. */
  pctReceita: number | null
  nivel: 0 | 1
}

export type DRE = {
  periodo: { inicio: string; fim: string }
  linhas: LinhaDRE[]
  receitaBruta: number
  receitaLiquida: number
  margemBruta: number | null
  resultado: number
  avisos: string[]
}

export async function montarDRE(
  inicio: string, fim: string, empresaId?: string
): Promise<Resultado<DRE>> {
  try {
    await assertMembro()
    const sb = await createClient()

    // DRE é demonstrativo do que aconteceu. A tabela `despesas` guarda também
    // os lançamentos futuros que o cron gera para as recorrências — incluí-los
    // transformaria o resultado numa previsão disfarçada de fato. O corte é
    // hoje, ou o fim do período, o que vier antes.
    const corte = fim < hojeISO() ? fim : hojeISO()

    const [{ data: receitas, error: e1 }, { data: despesas, error: e2 }, { data: impostos }] =
      await Promise.all([
        // Receita prevista pela recorrência não é receita recebida: só entra
        // no demonstrativo depois de alguém confirmar que o dinheiro caiu.
        porEmpresa(sb.from('receitas').select('valor, tipo, categoria, status')
          .gte('data', inicio).lt('data', corte).eq('confirmado', true), empresaId),
        // Só o confirmado entra no demonstrativo: a recorrência gera a linha
        // futura, e ela não vira fato só porque a data passou.
        porEmpresa(sb.from('despesas').select('valor, categoria')
          .gte('data', inicio).lt('data', corte).eq('confirmado', true), empresaId),
        porEmpresa(sb.from('impostos').select('valor')
          .gte('competencia', inicio).lt('competencia', corte), empresaId),
      ])
    if (e1) return { error: `receitas: ${e1.message}` }
    if (e2) return { error: `despesas: ${e2.message}` }

    // Estornado e cancelado não são receita — entram como dedução para o
    // número bruto continuar batendo com o extrato.
    const validas = (receitas ?? []).filter(r => r.status === 'recebido' || r.status === 'confirmado')
    const estornadas = (receitas ?? []).filter(r => r.status === 'estornado')

    const receitaBruta = validas.reduce((a, r) => a + Number(r.valor), 0)
    const deducoes = estornadas.reduce((a, r) => a + Number(r.valor), 0)
    const receitaLiquida = receitaBruta - deducoes

    // Custo direto: infra e APIs escalam com o cliente. O resto é operacional.
    const DIRETAS = new Set(['Infraestrutura', 'IA / APIs'])
    const porCategoria = new Map<string, number>()
    for (const d of despesas ?? []) {
      porCategoria.set(d.categoria, (porCategoria.get(d.categoria) ?? 0) + Number(d.valor))
    }

    const custoDireto = [...porCategoria.entries()]
      .filter(([c]) => DIRETAS.has(c))
      .reduce((a, [, v]) => a + v, 0)

    const operacionais = [...porCategoria.entries()]
      .filter(([c]) => !DIRETAS.has(c) && c !== 'Impostos')
      .sort((a, b) => b[1] - a[1])

    const totalOperacional = operacionais.reduce((a, [, v]) => a + v, 0)
    const tributos = (porCategoria.get('Impostos') ?? 0)
      + (impostos ?? []).reduce((a, i) => a + Number(i.valor), 0)

    const lucroBruto = receitaLiquida - custoDireto
    const resultado = lucroBruto - totalOperacional - tributos
    const pct = (v: number) => (receitaBruta > 0 ? Math.round((v / receitaBruta) * 1000) / 10 : null)
    const r2 = (v: number) => Math.round(v * 100) / 100

    const linhas: LinhaDRE[] = [
      { rotulo: 'Receita bruta', valor: r2(receitaBruta), natureza: 'entrada', pctReceita: pct(receitaBruta), nivel: 0 },
      ...(deducoes > 0
        ? [{ rotulo: 'Estornos e cancelamentos', valor: r2(deducoes), natureza: 'saida' as const, pctReceita: pct(deducoes), nivel: 1 as const }]
        : []),
      { rotulo: 'Receita líquida', valor: r2(receitaLiquida), natureza: 'resultado', pctReceita: pct(receitaLiquida), nivel: 0 },
      { rotulo: 'Custo direto (infra e APIs)', valor: r2(custoDireto), natureza: 'saida', pctReceita: pct(custoDireto), nivel: 1 },
      { rotulo: 'Lucro bruto', valor: r2(lucroBruto), natureza: 'resultado', pctReceita: pct(lucroBruto), nivel: 0 },
      ...operacionais.map(([c, v]) => ({
        rotulo: c, valor: r2(v), natureza: 'saida' as const, pctReceita: pct(v), nivel: 1 as const,
      })),
      { rotulo: 'Total operacional', valor: r2(totalOperacional), natureza: 'saida', pctReceita: pct(totalOperacional), nivel: 0 },
      { rotulo: 'Tributos', valor: r2(tributos), natureza: 'saida', pctReceita: pct(tributos), nivel: 0 },
      { rotulo: 'Resultado do período', valor: r2(resultado), natureza: 'resultado', pctReceita: pct(resultado), nivel: 0 },
    ]

    const avisos: string[] = []
    if (corte !== fim) {
      avisos.push(
        `Período cortado em ${corte.split('-').reverse().join('/')}: os lançamentos ` +
        'futuros gerados pelas recorrências ficam de fora, porque DRE mostra o que ' +
        'aconteceu. A projeção está no fluxo de caixa abaixo.'
      )
    }
    if (receitaBruta === 0) {
      avisos.push(
        'Nenhuma receita no período. As linhas de margem ficam sem denominador, ' +
        'então os percentuais aparecem em branco.'
      )
    }
    if ((porCategoria.get('Outros') ?? 0) > totalOperacional * 0.15) {
      avisos.push(
        'A categoria "Outros" passa de 15% da despesa operacional. Classificar ' +
        'essas linhas melhora a leitura do resultado.'
      )
    }

    return {
      data: {
        periodo: { inicio, fim },
        linhas,
        receitaBruta: r2(receitaBruta),
        receitaLiquida: r2(receitaLiquida),
        margemBruta: receitaBruta > 0 ? Math.round((lucroBruto / receitaBruta) * 1000) / 10 : null,
        resultado: r2(resultado),
        avisos,
      },
    }
  } catch (e) {
    return { error: `montarDRE: ${e instanceof Error ? e.message : String(e)}` }
  }
}

// ── Fluxo de caixa ───────────────────────────────────────────────────────────

export type MesFluxo = {
  mes: string
  entradas: number
  saidas: number
  liquido: number
  saldoAcumulado: number
  projetado: boolean
}

export type Fluxo = {
  meses: MesFluxo[]
  saldoInicial: number
  /** Mês em que o saldo fica negativo, se ficar. */
  mesDoAperto: string | null
  temSaldo: boolean
}

export async function montarFluxo(
  mesesAdiante = 12, empresaId?: string
): Promise<Resultado<Fluxo>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const hoje = hojeISO()

    const agora = new Date()
    const inicio = mesISO(agora.getFullYear(), agora.getMonth() + 1)
    const fimD = new Date(Date.UTC(agora.getFullYear(), agora.getMonth() + mesesAdiante, 1))
    const fim = fimD.toISOString().slice(0, 10)

    const [{ data: despesas, error: e1 }, { data: receitas }, { data: contas }, { data: impostos }] =
      await Promise.all([
        porEmpresa(sb.from('despesas').select('data, valor')
          .gte('data', inicio).lt('data', fim), empresaId),
        porEmpresa(sb.from('receitas').select('data, valor, status')
          .gte('data', inicio).lt('data', fim), empresaId),
        porEmpresa(sb.from('contas_bancarias').select('saldo_atual')
          .eq('ativa', true), empresaId),
        porEmpresa(sb.from('impostos').select('vencimento, valor').is('pago_em', null)
          .gte('vencimento', inicio).lt('vencimento', fim), empresaId),
      ])
    if (e1) return { error: `despesas: ${e1.message}` }

    const saldoInicial = (contas ?? []).reduce((a, c) => a + Number(c.saldo_atual), 0)

    const mapa = new Map<string, { entradas: number; saidas: number }>()
    const somar = (data: string, campo: 'entradas' | 'saidas', valor: number) => {
      const m = data.slice(0, 7)
      const atual = mapa.get(m) ?? { entradas: 0, saidas: 0 }
      atual[campo] += valor
      mapa.set(m, atual)
    }

    for (const d of despesas ?? []) somar(d.data, 'saidas', Number(d.valor))
    for (const i of impostos ?? []) somar(i.vencimento, 'saidas', Number(i.valor))
    for (const r of receitas ?? []) {
      if (r.status === 'estornado' || r.status === 'cancelado') continue
      somar(r.data, 'entradas', Number(r.valor))
    }

    const mesAtual = hoje.slice(0, 7)
    let acumulado = saldoInicial
    let mesDoAperto: string | null = null

    const meses: MesFluxo[] = [...mapa.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => {
        const liquido = v.entradas - v.saidas
        acumulado += liquido
        if (acumulado < 0 && mesDoAperto === null) mesDoAperto = mes
        return {
          mes,
          entradas: Math.round(v.entradas * 100) / 100,
          saidas: Math.round(v.saidas * 100) / 100,
          liquido: Math.round(liquido * 100) / 100,
          saldoAcumulado: Math.round(acumulado * 100) / 100,
          projetado: mes > mesAtual,
        }
      })

    return {
      data: {
        meses,
        saldoInicial: Math.round(saldoInicial * 100) / 100,
        // Sem saldo cadastrado o acumulado parte de zero e o "aperto" seria
        // um artefato do dado faltando, não um fato.
        mesDoAperto: saldoInicial > 0 ? mesDoAperto : null,
        temSaldo: saldoInicial > 0,
      },
    }
  } catch (e) {
    return { error: `montarFluxo: ${e instanceof Error ? e.message : String(e)}` }
  }
}

// ── Rentabilidade ────────────────────────────────────────────────────────────

export type LinhaRentabilidade = {
  projeto_id: string
  nome: string
  empresa: string | null
  contratado: number
  recebido: number
  custoAlocado: number
  horas: number
  custoHoras: number
  margem: number
  margemPct: number | null
}

export async function montarRentabilidade(
  custoHora = 120, empresaId?: string
): Promise<Resultado<LinhaRentabilidade[]>> {
  try {
    await assertMembro()
    const sb = await createClient()

    const [{ data: projetos, error: e1 }, { data: receitas }, { data: despesas }, { data: apontamentos }] =
      await Promise.all([
        // Projeto filtra pela empresa cliente; receita e despesa, pela nossa.
        // São colunas homônimas com sentidos diferentes, e é por isso que o
        // filtro do projeto fica de fora aqui.
        sb.from('projetos').select('id, nome, valor_contratado, empresas(razao_social)')
          .eq('arquivado', false),
        porEmpresa(sb.from('receitas').select('projeto_id, valor, status')
          .not('projeto_id', 'is', null), empresaId),
        porEmpresa(sb.from('despesas').select('projeto_id, valor')
          .not('projeto_id', 'is', null), empresaId),
        sb.from('apontamentos').select('projeto_id, horas'),
      ])
    if (e1) return { error: `projetos: ${e1.message}` }

    const soma = (linhas: { projeto_id: string | null; valor?: unknown; horas?: unknown }[] | null,
                  campo: 'valor' | 'horas') => {
      const m = new Map<string, number>()
      for (const l of linhas ?? []) {
        if (!l.projeto_id) continue
        m.set(l.projeto_id, (m.get(l.projeto_id) ?? 0) + Number(l[campo] ?? 0))
      }
      return m
    }

    const recebido = soma(
      (receitas ?? []).filter(r => r.status === 'recebido' || r.status === 'confirmado'),
      'valor'
    )
    const custo = soma(despesas, 'valor')
    const horas = soma(apontamentos ?? [], 'horas')
    const r2 = (v: number) => Math.round(v * 100) / 100

    const linhas = (projetos ?? []).map(p => {
      const emp = Array.isArray(p.empresas) ? p.empresas[0] : p.empresas
      const rec = recebido.get(p.id) ?? 0
      const cst = custo.get(p.id) ?? 0
      const h = horas.get(p.id) ?? 0
      const custoH = h * custoHora
      const margem = rec - cst - custoH
      return {
        projeto_id: p.id,
        nome: p.nome,
        empresa: (emp as { razao_social?: string } | null)?.razao_social ?? null,
        contratado: r2(Number(p.valor_contratado ?? 0)),
        recebido: r2(rec),
        custoAlocado: r2(cst),
        horas: r2(h),
        custoHoras: r2(custoH),
        margem: r2(margem),
        margemPct: rec > 0 ? Math.round((margem / rec) * 1000) / 10 : null,
      }
    })

    return { data: linhas.sort((a, b) => b.margem - a.margem) }
  } catch (e) {
    return { error: `montarRentabilidade: ${e instanceof Error ? e.message : String(e)}` }
  }
}
