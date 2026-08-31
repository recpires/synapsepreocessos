import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  dinheiro, camposAlterados, nomeDaEmpresa, ENTIDADE_LABEL,
} from '../lib/log-atividade.ts'

/**
 * O log de auditoria do financeiro.
 *
 * Despesa e receita passaram a ser registradas na fase 15; antes as duas
 * tabelas que movem o caixa eram as únicas sem gatilho. O que se testa aqui é
 * se o registro responde a pergunta que faz alguém abrir o histórico: quanto
 * era, quanto virou, de qual empresa.
 */

const de = (v: unknown) => ({ valor: v } as Record<string, unknown>)

describe('valor no log', () => {
  test('update mostra de quanto para quanto', () => {
    assert.equal(
      dinheiro({ entidade: 'despesas', antes: de(99.99), depois: de(129.9) }),
      'R$\u00a099,99 → R$\u00a0129,90'
    )
  })

  test('insert mostra quanto entrou', () => {
    assert.equal(
      dinheiro({ entidade: 'receitas', antes: null, depois: de(1500) }),
      'R$\u00a01.500,00'
    )
  })

  test('delete mostra quanto saiu — é o caso que mais importa', () => {
    // Foi assim que R$ 4.500 do Barber Pro sumiram do resultado sem rastro.
    assert.equal(
      dinheiro({ entidade: 'despesas', antes: de(4500), depois: null }),
      'R$\u00a04.500,00'
    )
  })

  test('entidade não financeira não inventa valor', () => {
    assert.equal(dinheiro({ entidade: 'projetos', antes: de(10), depois: de(20) }), null)
  })

  test('update que não tocou no valor não mostra número', () => {
    assert.equal(
      dinheiro({ entidade: 'despesas', antes: { categoria: 'a' }, depois: { categoria: 'b' } }),
      null
    )
  })

  test('numérico vindo como string do jsonb ainda é lido', () => {
    // O Postgres serializa `numeric` como string em alguns caminhos.
    assert.equal(dinheiro({ entidade: 'dividas', antes: null, depois: de('316.03') }), 'R$\u00a0316,03')
  })

  test('valor ausente não vira R$ 0,00', () => {
    assert.equal(dinheiro({ entidade: 'despesas', antes: null, depois: de(null) }), null)
    assert.equal(dinheiro({ entidade: 'despesas', antes: null, depois: de('') }), null)
  })
})

describe('campos alterados', () => {
  test('não repete "valor" quando o número já está na linha', () => {
    const a = { acao: 'update' as const, depois: { valor: 10, categoria: 'x' } }
    assert.equal(camposAlterados(a, true), 'categoria')
  })

  test('mantém "valor" quando o número não foi exibido', () => {
    const a = { acao: 'update' as const, depois: { valor: 10, categoria: 'x' } }
    assert.equal(camposAlterados(a, false), 'valor, categoria')
  })

  test('resume a partir de cinco campos', () => {
    const depois = Object.fromEntries('abcdef'.split('').map(k => [k, 1]))
    assert.equal(camposAlterados({ acao: 'update', depois }, false), 'a, b, c, d e mais 2')
  })

  test('insert não lista campos — a linha inteira mudou', () => {
    assert.equal(camposAlterados({ acao: 'insert', depois: { valor: 1 } }, false), null)
  })

  test('update sem nada além do id não vira texto vazio', () => {
    assert.equal(camposAlterados({ acao: 'update', depois: { id: 'x' } }, false), null)
  })
})

describe('empresa dona da linha', () => {
  const emp = { nome_fantasia: 'Synapse Code', razao_social: 'SYNAPSE CODE - SOFTWARE HOUSE LTDA' }

  test('aceita o embed como objeto — é o que o PostgREST devolve', () => {
    assert.equal(nomeDaEmpresa(emp), 'Synapse Code')
  })

  test('aceita o embed como lista — é o que o tipo gerado declara', () => {
    assert.equal(nomeDaEmpresa([emp]), 'Synapse Code')
  })

  test('cai na razão social quando não há nome fantasia', () => {
    assert.equal(
      nomeDaEmpresa({ nome_fantasia: null, razao_social: '52.676.239 HENRIQUE DE MOURA OLIVEIRA' }),
      '52.676.239 HENRIQUE DE MOURA OLIVEIRA'
    )
  })

  test('linha sem empresa não quebra — aparece para todos por decisão', () => {
    assert.equal(nomeDaEmpresa(null), undefined)
    assert.equal(nomeDaEmpresa([]), undefined)
  })
})

describe('rótulos', () => {
  test('toda tabela auditada tem nome em português', () => {
    const auditadas = [
      'despesas', 'receitas', 'dividas', 'divida_parcelas', 'notas_fiscais',
      'impostos', 'contas_bancarias', 'socios', 'membro_empresas', 'empresas',
      'contratos', 'propostas', 'proposta_itens', 'sites', 'membros',
      'contrato_templates', 'rateio_regras', 'projeto_erros', 'projetos',
    ]
    const sem = auditadas.filter(t => !ENTIDADE_LABEL[t])
    assert.deepEqual(sem, [], `sem rótulo: ${sem.join(', ')}`)
  })
})
