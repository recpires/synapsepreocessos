import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { foraDaJanela, rangePeriodo } from '../lib/filtros.ts'

/**
 * O que a janela de datas esconde.
 *
 * Três séries de Supabase viviam inteiras em 2027, somando R$ 869,11 por mês
 * de projeção duplicada. Quem foi caçar duplicata na tela de despesas com o
 * filtro padrão ("Este ano") não viu nenhuma, e concluiu — corretamente, sobre
 * o que via — que estava limpo.
 */

const linha = (data: string, valor: number) => ({ data, valor })

describe('lançamentos fora do período', () => {
  const de = '2026-01-01', ate = '2026-12-31'

  test('conta o que está depois da janela, que é o caso do Supabase', () => {
    const r = foraDaJanela([
      linha('2026-08-28', 409.68),
      linha('2027-01-28', 316.03),
      linha('2027-02-28', 316.03),
    ], de, ate)
    assert.equal(r.depois, 2)
    assert.equal(r.antes, 0)
    assert.equal(r.total, 632.06)
  })

  test('conta o que está antes, sem misturar com o que está depois', () => {
    const r = foraDaJanela([
      linha('2025-12-31', 100),
      linha('2026-06-01', 50),
      linha('2027-01-01', 200),
    ], de, ate)
    assert.deepEqual([r.antes, r.depois, r.total], [1, 1, 300])
  })

  test('nada fora da janela não vira aviso', () => {
    const r = foraDaJanela([linha('2026-03-01', 10)], de, ate)
    assert.deepEqual([r.antes, r.depois, r.total], [0, 0, 0])
  })

  test('as bordas pertencem à janela', () => {
    const r = foraDaJanela([linha(de, 1), linha(ate, 1)], de, ate)
    assert.equal(r.antes + r.depois, 0)
  })

  test('valor vindo como string do Postgres ainda soma', () => {
    const r = foraDaJanela([{ data: '2027-01-01', valor: '316.03' }], de, ate)
    assert.equal(r.total, 316.03)
  })

  test('lista vazia não quebra', () => {
    assert.deepEqual(foraDaJanela([], de, ate), { antes: 0, depois: 0, total: 0 })
  })

  test('"Todo o período" não esconde nada — é o destino do botão', () => {
    const { de: d, ate: a } = rangePeriodo('tudo')
    const r = foraDaJanela([linha('1999-01-01', 1), linha('2050-01-01', 1)], d, a)
    assert.equal(r.antes + r.depois, 0)
  })
})

describe('a janela padrão realmente corta o ano seguinte', () => {
  test('"Este ano" termina em 31/12 e deixa 2027 de fora', () => {
    const { de, ate } = rangePeriodo('ano-atual')
    assert.ok(ate.endsWith('-12-31'), ate)
    const r = foraDaJanela([{ data: `${Number(ate.slice(0, 4)) + 1}-01-28`, valor: 316.03 }], de, ate)
    assert.equal(r.depois, 1)
  })
})
