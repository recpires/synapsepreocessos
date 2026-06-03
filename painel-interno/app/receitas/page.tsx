'use client'

import { useState, useEffect, useCallback } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'
import SubNav from '@/components/SubNav'
import { toast, confirmar } from '@/components/Feedback'
import { SUBNAV } from '@/lib/nav'
import {
  type Receita,
  type ReceitaInsert,
  PRODUTOS_LISTA,
  FORMAS_RECEBIMENTO,
  CATEGORIAS_RECEITA,
} from '@/types/financeiro'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtData = (d?: string) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

const PERIODICIDADES = ['Mensal', 'Quinzenal', 'Semanal', 'Anual'] as const

function addPeriodo(dataISO: string, periodicidade: string, n: number): string {
  const [y, m, d] = dataISO.split('-').map(Number)
  if (periodicidade === 'Semanal' || periodicidade === 'Quinzenal') {
    const dias = (periodicidade === 'Semanal' ? 7 : 15) * n
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + dias)
    return dt.toISOString().slice(0, 10)
  }
  const passoMeses = periodicidade === 'Anual' ? 12 : 1
  const totalMeses = (m - 1) + passoMeses * n
  const novoAno = y + Math.floor(totalMeses / 12)
  const novoMes = totalMeses % 12
  const ultimoDia = new Date(Date.UTC(novoAno, novoMes + 1, 0)).getUTCDate()
  const dia = Math.min(d, ultimoDia)
  return `${novoAno}-${String(novoMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

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
  categoria: 'Mensalidade',
  produto: 'Geral',
  cliente: '',
  valor: 0,
  tipo: 'pontual',
  forma_pagamento: 'PIX',
  status: 'recebido',
  origem: 'manual',
  observacao: '',
  recorrente: false,
  periodicidade: undefined,
  created_by: 'painel',
})

// ─── Modal: Nova Receita ──────────────────────────────────────────────────────

function receitaToForm(r: Receita): ReceitaInsert {
  return {
    data: r.data,
    descricao: r.descricao,
    categoria: r.categoria,
    produto: r.produto,
    cliente: r.cliente,
    cliente_id: r.cliente_id,
    valor: r.valor,
    tipo: r.tipo,
    forma_pagamento: r.forma_pagamento,
    status: r.status,
    origem: r.origem,
    origem_id: r.origem_id,
    observacao: r.observacao,
    payload_raw: r.payload_raw,
    recorrente: r.recorrente,
    periodicidade: r.periodicidade,
    created_by: r.created_by,
  }
}

function ModalReceita({ open, editing, onClose, onSave }: {
  open: boolean
  editing: Receita | null
  onClose: () => void
  onSave: (r: ReceitaInsert, id?: string) => Promise<void>
}) {
  const [form, setForm]   = useState<ReceitaInsert>(formInicial())
  const [saving, setSave] = useState(false)
  const [parcelaModo, setParcelaModo] = useState<'continuo' | 'parcelado'>('continuo')
  const [parcelaQtd, setParcelaQtd]   = useState(12)

  useEffect(() => {
    if (open) {
      setForm(editing ? receitaToForm(editing) : formInicial())
      setParcelaModo(editing?.parcela_total ? 'parcelado' : 'continuo')
      setParcelaQtd(editing?.parcela_total ?? 12)
    }
  }, [open, editing])
  if (!open) return null

  const set = (k: keyof ReceitaInsert, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSave(true)
    const payload: ReceitaInsert = { ...form }
    if (!editing && form.recorrente) {
      payload.parcela_total = parcelaModo === 'parcelado' ? parcelaQtd : null
    }
    await onSave(payload, editing?.id); setSave(false)
  }

  const isAsaas = editing?.origem === 'asaas'
  const isSerie = !!editing?.serie_id

  const inp = `w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-white text-sm
    focus:outline-none focus:border-violet-600 transition-colors`
  const lbl = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
          <h2 className="font-semibold text-white">{editing ? 'Editar Receita' : 'Nova Receita (Manual)'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {isAsaas && (
            <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-2 text-xs text-amber-300">
              ⚠️ Receita originada do Asaas. Editar manualmente não altera a cobrança no gateway.
            </div>
          )}
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
              <label className={lbl}>Categoria</label>
              <select value={form.categoria ?? 'Mensalidade'} onChange={e => set('categoria', e.target.value)} className={inp}>
                {CATEGORIAS_RECEITA.map(c => <option key={c}>{c}</option>)}
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

            {/* Recorrência */}
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.recorrente ?? false}
                  onChange={e => { set('recorrente', e.target.checked); if (e.target.checked && !form.periodicidade) set('periodicidade', 'Mensal') }}
                  className="w-4 h-4 accent-violet-600" />
                <span className="text-sm text-gray-300">↺ Receita recorrente (ex: mensalidade)</span>
              </label>
            </div>
            {form.recorrente && (
              <div className="col-span-2 space-y-3 bg-violet-900/10 border border-violet-800/30 rounded-lg p-3">
                {editing ? (
                  <p className="text-xs text-violet-300">
                    ↺ {isSerie
                      ? `Lançamento de uma série${editing?.parcela_total ? ` (parcela ${editing.parcela_num}/${editing.parcela_total})` : ' contínua'}.`
                      : 'Receita recorrente.'} Alterações afetam <span className="font-semibold">apenas este lançamento</span>.
                  </p>
                ) : (
                  <>
                    <div>
                      <label className={lbl}>Periodicidade</label>
                      <select value={form.periodicidade ?? 'Mensal'} onChange={e => set('periodicidade', e.target.value)} className={inp}>
                        {PERIODICIDADES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setParcelaModo('continuo')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${parcelaModo === 'continuo' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-[#0a0a0f] border-[#2d2d3d] text-gray-400'}`}>
                        Contínuo
                      </button>
                      <button type="button" onClick={() => setParcelaModo('parcelado')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${parcelaModo === 'parcelado' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-[#0a0a0f] border-[#2d2d3d] text-gray-400'}`}>
                        Nº de parcelas
                      </button>
                    </div>
                    {parcelaModo === 'parcelado' && (
                      <input type="number" min={2} max={120} value={parcelaQtd}
                        onChange={e => setParcelaQtd(Math.max(2, parseInt(e.target.value) || 2))}
                        className={inp} />
                    )}
                    <p className="text-[11px] text-violet-300/80">
                      {parcelaModo === 'parcelado'
                        ? `Serão lançadas ${parcelaQtd} parcelas a partir da data.`
                        : 'Serão lançados 12 meses à frente (renovados automaticamente).'}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#1e1e2e] hover:bg-[#2d2d3d] text-gray-300 font-medium py-2.5 rounded-lg transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
              {saving ? 'Salvando…' : editing ? 'Salvar Alterações' : 'Salvar Receita'}
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
  const [editing, setEditing]     = useState<Receita | null>(null)
  const [busca, setBusca]         = useState('')
  const [produtoF, setProdutoF]   = useState('Todos')
  const [origemF, setOrigemF]     = useState('Todos')
  const [statusF, setStatusF]     = useState('Todos')
  const [catF, setCatF]           = useState('Todas')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())

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

  function openNova() {
    setEditing(null)
    setModal(true)
  }

  function openEditar(r: Receita) {
    setEditing(r)
    setModal(true)
  }

  function closeModal() {
    setModal(false)
    setEditing(null)
  }

  async function handleSave(r: ReceitaInsert, id?: string) {
    let error
    if (id) {
      const { serie_id: _s, parcela_num: _n, parcela_total: _t, ...editavel } = r
      void _s; void _n; void _t
      ;({ error } = await supabase.from('receitas').update(editavel).eq('id', id))
    } else if (r.recorrente && r.periodicidade) {
      const total = r.parcela_total ?? 12
      const serieId = crypto.randomUUID()
      const ehParcelado = r.parcela_total != null
      const rows = Array.from({ length: total }, (_, i) => ({
        ...r,
        data: addPeriodo(r.data, r.periodicidade!, i),
        serie_id: serieId,
        parcela_num: i + 1,
        parcela_total: ehParcelado ? total : null,
        descricao: ehParcelado ? `${r.descricao} (${i + 1}/${total})` : r.descricao,
      }))
      ;({ error } = await supabase.from('receitas').insert(rows))
    } else {
      ;({ error } = await supabase.from('receitas').insert(r))
    }
    if (error) {
      console.error('[receitas] save:', error)
      toast.error(`Erro ao salvar: ${error.message}`)
      return
    }
    toast.success(id ? 'Receita atualizada' : 'Receita lançada')
    closeModal(); fetchReceitas()
  }

  async function handleDelete(r: Receita) {
    if (r.serie_id) {
      const serieToda = await confirmar({
        titulo: 'Excluir série recorrente?',
        mensagem: 'Esta receita faz parte de uma série.\n"Excluir série" remove todos os lançamentos; "Só esta" remove apenas este.',
        confirmLabel: 'Excluir série', cancelLabel: 'Só esta', perigoso: true,
      })
      if (serieToda) {
        const { error } = await supabase.from('receitas').delete().eq('serie_id', r.serie_id)
        if (error) { toast.error(`Erro: ${error.message}`); return }
        toast.success('Série excluída'); fetchReceitas(); return
      }
      if (!await confirmar({ titulo: 'Excluir só esta receita?', confirmLabel: 'Excluir', perigoso: true })) return
    } else if (!await confirmar({ titulo: 'Excluir esta receita?', confirmLabel: 'Excluir', perigoso: true })) return
    const { error } = await supabase.from('receitas').delete().eq('id', r.id)
    if (error) { toast.error(`Erro: ${error.message}`); return }
    toast.success('Receita excluída'); fetchReceitas()
  }

  async function handleDeleteMany(ids: string[]) {
    const ok = await confirmar({
      titulo: `Excluir ${ids.length} receita${ids.length > 1 ? 's' : ''}?`,
      mensagem: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir', perigoso: true,
    })
    if (!ok) return
    const { error } = await supabase.from('receitas').delete().in('id', ids)
    if (error) { toast.error(`Erro: ${error.message}`); return }
    setSelecionados(new Set())
    toast.success(`${ids.length} excluída${ids.length > 1 ? 's' : ''}`)
    fetchReceitas()
  }

  // Filtros
  const filtradas = receitas.filter(r => {
    const matchBusca   = !busca || (r.descricao ?? '').toLowerCase().includes(busca.toLowerCase()) ||
                                   (r.cliente   ?? '').toLowerCase().includes(busca.toLowerCase())
    const matchProduto = produtoF === 'Todos' || r.produto === produtoF
    const matchOrigem  = origemF  === 'Todos' || r.origem  === origemF
    const matchStatus  = statusF  === 'Todos' || r.status  === statusF
    const matchCat     = catF     === 'Todas' || (r.categoria ?? 'Mensalidade') === catF
    return matchBusca && matchProduto && matchOrigem && matchStatus && matchCat
  })

  // Seleção múltipla
  const toggleUm = (id: string) => setSelecionados(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const todosMarcados = filtradas.length > 0 && filtradas.every(r => selecionados.has(r.id))
  const toggleTodos = () => setSelecionados(todosMarcados ? new Set() : new Set(filtradas.map(r => r.id)))
  const excluirSelecionados = () => {
    const ids = filtradas.filter(r => selecionados.has(r.id)).map(r => r.id)
    if (ids.length) handleDeleteMany(ids)
  }
  const totalSelecionado = filtradas.filter(r => selecionados.has(r.id)).reduce((s, r) => s + Number(r.valor), 0)

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
          <button onClick={openNova}
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
          <select value={catF} onChange={e => setCatF(e.target.value)} className={sel}>
            <option value="Todas">Todas as categorias</option>
            {CATEGORIAS_RECEITA.map(c => <option key={c}>{c}</option>)}
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
          {(busca || produtoF !== 'Todos' || origemF !== 'Todos' || statusF !== 'Todos' || catF !== 'Todas') && (
            <button onClick={() => { setBusca(''); setProdutoF('Todos'); setOrigemF('Todos'); setStatusF('Todos'); setCatF('Todas') }}
              className="text-xs text-gray-500 hover:text-white transition-colors">Limpar</button>
          )}
          <div className="sm:ml-auto text-sm text-gray-500">
            {filtradas.length} receita{filtradas.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Barra de ação em massa */}
        {selecionados.size > 0 && (
          <div className="flex items-center justify-between bg-violet-900/20 border border-violet-800/40 rounded-lg px-4 py-2.5">
            <span className="text-sm text-violet-200">
              <span className="font-semibold">{selecionados.size}</span> selecionada{selecionados.size > 1 ? 's' : ''}
              <span className="text-violet-300/70"> · {fmt(totalSelecionado)}</span>
            </span>
            <div className="flex items-center gap-3">
              <button onClick={() => setSelecionados(new Set())}
                className="text-xs text-gray-400 hover:text-white transition-colors">Limpar seleção</button>
              <button onClick={excluirSelecionados}
                className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
                🗑️ Excluir selecionadas
              </button>
            </div>
          </div>
        )}

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
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={todosMarcados} onChange={toggleTodos}
                        title="Selecionar todas" className="w-4 h-4 accent-violet-600 cursor-pointer align-middle" />
                    </th>
                    {['Data','Descrição','Produto','Cliente','Valor','Forma','Tipo','Status','Origem',''].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((r, i) => (
                    <tr key={r.id}
                      className={`border-b border-[#1e1e2e]/60 transition-colors ${i === filtradas.length - 1 ? 'border-b-0' : ''} ${
                        selecionados.has(r.id) ? 'bg-violet-900/20' : 'hover:bg-[#1e1e2e]/40'
                      }`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selecionados.has(r.id)} onChange={() => toggleUm(r.id)}
                          className="w-4 h-4 accent-violet-600 cursor-pointer align-middle" />
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtData(r.data)}</td>
                      <td className="px-4 py-3 text-white font-medium max-w-[260px]">
                        <span className="truncate block">{r.descricao || '—'}</span>
                        {r.categoria && <span className="text-[11px] text-gray-600">{r.categoria}</span>}
                        {r.recorrente && (
                          <span className="text-violet-400 text-[11px] flex items-center gap-1 mt-0.5">
                            ↺ {r.periodicidade}
                            {r.parcela_total ? <span className="text-gray-500">· {r.parcela_num}/{r.parcela_total}</span>
                             : r.parcela_num ? <span className="text-gray-600">· contínuo</span> : null}
                          </span>
                        )}
                      </td>
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
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditar(r)} title="Editar"
                            className="text-gray-600 hover:text-violet-400 transition-colors text-sm">✎</button>
                          <button onClick={() => handleDelete(r)} title="Excluir"
                            className="text-gray-600 hover:text-red-400 transition-colors text-base leading-none">×</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ModalReceita open={modal} editing={editing} onClose={closeModal} onSave={handleSave} />
    </PainelShell>
  )
}
