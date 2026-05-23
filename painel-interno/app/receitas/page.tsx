'use client'

import { useState, useEffect, useCallback } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'
import SubNav from '@/components/SubNav'
import { SUBNAV } from '@/lib/nav'
import {
  type Receita,
  type ReceitaInsert,
  PRODUTOS_LISTA,
  FORMAS_RECEBIMENTO,
} from '@/types/financeiro'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtData = (d?: string) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

const STATUS_CORES: Record<string, string> = {
  recebido:   'bg-emerald-900/40 text-emerald-300 border border-emerald-800',
  confirmado: 'bg-emerald-900/40 text-emerald-300 border border-emerald-800',
  estornado:  'bg-red-900/40    text-red-300    border border-red-800',
  cancelado:  'bg-gray-800      text-gray-400   border border-gray-700',
}

const STATUS_LABEL: Record<string, string> = {
  recebido:   'Recebido',
  confirmado: 'Confirmado',
  estornado:  'Estornado',
  cancelado:  'Cancelado',
}

const ORIGEM_LABEL: Record<string, string> = {
  manual: '✍️ Manual',
  asaas:  '🔗 Asaas',
}

const formInicial = (): ReceitaInsert => ({
  data: new Date().toISOString().split('T')[0],
  descricao: '',
  produto: 'Geral',
  cliente: '',
  valor: 0,
  tipo: 'pontual',
  forma_pagamento: 'PIX',
  status: 'recebido',
  origem: 'manual',
  observacao: '',
  created_by: 'painel',
})

// ─── Modal: Nova Receita ──────────────────────────────────────────────────────

function ModalReceita({ open, onClose, onSave }: {
  open: boolean
  onClose: () => void
  onSave: (r: ReceitaInsert) => Promise<void>
}) {
  const [form, setForm]   = useState<ReceitaInsert>(formInicial())
  const [saving, setSave] = useState(false)

  useEffect(() => { if (open) setForm(formInicial()) }, [open])
  if (!open) return null

  const set = (k: keyof ReceitaInsert, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSave(true)
    await onSave(form); setSave(false)
  }

  const inp = `w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-white text-sm
    focus:outline-none focus:border-violet-600 transition-colors`
  const lbl = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
          <h2 className="font-semibold text-white">Nova Receita (Manual)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={lbl}>Descrição</label>
              <input type="text" value={form.descricao ?? ''} onChange={e => set('descricao', e.target.value)}
                placeholder="Ex: Mensalidade Nero Pro - Cliente X" required className={inp} />
            </div>
            <div>
              <label className={lbl}>Produto</label>
              <select value={form.produto} onChange={e => set('produto', e.target.value)} className={inp}>
                {PRODUTOS_LISTA.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Valor (R$)</label>
              <input type="number" step="0.01" min="0" value={form.valor || ''}
                onChange={e => set('valor', parseFloat(e.target.value) || 0)}
                placeholder="0,00" required className={inp} />
            </div>
            <div>
              <label className={lbl}>Data</label>
              <input type="date" value={form.data} onChange={e => set('data', e.target.value)} required className={inp} />
            </div>
            <div>
              <label className={lbl}>Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value as ReceitaInsert['tipo'])} className={inp}>
                <option value="pontual">Pontual</option>
                <option value="recorrente">Recorrente</option>
                <option value="setup">Setup</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Forma de pagamento</label>
              <select value={form.forma_pagamento ?? ''} onChange={e => set('forma_pagamento', e.target.value)} className={inp}>
                {FORMAS_RECEBIMENTO.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as ReceitaInsert['status'])} className={inp}>
                <option value="recebido">Recebido</option>
                <option value="confirmado">Confirmado</option>
                <option value="estornado">Estornado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={lbl}>Cliente — opcional</label>
              <input type="text" value={form.cliente ?? ''} onChange={e => set('cliente', e.target.value)}
                placeholder="Nome ou razão social" className={inp} />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Observação — opcional</label>
              <input type="text" value={form.observacao ?? ''} onChange={e => set('observacao', e.target.value)} className={inp} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#1e1e2e] hover:bg-[#2d2d3d] text-gray-300 font-medium py-2.5 rounded-lg transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
              {saving ? 'Salvando…' : 'Salvar Receita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReceitasPage() {
  const supabase = createClient()

  const [receitas, setReceitas]   = useState<Receita[]>([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [busca, setBusca]         = useState('')
  const [produtoF, setProdutoF]   = useState('Todos')
  const [origemF, setOrigemF]     = useState('Todos')
  const [statusF, setStatusF]     = useState('Todos')

  const fetchReceitas = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('receitas')
      .select('*')
      .order('data', { ascending: false })
      .limit(500)
    if (error) console.error('[receitas] fetch:', error)
    setReceitas((data as Receita[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchReceitas() }, [fetchReceitas])

  async function handleSave(r: ReceitaInsert) {
    const { error } = await supabase.from('receitas').insert(r)
    if (error) {
      console.error('[receitas] insert:', error)
      alert(`Erro ao salvar: ${error.message}`)
      return
    }
    setModal(false); fetchReceitas()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta receita?')) return
    const { error } = await supabase.from('receitas').delete().eq('id', id)
    if (error) { alert(`Erro: ${error.message}`); return }
    fetchReceitas()
  }

  // Filtros
  const filtradas = receitas.filter(r => {
    const matchBusca   = !busca || (r.descricao ?? '').toLowerCase().includes(busca.toLowerCase()) ||
                                   (r.cliente   ?? '').toLowerCase().includes(busca.toLowerCase())
    const matchProduto = produtoF === 'Todos' || r.produto === produtoF
    const matchOrigem  = origemF  === 'Todos' || r.origem  === origemF
    const matchStatus  = statusF  === 'Todos' || r.status  === statusF
    return matchBusca && matchProduto && matchOrigem && matchStatus
  })

  // KPIs (só status recebido/confirmado contam para total)
  const valido       = (r: Receita) => r.status === 'recebido' || r.status === 'confirmado'
  const totalMes     = (() => {
    const ym = new Date().toISOString().slice(0, 7)
    return receitas.filter(r => valido(r) && r.data.startsWith(ym))
      .reduce((s, r) => s + Number(r.valor), 0)
  })()
  const totalAno     = (() => {
    const y = new Date().getFullYear().toString()
    return receitas.filter(r => valido(r) && r.data.startsWith(y))
      .reduce((s, r) => s + Number(r.valor), 0)
  })()
  const totalAsaas   = receitas.filter(r => valido(r) && r.origem === 'asaas').reduce((s, r) => s + Number(r.valor), 0)
  const totalManual  = receitas.filter(r => valido(r) && r.origem === 'manual').reduce((s, r) => s + Number(r.valor), 0)

  const sel = `bg-[#111118] border border-[#2d2d3d] text-sm text-gray-300 rounded-lg px-3 py-2
    focus:outline-none focus:border-violet-600 transition-colors`

  return (
    <PainelShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <SubNav tabs={SUBNAV.financeiro} />

        {/* Cabeçalho */}
        <div className="flex items-start sm:items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Receitas</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Recebimentos automáticos via Asaas + lançamentos manuais avulsos.
            </p>
          </div>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Nova Receita
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Mês atual</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400">{fmt(totalMes)}</p>
          </div>
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Ano corrente</p>
            <p className="text-xl sm:text-2xl font-bold text-violet-400">{fmt(totalAno)}</p>
          </div>
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Via Asaas</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-400">{fmt(totalAsaas)}</p>
            <p className="text-[10px] text-gray-600 mt-1">Total acumulado</p>
          </div>
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Manual</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-300">{fmt(totalManual)}</p>
            <p className="text-[10px] text-gray-600 mt-1">Lançamentos avulsos</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar descrição ou cliente…"
            className={`${sel} w-full sm:w-56 placeholder-gray-600`} />
          <select value={produtoF} onChange={e => setProdutoF(e.target.value)} className={sel}>
            <option value="Todos">Todos os produtos</option>
            {PRODUTOS_LISTA.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={origemF} onChange={e => setOrigemF(e.target.value)} className={sel}>
            <option value="Todos">Todas as origens</option>
            <option value="asaas">Asaas</option>
            <option value="manual">Manual</option>
          </select>
          <select value={statusF} onChange={e => setStatusF(e.target.value)} className={sel}>
            <option value="Todos">Todos os status</option>
            <option value="recebido">Recebido</option>
            <option value="confirmado">Confirmado</option>
            <option value="estornado">Estornado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          {(busca || produtoF !== 'Todos' || origemF !== 'Todos' || statusF !== 'Todos') && (
            <button onClick={() => { setBusca(''); setProdutoF('Todos'); setOrigemF('Todos'); setStatusF('Todos') }}
              className="text-xs text-gray-500 hover:text-white transition-colors">Limpar</button>
          )}
          <div className="sm:ml-auto text-sm text-gray-500">
            {filtradas.length} receita{filtradas.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Lista */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-600">Carregando…</div>
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
              <span className="text-4xl">💰</span>
              <p>Nenhuma receita encontrada.</p>
              <p className="text-xs">Configure o webhook do Asaas ou lance manualmente acima.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e1e2e]">
                    {['Data','Descrição','Produto','Cliente','Valor','Forma','Tipo','Status','Origem',''].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((r, i) => (
                    <tr key={r.id}
                      className={`border-b border-[#1e1e2e]/60 hover:bg-[#1e1e2e]/40 transition-colors ${i === filtradas.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtData(r.data)}</td>
                      <td className="px-4 py-3 text-white font-medium max-w-[260px] truncate">{r.descricao || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{r.produto}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate">{r.cliente ?? r.cliente_id ?? '—'}</td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold whitespace-nowrap">{fmt(Number(r.valor))}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.forma_pagamento ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize whitespace-nowrap">{r.tipo}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CORES[r.status] ?? 'bg-gray-800 text-gray-400'}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] text-gray-500">{ORIGEM_LABEL[r.origem] ?? r.origem}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(r.id)} className="text-gray-600 hover:text-red-400 transition-colors text-base">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ModalReceita open={modal} onClose={() => setModal(false)} onSave={handleSave} />
    </PainelShell>
  )
}
