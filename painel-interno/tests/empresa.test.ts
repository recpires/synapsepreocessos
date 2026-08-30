import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { porEmpresa } from '../lib/filtro-empresa.ts'
import { estaPausado, FASES_KANBAN, FASES_FORA_DO_QUADRO } from '../types/projetos.ts'

/**
 * Recorte por empresa e classificação de pausa.
 *
 * As duas regras que, erradas, produzem número plausível: um filtro que não
 * filtra soma dois CNPJs sem dizer, e uma pausa mal classificada enche o
 * resumo semanal de alarme falso.
 */

describe('porEmpresa', () => {
  /** Dublê com a mesma forma do builder do PostgREST: `.eq` devolve ele mesmo. */
  function builder() {
    const chamadas: [string, string][] = []
    const q = {
      chamadas,
      eq(coluna: string, valor: string) {
        chamadas.push([coluna, valor])
        return q
      },
    }
    return q
  }

  test('sem empresa, devolve a query intacta', () => {
    const q = builder()
    const r = porEmpresa(q, undefined)
    assert.equal(r, q)
    assert.equal(q.chamadas.length, 0)
  })

  test('string vazia também não filtra', () => {
    // O seletor manda '' quando o usuário escolhe "Todas".
    const q = builder()
    porEmpresa(q, '')
    assert.equal(q.chamadas.length, 0)
  })

  test('com empresa, aplica eq na coluna certa', () => {
    const q = builder()
    porEmpresa(q, 'abc-123')
    assert.deepEqual(q.chamadas, [['empresa_id', 'abc-123']])
  })

  test('devolve a mesma query, para seguir encadeando', () => {
    const q = builder()
    assert.equal(porEmpresa(q, 'abc-123'), q)
  })
})

describe('estaPausado', () => {
  test('fase pausado conta como pausa', () => {
    assert.equal(estaPausado({ fase_atual: 'pausado' }), true)
  })

  test('encerrado também sai das contas de risco', () => {
    assert.equal(estaPausado({ fase_atual: 'encerrado' }), true)
  })

  test('produto desligado pausa o projeto sem mudar a fase', () => {
    assert.equal(
      estaPausado({ fase_atual: 'desenvolvimento', produto_pausado: true }),
      true
    )
  })

  test('projeto ativo não é pausado', () => {
    assert.equal(
      estaPausado({ fase_atual: 'desenvolvimento', produto_pausado: false }),
      false
    )
  })

  test('sem informação de produto, decide só pela fase', () => {
    assert.equal(estaPausado({ fase_atual: 'operacao' }), false)
  })
})

describe('fases do kanban', () => {
  test('pausado e encerrado não são coluna', () => {
    assert.equal(FASES_KANBAN.includes('pausado'), false)
    assert.equal(FASES_KANBAN.includes('encerrado'), false)
  })

  test('mas têm lugar na faixa, senão o card desaparece', () => {
    assert.deepEqual(FASES_FORA_DO_QUADRO, ['pausado', 'encerrado'])
  })

  test('nenhuma fase aparece nos dois lugares', () => {
    const repetida = FASES_KANBAN.filter(f => FASES_FORA_DO_QUADRO.includes(f))
    assert.deepEqual(repetida, [])
  })
})
