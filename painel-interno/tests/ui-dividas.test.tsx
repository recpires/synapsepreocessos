import { test, describe, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import type { DividaResumo, Parcela, EmpresaPropria } from '../types/empresa-financeiro.ts'

/**
 * Dívidas: criar o carnê e baixar parcela.
 *
 * Dois riscos aqui. O primeiro é a prévia do carnê mentir — ela usa a mesma
 * função que grava, então divergir significa que alguém trocou uma das duas. O
 * segundo é baixar a parcela errada: cada baixa lança uma despesa de verdade, e
 * pagar a de outro mês desalinha o saldo devedor em silêncio.
 */

const pagas: { parcela_id: string; valor_pago: number; lancar_despesa: boolean }[] = []
const criadas: { credor: string; parcelas_total: number; valor_total: number }[] = []

mock.module('@/server/empresa-financeiro', {
  namedExports: {
    criarDivida: async (d: { credor: string; parcelas_total: number; valor_total: number }) => {
      criadas.push({ credor: d.credor, parcelas_total: d.parcelas_total, valor_total: d.valor_total })
      return { ok: true, id: 'nova' }
    },
    pagarParcela: async (d: { parcela_id: string; valor_pago: number; lancar_despesa: boolean }) => {
      pagas.push(d)
      return { ok: true }
    },
    alterarStatusDivida: async () => ({ ok: true }),
  },
})

mock.module('@/components/Feedback', {
  namedExports: {
    toast: { success: () => {}, error: () => {}, info: () => {} },
    confirmar: async () => true,
  },
})

type Props = {
  empresas: EmpresaPropria[]
  dividas: DividaResumo[]
  parcelas: Parcela[]
}
let Dividas: (p: Props) => React.ReactElement

before(async () => {
  ;({ Dividas } = await import('../app/financeiro/dividas/Dividas.tsx'))
})

const EMPRESA = {
  id: 'e1', razao_social: 'Synapse Code', nome_fantasia: 'Synapse',
  cnpj: null, regime_tributario: null, teto_faturamento: null,
  abertura: null, ativa: true,
} as EmpresaPropria

const DIVIDA = {
  id: 'd1', empresa_id: 'e1', tipo: 'financiamento', credor: 'Banco A',
  descricao: null, documento: null, valor_principal: 900, valor_total: 1200,
  taxa_juros_mes: null, parcelas_total: 3, data_contratacao: '2026-01-10',
  status: 'ativa', observacao: null, empresa_nome: 'Synapse',
  saldo_devedor: 800, total_pago: 400, parcelas_abertas: 2,
  parcelas_atrasadas: 1, proximo_vencimento: '2026-02-10',
} as DividaResumo

const PARCELAS = [
  { id: 'p1', divida_id: 'd1', numero: 1, vencimento: '2026-01-10', valor: 400,
    pago_em: '2026-01-10', valor_pago: 400, despesa_id: null, observacao: null },
  { id: 'p2', divida_id: 'd1', numero: 2, vencimento: '2026-02-10', valor: 400,
    pago_em: null, valor_pago: null, despesa_id: null, observacao: null },
  { id: 'p3', divida_id: 'd1', numero: 3, vencimento: '2026-03-10', valor: 400,
    pago_em: null, valor_pago: null, despesa_id: null, observacao: null },
] as Parcela[]

describe('Dividas', () => {
  beforeEach(() => { cleanup(); pagas.length = 0; criadas.length = 0 })

  test('sem empresa própria, orienta em vez de deixar lançar', () => {
    render(<Dividas empresas={[]} dividas={[]} parcelas={[]} />)
    assert.ok(screen.getByText(/Toda dívida pertence a um CNPJ/))
  })

  test('mostra saldo, atraso e proporção de parcelas abertas', () => {
    render(<Dividas empresas={[EMPRESA]} dividas={[DIVIDA]} parcelas={PARCELAS} />)
    assert.ok(screen.getByText('Banco A'))
    assert.ok(screen.getByText(/1 atrasada/))
    assert.ok(screen.getByText(/2\/3 em aberto/))
  })

  test('parcela já paga não oferece pagar de novo', () => {
    render(<Dividas empresas={[EMPRESA]} dividas={[DIVIDA]} parcelas={PARCELAS} />)
    fireEvent.click(screen.getByText('ver parcelas'))
    // Três parcelas, uma paga: só duas podem ser pagas.
    assert.equal(screen.getAllByText('pagar').length, 2)
    assert.ok(screen.getByText(/pago em 10\/01\/2026/))
  })

  test('paga a parcela clicada, com o valor dela', async () => {
    render(<Dividas empresas={[EMPRESA]} dividas={[DIVIDA]} parcelas={PARCELAS} />)
    fireEvent.click(screen.getByText('ver parcelas'))
    fireEvent.click(screen.getAllByText('pagar')[1])   // a terceira parcela
    await new Promise(r => setTimeout(r, 0))

    assert.equal(pagas.length, 1)
    assert.equal(pagas[0].parcela_id, 'p3')
    assert.equal(pagas[0].valor_pago, 400)
    // Baixar sem lançar a despesa deixaria o dinheiro sumir do DRE.
    assert.equal(pagas[0].lancar_despesa, true)
  })

  test('a prévia do carnê usa a mesma conta que grava', () => {
    render(<Dividas empresas={[EMPRESA]} dividas={[]} parcelas={[]} />)
    fireEvent.click(screen.getByText('Lançar dívida'))

    fireEvent.change(screen.getByLabelText('Total a pagar'), { target: { value: '1000' } })
    fireEvent.change(screen.getByLabelText('Parcelas'), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText('1º vencimento'), { target: { value: '2026-09-10' } })

    const previa = screen.getByText(/12 parcela\(s\) de/)
    // Onze de 83,33 e a última de 83,37 — a sobra tem de aparecer na tela.
    assert.match(previa.textContent!, /83,33/)
    assert.match(previa.textContent!, /83,37/)
    assert.match(previa.textContent!, /10\/09\/2026/)
  })

  test('criar manda os valores digitados, sem arredondar no caminho', async () => {
    const { container } = render(<Dividas empresas={[EMPRESA]} dividas={[]} parcelas={[]} />)
    fireEvent.click(screen.getByText('Lançar dívida'))

    fireEvent.change(screen.getByLabelText('Credor'), { target: { value: 'Banco Z' } })
    fireEvent.change(screen.getByLabelText('Total a pagar'), { target: { value: '1234.56' } })
    fireEvent.change(screen.getByLabelText('Parcelas'), { target: { value: '3' } })

    // `submit` no formulário, e não clique no botão: o happy-dom não propaga o
    // clique do submit para o form. Limitação do harness, não do componente.
    fireEvent.submit(container.querySelector('form')!)
    await new Promise(r => setTimeout(r, 0))

    assert.deepEqual(criadas, [{ credor: 'Banco Z', parcelas_total: 3, valor_total: 1234.56 }])
  })
})
