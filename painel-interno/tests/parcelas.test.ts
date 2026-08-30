import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { gerarParcelas, TETO_SUGERIDO } from '../types/empresa-financeiro.ts'

/**
 * Carnê de dívida.
 *
 * Duas coisas quebram aqui e não aparecem na tela: centavo que some no
 * arredondamento vira saldo devedor que nunca zera, e dia 31 em mês curto
 * empurra o vencimento para o mês seguinte.
 */

const soma = (ps: { valor: number }[]) =>
  Math.round(ps.reduce((a, p) => a + p.valor, 0) * 100) / 100

describe('gerarParcelas', () => {
  test('divisão exata', () => {
    const p = gerarParcelas(1200, 12, '2026-09-10')
    assert.equal(p.length, 12)
    assert.equal(soma(p), 1200)
    assert.ok(p.every(x => x.valor === 100))
  })

  test('a última parcela absorve a sobra do arredondamento', () => {
    const p = gerarParcelas(1000, 12, '2026-09-10')
    assert.equal(soma(p), 1000)
    assert.equal(p[0].valor, 83.33)
    assert.equal(p[11].valor, 83.37)
  })

  test('dia 31 volta a ser 31 no mês que tem', () => {
    const p = gerarParcelas(300, 3, '2026-01-31')
    assert.deepEqual(p.map(x => x.vencimento), [
      '2026-01-31', '2026-02-28', '2026-03-31',
    ])
  })

  test('vira o ano sem perder o dia', () => {
    const p = gerarParcelas(500, 5, '2026-11-15')
    assert.equal(p[0].vencimento, '2026-11-15')
    assert.equal(p[4].vencimento, '2027-03-15')
    assert.equal(soma(p), 500)
  })

  test('parcela única devolve o valor inteiro', () => {
    const p = gerarParcelas(87.33, 1, '2026-09-01')
    assert.equal(p.length, 1)
    assert.equal(p[0].valor, 87.33)
  })

  test('numeração começa em 1 e é sequencial', () => {
    const p = gerarParcelas(600, 6, '2026-02-05')
    assert.deepEqual(p.map(x => x.numero), [1, 2, 3, 4, 5, 6])
  })

  test('29 de fevereiro em ano não bissexto cai no dia 28', () => {
    const p = gerarParcelas(200, 2, '2027-01-29')
    assert.deepEqual(p.map(x => x.vencimento), ['2027-01-29', '2027-02-28'])
  })
})

describe('TETO_SUGERIDO', () => {
  test('MEI e Simples têm teto; presumido e real não', () => {
    assert.equal(TETO_SUGERIDO.mei, 81_000)
    assert.equal(TETO_SUGERIDO.simples, 4_800_000)
    assert.equal(TETO_SUGERIDO.presumido, undefined)
    assert.equal(TETO_SUGERIDO.real, undefined)
  })
})
