'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import {
  type Despesa,
  type DespesaInsert,
  CATEGORIAS,
  FORMAS_PAGAMENTO,
  PRODUTOS_LISTA,
  CATEGORIA_CORES,
} from '@/types/financeiro'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtK = (v: number) =>
  v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v.toFixed(0)}`

const MESES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MESES_FULL  = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function mesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const CHART_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316']

const TIPO_CORES: Record<string, string> = {
  fixo:     'text-blue-400',
  variavel: 'text-yellow-400',
  pontual:  'text-gray-400',
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = 'text-white', alert }: {
  label: string; value: string; sub?: string; color?: string; alert?: boolean
}) {
  return (
    <div className={`bg-[#111118] border rounded-xl p-5 ${alert ? 'border-amber-700/60' : 'border-[#1e1e2e]'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${alert ? 'text-amber-400' : color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1e1e2e] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm shadow-xl">
      {label && <p className="text-gray-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.fill || '#7c3aed' }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Modal Nova Despesa ───────────────────────────────────────────────────────

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

function ModalDespesa({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (d: DespesaInsert) => Promise<void>
}) {
  const [form, setForm] = useState<DespesaInsert>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) setForm(EMPTY_FORM) }, [open])
  if (!open) return null

  const set = (k: keyof DespesaInsert, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const inp = `w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-white text-sm
    focus:outline-none focus:border-violet-600 transition-colors`
  const lbl = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
          <h2 className="font-semibold text-white">Nova Despesa</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Data</label>
              <input type="date" value={form.data} onChange={e => set('data', e.target.value)} required className={inp} /></div>
            <div><label className={lbl}>Valor (R$)</label>
              <input type="number" step="0.01" min="0" value={form.valor || ''}
                onChange={e => set('valor', parseFloat(e.target.value) || 0)} required className={inp} /></div>
          </div>
          <div><label className={lbl}>Descrição</label>
            <input type="text" value={form.descricao} onChange={e => set('descricao', e.target.value)}
              placeholder="ex: Supabase, Vercel…" required className={inp} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Categoria</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className={inp}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className={lbl}>Produto</label>
              <select value={form.produto} onChange={e => set('produto', e.target.value)} className={inp}>
                {PRODUTOS_LISTA.map(p => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Forma de Pagamento</label>
              <select value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)} className={inp}>
                {FORMAS_PAGAMENTO.map(f => <option key={f}>{f}</option>)}</select></div>
            <div><label className={lbl}>Condição</label>
              <input type="text" value={form.condicao} onChange={e => set('condicao', e.target.value)}
                placeholder="Mensal, Anual, IOF…" className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value as 'fixo' | 'variavel' | 'pontual')} className={inp}>
                <option value="fixo">Fixo</option>
                <option value="variavel">Variável</option>
                <option value="pontual">Pontual</option>
              </select></div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.recorrente}
                  onChange={e => set('recorrente', e.target.checked)} className="w-4 h-4 accent-violet-600" />
                <span className="text-sm text-gray-300">Recorrente</span>
              </label>
            </div>
          </div>
          <div><label className={lbl}>Observação (opcional)</label>
            <input type="text" value={form.observacao || ''} onChange={e => set('observacao', e.target.value)} className={inp} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#1e1e2e] hover:bg-[#2d2d3d] text-gray-300 font-medium py-2.5 rounded-lg transition-colors text-sm">
              Cancelar</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
              {saving ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({ despesas }: { despesas: Despesa[] }) {
  // Gastos por mês
  const porMes = Array.from(
    despesas.reduce((map, d) => {
      const mes = d.data.slice(0, 7)
      map.set(mes, (map.get(mes) || 0) + Number(d.valor))
      return map
    }, new Map<string, number>())
  ).sort(([a], [b]) => a.localeCompare(b)).map(([mes, total]) => ({
    name: MESES_LABEL[parseInt(mes.split('-')[1]) - 1],
    total,
    fixo: despesas.filter(d => d.data.startsWith(mes) && d.tipo === 'fixo').reduce((s, d) => s + Number(d.valor), 0),
    variavel: despesas.filter(d => d.data.startsWith(mes) && d.tipo === 'variavel').reduce((s, d) => s + Number(d.valor), 0),
    pontual: despesas.filter(d => d.data.startsWith(mes) && d.tipo === 'pontual').reduce((s, d) => s + Number(d.valor), 0),
  }))

  // Por categoria
  const porCategoria = Array.from(
    despesas.reduce((map, d) => {
      map.set(d.categoria, (map.get(d.categoria) || 0) + Number(d.valor))
      return map
    }, new Map<string, number>())
  ).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }))

  // Por produto
  const porProduto = Array.from(
    despesas.reduce((map, d) => {
      map.set(d.produto, (map.get(d.produto) || 0) + Number(d.valor))
      return map
    }, new Map<string, number>())
  ).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }))

  // KPIs
  const total = despesas.reduce((s, d) => s + Number(d.valor), 0)
  const mesAtualStr = mesAtual()
  const totalMesAtual = despesas.filter(d => d.data.startsWith(mesAtualStr)).reduce((s, d) => s + Number(d.valor), 0)
  const custoFixo = despesas.filter(d => d.recorrente && d.data.startsWith(mesAtualStr)).reduce((s, d) => s + Number(d.valor), 0)
  const supabaseCusto = despesas.filter(d => d.descricao.toLowerCase().includes('supabase')).reduce((s, d) => s + Number(d.valor), 0)
  const maiorCategoria = porCategoria[0]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Geral" value={fmt(total)} sub={`${despesas.length} lançamentos`} />
        <KpiCard label={`Mês atual (${MESES_LABEL[new Date().getMonth()]})`} value={fmt(totalMesAtual)} sub="todos os tipos" />
        <KpiCard label="Custo fixo mensal" value={fmt(custoFixo)} sub="apenas recorrentes" color="text-blue-400" />
        <KpiCard label="Supabase acumulado" value={fmt(supabaseCusto)} sub="atenção: crescimento 4×" alert />
      </div>

      {/* Gastos por mês + Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart mensal */}
        <div className="lg:col-span-2 bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Gastos por mês</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porMes} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#1e1e2e' }} />
              <Bar dataKey="total" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut categoria */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Por categoria</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={porCategoria} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                dataKey="value" nameKey="name" paddingAngle={2}>
                {porCategoria.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {porCategoria.slice(0, 5).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-gray-400 truncate max-w-[100px]">{c.name}</span>
                </div>
                <span className="text-gray-300 font-medium">{fmt(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Área: Fixo vs Variável vs Pontual */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Evolução por tipo de gasto</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={porMes}>
            <defs>
              <linearGradient id="gFixo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gVariavel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gPontual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
            <Area type="monotone" dataKey="fixo" name="Fixo" stroke="#3b82f6" fill="url(#gFixo)" strokeWidth={2} />
            <Area type="monotone" dataKey="variavel" name="Variável" stroke="#f59e0b" fill="url(#gVariavel)" strokeWidth={2} />
            <Area type="monotone" dataKey="pontual" name="Pontual" stroke="#6b7280" fill="url(#gPontual)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Por produto + últimas despesas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Horizontal bar por produto */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Gastos por produto</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porProduto} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtK} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#1e1e2e' }} />
              <Bar dataKey="value" name="Total" radius={[0, 4, 4, 0]}>
                {porProduto.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Últimas 5 despesas */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Últimos lançamentos</h3>
          <div className="space-y-3">
            {despesas.slice(0, 8).map(d => (
              <div key={d.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#1e1e2e] flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                    {d.descricao.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{d.descricao}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR')} · {d.categoria}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-white ml-3 flex-shrink-0">{fmt(Number(d.valor))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insight box */}
      {maiorCategoria && (
        <div className="bg-violet-900/20 border border-violet-800/40 rounded-xl p-4">
          <p className="text-sm text-violet-300">
            <span className="font-semibold">📊 Maior categoria:</span>{' '}
            <span className="font-bold">{maiorCategoria.name}</span> representa{' '}
            <span className="font-bold">{((maiorCategoria.value / total) * 100).toFixed(1)}%</span> do total gasto ({fmt(maiorCategoria.value)}).
            {maiorCategoria.name === 'Infraestrutura' && ' Monitore o crescimento do Supabase — subiu 4× em 2 meses.'}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Despesas View ────────────────────────────────────────────────────────────

function DespesasView({
  despesas, onDelete, onAdd,
}: { despesas: Despesa[]; onDelete: (id: string) => void; onAdd: () => void }) {
  const [mesFiltro, setMesFiltro] = useState(mesAtual())
  const [catFiltro, setCatFiltro] = useState('Todas')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [busca, setBusca] = useState('')

  const filtradas = despesas.filter(d => {
    const matchMes  = mesFiltro === 'todos' || d.data.startsWith(mesFiltro)
    const matchCat  = catFiltro === 'Todas' || d.categoria === catFiltro
    const matchTipo = tipoFiltro === 'todos' || d.tipo === tipoFiltro
    const matchBusca = !busca ||
      d.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      d.produto.toLowerCase().includes(busca.toLowerCase())
    return matchMes && matchCat && matchTipo && matchBusca
  })

  const totalFiltrado = filtradas.reduce((s, d) => s + Number(d.valor), 0)
  const mesesDisponiveis = Array.from(new Set(despesas.map(d => d.data.slice(0, 7)))).sort().reverse()

  const sel = `bg-[#111118] border border-[#2d2d3d] text-sm text-gray-300 rounded-lg px-3 py-2
    focus:outline-none focus:border-violet-600 transition-colors`

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)} className={sel}>
          <option value="todos">Todos os meses</option>
          {mesesDisponiveis.map(m => {
            const [ano, mes] = m.split('-')
            return <option key={m} value={m}>{MESES_FULL[parseInt(mes) - 1]} {ano}</option>
          })}
        </select>
        <select value={catFiltro} onChange={e => setCatFiltro(e.target.value)} className={sel}>
          <option value="Todas">Todas as categorias</option>
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)} className={sel}>
          <option value="todos">Todos os tipos</option>
          <option value="fixo">Fixo</option>
          <option value="variavel">Variável</option>
          <option value="pontual">Pontual</option>
        </select>
        <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar…"
          className={`${sel} w-44 placeholder-gray-600`} />
        {(mesFiltro !== mesAtual() || catFiltro !== 'Todas' || tipoFiltro !== 'todos' || busca) && (
          <button onClick={() => { setMesFiltro(mesAtual()); setCatFiltro('Todas'); setTipoFiltro('todos'); setBusca('') }}
            className="text-xs text-gray-500 hover:text-white transition-colors">Limpar</button>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-500">{filtradas.length} registros · {fmt(totalFiltrado)}</span>
          <button onClick={onAdd}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <span className="text-base leading-none">+</span> Nova despesa
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-600">Nenhuma despesa encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {['Data', 'Descrição', 'Categoria', 'Produto', 'Forma', 'Tipo', 'Valor', ''].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((d, i) => (
                  <tr key={d.id}
                    className={`border-b border-[#1e1e2e]/60 hover:bg-[#1e1e2e]/40 transition-colors ${i === filtradas.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">
                      {d.descricao}
                      {d.recorrente && <span className="ml-1.5 text-violet-400 text-xs">↺</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORIA_CORES[d.categoria] ?? 'bg-gray-800 text-gray-400'}`}>
                        {d.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{d.produto}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{d.forma_pagamento}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-medium ${TIPO_CORES[d.tipo] ?? 'text-gray-400'}`}>{d.tipo}</span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-white">{fmt(Number(d.valor))}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => onDelete(d.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors text-base" title="Excluir">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [aba, setAba] = useState<'dashboard' | 'despesas'>('dashboard')

  const fetchDespesas = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('despesas').select('*').order('data', { ascending: false })
    setDespesas(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchDespesas()
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
  }, [fetchDespesas, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleSave(d: DespesaInsert) {
    await supabase.from('despesas').insert(d)
    setModalOpen(false)
    fetchDespesas()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta despesa?')) return
    await supabase.from('despesas').delete().eq('id', id)
    fetchDespesas()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="border-b border-[#1e1e2e] bg-[#111118] sticky top-0 z-40">
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
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-white transition-colors">Sair</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Título + tabs */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Controle Financeiro</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {despesas.length} registros · {fmt(despesas.reduce((s, d) => s + Number(d.valor), 0))} total
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#111118] border border-[#1e1e2e] rounded-xl p-1">
            {(['dashboard', 'despesas'] as const).map(t => (
              <button key={t} onClick={() => setAba(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                  aba === t ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                {t === 'dashboard' ? '📊 Dashboard' : '📋 Despesas'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32 text-gray-600">Carregando…</div>
        ) : aba === 'dashboard' ? (
          <DashboardView despesas={despesas} />
        ) : (
          <DespesasView despesas={despesas} onDelete={handleDelete} onAdd={() => setModalOpen(true)} />
        )}
      </main>

      <ModalDespesa open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  )
}
