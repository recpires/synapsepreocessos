'use client'

import { useState, useEffect, useCallback } from 'react'
import PainelShell from '@/components/PainelShell'
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

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function mesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const CHART_COLORS = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#84cc16','#f97316']

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

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; fill?: string }[]
  label?: string
}) {
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

const PERIODICIDADES = ['Mensal', 'Quinzenal', 'Semanal', 'Anual'] as const

const EMPTY_FORM: DespesaInsert = {
  data: new Date().toISOString().split('T')[0],
  descricao: '',
  categoria: 'Infraestrutura',
  produto: 'Geral',
  forma_pagamento: 'Cartão Santander',
  condicao: '',
  valor: 0,
  tipo: 'fixo',
  recorrente: false,
  periodicidade: undefined,
  proxima_data: undefined,
  observacao: '',
  created_by: 'painel',
}

function ModalDespesa({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (d: DespesaInsert, file?: File) => Promise<void>
}) {
  const [form, setForm] = useState<DespesaInsert>(EMPTY_FORM)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) { setForm(EMPTY_FORM); setArquivo(null) } }, [open])
  if (!open) return null

  const set = (k: keyof DespesaInsert, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form, arquivo ?? undefined)
    setSaving(false)
  }

  const inp = `w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-white text-sm
    focus:outline-none focus:border-violet-600 transition-colors`
  const lbl = 'block text-xs text-gray-400 mb-1'

  const isPdf = arquivo?.type === 'application/pdf'
  const isImg = arquivo?.type.startsWith('image/')

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
                placeholder="IOF, parcelado…" className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value as 'fixo' | 'variavel' | 'pontual')} className={inp}>
                <option value="fixo">Fixo</option>
                <option value="variavel">Variável</option>
                <option value="pontual">Pontual</option>
              </select></div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.recorrente}
                  onChange={e => {
                    set('recorrente', e.target.checked)
                    if (!e.target.checked) {
                      set('periodicidade', undefined)
                      set('proxima_data', undefined)
                    } else {
                      set('periodicidade', 'Mensal')
                    }
                  }}
                  className="w-4 h-4 accent-violet-600" />
                <span className="text-sm text-gray-300">Recorrente</span>
              </label>
            </div>
          </div>

          {/* Campos de recorrência — só aparecem quando recorrente=true */}
          {form.recorrente && (
            <div className="grid grid-cols-2 gap-3 bg-violet-900/10 border border-violet-800/30 rounded-lg p-3">
              <div>
                <label className={lbl}>Periodicidade</label>
                <select value={form.periodicidade ?? 'Mensal'} onChange={e => set('periodicidade', e.target.value)} className={inp}>
                  {PERIODICIDADES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Próxima cobrança</label>
                <input type="date" value={form.proxima_data ?? ''}
                  onChange={e => set('proxima_data', e.target.value || undefined)}
                  className={inp} />
              </div>
            </div>
          )}
          <div><label className={lbl}>Observação (opcional)</label>
            <input type="text" value={form.observacao || ''} onChange={e => set('observacao', e.target.value)} className={inp} /></div>

          {/* Upload de comprovante */}
          <div>
            <label className={lbl}>Comprovante / Nota (opcional)</label>
            <label className={`flex items-center gap-3 cursor-pointer border border-dashed rounded-lg px-4 py-3 transition-colors ${
              arquivo ? 'border-violet-600/60 bg-violet-900/10' : 'border-[#2d2d3d] hover:border-[#3d3d4d]'
            }`}>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={e => setArquivo(e.target.files?.[0] ?? null)}
              />
              {arquivo ? (
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg">{isPdf ? '📄' : isImg ? '🖼️' : '📎'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-violet-300 truncate">{arquivo.name}</p>
                    <p className="text-xs text-gray-500">{(arquivo.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.preventDefault(); setArquivo(null) }}
                    className="text-gray-500 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0"
                  >×</button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-500">
                  <span className="text-xl">📎</span>
                  <div>
                    <p className="text-sm">Clique para anexar</p>
                    <p className="text-xs text-gray-600">JPG, PNG, PDF · máx. 10 MB</p>
                  </div>
                </div>
              )}
            </label>
          </div>

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

function DashboardView({ despesas, periodo }: { despesas: Despesa[]; periodo: string }) {
  const isGeral = periodo === 'geral'

  const porMes = Array.from(
    despesas.reduce((map, d) => {
      const mes = d.data.slice(0, 7)
      map.set(mes, (map.get(mes) || 0) + Number(d.valor))
      return map
    }, new Map<string, number>())
  ).sort(([a], [b]) => a.localeCompare(b)).map(([mes, total]) => ({
    name: MESES_LABEL[parseInt(mes.split('-')[1]) - 1],
    total,
    fixo:     despesas.filter(d => d.data.startsWith(mes) && d.tipo === 'fixo').reduce((s, d) => s + Number(d.valor), 0),
    variavel: despesas.filter(d => d.data.startsWith(mes) && d.tipo === 'variavel').reduce((s, d) => s + Number(d.valor), 0),
    pontual:  despesas.filter(d => d.data.startsWith(mes) && d.tipo === 'pontual').reduce((s, d) => s + Number(d.valor), 0),
  }))

  const porCategoria = Array.from(
    despesas.reduce((map, d) => {
      map.set(d.categoria, (map.get(d.categoria) || 0) + Number(d.valor))
      return map
    }, new Map<string, number>())
  ).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }))

  const porProduto = Array.from(
    despesas.reduce((map, d) => {
      map.set(d.produto, (map.get(d.produto) || 0) + Number(d.valor))
      return map
    }, new Map<string, number>())
  ).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }))

  const total        = despesas.reduce((s, d) => s + Number(d.valor), 0)
  const totalFixo    = despesas.filter(d => d.tipo === 'fixo').reduce((s, d) => s + Number(d.valor), 0)
  const totalVar     = despesas.filter(d => d.tipo === 'variavel').reduce((s, d) => s + Number(d.valor), 0)
  const totalPontual = despesas.filter(d => d.tipo === 'pontual').reduce((s, d) => s + Number(d.valor), 0)
  const custoFixoRec = despesas.filter(d => d.recorrente).reduce((s, d) => s + Number(d.valor), 0)
  const supabaseCusto = despesas.filter(d => d.descricao.toLowerCase().includes('supabase')).reduce((s, d) => s + Number(d.valor), 0)
  const maiorCategoria = porCategoria[0]

  const labelPeriodo = isGeral ? 'acumulado' : 'no período'

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={`Total ${labelPeriodo}`}
          value={fmt(total)}
          sub={`${despesas.length} lançamentos`}
        />
        <KpiCard
          label={isGeral ? 'Custo fixo recorrente' : 'Custo fixo'}
          value={fmt(custoFixoRec)}
          sub="apenas recorrentes"
          color="text-blue-400"
        />
        <KpiCard
          label="Gastos variáveis"
          value={fmt(totalVar)}
          sub={`Pontuais: ${fmt(totalPontual)}`}
          color="text-yellow-400"
        />
        <KpiCard
          label="Supabase"
          value={fmt(supabaseCusto)}
          sub={isGeral ? 'cresceu 4× em 2 meses' : 'no período'}
          alert={supabaseCusto > 150}
        />
      </div>

      {/* Bar mensal + donut categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">
            {isGeral ? 'Gastos por mês' : 'Distribuição no mês'}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            {isGeral ? (
              <BarChart data={porMes} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#1e1e2e' }} />
                <Bar dataKey="total" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Total" />
              </BarChart>
            ) : (
              <BarChart data={[
                { name: 'Fixo', value: totalFixo, fill: '#3b82f6' },
                { name: 'Variável', value: totalVar, fill: '#f59e0b' },
                { name: 'Pontual', value: totalPontual, fill: '#6b7280' },
              ]} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#1e1e2e' }} />
                <Bar dataKey="value" name="Valor" radius={[4, 4, 0, 0]}>
                  {[{ fill: '#3b82f6' }, { fill: '#f59e0b' }, { fill: '#6b7280' }].map((c, i) => (
                    <Cell key={i} fill={c.fill} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

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

      {/* Área evolução — só no modo geral */}
      {isGeral && (
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Evolução por tipo de gasto</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={porMes}>
              <defs>
                <linearGradient id="gFixo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gVariavel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPontual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} /><stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
              <Area type="monotone" dataKey="fixo"     name="Fixo"     stroke="#3b82f6" fill="url(#gFixo)"     strokeWidth={2} />
              <Area type="monotone" dataKey="variavel" name="Variável" stroke="#f59e0b" fill="url(#gVariavel)" strokeWidth={2} />
              <Area type="monotone" dataKey="pontual"  name="Pontual"  stroke="#6b7280" fill="url(#gPontual)"  strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Por produto + últimos lançamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Gastos por produto</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porProduto} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtK} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#1e1e2e' }} />
              <Bar dataKey="value" name="Total" radius={[0, 4, 4, 0]}>
                {porProduto.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Lançamentos do período</h3>
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

      {maiorCategoria && (
        <div className="bg-violet-900/20 border border-violet-800/40 rounded-xl p-4">
          <p className="text-sm text-violet-300">
            <span className="font-semibold">📊 Maior categoria:</span>{' '}
            <span className="font-bold">{maiorCategoria.name}</span> representa{' '}
            <span className="font-bold">{((maiorCategoria.value / total) * 100).toFixed(1)}%</span> do total ({fmt(maiorCategoria.value)}).
            {maiorCategoria.name === 'Infraestrutura' && ' Monitore o Supabase — cresceu 4× em 2 meses.'}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Despesas View ────────────────────────────────────────────────────────────

function DespesasView({ despesas, onDelete, onAdd }: {
  despesas: Despesa[]; onDelete: (id: string) => void; onAdd: () => void
}) {
  const [mesFiltro, setMesFiltro]   = useState('todos')
  const [catFiltro, setCatFiltro]   = useState('Todas')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [busca, setBusca]           = useState('')

  const filtradas = despesas.filter(d => {
    const matchMes   = mesFiltro === 'todos'  || d.data.startsWith(mesFiltro)
    const matchCat   = catFiltro === 'Todas'  || d.categoria === catFiltro
    const matchTipo  = tipoFiltro === 'todos' || d.tipo === tipoFiltro
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
          placeholder="Buscar…" className={`${sel} w-44 placeholder-gray-600`} />
        {(mesFiltro !== 'todos' || catFiltro !== 'Todas' || tipoFiltro !== 'todos' || busca) && (
          <button onClick={() => { setMesFiltro('todos'); setCatFiltro('Todas'); setTipoFiltro('todos'); setBusca('') }}
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

      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-600">Nenhuma despesa encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {['Data','Descrição','Categoria','Produto','Forma','Tipo','Valor','📎',''].map(h => (
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
                    <td className="px-4 py-3 text-white font-medium max-w-[200px]">
                      <span className="truncate block">{d.descricao}</span>
                      {d.recorrente && (
                        <span className="text-violet-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <span>↺</span>
                          {d.periodicidade && <span>{d.periodicidade}</span>}
                          {d.proxima_data && (
                            <span className="text-gray-600">
                              · próx. {new Date(d.proxima_data + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </span>
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
                      <span className={`text-xs font-medium ${TIPO_CORES[d.tipo] ?? 'text-gray-400'}`}>{d.tipo}</span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-white">{fmt(Number(d.valor))}</td>
                    <td className="px-4 py-3 text-center">
                      {d.anexo_url ? (
                        <a href={d.anexo_url} target="_blank" rel="noopener noreferrer"
                          title={d.anexo_nome ?? 'Ver anexo'}
                          className="text-violet-400 hover:text-violet-300 transition-colors text-base">
                          {d.anexo_nome?.endsWith('.pdf') ? '📄' : '🖼️'}
                        </a>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => onDelete(d.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors text-base">×</button>
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
  const supabase = createClient()

  const [despesas, setDespesas]   = useState<Despesa[]>([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [aba, setAba]             = useState<'dashboard' | 'despesas'>('dashboard')
  const [mesGlobal, setMesGlobal] = useState('geral')

  const fetchDespesas = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('despesas').select('*').order('data', { ascending: false })
    setDespesas(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchDespesas()
  }, [fetchDespesas])

  async function handleSave(d: DespesaInsert, file?: File) {
    let anexo_url: string | undefined
    let anexo_nome: string | undefined

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('financeiro-anexos')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('financeiro-anexos')
          .getPublicUrl(uploadData.path)
        anexo_url = urlData.publicUrl
        anexo_nome = file.name
      }
    }

    await supabase.from('despesas').insert({ ...d, anexo_url, anexo_nome })
    setModalOpen(false)
    fetchDespesas()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta despesa?')) return
    await supabase.from('despesas').delete().eq('id', id)
    fetchDespesas()
  }

  // Meses disponíveis para o filtro global
  const mesesDisponiveis = Array.from(new Set(despesas.map(d => d.data.slice(0, 7)))).sort().reverse()

  // Despesas filtradas pelo mês global (usado só no Dashboard)
  const despesasDashboard = mesGlobal === 'geral'
    ? despesas
    : despesas.filter(d => d.data.startsWith(mesGlobal))

  const totalGeral = despesas.reduce((s, d) => s + Number(d.valor), 0)

  return (
    <PainelShell>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Título + controles */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Controle Financeiro</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {despesas.length} registros · {fmt(totalGeral)} total acumulado
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtro de mês global — só aparece no dashboard */}
            {aba === 'dashboard' && (
              <div className="flex items-center gap-1 bg-[#111118] border border-[#1e1e2e] rounded-xl p-1">
                <button
                  onClick={() => setMesGlobal('geral')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    mesGlobal === 'geral' ? 'bg-violet-600 text-white font-medium' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Geral
                </button>
                {mesesDisponiveis.map(m => {
                  const [, mes] = m.split('-')
                  return (
                    <button key={m}
                      onClick={() => setMesGlobal(m)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        mesGlobal === m ? 'bg-violet-600 text-white font-medium' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {MESES_LABEL[parseInt(mes) - 1]}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Abas */}
            <div className="flex items-center gap-2 bg-[#111118] border border-[#1e1e2e] rounded-xl p-1">
              {(['dashboard', 'despesas'] as const).map(t => (
                <button key={t} onClick={() => setAba(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    aba === t ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}>
                  {t === 'dashboard' ? '📊 Dashboard' : '📋 Despesas'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32 text-gray-600">Carregando…</div>
        ) : aba === 'dashboard' ? (
          <DashboardView despesas={despesasDashboard} periodo={mesGlobal} />
        ) : (
          <DespesasView despesas={despesas} onDelete={handleDelete} onAdd={() => setModalOpen(true)} />
        )}
      </div>

      <ModalDespesa open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </PainelShell>
  )
}
