/**
 * Modelo de precificação de SaaS.
 *
 * A fórmula vive aqui, fora do componente e fora do servidor, para que a tela
 * recalcule na hora e o servidor grave exatamente o mesmo resultado.
 */

export type Entradas = {
  /** Infra por cliente/mês: banco, storage, e-mail, o que escala com o cliente. */
  custoInfraCliente: number
  /** Horas de suporte por cliente/mês. */
  horasSuporte: number
  /** Quanto vale a sua hora. */
  custoHora: number
  /** Custo fixo mensal do produto: sua dedicação, ferramentas, licenças. */
  custoFixoMensal: number
  /** Clientes ativos hoje — divide o custo fixo. */
  clientesAtivos: number
  /** Margem que você quer sobre o custo total. */
  margemAlvo: number
  /** Cancelamento mensal, em %. */
  churnMensal: number
  /** Custo de aquisição por cliente. */
  cac: number
  /** Novos clientes por mês, no cenário base. */
  novosPorMes: number
}

export type Plano = {
  nome: string
  preco: number
  anual: number
  destaque: boolean
}

export type Resultado = {
  custoVariavel: number
  custoFixoRateado: number
  custoTotalCliente: number
  precoMinimo: number
  planos: Plano[]
  /** Meses médios de permanência = 1 / churn. */
  vidaMediaMeses: number | null
  ltv: number | null
  ltvSobreCac: number | null
  /** Meses até o CAC se pagar. */
  paybackMeses: number | null
  /** Clientes necessários para cobrir o custo fixo. */
  breakEvenClientes: number | null
  mrrProjetado: { mes: number; pessimista: number; base: number; otimista: number }[]
}

export const ENTRADAS_PADRAO: Entradas = {
  custoInfraCliente: 12,
  horasSuporte: 0.5,
  custoHora: 120,
  custoFixoMensal: 2000,
  clientesAtivos: 10,
  margemAlvo: 70,
  churnMensal: 3,
  cac: 300,
  novosPorMes: 3,
}

export function calcular(e: Entradas): Resultado {
  const custoVariavel = e.custoInfraCliente + e.horasSuporte * e.custoHora
  const custoFixoRateado = e.clientesAtivos > 0 ? e.custoFixoMensal / e.clientesAtivos : 0
  const custoTotalCliente = custoVariavel + custoFixoRateado

  // Preço que entrega a margem desejada sobre o custo total.
  const margem = Math.min(Math.max(e.margemAlvo, 0), 99) / 100
  const precoMinimo = custoTotalCliente / (1 - margem)

  // Ancoragem clássica de três planos: o do meio é o que se quer vender.
  const meio = Math.ceil(precoMinimo / 10) * 10
  const planos: Plano[] = [
    { nome: 'Starter', preco: Math.ceil((meio * 0.55) / 10) * 10, anual: 0, destaque: false },
    { nome: 'Pro', preco: meio, anual: 0, destaque: true },
    { nome: 'Premium', preco: Math.ceil((meio * 1.7) / 10) * 10, anual: 0, destaque: false },
  ].map(p => ({ ...p, anual: p.preco * 10 })) // anual = 10 meses, 2 de desconto

  const churn = e.churnMensal / 100
  const vidaMediaMeses = churn > 0 ? 1 / churn : null
  const margemUnitaria = meio - custoVariavel
  const ltv = vidaMediaMeses !== null ? margemUnitaria * vidaMediaMeses : null
  const ltvSobreCac = ltv !== null && e.cac > 0 ? ltv / e.cac : null
  const paybackMeses = margemUnitaria > 0 && e.cac > 0 ? e.cac / margemUnitaria : null
  const breakEvenClientes = margemUnitaria > 0
    ? Math.ceil(e.custoFixoMensal / margemUnitaria)
    : null

  // Projeção de 12 meses. A base de clientes cresce com os novos e encolhe
  // com o churn — sem isso a projeção vira linha reta e mente.
  const cenarios = { pessimista: e.novosPorMes * 0.5, base: e.novosPorMes, otimista: e.novosPorMes * 1.8 }
  const bases = { pessimista: e.clientesAtivos, base: e.clientesAtivos, otimista: e.clientesAtivos }
  const mrrProjetado: Resultado['mrrProjetado'] = []

  for (let mes = 1; mes <= 12; mes++) {
    for (const k of ['pessimista', 'base', 'otimista'] as const) {
      bases[k] = bases[k] * (1 - churn) + cenarios[k]
    }
    mrrProjetado.push({
      mes,
      pessimista: Math.round(bases.pessimista * meio),
      base: Math.round(bases.base * meio),
      otimista: Math.round(bases.otimista * meio),
    })
  }

  const r2 = (n: number) => Math.round(n * 100) / 100

  return {
    custoVariavel: r2(custoVariavel),
    custoFixoRateado: r2(custoFixoRateado),
    custoTotalCliente: r2(custoTotalCliente),
    precoMinimo: r2(precoMinimo),
    planos,
    vidaMediaMeses: vidaMediaMeses !== null ? r2(vidaMediaMeses) : null,
    ltv: ltv !== null ? r2(ltv) : null,
    ltvSobreCac: ltvSobreCac !== null ? r2(ltvSobreCac) : null,
    paybackMeses: paybackMeses !== null ? r2(paybackMeses) : null,
    breakEvenClientes,
    mrrProjetado,
  }
}

export const CAMPOS: { chave: keyof Entradas; rotulo: string; sufixo?: string; ajuda: string }[] = [
  { chave: 'custoInfraCliente', rotulo: 'Infra por cliente', sufixo: 'R$/mês', ajuda: 'Banco, storage, e-mail — o que cresce com cada cliente.' },
  { chave: 'horasSuporte', rotulo: 'Suporte por cliente', sufixo: 'h/mês', ajuda: 'Horas médias de atendimento por cliente.' },
  { chave: 'custoHora', rotulo: 'Sua hora', sufixo: 'R$', ajuda: 'Quanto vale uma hora sua.' },
  { chave: 'custoFixoMensal', rotulo: 'Custo fixo do produto', sufixo: 'R$/mês', ajuda: 'Ferramentas, licenças e sua dedicação, independente do nº de clientes.' },
  { chave: 'clientesAtivos', rotulo: 'Clientes ativos', ajuda: 'Divide o custo fixo. Com poucos clientes, o rateio pesa.' },
  { chave: 'margemAlvo', rotulo: 'Margem alvo', sufixo: '%', ajuda: 'Margem sobre o custo total por cliente.' },
  { chave: 'churnMensal', rotulo: 'Churn mensal', sufixo: '%', ajuda: 'Quantos por cento cancelam por mês.' },
  { chave: 'cac', rotulo: 'CAC', sufixo: 'R$', ajuda: 'Quanto custa conquistar um cliente.' },
  { chave: 'novosPorMes', rotulo: 'Novos por mês', ajuda: 'Cenário base de aquisição.' },
]
