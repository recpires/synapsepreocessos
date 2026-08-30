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
  /**
   * Alíquota efetiva do Simples sobre o faturamento, em %.
   *
   * Entra no divisor junto com a margem: imposto incide sobre o preço, não
   * sobre o custo. Ignorá-lo — como esta calculadora fazia — subestima o preço
   * e entrega margem menor que a pedida.
   */
  aliquotaImposto: number
  /** Taxa de gateway/cartão sobre o faturamento, em %. Mesma lógica do imposto. */
  taxaFinanceira: number
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
  /** `preço/custo − 1`. Serve de conferência contra a margem sobre o preço. */
  markup: number
  /** Quanto sobra por cliente depois de custo, imposto e taxa. */
  lucroLiquidoCliente: number
  /** Margem que o preço de fato entrega. Bate com a alvo quando a conta fecha. */
  margemLiquida: number
  /** Lucro mensal para diferentes tamanhos de base. */
  simulacaoClientes: { clientes: number; faturamento: number; custos: number; lucro: number }[]
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
  aliquotaImposto: 6,
  taxaFinanceira: 5,
  churnMensal: 3,
  cac: 300,
  novosPorMes: 3,
}

export function calcular(e: Entradas): Resultado {
  const custoVariavel = e.custoInfraCliente + e.horasSuporte * e.custoHora
  const custoFixoRateado = e.clientesAtivos > 0 ? e.custoFixoMensal / e.clientesAtivos : 0
  const custoTotalCliente = custoVariavel + custoFixoRateado

  // Preço que entrega a margem desejada DEPOIS de imposto e taxa.
  //
  // Os três entram no divisor porque incidem sobre o preço, não sobre o custo.
  // A versão anterior dividia só por (1 − margem): pedindo 30% com Simples de
  // 6% e taxa de 5%, sugeria R$ 75,71 onde o correto era R$ 89,83 — e a margem
  // real caía para 19%.
  const margem = Math.min(Math.max(e.margemAlvo, 0), 99) / 100
  const imposto = Math.min(Math.max(e.aliquotaImposto, 0), 99) / 100
  const taxa = Math.min(Math.max(e.taxaFinanceira, 0), 99) / 100

  // O divisor precisa sobrar algo: margem + imposto + taxa somando 100% ou mais
  // não tem preço que resolva.
  const sobra = Math.max(1 - margem - imposto - taxa, 0.01)
  const precoMinimo = custoTotalCliente / sobra

  // Ancoragem clássica de três planos: o do meio é o que se quer vender.
  const meio = Math.ceil(precoMinimo / 10) * 10
  const planos: Plano[] = [
    { nome: 'Starter', preco: Math.ceil((meio * 0.55) / 10) * 10, anual: 0, destaque: false },
    { nome: 'Pro', preco: meio, anual: 0, destaque: true },
    { nome: 'Premium', preco: Math.ceil((meio * 1.7) / 10) * 10, anual: 0, destaque: false },
  ].map(p => ({ ...p, anual: p.preco * 10 })) // anual = 10 meses, 2 de desconto

  // O que sobra de cada mensalidade depois do que o governo e o gateway levam.
  const markup = custoTotalCliente > 0 ? precoMinimo / custoTotalCliente - 1 : 0
  const lucroLiquidoCliente = meio * (1 - imposto - taxa) - custoTotalCliente
  const margemLiquida = meio > 0 ? lucroLiquidoCliente / meio : 0

  const churn = e.churnMensal / 100
  const vidaMediaMeses = churn > 0 ? 1 / churn : null
  // Margem de contribuição: o custo fixo não entra, porque ele não cresce com
  // o cliente. Mas imposto e taxa crescem, e por isso descem daqui.
  const margemUnitaria = meio * (1 - imposto - taxa) - custoVariavel
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

  // Lucro conforme o tamanho da base. Mostra onde o custo fixo deixa de doer —
  // com poucos clientes o rateio come tudo, e o número negativo é a informação.
  const simulacaoClientes = [10, 25, 50, 100, 250, 500].map(clientes => {
    const faturamento = clientes * meio
    const custos = e.custoFixoMensal
      + clientes * custoVariavel
      + faturamento * (imposto + taxa)
    return {
      clientes,
      faturamento: Math.round(faturamento),
      custos: Math.round(custos),
      lucro: Math.round(faturamento - custos),
    }
  })

  const r2 = (n: number) => Math.round(n * 100) / 100

  return {
    custoVariavel: r2(custoVariavel),
    custoFixoRateado: r2(custoFixoRateado),
    custoTotalCliente: r2(custoTotalCliente),
    precoMinimo: r2(precoMinimo),
    markup: r2(markup),
    lucroLiquidoCliente: r2(lucroLiquidoCliente),
    margemLiquida: r2(margemLiquida * 100),
    simulacaoClientes,
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
  { chave: 'margemAlvo', rotulo: 'Margem alvo', sufixo: '%', ajuda: 'Quanto quer que sobre depois de custo, imposto e taxa.' },
  { chave: 'aliquotaImposto', rotulo: 'Simples Nacional', sufixo: '%', ajuda: 'Alíquota efetiva sobre o faturamento. Confirme a faixa com o contador.' },
  { chave: 'taxaFinanceira', rotulo: 'Taxa de pagamento', sufixo: '%', ajuda: 'Gateway ou cartão, sobre o faturamento.' },
  { chave: 'churnMensal', rotulo: 'Churn mensal', sufixo: '%', ajuda: 'Quantos por cento cancelam por mês.' },
  { chave: 'cac', rotulo: 'CAC', sufixo: 'R$', ajuda: 'Quanto custa conquistar um cliente.' },
  { chave: 'novosPorMes', rotulo: 'Novos por mês', ajuda: 'Cenário base de aquisição.' },
]
