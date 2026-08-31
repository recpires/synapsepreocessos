import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { previsoesACancelar } from '../lib/assinatura.ts'

/**
 * Cancelar assinatura.
 *
 * A regra é uma só: desfaz previsão, nunca histórico. A data de corte é
 * digitada à mão no modal, então nada impede escolher uma data no passado — e
 * até aqui isso apagaria despesa já paga, porque a exclusão filtrava só por
 * data. Perder lançamento pago é o pior estrago possível neste painel.
 */

const l = (id: string, data: string, valor: number, confirmado: boolean, serie = 'S1') =>
  ({ id, data, valor, confirmado, serie_id: serie })

// Uma série real: três faturas pagas e três previsões à frente.
const SERIE = [
  l('a', '2026-06-28', 237.05, true),
  l('b', '2026-07-12', 287.07, true),
  l('c', '2026-08-28', 409.68, true),
  l('d', '2027-01-28', 237.05, false),
  l('e', '2027-02-28', 237.05, false),
  l('f', '2027-03-28', 237.05, false),
]

describe('o que sai no cancelamento', () => {
  test('corte hoje remove só as previsões à frente', () => {
    const r = previsoesACancelar(SERIE, 'S1', '2026-08-31')
    assert.deepEqual(r.ids, ['d', 'e', 'f'])
    assert.equal(r.linhas, 3)
    assert.ok(Math.abs(r.total - 711.15) < 0.01, String(r.total))
    assert.equal(r.protegidas, 0)
  })

  test('corte no passado NÃO leva o que já foi pago', () => {
    // Sem a guarda de `confirmado`, isto apagaria as três faturas reais.
    const r = previsoesACancelar(SERIE, 'S1', '2026-01-01')
    assert.deepEqual(r.ids, ['d', 'e', 'f'])
    assert.equal(r.protegidas, 3)
  })

  test('previsão já vencida e não confirmada sai junto', () => {
    // É previsão que não virou dinheiro; some sem buraco no histórico.
    const com = [...SERIE, l('g', '2026-05-28', 226.23, false)]
    const r = previsoesACancelar(com, 'S1', '2026-01-01')
    assert.ok(r.ids.includes('g'))
    assert.equal(r.protegidas, 3)
  })

  test('não toca em outra série', () => {
    const com = [...SERIE, l('x', '2027-01-28', 316.03, false, 'S2')]
    const r = previsoesACancelar(com, 'S1', '2026-08-31')
    assert.ok(!r.ids.includes('x'))
  })

  test('série só com histórico pago não remove nada', () => {
    const r = previsoesACancelar(SERIE.slice(0, 3), 'S1', '2026-01-01')
    assert.deepEqual(r.ids, [])
    assert.equal(r.linhas, 0)
    assert.equal(r.total, 0)
    assert.equal(r.protegidas, 3)
  })

  test('a data do corte entra no corte', () => {
    const r = previsoesACancelar(SERIE, 'S1', '2027-02-28')
    assert.deepEqual(r.ids, ['e', 'f'])
  })

  test('confirmado nulo conta como previsão, não como pago', () => {
    // Linha antiga, anterior à coluna: tratá-la como paga a tornaria imortal.
    const r = previsoesACancelar(
      [{ id: 'n', data: '2027-01-01', valor: 10, confirmado: null, serie_id: 'S1' }],
      'S1', '2026-01-01')
    assert.deepEqual(r.ids, ['n'])
  })

  test('valor em string do Postgres soma certo', () => {
    const r = previsoesACancelar(
      [{ id: 'p', data: '2027-01-01', valor: '316.03', confirmado: false, serie_id: 'S1' }],
      'S1', '2026-01-01')
    assert.equal(r.total, 316.03)
  })
})
