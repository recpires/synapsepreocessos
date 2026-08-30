import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  pctNaData, fatiaNoPeriodo, variouNoPeriodo, type Vigencia,
} from '../lib/participacao.ts'

/**
 * Fatia de sócio por vigência.
 *
 * O que está sendo protegido aqui é dinheiro atribuído à pessoa errada: a
 * versão anterior multiplicava o resultado do ano pela participação de hoje, o
 * que dá a quem entrou em julho o que aconteceu em março.
 */

const sempre = (pct: number): Vigencia =>
  ({ participacao_pct: pct, entrada: null, saida: null })

describe('pctNaData', () => {
  test('sem data de entrada, vale desde sempre', () => {
    assert.equal(pctNaData([sempre(50)], '2020-01-01'), 50)
  })

  test('antes da entrada não é sócio', () => {
    const v = [{ participacao_pct: 50, entrada: '2026-07-01', saida: null }]
    assert.equal(pctNaData(v, '2026-06-30'), 0)
    assert.equal(pctNaData(v, '2026-07-01'), 50)
  })

  test('a data de saída já é o primeiro dia fora', () => {
    const v = [{ participacao_pct: 40, entrada: null, saida: '2026-07-01' }]
    assert.equal(pctNaData(v, '2026-06-30'), 40)
    assert.equal(pctNaData(v, '2026-07-01'), 0)
  })

  test('sem vigência declarada, ninguém tem fatia', () => {
    assert.equal(pctNaData([], '2026-05-01'), 0)
  })
})

describe('fatiaNoPeriodo', () => {
  test('sócio o ano todo leva a fração de tudo', () => {
    const r = fatiaNoPeriodo([sempre(50)], [
      { data: '2026-03-10', valor: 1000 },
      { data: '2026-09-10', valor: -400 },
    ])
    assert.equal(r, 300)
  })

  test('quem entrou depois não leva o que veio antes', () => {
    const v = [{ participacao_pct: 50, entrada: '2026-07-01', saida: null }]
    assert.equal(fatiaNoPeriodo(v, [{ data: '2026-03-10', valor: 1000 }]), 0)
    assert.equal(fatiaNoPeriodo(v, [{ data: '2026-09-10', valor: 1000 }]), 500)
  })

  test('quem saiu leva o que veio antes da saída', () => {
    const v = [{ participacao_pct: 40, entrada: null, saida: '2026-07-01' }]
    assert.equal(fatiaNoPeriodo(v, [{ data: '2026-03-10', valor: 1000 }]), 400)
    assert.equal(fatiaNoPeriodo(v, [{ data: '2026-07-01', valor: 1000 }]), 0)
  })

  test('troca de fatia no meio do ano não conta o dia da virada duas vezes', () => {
    const duas: Vigencia[] = [
      { participacao_pct: 30, entrada: null, saida: '2026-07-01' },
      { participacao_pct: 60, entrada: '2026-07-01', saida: null },
    ]
    assert.equal(fatiaNoPeriodo(duas, [{ data: '2026-06-30', valor: 1000 }]), 300)
    assert.equal(fatiaNoPeriodo(duas, [{ data: '2026-07-01', valor: 1000 }]), 600)
    assert.equal(
      fatiaNoPeriodo(duas, [
        { data: '2026-06-30', valor: 1000 },
        { data: '2026-08-01', valor: 1000 },
      ]),
      900
    )
  })

  test('prejuízo é rateado como o lucro', () => {
    assert.equal(
      fatiaNoPeriodo([sempre(10)], [{ data: '2026-05-01', valor: -92687.51 }]),
      -9268.75
    )
  })

  test('arredonda uma vez no fim, não a cada linha', () => {
    // Três de 0,335 dariam 1,02 arredondando linha a linha, e 1,01 somando antes.
    const r = fatiaNoPeriodo([sempre(50)], [
      { data: '2026-01-01', valor: 0.67 },
      { data: '2026-01-02', valor: 0.67 },
      { data: '2026-01-03', valor: 0.67 },
    ])
    assert.equal(r, 1.01)
  })

  test('sem vigência devolve zero, não NaN', () => {
    assert.equal(fatiaNoPeriodo([], [{ data: '2026-01-01', valor: 100 }]), 0)
  })
})

describe('variouNoPeriodo', () => {
  test('entrada dentro da janela conta como mudança', () => {
    const v = [{ participacao_pct: 50, entrada: '2026-07-01', saida: null }]
    assert.equal(variouNoPeriodo(v, '2026-01-01', '2026-08-29'), true)
  })

  test('sócio antigo não conta como mudança', () => {
    const v = [{ participacao_pct: 50, entrada: '2023-01-01', saida: null }]
    assert.equal(variouNoPeriodo(v, '2026-01-01', '2026-08-29'), false)
  })

  test('saída dentro da janela conta como mudança', () => {
    const v = [{ participacao_pct: 50, entrada: null, saida: '2026-05-01' }]
    assert.equal(variouNoPeriodo(v, '2026-01-01', '2026-08-29'), true)
  })
})
