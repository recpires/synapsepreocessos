import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { calcular, ENTRADAS_PADRAO, type Entradas } from '../types/precificacao.ts'

/**
 * Precificação de SaaS.
 *
 * A fórmula errada aqui não estoura: ela devolve um preço plausível e menor. A
 * versão anterior dividia só por (1 − margem), ignorando imposto e taxa —
 * pedindo 30% de margem com Simples de 6% e taxa de 5%, sugeria R$ 75,71 onde
 * o certo era R$ 89,83, e a margem real caía para 19%. Um preço desses vai
 * para dentro de uma proposta e vira contrato.
 */

/** Cenário da planilha de referência: custo por cliente de R$ 53. */
const PLANILHA: Entradas = {
  ...ENTRADAS_PADRAO,
  custoInfraCliente: 53,
  horasSuporte: 0,
  custoHora: 0,
  custoFixoMensal: 0,
  clientesAtivos: 1,
  margemAlvo: 30,
  aliquotaImposto: 6,
  taxaFinanceira: 5,
}

describe('preço mínimo', () => {
  test('imposto e taxa entram no divisor, junto com a margem', () => {
    const r = calcular(PLANILHA)
    // 53 / (1 − 0,30 − 0,06 − 0,05) = 89,83
    assert.equal(r.precoMinimo, 89.83)
  })

  test('sem imposto nem taxa, volta a ser custo sobre margem', () => {
    const r = calcular({ ...PLANILHA, aliquotaImposto: 0, taxaFinanceira: 0 })
    assert.equal(r.precoMinimo, 75.71)   // 53 / 0,70
  })

  test('imposto maior empurra o preço para cima', () => {
    const baixo = calcular({ ...PLANILHA, aliquotaImposto: 6 }).precoMinimo
    const alto = calcular({ ...PLANILHA, aliquotaImposto: 15 }).precoMinimo
    assert.ok(alto > baixo, `${alto} deveria ser maior que ${baixo}`)
  })

  test('margem somada a imposto e taxa passando de 100% não explode', () => {
    // Não existe preço que entregue isso; o cálculo precisa devolver número
    // finito em vez de dividir por zero ou virar negativo.
    const r = calcular({ ...PLANILHA, margemAlvo: 95, aliquotaImposto: 6, taxaFinanceira: 5 })
    assert.ok(Number.isFinite(r.precoMinimo))
    assert.ok(r.precoMinimo > 0)
  })
})

describe('custo por cliente', () => {
  test('soma infra, suporte e o rateio do fixo', () => {
    const r = calcular({
      ...ENTRADAS_PADRAO,
      custoInfraCliente: 10, horasSuporte: 0.5, custoHora: 100,
      custoFixoMensal: 1000, clientesAtivos: 20,
    })
    assert.equal(r.custoVariavel, 60)        // 10 + 0,5 × 100
    assert.equal(r.custoFixoRateado, 50)     // 1000 / 20
    assert.equal(r.custoTotalCliente, 110)
  })

  test('sem cliente ativo, o rateio é zero em vez de infinito', () => {
    const r = calcular({ ...ENTRADAS_PADRAO, clientesAtivos: 0, custoFixoMensal: 5000 })
    assert.equal(r.custoFixoRateado, 0)
    assert.ok(Number.isFinite(r.precoMinimo))
  })
})

describe('markup e margem líquida', () => {
  test('markup é o preço sobre o custo, menos um', () => {
    const r = calcular(PLANILHA)
    // 89,83 / 53 − 1 = 0,6949…
    assert.ok(Math.abs(r.markup - 0.69) < 0.01, `markup ${r.markup}`)
  })

  test('a margem líquida do plano do meio bate com o que sobra de fato', () => {
    const r = calcular(PLANILHA)
    const meio = r.planos.find(p => p.destaque)!.preco
    const esperado = (meio * (1 - 0.06 - 0.05) - r.custoTotalCliente) / meio * 100
    assert.ok(Math.abs(r.margemLiquida - esperado) < 0.01)
  })

  test('lucro líquido por cliente desconta imposto, taxa e custo', () => {
    const r = calcular(PLANILHA)
    const meio = r.planos.find(p => p.destaque)!.preco
    assert.equal(r.lucroLiquidoCliente, Math.round((meio * 0.89 - 53) * 100) / 100)
  })
})

describe('simulação por número de clientes', () => {
  test('cobre de 10 a 500 clientes', () => {
    const r = calcular(ENTRADAS_PADRAO)
    assert.deepEqual(r.simulacaoClientes.map(s => s.clientes), [10, 25, 50, 100, 250, 500])
  })

  test('lucro é faturamento menos custos, sem sobra escondida', () => {
    const r = calcular(ENTRADAS_PADRAO)
    for (const linha of r.simulacaoClientes) {
      assert.equal(linha.lucro, linha.faturamento - linha.custos)
    }
  })

  test('base pequena com custo fixo alto dá prejuízo, e isso precisa aparecer', () => {
    const r = calcular({ ...ENTRADAS_PADRAO, custoFixoMensal: 50_000, clientesAtivos: 100 })
    assert.ok(r.simulacaoClientes[0].lucro < 0, 'com 10 clientes deveria dar prejuízo')
  })

  test('escala melhora a margem, porque o fixo não cresce', () => {
    const r = calcular(ENTRADAS_PADRAO)
    const dez = r.simulacaoClientes[0]
    const quinhentos = r.simulacaoClientes[5]
    assert.ok(quinhentos.lucro / quinhentos.faturamento > dez.lucro / dez.faturamento)
  })
})

describe('LTV e CAC', () => {
  test('vida média é o inverso do churn', () => {
    const r = calcular({ ...ENTRADAS_PADRAO, churnMensal: 4 })
    assert.equal(r.vidaMediaMeses, 25)
  })

  test('churn zero não vira divisão por zero', () => {
    const r = calcular({ ...ENTRADAS_PADRAO, churnMensal: 0 })
    assert.equal(r.vidaMediaMeses, null)
    assert.equal(r.ltv, null)
  })

  test('a margem unitária do LTV já desconta imposto e taxa', () => {
    // Testa a fórmula, não a direção: com imposto maior o preço sobe para
    // preservar a margem, e sobe mais rápido que a mordida — o LTV cresce.
    // A intuição contrária estava errada, o cálculo não.
    const e = { ...ENTRADAS_PADRAO, aliquotaImposto: 10, taxaFinanceira: 5 }
    const r = calcular(e)
    const meio = r.planos.find(p => p.destaque)!.preco
    // Vida média sem arredondar: o resultado expõe 33,33, mas o cálculo usa
    // 1/0,03 inteiro. Comparar com o valor exibido erra por alguns reais.
    const vida = 1 / (e.churnMensal / 100)
    const esperado = (meio * 0.85 - r.custoVariavel) * vida
    assert.ok(
      Math.abs(r.ltv! - esperado) < 0.01,
      `ltv ${r.ltv} deveria ser ${esperado}`
    )
  })

  test('o LTV usa margem de contribuição, sem o custo fixo rateado', () => {
    // Custo fixo não some com o cliente indo embora, então não entra no que
    // ele "deixa" — entra no break-even, que é outra conta.
    const r = calcular({ ...ENTRADAS_PADRAO, custoFixoMensal: 9999, clientesAtivos: 10 })
    const meio = r.planos.find(p => p.destaque)!.preco
    const comFixo = (meio - r.custoTotalCliente) * r.vidaMediaMeses!
    assert.ok(r.ltv! > comFixo, 'o rateio do fixo não pode entrar no LTV')
  })
})

describe('projeção de MRR', () => {
  test('doze meses, com a base encolhendo pelo churn', () => {
    const r = calcular(ENTRADAS_PADRAO)
    assert.equal(r.mrrProjetado.length, 12)
    assert.ok(r.mrrProjetado[11].otimista > r.mrrProjetado[11].base)
    assert.ok(r.mrrProjetado[11].base > r.mrrProjetado[11].pessimista)
  })
})
