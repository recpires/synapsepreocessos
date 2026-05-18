'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  type Despesa,
  type DespesaInsert,
  CATEGORIAS,
  FORMAS_PAGAMENTO,
  PRODUTOS_LISTA,
  CATEGORIA_CORES,
} from '@/types/financeiro'

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const TIPO_CORES: Record<string, string> = {
  fixo:     'text-blue-400',
  variavel: 'text-yellow-400',
  pontual:  'text-gray-400',
}

function mesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Stats Card ──────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, alert,
}: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className={`bg-[#111118] border rounded-xl p-5 ${alert ? 'border-amber-700/60' : 'border-[#1e1e2e]'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${alert ? 'text-amber-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Modal Despesa ────────────────────────────────────────────────────────────

const EMPTY_FORM: DespesaInsert = {
  data: new Date().toISOString().split('T')[0],
  descricao: '',
  categoria: 'Infraestrutura',
  produto: 'Geral',
  forma_pagamento: 'Cartão Santander',
  condicao: 'Mensal',
  valor: 0,
  tipo: 'fixo',
  recorrente: false,
  observacao: '',
  created_by: 'painel',
}

function ModalDespesa({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (d: DespesaInsert) => Promise<void>
}) {
  const [form, setForm] = useState<DespesaInsert>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(EMPTY_FORM)
  }, [open])

  if (!open) return null

  const set = (k: keyof DespesaInsert, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const inputCls = `w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2
    text-white text-sm focus:outline-none focus:border-violet-600 transition-colors`

  const labelCls = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
          <h2 className="font-semibold text-white">Nova Despesa</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Data</label>
              <input type="date" value={form.data} onChange={e => set('data', e.target.value)}
                required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Valor (R$)</label>
              <input type="number" step="0.01" min="0" value={form.valor || ''}
                onChange={e => set('valor', parseFloat(e.target.value) || 0)}
                required className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Descrição</label>
            <input type="text" value={form.descricao} onChange={e => set('descricao', e.target.value)}
              placeholder="ex: Supabase, Vercel, Claude AI…" required className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Categoria</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
                className={inputCls}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Produto</label>
              <select value={form.produto} onChange={e => set('produto', e.target.value)}
                className={inputCls}>
                {PRODUTOS_LISTA.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Forma de Pagamento</label>
              <select value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)}
                className={inputCls}>
                {FORMAS_PAGAMENTO.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Condição</label>
              <input type="text" value={form.condicao} onChange={e => set('condicao', e.target.value)}
                placeholder="Mensal, Anual, IOF…" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value as 'fixo' | 'variavel' | 'pontual')}
                className={inputCls}>
                <option value="fixo">Fixo</option>
                <option value="variavel">Variável</option>
                <option value="pontual">Pontual</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.recorrente}
                  onChange={e => set('recorrente', e.target.checked)}
                  className="w-4 h-4 accent-violet-600" />
                <span className="text-sm text-gray-300">Recorrente</span>
              </label>
            </div>
          </div>

          <div>
            <label className={labelCls}>Observação (opcional)</label>
            <input type="text" value={form.observacao || ''} onChange={e => set('observacao', e.target.value)}
              className={inputCls} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#1e1e2e] hover:bg-[#2d2d3d] text-gray-300 font-medium py-2.5 rounded-lg transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page Principal ───────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // Filtros
  const [mesFiltro, setMesFiltro] = useState(mesAtual())
  const [catFiltro, setCatFiltro] = useState('Todas')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [busca, setBusca] = useState('')

  // Carrega dados
  const fetchDespesas = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('despesas')
      .select('*')
      .order('data', { ascending: false })
    setDespesas(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchDespesas()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? '')
    })
  }, [fetchDespesas, supabase])

  // Logout
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Adicionar despesa
  async function handleSave(d: DespesaInsert) {
    await supabase.from('despesas').insert(d)
    setModalOpen(false)
    fetchDespesas()
  }

  // Deletar despesa
  async function handleDelete(id: string) {
    if (!confirm('Excluir esta despesa?')) return
    await supabase.from('despesas').delete().eq('id', id)
    fetchDespesas()
  }

  // Filtra
  const filtradas = despesas.filter(d => {
    const matchMes = mesFiltro === 'todos' || d.data.startsWith(mesFiltro)
    const matchCat = catFiltro === 'Todas' || d.categoria === catFiltro
    const matchTipo = tipoFiltro === 'todos' || d.tipo === tipoFiltro
    const matchBusca = !busca ||
      d.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      d.produto.toLowerCase().includes(busca.toLowerCase())
    return matchMes && matchCat && matchTipo && matchBusca
  })

  // Stats
  const totalFiltrado = filtradas.reduce((s, d) => s + Number(d.valor), 0)
  const totalGeral = despesas.reduce((s, d) => s + Number(d.valor), 0)
  const custoFixoMes = despesas
    .filter(d => d.recorrente && d.data.startsWith(mesAtual()))
    .reduce((s, d) => s + Number(d.valor), 0)
  const maiorDespesa = despesas.reduce(
    (max, d) => Number(d.valor) > Number(max.valor) ? d : max,
    despesas[0] ?? { valor: 0, descricao: '—' } as Despesa
  )
  const supabaseMes = despesas
    .filter(d => d.descricao.toLowerCase().includes('supabase') && d.data.startsWith(mesAtual()))
    .reduce((s, d) => s + Number(d.valor), 0)

  // Meses disponíveis para filtro
  const mesesDisponiveis = Array.from(
    new Set(despesas.map(d => d.data.slice(0, 7)))
  ).sort().reverse()

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-[#1e1e2e] bg-[#111118]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold text-white text-sm">Synapse Code</span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400 text-sm">Financeiro</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-xs hidden sm:block">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Título */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Controle Financeiro</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {despesas.length} registros · total geral {fmt(totalGeral)}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white
              text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Nova despesa
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total no período"
            value={fmt(totalFiltrado)}
            sub={mesFiltro === 'todos' ? 'todos os meses' : MESES[parseInt(mesFiltro.split('-')[1]) - 1]}
          />
          <StatCard
            label="Custo fixo / mês atual"
            value={fmt(custoFixoMes)}
            sub="apenas recorrentes"
          />
          <StatCard
            label="Maior despesa"
            value={fmt(Number(maiorDespesa?.valor ?? 0))}
            sub={maiorDespesa?.descricao ?? '—'}
          />
          <StatCard
            label="Supabase (mês atual)"
            value={fmt(supabaseMes)}
            sub="cresceu 4× em 2 meses"
            alert={supabaseMes > 150}
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={mesFiltro}
            onChange={e => setMesFiltro(e.target.value)}
            className="bg-[#111118] border border-[#2d2d3d] text-sm text-gray-300 rounded-lg px-3 py-2
              focus:outline-none focus:border-violet-600 transition-colors"
          >
            <option value="todos">Todos os meses</option>
            {mesesDisponiveis.map(m => {
              const [ano, mes] = m.split('-')
              return (
                <option key={m} value={m}>
                  {MESES[parseInt(mes) - 1]} {ano}
                </option>
              )
            })}
          </select>

          <select
            value={catFiltro}
            onChange={e => setCatFiltro(e.target.value)}
            className="bg-[#111118] border border-[#2d2d3d] text-sm text-gray-300 rounded-lg px-3 py-2
              focus:outline-none focus:border-violet-600 transition-colors"
          >
            <option value="Todas">Todas as categorias</option>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>

          <select
            value={tipoFiltro}
            onChange={e => setTipoFiltro(e.target.value)}
            className="bg-[#111118] border border-[#2d2d3d] text-sm text-gray-300 rounded-lg px-3 py-2
              focus:outline-none focus:border-violet-600 transition-colors"
          >
            <option value="todos">Todos os tipos</option>
            <option value="fixo">Fixo</option>
            <option value="variavel">Variável</option>
            <option value="pontual">Pontual</option>
          </select>

          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar despesa…"
            className="bg-[#111118] border border-[#2d2d3d] text-sm text-gray-300 rounded-lg px-3 py-2
              focus:outline-none focus:border-violet-600 transition-colors w-48 placeholder-gray-600"
          />

          {(mesFiltro !== mesAtual() || catFiltro !== 'Todas' || tipoFiltro !== 'todos' || busca) && (
            <button
              onClick={() => { setMesFiltro(mesAtual()); setCatFiltro('Todas'); setTipoFiltro('todos'); setBusca('') }}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Limpar filtros
            </button>
          )}

          <span className="ml-auto text-sm text-gray-500">
            {filtradas.length} registros · {fmt(totalFiltrado)}
          </span>
        </div>

        {/* Tabela */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-600">
              Carregando…
            </div>
          ) : filtradas.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-gray-600">
              Nenhuma despesa encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e1e2e]">
                    {['Data', 'Descrição', 'Categoria', 'Produto', 'Forma', 'Tipo', 'Valor', ''].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((d, i) => (
                    <tr
                      key={d.id}
                      className={`border-b border-[#1e1e2e]/60 hover:bg-[#1e1e2e]/40 transition-colors
                        ${i === filtradas.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">
                        {d.descricao}
                        {d.recorrente && (
                          <span className="ml-1.5 text-violet-400 text-xs" title="Recorrente">↺</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORIA_CORES[d.categoria] ?? 'bg-gray-800 text-gray-400'}`}>
                          {d.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{d.produto}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{d.forma_pagamento}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium ${TIPO_CORES[d.tipo] ?? 'text-gray-400'}`}>
                          {d.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-semibold text-white">{fmt(Number(d.valor))}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors text-base"
                          title="Excluir"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <ModalDespesa
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
