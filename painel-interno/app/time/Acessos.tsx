'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast, confirmar } from '@/components/Feedback'
import {
  criarAcesso, definirEmpresas, alterarAtivo,
  type MembroComAcesso,
} from '@/server/acessos'
import type { Papel } from '@/lib/auth/membro'

const PAPEIS: { valor: Papel; label: string; ajuda: string }[] = [
  { valor: 'dono',       label: 'Dono',       ajuda: 'Tudo, inclusive gerenciar acessos' },
  { valor: 'admin',      label: 'Admin',      ajuda: 'Tudo, inclusive gerenciar acessos' },
  { valor: 'financeiro', label: 'Financeiro', ajuda: 'Lança e edita, sem gerenciar acessos' },
  { valor: 'comercial',  label: 'Comercial',  ajuda: 'Lança e edita, sem gerenciar acessos' },
  { valor: 'leitura',    label: 'Leitura',    ajuda: 'Só consulta' },
]

const campo = `bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-white text-sm
  focus:outline-none focus:border-violet-600 transition-colors`

/**
 * Quem entra no painel e quais empresas cada um enxerga.
 *
 * O isolamento é de verdade — mora na RLS, não neste formulário: um usuário
 * restrito não lê a despesa da outra empresa nem montando a requisição à mão.
 */
export function Acessos({
  inicial, empresas,
}: { inicial: MembroComAcesso[]; empresas: { id: string; nome: string }[] }) {
  const router = useRouter()
  // A lista vem pronta do servidor; o estado local só existe para a marcação
  // de empresa responder no clique, antes do refresh chegar.
  const [membros, setMembros] = useState(inicial)
  const [novo, setNovo] = useState(false)
  const [f, setF] = useState({ nome: '', email: '', papel: 'leitura' as Papel, empresas: [] as string[] })
  const [senhaGerada, setSenhaGerada] = useState<string | null>(null)
  const [salvando, iniciar] = useTransition()

  function alternar(lista: string[], id: string) {
    return lista.includes(id) ? lista.filter(x => x !== id) : [...lista, id]
  }

  function criar(e: React.FormEvent) {
    e.preventDefault()
    iniciar(async () => {
      const r = await criarAcesso(f)
      if (!r.ok) { toast.error(r.error ?? 'Não foi possível criar.'); return }
      if (r.convidado) toast.success(`Convite enviado para ${f.email}.`)
      else {
        setSenhaGerada(r.senhaTemporaria ?? null)
        toast.success('Usuário criado com senha temporária.')
      }
      setF({ nome: '', email: '', papel: 'leitura', empresas: [] })
      setNovo(false)
      router.refresh()
    })
  }

  function trocarEmpresas(m: MembroComAcesso, empresaId: string) {
    const alvo = alternar(m.empresas, empresaId)
    iniciar(async () => {
      const r = await definirEmpresas(m.id, alvo)
      if (r.ok) { setMembros(xs => xs.map(x => x.id === m.id ? { ...x, empresas: alvo } : x)) }
      else toast.error(r.error ?? 'Não foi possível salvar.')
    })
  }

  async function alternarAtivo(m: MembroComAcesso) {
    if (m.ativo) {
      const ok = await confirmar({
        titulo: `Desativar o acesso de ${m.nome}?`,
        mensagem:
          'A pessoa deixa de entrar no painel na hora. O histórico do que ela fez ' +
          'continua no log — desativar não apaga nada.',
        confirmLabel: 'Desativar',
        perigoso: true,
      })
      if (!ok) return
    }
    const r = await alterarAtivo(m.id, !m.ativo)
    if (r.ok) { toast.success(m.ativo ? 'Acesso desativado.' : 'Acesso reativado.'); router.refresh() }
    else toast.error(r.error ?? 'Não foi possível alterar.')
  }

  return (
    <div className="space-y-4">
      {senhaGerada && (
        <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
          <p className="text-sm text-amber-400">
            <strong>Senha temporária:</strong>{' '}
            <code className="rounded bg-black/40 px-2 py-0.5 text-amber-200">{senhaGerada}</code>
          </p>
          <p className="mt-1.5 text-xs text-amber-600/90">
            Aparece uma única vez. O convite por e-mail não saiu — provavelmente o projeto
            não tem SMTP configurado —, então repasse por um canal seguro e peça para
            trocar no primeiro acesso.
          </p>
          <button
            type="button"
            onClick={() => setSenhaGerada(null)}
            className="mt-2 text-xs text-amber-500 hover:underline"
          >
            já anotei, esconder
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {membros.map(m => (
          <li
            key={m.id}
            className={`rounded-xl border border-[#1e1e2e] bg-[#111118] p-4 ${m.ativo ? '' : 'opacity-60'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {m.nome}
                  <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">
                    {PAPEIS.find(p => p.valor === m.papel)?.label ?? m.papel}
                  </span>
                  {!m.ativo && <span className="ml-2 text-[11px] text-red-400">desativado</span>}
                </p>
                <p className="text-xs text-gray-500">{m.email}</p>
              </div>
              <button
                type="button"
                onClick={() => alternarAtivo(m)}
                className="text-xs text-gray-500 transition-colors hover:text-white"
              >
                {m.ativo ? 'desativar' : 'reativar'}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#1e1e2e] pt-3">
              {empresas.map(e => {
                const marcada = m.empresas.includes(e.id)
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => trocarEmpresas(m, e.id)}
                    disabled={salvando}
                    className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                      marcada
                        ? 'bg-violet-600 text-white'
                        : 'bg-[#1a1a24] text-gray-400 hover:text-white'
                    }`}
                  >
                    {e.nome}
                  </button>
                )
              })}
              <span className="text-[11px] text-gray-600">
                {m.empresas.length === 0
                  ? 'nenhuma marcada = vê todas as empresas'
                  : `restrito a ${m.empresas.length} de ${empresas.length}`}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {!novo ? (
        <button
          type="button"
          onClick={() => setNovo(true)}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
        >
          + Novo usuário
        </button>
      ) : (
        <form onSubmit={criar} className="space-y-3 rounded-xl border border-[#1e1e2e] bg-[#111118] p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Nome</label>
              <input required value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })}
                className={`${campo} w-full`} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">E-mail</label>
              <input required type="email" value={f.email}
                onChange={e => setF({ ...f, email: e.target.value })} className={`${campo} w-full`} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Papel</label>
              <select value={f.papel} onChange={e => setF({ ...f, papel: e.target.value as Papel })}
                className={`${campo} w-full`}>
                {PAPEIS.map(p => <option key={p.valor} value={p.valor}>{p.label}</option>)}
              </select>
              <p className="mt-1 text-[11px] text-gray-600">
                {PAPEIS.find(p => p.valor === f.papel)?.ajuda}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-gray-400">Empresas que poderá ver</label>
            <div className="flex flex-wrap items-center gap-2">
              {empresas.map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setF({ ...f, empresas: alternar(f.empresas, e.id) })}
                  className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                    f.empresas.includes(e.id)
                      ? 'bg-violet-600 text-white'
                      : 'bg-[#1a1a24] text-gray-400 hover:text-white'
                  }`}
                >
                  {e.nome}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-gray-600">
              {f.empresas.length === 0
                ? 'Sem nenhuma marcada, a pessoa vê todas as empresas. Marque para restringir.'
                : 'Lançamento sem empresa definida continua visível para todos.'}
            </p>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={salvando}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50">
              {salvando ? 'Criando…' : 'Criar acesso'}
            </button>
            <button type="button" onClick={() => setNovo(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
