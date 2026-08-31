import { test, describe, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

/**
 * Fila de previsões vencidas.
 *
 * O risco desta tela é confirmar em massa o que não foi pago: quando nada está
 * marcado, a ação vale para TODAS. É comportamento deliberado — o caso comum é
 * confirmar o mês inteiro —, mas se a seleção parasse de ser respeitada,
 * ninguém notaria olhando a tela, e cada confirmação errada entra direto no
 * resultado.
 */

/** Registra o que a action recebeu, sem tocar em banco. */
const chamadas: { ids: string[]; acao: string }[] = []

mock.module('@/server/financeiro', {
  namedExports: {
    resolverPendencias: async (itens: { id: string; tipo: string }[], acao: string) => {
      chamadas.push({ ids: itens.map(i => i.id), acao })
      return { ok: true, linhas: itens.length }
    },
  },
})

mock.module('next/navigation', {
  namedExports: { useRouter: () => ({ refresh: () => {} }) },
})

// `confirmar` abre modal e devolve promessa; no teste responde sempre sim.
mock.module('@/components/Feedback', {
  namedExports: {
    toast: { success: () => {}, error: () => {}, info: () => {} },
    confirmar: async () => true,
  },
})

// Carregado depois dos mocks e sem `await` no topo: o loader compila para CJS,
// onde top-level await não existe.
type Pendencia = {
  id: string; data: string; descricao: string; categoria: string
  valor: number; tipo: 'despesa' | 'receita'
}
let AConfirmar: (p: { pendencias: Pendencia[] }) => React.ReactElement | null

before(async () => {
  ;({ AConfirmar } = await import('../app/financeiro/AConfirmar.tsx'))
})

const PENDENCIAS: Pendencia[] = [
  { id: 'a', data: '2026-08-01', descricao: 'Supabase', categoria: 'Infraestrutura', valor: 100, tipo: 'despesa' },
  { id: 'b', data: '2026-08-05', descricao: 'ManyChat', categoria: 'Ferramentas', valor: 200, tipo: 'despesa' },
  { id: 'c', data: '2026-08-10', descricao: 'Mensalidade Nero', categoria: 'Mensalidade', valor: 300, tipo: 'receita' },
]

describe('AConfirmar', () => {
  beforeEach(() => { cleanup(); chamadas.length = 0 })

  test('não renderiza nada quando a fila está vazia', () => {
    const { container } = render(<AConfirmar pendencias={[]} />)
    assert.equal(container.textContent, '')
  })

  test('mostra a contagem e o total', () => {
    render(<AConfirmar pendencias={PENDENCIAS} />)
    const cabecalho = screen.getByText(/venceram sem confirmação/).textContent!
    assert.match(cabecalho, /3 previsão/)
    // Saída e entrada somam separado: R$ 300 a pagar e R$ 300 a receber.
    assert.match(cabecalho, /300,00 a pagar/)
    assert.match(cabecalho, /300,00 a receber/)
  })

  test('sem nada marcado, confirma todas', async () => {
    render(<AConfirmar pendencias={PENDENCIAS} />)
    fireEvent.click(screen.getByText(/Confirmar todas/))
    await new Promise(r => setTimeout(r, 0))
    assert.deepEqual(chamadas, [{ ids: ['a', 'b', 'c'], acao: 'confirmar' }])
  })

  test('com seleção, confirma só as marcadas', async () => {
    render(<AConfirmar pendencias={PENDENCIAS} />)
    const caixas = screen.getAllByRole('checkbox')
    fireEvent.click(caixas[0])
    fireEvent.click(caixas[2])
    fireEvent.click(screen.getByText(/Confirmar 2 selecionada/))
    await new Promise(r => setTimeout(r, 0))
    assert.deepEqual(chamadas, [{ ids: ['a', 'c'], acao: 'confirmar' }])
  })

  test('desmarcar volta a valer para todas', async () => {
    render(<AConfirmar pendencias={PENDENCIAS} />)
    const caixas = screen.getAllByRole('checkbox')
    fireEvent.click(caixas[1])
    fireEvent.click(caixas[1])
    fireEvent.click(screen.getByText(/Confirmar todas/))
    await new Promise(r => setTimeout(r, 0))
    assert.deepEqual(chamadas[0].ids, ['a', 'b', 'c'])
  })

  test('apagar manda a ação certa, não confirmar', async () => {
    render(<AConfirmar pendencias={PENDENCIAS} />)
    fireEvent.click(screen.getByText(/Apagar todas/))
    await new Promise(r => setTimeout(r, 0))
    assert.equal(chamadas.length, 1)
    assert.equal(chamadas[0].acao, 'apagar')
  })

  test('lista longa é truncada mas a ação continua valendo para tudo', async () => {
    const muitas = Array.from({ length: 20 }, (_, i) => ({
      id: `x${i}`, data: '2026-08-01', descricao: `Item ${i}`,
      categoria: 'Outros', valor: 10, tipo: 'despesa' as const,
    }))
    render(<AConfirmar pendencias={muitas} />)
    assert.equal(screen.getAllByRole('checkbox').length, 12)
    assert.ok(screen.getByText(/e mais 8/))

    fireEvent.click(screen.getByText(/Confirmar todas/))
    await new Promise(r => setTimeout(r, 0))
    assert.equal(chamadas[0].ids.length, 20)
  })
})
