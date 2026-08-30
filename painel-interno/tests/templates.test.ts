import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  renderizar, chavesDoTemplate, camposFaltando, type TemplateContrato,
} from '../lib/templates.ts'

/**
 * Renderização de contrato.
 *
 * O filtro `moeda` já errou por dez em produção: `1234.5` virava
 * "R$ 12.345,00" porque o ponto decimal era tratado como separador de milhar.
 * Num contrato assinado isso é o tipo de erro que ninguém desfaz com deploy.
 */

describe('filtro moeda', () => {
  const render = (v: string) => renderizar('{{valor|moeda}}', { valor: v })

  test('decimal com ponto não é multiplicado por dez', () => {
    assert.equal(render('1234.5'), '1.234,50')
  })

  test('formato brasileiro com milhar e vírgula', () => {
    assert.equal(render('1.234,56'), '1.234,56')
  })

  test('inteiro ganha os centavos', () => {
    assert.equal(render('1000'), '1.000,00')
  })

  test('milhão em formato brasileiro', () => {
    assert.equal(render('1.234.567,89'), '1.234.567,89')
  })

  test('zero', () => {
    // Valor vazio depois do trim vira string vazia antes de chegar no filtro.
    assert.equal(render('0'), '0,00')
  })

  test('valor não numérico passa direto, sem virar NaN', () => {
    assert.equal(render('a combinar'), 'a combinar')
  })

  test('negativo mantém o sinal', () => {
    assert.equal(render('-250.5'), '-250,50')
  })
})

describe('filtro data', () => {
  test('ISO vira formato brasileiro', () => {
    assert.equal(renderizar('{{d|data}}', { d: '2026-08-29' }), '29/08/2026')
  })

  test('o que não é ISO passa intacto', () => {
    assert.equal(renderizar('{{d|data}}', { d: '29 de agosto' }), '29 de agosto')
  })
})

describe('renderizar', () => {
  test('escapa HTML do valor', () => {
    // Nome de cliente com script já foi injetado direto no documento antes de
    // o escape existir.
    const r = renderizar('{{nome}}', { nome: '<script>alert(1)</script>' })
    assert.equal(r, '&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  test('escapa aspas, que quebrariam atributo', () => {
    assert.equal(renderizar('{{n}}', { n: 'a"b' }), 'a&quot;b')
  })

  test('chave sem valor vira vazio, não a chave literal', () => {
    assert.equal(renderizar('[{{ausente}}]', {}), '[]')
  })

  test('aceita espaço dentro das chaves', () => {
    assert.equal(renderizar('{{ nome }}', { nome: 'Synapse' }), 'Synapse')
  })

  test('_hoje é preenchido sem vir dos dados', () => {
    const r = renderizar('{{_hoje}}', {})
    assert.match(r, /^\d{2}\/\d{2}\/\d{4}$/)
  })

  test('substitui todas as ocorrências da mesma chave', () => {
    assert.equal(renderizar('{{n}} e {{n}}', { n: 'x' }), 'x e x')
  })
})

describe('chavesDoTemplate', () => {
  test('lista sem repetir e ignora o filtro', () => {
    const ks = chavesDoTemplate('{{a}} {{b|moeda}} {{a}}')
    assert.deepEqual(ks.sort(), ['a', 'b'])
  })
})

describe('camposFaltando', () => {
  const template: TemplateContrato = {
    id: 't',
    nome: 'Teste',
    descricao: null,
    tipo: 'servico',
    conteudo_html: '',
    campos: [
      { key: 'cliente', label: 'Cliente', tipo: 'text' },
      { key: 'valor', label: 'Valor', tipo: 'number' },
    ],
  }

  test('devolve o rótulo do que ficou em branco', () => {
    assert.deepEqual(camposFaltando(template, { cliente: 'Acme' }), ['Valor'])
  })

  test('espaço em branco não conta como preenchido', () => {
    assert.deepEqual(
      camposFaltando(template, { cliente: '   ', valor: '10' }),
      ['Cliente']
    )
  })

  test('tudo preenchido devolve lista vazia', () => {
    assert.deepEqual(camposFaltando(template, { cliente: 'Acme', valor: '10' }), [])
  })
})
