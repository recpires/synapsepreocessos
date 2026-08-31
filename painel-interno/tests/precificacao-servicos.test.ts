import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  calcularServicos, PREMISSAS_PADRAO,
  SERVICOS_PADRAO, PRODUTOS_PADRAO, EVENTOS_PADRAO,
} from '../types/precificacao-servicos.ts'

/**
 * Precificação de serviço, revenda e evento.
 *
 * Os valores esperados vieram da planilha que o Rodrigo mandou — é ela o
 * gabarito. Se o código divergir, um dos dois está errado, e a diferença
 * aparece aqui em vez de aparecer num orçamento entregue ao cliente.
 */

const perto = (a: number, b: number, tol = 0.02) =>
  Math.abs(a - b) < tol

describe('rateio do custo fixo', () => {
  test('divide o fixo pelos atendimentos do mês', () => {
    const r = calcularServicos(PREMISSAS_PADRAO, [], [], [])
    assert.equal(r.custoFixoRateado, 15)   // 6000 / 400
  })

  test('sem atendimento estimado, o rateio é zero e não Infinity', () => {
    const r = calcularServicos({ ...PREMISSAS_PADRAO, atendimentosMes: 0 }, SERVICOS_PADRAO, [], [])
    assert.equal(r.custoFixoRateado, 0)
    assert.ok(Number.isFinite(r.servicos[0].preco))
  })
})

describe('serviços — gabarito da planilha', () => {
  const r = calcularServicos(PREMISSAS_PADRAO, SERVICOS_PADRAO, [], [])

  test('corte masculino: 30 min a R$ 35/h + R$ 4 + R$ 15 de rateio', () => {
    const corte = r.servicos[0]
    assert.equal(corte.custoMaoObra, 17.5)
    assert.equal(corte.custoTotal, 36.5)
    // 36,5 / (1 − 0,35 − 0,0808) = 64,13
    assert.ok(perto(corte.preco, 64.13), `preço ${corte.preco}`)
  })

  test('barba: 20 min', () => {
    const barba = r.servicos[1]
    assert.ok(perto(barba.custoMaoObra, 11.67))
    assert.ok(perto(barba.preco, 52.12), `preço ${barba.preco}`)
  })

  test('corte + barba: 45 min', () => {
    assert.ok(perto(r.servicos[2].preco, 83.01), `preço ${r.servicos[2].preco}`)
  })

  test('sobrancelha: 10 min, onde o rateio pesa mais que a mão de obra', () => {
    const sob = r.servicos[3]
    assert.ok(sob.custoFixoRateado > sob.custoMaoObra)
    assert.ok(perto(sob.preco, 38.36), `preço ${sob.preco}`)
  })

  test('markup é igual entre serviços de mesma margem, mesmo com custo diferente', () => {
    // Consequência da fórmula: markup só depende de margem e alíquota.
    const markups = r.servicos.map(s => s.markup)
    assert.ok(markups.every(m => perto(m, markups[0], 0.001)), markups.join(', '))
  })

  test('o lucro declarado sobra de fato depois do imposto', () => {
    const s = r.servicos[0]
    assert.ok(perto(s.lucro, s.preco * (1 - 0.0808) - s.custoTotal))
  })
})

describe('produtos — gabarito da planilha', () => {
  const r = calcularServicos(PREMISSAS_PADRAO, [], PRODUTOS_PADRAO, [])

  test('pomada: 18 + 2 de frete + 8% de imposto na compra', () => {
    const p = r.produtos[0]
    assert.equal(p.custoUnitario, 21.44)
    // 21,44 / (1 − 0,40 − 0,0532) = 39,21
    assert.ok(perto(p.preco, 39.21), `preço ${p.preco}`)
  })

  test('óleo com margem maior sai proporcionalmente mais caro', () => {
    assert.ok(perto(r.produtos[1].custoUnitario, 25.76))
    assert.ok(perto(r.produtos[1].preco, 51.85), `preço ${r.produtos[1].preco}`)
  })

  test('kit de barbear', () => {
    assert.ok(perto(r.produtos[3].custoUnitario, 68.8))
    assert.ok(perto(r.produtos[3].preco, 115.28), `preço ${r.produtos[3].preco}`)
  })

  test('revenda usa a alíquota de comércio, não a de serviço', () => {
    const comercio = calcularServicos(PREMISSAS_PADRAO, [], PRODUTOS_PADRAO, []).produtos[0].preco
    const igualada = calcularServicos(
      { ...PREMISSAS_PADRAO, aliquotaComercio: PREMISSAS_PADRAO.aliquotaServicos },
      [], PRODUTOS_PADRAO, []
    ).produtos[0].preco
    // Anexo I é menor que o III: o produto tem de sair mais barato.
    assert.ok(comercio < igualada, `${comercio} deveria ser menor que ${igualada}`)
  })

  test('imposto de compra entra no custo, não no divisor', () => {
    const sem = calcularServicos(
      PREMISSAS_PADRAO, [], [{ ...PRODUTOS_PADRAO[0], impostoCompra: 0 }], []
    ).produtos[0]
    const com = calcularServicos(PREMISSAS_PADRAO, [], [PRODUTOS_PADRAO[0]], []).produtos[0]
    assert.equal(sem.custoUnitario, 20)          // 18 + 2
    assert.equal(com.custoUnitario, 21.44)       // + 8% de 18
    // Mesmo markup: o imposto de compra sobe custo e preço na mesma proporção.
    assert.ok(perto(sem.markup, com.markup, 0.001))
  })
})

describe('eventos — gabarito da planilha', () => {
  const r = calcularServicos(PREMISSAS_PADRAO, [], [], EVENTOS_PADRAO)

  test('barboterapia: 800 fixos + 25 × 12 participantes', () => {
    const w = r.eventos[0]
    assert.equal(w.custoTotalEvento, 1100)
    assert.ok(perto(w.custoPorParticipante, 91.67))
    assert.ok(perto(w.precoPorParticipante, 176.55), `preço ${w.precoPorParticipante}`)
    assert.ok(perto(w.receitaTotal, 2118.64), `receita ${w.receitaTotal}`)
  })

  test('curso de autocuidado', () => {
    const w = r.eventos[1]
    assert.equal(w.custoTotalEvento, 825)
    assert.ok(perto(w.precoPorParticipante, 117.22), `preço ${w.precoPorParticipante}`)
  })

  test('mais participantes diluem o custo fixo do evento', () => {
    const poucos = calcularServicos(PREMISSAS_PADRAO, [], [],
      [{ ...EVENTOS_PADRAO[0], participantes: 5 }]).eventos[0]
    const muitos = calcularServicos(PREMISSAS_PADRAO, [], [],
      [{ ...EVENTOS_PADRAO[0], participantes: 40 }]).eventos[0]
    assert.ok(muitos.precoPorParticipante < poucos.precoPorParticipante)
  })

  test('evento sem participante não divide por zero', () => {
    const r0 = calcularServicos(PREMISSAS_PADRAO, [], [],
      [{ ...EVENTOS_PADRAO[0], participantes: 0 }]).eventos[0]
    assert.equal(r0.custoPorParticipante, 0)
    assert.ok(Number.isFinite(r0.precoPorParticipante))
    assert.equal(r0.receitaTotal, 0)
  })
})

describe('guardas da fórmula', () => {
  test('margem somada à alíquota passando de 100% devolve número finito', () => {
    const r = calcularServicos(
      { ...PREMISSAS_PADRAO, aliquotaServicos: 20 },
      [{ nome: 'Impossível', minutos: 30, materiais: 0, margem: 95 }], [], []
    )
    assert.ok(Number.isFinite(r.servicos[0].preco))
    assert.ok(r.servicos[0].preco > 0)
  })

  test('listas vazias devolvem estrutura vazia, não erro', () => {
    const r = calcularServicos(PREMISSAS_PADRAO, [], [], [])
    assert.deepEqual([r.servicos, r.produtos, r.eventos], [[], [], []])
  })
})
