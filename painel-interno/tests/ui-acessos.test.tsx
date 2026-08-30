import { test, describe, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import type { MembroComAcesso } from '../server/acessos.ts'

/**
 * Acesso por empresa.
 *
 * A regra que mais confunde é a inversa do que a tela sugere: nenhuma empresa
 * marcada significa acesso a TODAS, não a nenhuma. Se o texto ou a marcação
 * saírem de sincronia com essa regra, alguém concede acesso total achando que
 * está restringindo — e o erro não aparece até o dado vazar.
 */

const definidas: { membroId: string; empresas: string[] }[] = []

mock.module('@/server/acessos', {
  namedExports: {
    criarAcesso: async () => ({ ok: true, convidado: true }),
    definirEmpresas: async (membroId: string, empresas: string[]) => {
      definidas.push({ membroId, empresas })
      return { ok: true }
    },
    alterarAtivo: async () => ({ ok: true }),
  },
})

mock.module('next/navigation', {
  namedExports: { useRouter: () => ({ refresh: () => {} }) },
})

mock.module('@/components/Feedback', {
  namedExports: {
    toast: { success: () => {}, error: () => {}, info: () => {} },
    confirmar: async () => true,
  },
})

type Props = {
  inicial: MembroComAcesso[]
  empresas: { id: string; nome: string }[]
}
let Acessos: (p: Props) => React.ReactElement

before(async () => {
  ;({ Acessos } = await import('../app/time/Acessos.tsx'))
})

const EMPRESAS = [
  { id: 'e1', nome: 'Synapse' },
  { id: 'e2', nome: 'Segunda' },
]

const IRRESTRITO: MembroComAcesso = {
  id: 'm1', nome: 'Rodrigo', email: 'r@x.com', papel: 'dono', ativo: true, empresas: [],
}
const RESTRITO: MembroComAcesso = {
  id: 'm2', nome: 'Henrique', email: 'h@x.com', papel: 'leitura', ativo: true, empresas: ['e2'],
}

describe('Acessos', () => {
  beforeEach(() => { cleanup(); definidas.length = 0 })

  test('sem empresa marcada, a tela diz que vê todas', () => {
    render(<Acessos inicial={[IRRESTRITO]} empresas={EMPRESAS} />)
    assert.ok(screen.getByText(/nenhuma marcada = vê todas as empresas/))
  })

  test('com empresa marcada, a tela diz de quantas está restrito', () => {
    render(<Acessos inicial={[RESTRITO]} empresas={EMPRESAS} />)
    assert.ok(screen.getByText(/restrito a 1 de 2/))
  })

  test('marcar uma empresa envia a lista com ela', async () => {
    render(<Acessos inicial={[IRRESTRITO]} empresas={EMPRESAS} />)
    fireEvent.click(screen.getByText('Segunda'))
    await new Promise(r => setTimeout(r, 0))
    assert.deepEqual(definidas, [{ membroId: 'm1', empresas: ['e2'] }])
  })

  test('desmarcar a última devolve acesso total, e não lista vazia por engano', async () => {
    render(<Acessos inicial={[RESTRITO]} empresas={EMPRESAS} />)
    fireEvent.click(screen.getByText('Segunda'))   // já estava marcada
    await new Promise(r => setTimeout(r, 0))
    assert.deepEqual(definidas, [{ membroId: 'm2', empresas: [] }])
  })

  test('marcar a segunda acumula em vez de trocar', async () => {
    render(<Acessos inicial={[RESTRITO]} empresas={EMPRESAS} />)
    fireEvent.click(screen.getByText('Synapse'))
    await new Promise(r => setTimeout(r, 0))
    assert.deepEqual(definidas[0].empresas.sort(), ['e1', 'e2'])
  })

  test('membro desativado aparece marcado como tal', () => {
    render(
      <Acessos inicial={[{ ...RESTRITO, ativo: false }]} empresas={EMPRESAS} />
    )
    assert.ok(screen.getByText('desativado'))
    assert.ok(screen.getByText('reativar'))
  })

  test('o formulário novo avisa que sem marcação o acesso é total', () => {
    render(<Acessos inicial={[IRRESTRITO]} empresas={EMPRESAS} />)
    fireEvent.click(screen.getByText('+ Novo usuário'))
    assert.ok(screen.getByText(/Sem nenhuma marcada, a pessoa vê todas as empresas/))
  })
})
