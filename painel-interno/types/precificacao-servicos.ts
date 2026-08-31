/**
 * Precificação de serviço, revenda e evento.
 *
 * Veio da planilha da barbearia, mas a mecânica não é dela: serviço cobrado por
 * tempo, produto comprado para revender e evento rateado por participante
 * aparecem em qualquer negócio que não seja só software. A Synapse mesma vende
 * projeto sob medida e manutenção, que são serviço por hora.
 *
 * A fórmula é a mesma da precificação de SaaS — `custo ÷ (1 − margem − imposto)`
 * — e pela mesma razão: imposto incide sobre o preço, não sobre o custo.
 *
 * Duas alíquotas, porque o Simples separa: serviço cai no Anexo III ou V,
 * revenda cai no Anexo I. Usar uma só faz o produto subsidiar o serviço ou o
 * contrário, e ninguém percebe pelo total.
 */

export type Premissas = {
  /** Mão de obra por hora de quem executa. */
  custoHora: number
  /** Aluguel, contas, tudo que não muda com o número de atendimentos. */
  custoFixoMensal: number
  /** Atendimentos por mês, para ratear o fixo. */
  atendimentosMes: number
  /** Simples sobre serviço — Anexo III ou V, em %. */
  aliquotaServicos: number
  /** Simples sobre revenda — Anexo I, em %. */
  aliquotaComercio: number
}

export type ItemServico = {
  nome: string
  /** Duração do atendimento. É o que transforma hora em custo. */
  minutos: number
  /** Insumo consumido no atendimento: lâmina, produto, descartável. */
  materiais: number
  margem: number
}

export type ItemProduto = {
  nome: string
  aquisicao: number
  frete: number
  /** Imposto pago na compra, em %. Entra no custo, não no divisor. */
  impostoCompra: number
  margem: number
}

export type ItemEvento = {
  nome: string
  /** Instrutor, local, o que não muda com o número de inscritos. */
  custoFixo: number
  materialPorParticipante: number
  participantes: number
  margem: number
}

export type LinhaServico = {
  nome: string
  custoMaoObra: number
  custoMateriais: number
  custoFixoRateado: number
  custoTotal: number
  preco: number
  markup: number
  /** O que sobra depois do imposto. */
  lucro: number
}

export type LinhaProduto = {
  nome: string
  custoUnitario: number
  preco: number
  markup: number
  lucro: number
}

export type LinhaEvento = {
  nome: string
  custoTotalEvento: number
  custoPorParticipante: number
  precoPorParticipante: number
  receitaTotal: number
  lucroTotal: number
  markup: number
}

export type ResultadoServicos = {
  custoFixoRateado: number
  servicos: LinhaServico[]
  produtos: LinhaProduto[]
  eventos: LinhaEvento[]
}

export const PREMISSAS_PADRAO: Premissas = {
  custoHora: 35,
  custoFixoMensal: 6000,
  atendimentosMes: 400,
  aliquotaServicos: 8.08,
  aliquotaComercio: 5.32,
}

export const SERVICOS_PADRAO: ItemServico[] = [
  { nome: 'Corte masculino', minutos: 30, materiais: 4, margem: 35 },
  { nome: 'Barba', minutos: 20, materiais: 3, margem: 35 },
  { nome: 'Corte + barba', minutos: 45, materiais: 6, margem: 35 },
  { nome: 'Sobrancelha', minutos: 10, materiais: 1, margem: 35 },
]

export const PRODUTOS_PADRAO: ItemProduto[] = [
  { nome: 'Pomada modeladora', aquisicao: 18, frete: 2, impostoCompra: 8, margem: 40 },
  { nome: 'Óleo para barba', aquisicao: 22, frete: 2, impostoCompra: 8, margem: 45 },
  { nome: 'Shampoo / condicionador', aquisicao: 25, frete: 2.5, impostoCompra: 8, margem: 40 },
  { nome: 'Kit de barbear', aquisicao: 60, frete: 4, impostoCompra: 8, margem: 35 },
]

export const EVENTOS_PADRAO: ItemEvento[] = [
  { nome: 'Workshop de barboterapia', custoFixo: 800, materialPorParticipante: 25, participantes: 12, margem: 40 },
  { nome: 'Curso de autocuidado', custoFixo: 600, materialPorParticipante: 15, participantes: 15, margem: 45 },
]

/**
 * Preço que entrega a margem depois do imposto.
 *
 * O divisor precisa sobrar algo: margem somada à alíquota chegando a 100% não
 * tem preço que resolva, e dividir por zero devolveria `Infinity` na tela.
 */
function precoComMargem(custo: number, margemPct: number, aliquotaPct: number): number {
  const margem = Math.min(Math.max(margemPct, 0), 99) / 100
  const aliquota = Math.min(Math.max(aliquotaPct, 0), 99) / 100
  const sobra = Math.max(1 - margem - aliquota, 0.01)
  return custo / sobra
}

const r2 = (n: number) => Math.round(n * 100) / 100

export function calcularServicos(
  p: Premissas,
  servicos: ItemServico[],
  produtos: ItemProduto[],
  eventos: ItemEvento[]
): ResultadoServicos {
  // Sem atendimento estimado não há como ratear: melhor zerar do que estourar.
  const custoFixoRateado = p.atendimentosMes > 0 ? p.custoFixoMensal / p.atendimentosMes : 0

  const linhasServico = servicos.map(s => {
    const custoMaoObra = (s.minutos / 60) * p.custoHora
    const custoTotal = custoMaoObra + s.materiais + custoFixoRateado
    const preco = precoComMargem(custoTotal, s.margem, p.aliquotaServicos)
    return {
      nome: s.nome,
      custoMaoObra: r2(custoMaoObra),
      custoMateriais: r2(s.materiais),
      custoFixoRateado: r2(custoFixoRateado),
      custoTotal: r2(custoTotal),
      preco: r2(preco),
      markup: custoTotal > 0 ? r2(preco / custoTotal - 1) : 0,
      lucro: r2(preco * (1 - p.aliquotaServicos / 100) - custoTotal),
    }
  })

  const linhasProduto = produtos.map(x => {
    // O imposto da compra entra no custo; o da venda entra no divisor. São
    // impostos diferentes e misturá-los é como o markup vira mentira.
    const custoUnitario = x.aquisicao + x.frete + x.aquisicao * (x.impostoCompra / 100)
    const preco = precoComMargem(custoUnitario, x.margem, p.aliquotaComercio)
    return {
      nome: x.nome,
      custoUnitario: r2(custoUnitario),
      preco: r2(preco),
      markup: custoUnitario > 0 ? r2(preco / custoUnitario - 1) : 0,
      lucro: r2(preco * (1 - p.aliquotaComercio / 100) - custoUnitario),
    }
  })

  const linhasEvento = eventos.map(ev => {
    const custoTotalEvento = ev.custoFixo + ev.materialPorParticipante * ev.participantes
    // Evento sem inscrito não tem custo por participante — e nem evento.
    const custoPorParticipante = ev.participantes > 0 ? custoTotalEvento / ev.participantes : 0
    const precoPorParticipante = precoComMargem(custoPorParticipante, ev.margem, p.aliquotaServicos)
    const receitaTotal = precoPorParticipante * ev.participantes
    return {
      nome: ev.nome,
      custoTotalEvento: r2(custoTotalEvento),
      custoPorParticipante: r2(custoPorParticipante),
      precoPorParticipante: r2(precoPorParticipante),
      receitaTotal: r2(receitaTotal),
      lucroTotal: r2(receitaTotal * (1 - p.aliquotaServicos / 100) - custoTotalEvento),
      markup: custoPorParticipante > 0 ? r2(precoPorParticipante / custoPorParticipante - 1) : 0,
    }
  })

  return {
    custoFixoRateado: r2(custoFixoRateado),
    servicos: linhasServico,
    produtos: linhasProduto,
    eventos: linhasEvento,
  }
}
