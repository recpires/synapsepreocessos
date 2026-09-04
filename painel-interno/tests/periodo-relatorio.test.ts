import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  periodoDoMes, periodoDoAno, periodoPadrao, mesDoPeriodo, mesAtual, deslocarMesRotulo,
} from '../lib/periodo-relatorio.ts'

/**
 * Período do relatório financeiro.
 *
 * O intervalo é meio-aberto — `inicio` entra, `fim` não —, então o teste que
 * mais importa é o da borda: um lançamento do dia 1º pertence a um mês só.
 */

describe('período de um mês', () => {
  test('setembro vai do dia 1 ao dia 1 de outubro', () => {
    assert.deepEqual(periodoDoMes('2026-09'), { inicio: '2026-09-01', fim: '2026-10-01' })
  })

  test('dezembro atravessa o ano em vez de virar mês 13', () => {
    // O padrão antigo montava `${ano}-${mes + 2}` e produzia "2026-13-01",
    // data que o Postgres recusa: o relatório quebrava em dezembro.
    assert.deepEqual(periodoDoMes('2026-12'), { inicio: '2026-12-01', fim: '2027-01-01' })
  })

  test('janeiro não volta para o ano anterior', () => {
    assert.deepEqual(periodoDoMes('2026-01'), { inicio: '2026-01-01', fim: '2026-02-01' })
  })

  test('fevereiro de ano bissexto não precisa saber quantos dias tem', () => {
    assert.deepEqual(periodoDoMes('2028-02'), { inicio: '2028-02-01', fim: '2028-03-01' })
  })

  test('mês fora de 1..12 é recusado em vez de gerar data torta', () => {
    assert.throws(() => periodoDoMes('2026-13'), RangeError)
    assert.throws(() => periodoDoMes('2026-00'), RangeError)
    assert.throws(() => periodoDoMes('abacaxi'), RangeError)
  })
})

describe('período do ano', () => {
  test('vai de 1º de janeiro a 1º de janeiro seguinte', () => {
    assert.deepEqual(periodoDoAno(2026), { inicio: '2026-01-01', fim: '2027-01-01' })
  })
})

describe('período padrão', () => {
  test('do começo do ano ao fim do mês corrente', () => {
    assert.deepEqual(periodoPadrao(new Date(2026, 8, 3)), { inicio: '2026-01-01', fim: '2026-10-01' })
  })

  test('em dezembro o fim cai em janeiro do ano seguinte', () => {
    assert.deepEqual(periodoPadrao(new Date(2026, 11, 20)), { inicio: '2026-01-01', fim: '2027-01-01' })
  })

  test('não vai até 31/12: projeção do cron não entra como gasto', () => {
    const p = periodoPadrao(new Date(2026, 2, 15))
    assert.equal(p.fim, '2026-04-01')
  })
})

describe('ler o período de volta como mês', () => {
  test('um mês exato devolve YYYY-MM', () => {
    assert.equal(mesDoPeriodo({ inicio: '2026-09-01', fim: '2026-10-01' }), '2026-09')
  })

  test('a virada do ano também', () => {
    assert.equal(mesDoPeriodo({ inicio: '2026-12-01', fim: '2027-01-01' }), '2026-12')
  })

  test('o ano inteiro não é mês nenhum', () => {
    assert.equal(mesDoPeriodo({ inicio: '2026-01-01', fim: '2027-01-01' }), null)
  })

  test('intervalo que não começa no dia 1 não é mês', () => {
    assert.equal(mesDoPeriodo({ inicio: '2026-09-15', fim: '2026-10-15' }), null)
  })

  test('ida e volta preserva o mês', () => {
    for (const m of ['2026-01', '2026-06', '2026-12', '2027-02']) {
      assert.equal(mesDoPeriodo(periodoDoMes(m)), m)
    }
  })
})

describe('navegação por mês', () => {
  test('a seta para trás atravessa a virada do ano', () => {
    assert.equal(deslocarMesRotulo('2026-01', -1), '2025-12')
  })
  test('a seta para frente também', () => {
    assert.equal(deslocarMesRotulo('2026-12', 1), '2027-01')
  })
  test('doze passos dão uma volta completa', () => {
    assert.equal(deslocarMesRotulo('2026-05', 12), '2027-05')
  })
  test('mês atual sai com dois dígitos', () => {
    assert.equal(mesAtual(new Date(2026, 0, 9)), '2026-01')
  })
})
