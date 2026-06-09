'use client'

import { useState, useEffect, useCallback } from 'react'
import PainelShell from '@/components/PainelShell'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import SubNav from '@/components/SubNav'
import { toast, confirmar } from '@/components/Feedback'
import { usePersistido, rangePeriodo, PERIODO_LABEL, type PeriodoPreset } from '@/lib/filtros'
import { SUBNAV } from '@/lib/nav'
import {
  type Despesa,
  type DespesaInsert,
  type Receita,
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

// Soma N períodos a uma data 'YYYY-MM-DD' conforme a periodicidade.
// Para Mensal/Anual mantém o dia, com clamp no último dia do mês (ex: 31 jan → 28 fev).
function addPeriodo(dataISO: string, periodicidade: string, n: number): string {
  const [y, m, d] = dataISO.split('-').map(Number)
  if (periodicidade === 'Semanal' || periodicidade === 'Quinzenal') {
    const dias = (periodicidade === 'Semanal' ? 7 : 15) * n
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + dias)
    return dt.toISOString().slice(0, 10)
  }
  // Mensal (default) ou Anual
  const passoMeses = periodicidade === 'Anual' ? 12 : 1
  const totalMeses = (m - 1) + passoMeses * n
  const novoAno = y + Math.floor(totalMeses / 12)
  const novoMes = totalMeses % 12 // 0-11
  const ultimoDia = new Date(Date.UTC(novoAno, novoMes + 1, 0)).getUTCDate()
  const dia = Math.min(d, ultimoDia)
  return `${novoAno}-${String(novoMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
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

type FiltrosDespesa = {
  preset: PeriodoPreset; de: string; ate: string
  categoria: string; tipo: string; produto: string; busca: string
}
const FILTRO_DESPESA_INICIAL: FiltrosDespesa = {
  preset: 'ano-atual', de: '', ate: '',
  categoria: 'Todas', tipo: 'todos', produto: 'Todos', busca: '',
}

// Colunas da tabela de despesas. `campo` null = não ordenável (anexo / ações).
type SortCampoDespesa = 'data' | 'descricao' | 'categoria' | 'produto' | 'forma_pagamento' | 'tipo' | 'valor'
type SortDespesa = { campo: SortCampoDespesa; dir: 'asc' | 'desc' }
const SORT_DESPESA_INICIAL: SortDespesa = { campo: 'data', dir: 'desc' }

const COLUNAS_DESPESA: { label: string; campo: SortCampoDespesa | null; align?: 'right' }[] = [
  { label: 'Data',      campo: 'data' },
  { label: 'Descrição', campo: 'descricao' },
  { label: 'Categoria', campo: 'categoria' },
  { label: 'Produto',   campo: 'produto' },
  { label: 'Forma',     campo: 'forma_pagamento' },
  { label: 'Tipo',      campo: 'tipo' },
  { label: 'Valor',     campo: 'valor', align: 'right' },
  { label: '📎',         campo: null },
  { label: '',          campo: null },
]

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

function despesaToForm(d: Despesa, opts?: { duplicar?: boolean }): DespesaInsert {
  return {
    data: d.data,
    descricao: opts?.duplicar ? `${d.descricao} (cópia)` : d.descricao,
    categoria: d.categoria,
    produto: d.produto,
    forma_pagamento: d.forma_pagamento,
    condicao: d.condicao,
    // o input mostra o valor BASE (antes da taxa); o total é recalculado no submit
    valor: d.valor_base ?? d.valor,
    tipo: d.tipo,
    // duplicata nasce como lançamento único — não herda a série
    recorrente: opts?.duplicar ? false : d.recorrente,
    periodicidade: opts?.duplicar ? undefined : d.periodicidade,
    proxima_data: opts?.duplicar ? undefined : d.proxima_data,
    observacao: d.observacao,
    anexo_url: opts?.duplicar ? undefined : d.anexo_url,
    anexo_nome: opts?.duplicar ? undefined : d.anexo_nome,
    internacional: d.internacional ?? false,
    taxa_pct: d.taxa_pct ?? null,
    valor_base: d.valor_base ?? null,
    created_by: d.created_by,
  }
}

function ModalDespesa({ open, editing, duplicando, onClose, onSave }: {
  open: boolean
  editing: Despesa | null
  duplicando: Despesa | null
  onClose: () => void
  onSave: (d: DespesaInsert, file: File | undefined, id?: string) => Promise<void>
}) {
  const [form, setForm] = useState<DespesaInsert>(EMPTY_FORM)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [parcelaModo, setParcelaModo] = useState<'continuo' | 'parcelado'>('continuo')
  const [parcelaQtd, setParcelaQtd]   = useState(12)
  const [internacional, setInternacional] = useState(false)
  const [taxaPct, setTaxaPct]             = useState(0)

  useEffect(() => {
    if (open) {
      const base = editing ?? duplicando
      setForm(
        editing ? despesaToForm(editing)
        : duplicando ? despesaToForm(duplicando, { duplicar: true })
        : EMPTY_FORM
      )
      setArquivo(null)
      setParcelaModo(editing?.parcela_total ? 'parcelado' : 'continuo')
      setParcelaQtd(editing?.parcela_total ?? 12)
      setInternacional(base?.internacional ?? false)
      setTaxaPct(base?.taxa_pct ?? 0)
    }
  }, [open, editing, duplicando])
  if (!open) return null

  const set = (k: keyof DespesaInsert, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  // Em edição não regeneramos a série — apenas o registro atual é alterado.
  const isSerieExistente = !!editing?.serie_id

  // Valor base digitado + taxa internacional = total
  const valorBase  = Number(form.valor) || 0
  const valorTaxa  = internacional ? valorBase * (taxaPct / 100) : 0
  const valorTotal = Math.round((valorBase + valorTaxa) * 100) / 100

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload: DespesaInsert = {
      ...form,
      valor: valorTotal,
      valor_base: internacional ? valorBase : null,
      taxa_pct: internacional ? taxaPct : null,
      internacional,
    }
    if (!editing && form.recorrente) {
      payload.parcela_total = parcelaModo === 'parcelado' ? parcelaQtd : null
    }
    await onSave(payload, arquivo ?? undefined, editing?.id)
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
          <h2 className="font-semibold text-white">{editing ? 'Editar Despesa' : duplicando ? 'Duplicar Despesa' : 'Nova Despesa'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Data</label>
              <input type="date" value={form.data} onChange={e => set('data', e.target.value)} required className={inp} /></div>
            <div><label className={lbl}>{internacional ? 'Valor base (R$)' : 'Valor (R$)'}</label>
              <input type="number" step="0.01" min="0" value={form.valor || ''}
                onChange={e => set('valor', parseFloat(e.target.value) || 0)} required className={inp} /></div>
          </div>

          {/* Taxa internacional (IOF/spread em serviço de fora do Brasil) */}
          <div className="bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={internacional}
                onChange={e => { setInternacional(e.target.checked); if (e.target.checked && !taxaPct) setTaxaPct(6.38) }}
                className="w-4 h-4 accent-violet-600" />
              <span className="text-sm text-gray-300">🌎 Serviço internacional (cobrar taxa)</span>
            </label>
            {internacional && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Taxa (%)</label>
                    <input type="number" step="0.01" min="0" value={taxaPct || ''}
                      onChange={e => setTaxaPct(parseFloat(e.target.value) || 0)}
                      placeholder="ex: 6,38 (IOF)" className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Taxa em R$</label>
                    <input type="text" disabled value={fmt(valorTaxa)}
                      className={`${inp} opacity-60 cursor-not-allowed`} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm pt-1 border-t border-[#1e1e2e]">
                  <span className="text-gray-400">Valor total com taxa</span>
                  <span className="font-bold text-violet-300">{fmt(valorTotal)}</span>
                </div>
              </>
            )}
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
            <div className="space-y-3 bg-violet-900/10 border border-violet-800/30 rounded-lg p-3">
              {editing ? (
                <p className="text-xs text-violet-300">
                  ↺ {isSerieExistente
                    ? `Lançamento de uma série${editing?.parcela_total ? ` (parcela ${editing.parcela_num}/${editing.parcela_total})` : ' mensal contínua'}.`
                    : 'Despesa recorrente.'}
                  {' '}Alterações afetam <span className="font-semibold">apenas este lançamento</span>.
                </p>
              ) : (
                <>
                  <div>
                    <label className={lbl}>Periodicidade</label>
                    <select value={form.periodicidade ?? 'Mensal'} onChange={e => set('periodicidade', e.target.value)} className={inp}>
                      {PERIODICIDADES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Duração</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setParcelaModo('continuo')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors border ${
                          parcelaModo === 'continuo'
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'bg-[#0a0a0f] border-[#2d2d3d] text-gray-400 hover:text-white'
                        }`}>
                        Fixo contínuo
                      </button>
                      <button type="button" onClick={() => setParcelaModo('parcelado')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors border ${
                          parcelaModo === 'parcelado'
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'bg-[#0a0a0f] border-[#2d2d3d] text-gray-400 hover:text-white'
                        }`}>
                        Parcelado
                      </button>
                    </div>
                  </div>
                  {parcelaModo === 'parcelado' && (
                    <div>
                      <label className={lbl}>Número de parcelas</label>
                      <input type="number" min={2} max={120} value={parcelaQtd}
                        onChange={e => setParcelaQtd(Math.max(2, parseInt(e.target.value) || 2))}
                        className={inp} />
                    </div>
                  )}
                  <p className="text-[11px] text-violet-300/80">
                    {parcelaModo === 'parcelado'
                      ? `Serão lançadas ${parcelaQtd} parcelas, uma a cada período, a partir da data informada.`
                      : `Serão lançados 12 meses à frente. Quando o valor mudar, edite o mês específico.`}
                  </p>
                </>
              )}
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
              ) : form.anexo_url ? (
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg">{form.anexo_nome?.endsWith('.pdf') ? '📄' : '🖼️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-violet-300 truncate">{form.anexo_nome ?? 'Anexo atual'}</p>
                    <p className="text-xs text-gray-500">Clique para substituir</p>
                  </div>
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

function DespesasView({ despesas, onDelete, onDeleteMany, onEdit, onDuplicate, onVerAnexo, onAdd }: {
  despesas: Despesa[]; onDelete: (d: Despesa) => void; onDeleteMany: (ids: string[]) => void
  onEdit: (d: Despesa) => void; onDuplicate: (d: Despesa) => void
  onVerAnexo: (path: string) => void; onAdd: () => void
}) {
  const [f, setF] = usePersistido<FiltrosDespesa>('financeiro:filtros-despesas', FILTRO_DESPESA_INICIAL)
  const upd = (patch: Partial<FiltrosDespesa>) => setF({ ...f, ...patch })
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [sort, setSort] = usePersistido<SortDespesa>('financeiro:sort-despesas', SORT_DESPESA_INICIAL)

  // Clicar na coluna ativa alterna asc/desc; em coluna nova, datas e valores
  // começam em desc (mais recente / maior primeiro), texto em asc (A→Z).
  const toggleSort = (campo: SortCampoDespesa) =>
    setSort(sort.campo === campo
      ? { campo, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
      : { campo, dir: campo === 'data' || campo === 'valor' ? 'desc' : 'asc' })

  const { de, ate } = rangePeriodo(f.preset, f.de, f.ate)

  const filtradas = despesas.filter(d => {
    const matchPeriodo = d.data >= de && d.data <= ate
    const matchCat     = f.categoria === 'Todas' || d.categoria === f.categoria
    const matchTipo    = f.tipo === 'todos'      || d.tipo === f.tipo
    const matchProduto = f.produto === 'Todos'   || d.produto === f.produto
    const matchBusca   = !f.busca ||
      d.descricao.toLowerCase().includes(f.busca.toLowerCase()) ||
      d.produto.toLowerCase().includes(f.busca.toLowerCase())
    return matchPeriodo && matchCat && matchTipo && matchProduto && matchBusca
  })

  const ordenadas = [...filtradas].sort((a, b) => {
    const cmp = sort.campo === 'valor'
      ? Number(a.valor) - Number(b.valor)
      : String(a[sort.campo] ?? '').localeCompare(String(b[sort.campo] ?? ''), 'pt-BR')
    return sort.dir === 'asc' ? cmp : -cmp
  })

  const totalFiltrado = filtradas.reduce((s, d) => s + Number(d.valor), 0)
  const filtroAtivo = f.preset !== 'ano-atual' || f.categoria !== 'Todas' || f.tipo !== 'todos' || f.produto !== 'Todos' || !!f.busca

  const toggleUm = (id: string) => setSelecionados(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const todosMarcados = filtradas.length > 0 && filtradas.every(d => selecionados.has(d.id))
  const toggleTodos = () => setSelecionados(
    todosMarcados ? new Set() : new Set(filtradas.map(d => d.id))
  )
  const limparSelecao = () => setSelecionados(new Set())
  const excluirSelecionados = () => {
    const ids = filtradas.filter(d => selecionados.has(d.id)).map(d => d.id)
    if (ids.length) onDeleteMany(ids)
    limparSelecao()
  }
  const totalSelecionado = filtradas
    .filter(d => selecionados.has(d.id))
    .reduce((s, d) => s + Number(d.valor), 0)

  const sel = `bg-[#111118] border border-[#2d2d3d] text-sm text-gray-300 rounded-lg px-3 py-2
    focus:outline-none focus:border-violet-600 transition-colors`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={f.preset} onChange={e => upd({ preset: e.target.value as PeriodoPreset })} className={sel}>
          {(Object.keys(PERIODO_LABEL) as PeriodoPreset[]).map(p => (
            <option key={p} value={p}>{PERIODO_LABEL[p]}</option>
          ))}
        </select>
        {f.preset === 'custom' && (
          <>
            <input type="date" value={f.de} onChange={e => upd({ de: e.target.value })}
              title="Data início" className={sel} />
            <span className="text-gray-600 text-sm">até</span>
            <input type="date" value={f.ate} onChange={e => upd({ ate: e.target.value })}
              title="Data fim" className={sel} />
          </>
        )}
        <select value={f.produto} onChange={e => upd({ produto: e.target.value })} className={sel}>
          <option value="Todos">Todos os serviços</option>
          {PRODUTOS_LISTA.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={f.categoria} onChange={e => upd({ categoria: e.target.value })} className={sel}>
          <option value="Todas">Todas as categorias</option>
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={f.tipo} onChange={e => upd({ tipo: e.target.value })} className={sel}>
          <option value="todos">Todos os tipos</option>
          <option value="fixo">Fixo</option>
          <option value="variavel">Variável</option>
          <option value="pontual">Pontual</option>
        </select>
        <input type="text" value={f.busca} onChange={e => upd({ busca: e.target.value })}
          placeholder="Buscar…" className={`${sel} w-40 placeholder-gray-600`} />
        {filtroAtivo && (
          <button onClick={() => setF(FILTRO_DESPESA_INICIAL)}
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

      {/* Barra de ação em massa */}
      {selecionados.size > 0 && (
        <div className="flex items-center justify-between bg-violet-900/20 border border-violet-800/40 rounded-lg px-4 py-2.5">
          <span className="text-sm text-violet-200">
            <span className="font-semibold">{selecionados.size}</span> selecionado{selecionados.size > 1 ? 's' : ''}
            <span className="text-violet-300/70"> · {fmt(totalSelecionado)}</span>
          </span>
          <div className="flex items-center gap-3">
            <button onClick={limparSelecao}
              className="text-xs text-gray-400 hover:text-white transition-colors">Limpar seleção</button>
            <button onClick={excluirSelecionados}
              className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
              🗑️ Excluir selecionados
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-600">Nenhuma despesa encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={todosMarcados} onChange={toggleTodos}
                      title="Selecionar todos" className="w-4 h-4 accent-violet-600 cursor-pointer align-middle" />
                  </th>
                  {COLUNAS_DESPESA.map((col, idx) => (
                    <th key={col.label || `acoes-${idx}`}
                      className={`text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                      {col.campo ? (
                        <button onClick={() => toggleSort(col.campo!)}
                          title={`Ordenar por ${col.label}`}
                          className={`inline-flex items-center gap-1 transition-colors hover:text-gray-300 ${
                            col.align === 'right' ? 'flex-row-reverse' : ''
                          } ${sort.campo === col.campo ? 'text-violet-400' : ''}`}>
                          <span>{col.label}</span>
                          <span className={`text-[10px] leading-none ${sort.campo === col.campo ? '' : 'text-gray-700'}`}>
                            {sort.campo === col.campo ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                          </span>
                        </button>
                      ) : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((d, i) => (
                  <tr key={d.id}
                    className={`border-b border-[#1e1e2e]/60 transition-colors ${i === ordenadas.length - 1 ? 'border-b-0' : ''} ${
                      selecionados.has(d.id) ? 'bg-violet-900/20' : 'hover:bg-[#1e1e2e]/40'
                    }`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selecionados.has(d.id)} onChange={() => toggleUm(d.id)}
                        className="w-4 h-4 accent-violet-600 cursor-pointer align-middle" />
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-white font-medium max-w-[200px]">
                      <span className="truncate block">{d.descricao}</span>
                      {d.recorrente && (
                        <span className="text-violet-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <span>↺</span>
                          {d.periodicidade && <span>{d.periodicidade}</span>}
                          {d.parcela_total ? (
                            <span className="text-gray-500">· parcela {d.parcela_num}/{d.parcela_total}</span>
                          ) : d.parcela_num ? (
                            <span className="text-gray-600">· fixo contínuo</span>
                          ) : d.proxima_data ? (
                            <span className="text-gray-600">
                              · próx. {new Date(d.proxima_data + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          ) : null}
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
                    <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-white">
                      {fmt(Number(d.valor))}
                      {d.internacional && d.taxa_pct ? (
                        <span className="block text-[10px] text-gray-500 font-normal">🌎 incl. {d.taxa_pct}% taxa</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.anexo_path || d.anexo_url ? (
                        <button onClick={() => d.anexo_path ? onVerAnexo(d.anexo_path) : window.open(d.anexo_url, '_blank')}
                          title={d.anexo_nome ?? 'Ver anexo'}
                          className="text-violet-400 hover:text-violet-300 transition-colors text-base">
                          {d.anexo_nome?.endsWith('.pdf') ? '📄' : '🖼️'}
                        </button>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onDuplicate(d)} title="Duplicar"
                          className="text-gray-600 hover:text-blue-400 transition-colors text-sm">⧉</button>
                        <button onClick={() => onEdit(d)} title="Editar"
                          className="text-gray-600 hover:text-violet-400 transition-colors text-sm">✎</button>
                        <button onClick={() => onDelete(d)} title="Excluir"
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
  )
}

// ─── Projeção de Fluxo de Caixa ───────────────────────────────────────────────

function ProjecaoView({ despesas, receitas, ultimaRenovacao }: { despesas: Despesa[]; receitas: Receita[]; ultimaRenovacao?: string | null }) {
  const [saldoInicial, setSaldoInicial] = useState(0)

  // Janela: mês atual + 11 meses à frente
  const hoje = new Date()
  const meses: string[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const receitaValida = (r: Receita) => r.status !== 'cancelado' && r.status !== 'estornado'

  let acumulado = saldoInicial
  const linhas = meses.map(mes => {
    const entradas = receitas
      .filter(r => receitaValida(r) && r.data.startsWith(mes))
      .reduce((s, r) => s + Number(r.valor), 0)
    const saidas = despesas
      .filter(d => d.data.startsWith(mes))
      .reduce((s, d) => s + Number(d.valor), 0)
    const resultado = entradas - saidas
    acumulado += resultado
    const [ano, m] = mes.split('-')
    return {
      mes,
      label: `${MESES_LABEL[parseInt(m) - 1]}/${ano.slice(2)}`,
      entradas, saidas, resultado, saldo: acumulado,
    }
  })

  const totalEntradas = linhas.reduce((s, l) => s + l.entradas, 0)
  const totalSaidas   = linhas.reduce((s, l) => s + l.saidas, 0)
  const saldoFinal    = linhas.length ? linhas[linhas.length - 1].saldo : saldoInicial
  const primeiroNegativo = linhas.find(l => l.saldo < 0)

  return (
    <div className="space-y-6">
      {/* Controles + KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Saldo atual em caixa</p>
          <input type="number" step="0.01" value={saldoInicial || ''}
            onChange={e => setSaldoInicial(parseFloat(e.target.value) || 0)}
            placeholder="0,00"
            className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-1.5 text-lg font-bold text-white focus:outline-none focus:border-violet-600" />
          <p className="text-[11px] text-gray-600 mt-1">ponto de partida da projeção</p>
        </div>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Entradas previstas (12m)</p>
          <p className="text-2xl font-bold text-emerald-400">{fmt(totalEntradas)}</p>
        </div>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Saídas previstas (12m)</p>
          <p className="text-2xl font-bold text-red-400">{fmt(totalSaidas)}</p>
        </div>
        <div className={`bg-[#111118] border rounded-xl p-5 ${saldoFinal < 0 ? 'border-red-700/60' : 'border-[#1e1e2e]'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Saldo projetado (12m)</p>
          <p className={`text-2xl font-bold ${saldoFinal < 0 ? 'text-red-400' : 'text-violet-400'}`}>{fmt(saldoFinal)}</p>
        </div>
      </div>

      {primeiroNegativo && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4">
          <p className="text-sm text-red-300">
            ⚠️ <span className="font-semibold">Atenção ao caixa:</span> a projeção fica negativa em{' '}
            <span className="font-bold">{primeiroNegativo.label}</span> ({fmt(primeiroNegativo.saldo)}).
            Ajuste o saldo inicial ou reveja despesas/receitas desse período.
          </p>
        </div>
      )}

      {/* Gráfico do saldo acumulado */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Saldo de caixa projetado</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={linhas}>
            <defs>
              <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#7c3aed" fill="url(#gSaldo)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela mês a mês */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="bg-[#0d0d14]">
              <tr>{['Mês', 'Entradas', 'Saídas', 'Resultado', 'Saldo acumulado'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-medium text-left first:pl-4">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => (
                <tr key={l.mes} className={`border-t border-[#1e1e2e] ${i % 2 ? 'bg-[#0a0a10]' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-gray-200">{l.label}</td>
                  <td className="px-4 py-2.5 text-emerald-400">{l.entradas ? fmt(l.entradas) : '—'}</td>
                  <td className="px-4 py-2.5 text-red-400">{l.saidas ? fmt(l.saidas) : '—'}</td>
                  <td className={`px-4 py-2.5 font-medium ${l.resultado >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {l.resultado >= 0 ? '+' : ''}{fmt(l.resultado)}
                  </td>
                  <td className={`px-4 py-2.5 font-bold ${l.saldo < 0 ? 'text-red-400' : 'text-violet-300'}`}>{fmt(l.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-gray-600">
        <p>
          💡 Projeção baseada nos lançamentos já registrados (incluindo despesas fixas e parcelas futuras).
          Cadastre receitas recorrentes para enriquecer as entradas previstas.
        </p>
        {ultimaRenovacao && (
          <span className="text-gray-700 whitespace-nowrap">
            🔄 renovação automática: {new Date(ultimaRenovacao).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const supabase = createClient()

  const [despesas, setDespesas]   = useState<Despesa[]>([])
  const [receitas, setReceitas]   = useState<Receita[]>([])
  const [ultimaRenovacao, setUltimaRenovacao] = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState<Despesa | null>(null)
  const [duplicando, setDuplicando] = useState<Despesa | null>(null)
  const [aba, setAba]             = useState<'dashboard' | 'despesas' | 'projecao'>('dashboard')
  const [mesGlobal, setMesGlobal] = usePersistido<string>('financeiro:dashboard-mes', 'geral')

  const fetchDespesas = useCallback(async () => {
    setLoading(true)
    const [{ data: desp }, { data: rec }, { data: log }] = await Promise.all([
      supabase.from('despesas').select('*').order('data', { ascending: false }),
      supabase.from('receitas').select('*').order('data', { ascending: false }),
      supabase.from('cron_log').select('executado_em').order('executado_em', { ascending: false }).limit(1),
    ])
    setDespesas(desp ?? [])
    setReceitas((rec as Receita[]) ?? [])
    setUltimaRenovacao(log?.[0]?.executado_em ?? null)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchDespesas()
  }, [fetchDespesas])

  async function verAnexo(path: string) {
    const { data, error } = await supabase.storage
      .from('financeiro-anexos')
      .createSignedUrl(path, 120)
    if (error || !data?.signedUrl) { toast.error('Não foi possível abrir o anexo.'); return }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  function openNova() {
    setEditing(null)
    setDuplicando(null)
    setModalOpen(true)
  }

  function openEditar(d: Despesa) {
    setEditing(d)
    setDuplicando(null)
    setModalOpen(true)
  }

  function openDuplicar(d: Despesa) {
    setEditing(null)
    setDuplicando(d)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setDuplicando(null)
  }

  async function handleSave(d: DespesaInsert, file: File | undefined, id?: string) {
    const payload = { ...d }

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('financeiro-anexos')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (!uploadError && uploadData) {
        // bucket privado → guardamos o path; a URL é assinada na hora de ver
        payload.anexo_path = uploadData.path
        payload.anexo_nome = file.name
      }
    }

    if (id) {
      // Edição: altera apenas o registro atual (não regenera a série)
      const { serie_id: _s, parcela_num: _n, parcela_total: _t, ...editavel } = payload
      void _s; void _n; void _t
      const { error } = await supabase.from('despesas').update(editavel).eq('id', id)
      if (error) { toast.error(`Erro ao salvar: ${error.message}`); return }
      toast.success('Despesa atualizada')
    } else if (payload.recorrente && payload.periodicidade) {
      // Nova despesa recorrente → gera a série de lançamentos
      const total = payload.parcela_total ?? 12 // contínuo = janela de 12 ocorrências
      const serieId = crypto.randomUUID()
      const ehParcelado = payload.parcela_total != null
      const rows = Array.from({ length: total }, (_, i) => ({
        ...payload,
        data: addPeriodo(payload.data, payload.periodicidade!, i),
        serie_id: serieId,
        parcela_num: i + 1,
        parcela_total: ehParcelado ? total : null,
        descricao: ehParcelado ? `${payload.descricao} (${i + 1}/${total})` : payload.descricao,
        // anexo só na primeira ocorrência (evita duplicar o mesmo comprovante)
        anexo_path: i === 0 ? payload.anexo_path : undefined,
        anexo_nome: i === 0 ? payload.anexo_nome : undefined,
      }))
      const { error } = await supabase.from('despesas').insert(rows)
      if (error) { toast.error(`Erro ao salvar: ${error.message}`); return }
      toast.success(`${rows.length} lançamentos criados`)
    } else {
      const { error } = await supabase.from('despesas').insert(payload)
      if (error) { toast.error(`Erro ao salvar: ${error.message}`); return }
      toast.success('Despesa lançada')
    }
    closeModal()
    fetchDespesas()
  }

  async function handleDelete(d: Despesa) {
    if (d.serie_id) {
      const serieToda = await confirmar({
        titulo: 'Excluir série recorrente?',
        mensagem: 'Esta despesa faz parte de uma série.\n"Excluir série" remove todos os lançamentos; "Só este" remove apenas este mês.',
        confirmLabel: 'Excluir série',
        cancelLabel: 'Só este',
        perigoso: true,
      })
      if (serieToda) {
        await supabase.from('despesas').delete().eq('serie_id', d.serie_id)
        toast.success('Série excluída'); fetchDespesas(); return
      }
      if (!await confirmar({ titulo: 'Excluir só este lançamento?', confirmLabel: 'Excluir', perigoso: true })) return
      await supabase.from('despesas').delete().eq('id', d.id)
      toast.success('Lançamento excluído'); fetchDespesas(); return
    }
    if (!await confirmar({ titulo: 'Excluir esta despesa?', confirmLabel: 'Excluir', perigoso: true })) return
    await supabase.from('despesas').delete().eq('id', d.id)
    toast.success('Despesa excluída'); fetchDespesas()
  }

  async function handleDeleteMany(ids: string[]) {
    const ok = await confirmar({
      titulo: `Excluir ${ids.length} lançamento${ids.length > 1 ? 's' : ''}?`,
      mensagem: 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir', perigoso: true,
    })
    if (!ok) return
    await supabase.from('despesas').delete().in('id', ids)
    toast.success(`${ids.length} excluído${ids.length > 1 ? 's' : ''}`)
    fetchDespesas()
  }

  // Dashboard considera só o REALIZADO (até hoje) — o futuro fica na aba Projeção
  const hojeISO = new Date().toISOString().slice(0, 10)
  const despesasRealizadas = despesas.filter(d => d.data <= hojeISO)

  // Meses disponíveis para o filtro global (só meses já realizados)
  const mesesDisponiveis = Array.from(new Set(despesasRealizadas.map(d => d.data.slice(0, 7)))).sort().reverse()
  const despesasDashboard = mesGlobal === 'geral'
    ? despesasRealizadas
    : despesasRealizadas.filter(d => d.data.startsWith(mesGlobal))

  const totalGeral = despesasRealizadas.reduce((s, d) => s + Number(d.valor), 0)

  // Alertas de vencimento — despesas a vencer nos próximos 7 dias
  const hojeStr = new Date().toISOString().slice(0, 10)
  const limiteStr = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)
  const aVencer = despesas
    .filter(d => d.data >= hojeStr && d.data <= limiteStr)
    .sort((a, b) => a.data.localeCompare(b.data))
  const totalAVencer = aVencer.reduce((s, d) => s + Number(d.valor), 0)

  return (
    <PainelShell>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <SubNav tabs={SUBNAV.financeiro} />

        {/* Título + controles */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Controle Financeiro</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {despesasRealizadas.length} lançamentos realizados · {fmt(totalGeral)} já gasto
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtro de mês global — só aparece no dashboard */}
            {aba === 'dashboard' && (
              <select value={mesGlobal} onChange={e => setMesGlobal(e.target.value)}
                className="bg-[#111118] border border-[#2d2d3d] text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-600 transition-colors">
                <option value="geral">📊 Visão geral</option>
                {mesesDisponiveis.map(m => {
                  const [ano, mes] = m.split('-')
                  return <option key={m} value={m}>{MESES_FULL[parseInt(mes) - 1]} {ano}</option>
                })}
              </select>
            )}

            {/* Abas */}
            <div className="flex items-center gap-2 bg-[#111118] border border-[#1e1e2e] rounded-xl p-1">
              {(['dashboard', 'despesas', 'projecao'] as const).map(t => (
                <button key={t} onClick={() => setAba(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    aba === t ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}>
                  {t === 'dashboard' ? '📊 Dashboard' : t === 'despesas' ? '📋 Despesas' : '📈 Projeção'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Alerta de vencimentos próximos */}
        {!loading && aVencer.length > 0 && (
          <div className="bg-amber-900/15 border border-amber-800/40 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-amber-300">
                ⏰ <span className="font-semibold">{aVencer.length} despesa{aVencer.length > 1 ? 's' : ''} a vencer</span> nos próximos 7 dias
                <span className="text-amber-400/70"> · {fmt(totalAVencer)}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {aVencer.slice(0, 4).map(d => (
                  <span key={d.id} className="text-[11px] bg-amber-900/30 text-amber-200 rounded px-2 py-0.5">
                    {d.descricao.slice(0, 24)} · {new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                ))}
                {aVencer.length > 4 && <span className="text-[11px] text-amber-400/70">+{aVencer.length - 4}</span>}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32 text-gray-600">Carregando…</div>
        ) : aba === 'dashboard' ? (
          <DashboardView despesas={despesasDashboard} periodo={mesGlobal} />
        ) : aba === 'projecao' ? (
          <ProjecaoView despesas={despesas} receitas={receitas} ultimaRenovacao={ultimaRenovacao} />
        ) : (
          <DespesasView despesas={despesas} onDelete={handleDelete} onDeleteMany={handleDeleteMany} onEdit={openEditar} onDuplicate={openDuplicar} onVerAnexo={verAnexo} onAdd={openNova} />
        )}
      </div>

      <ModalDespesa open={modalOpen} editing={editing} duplicando={duplicando} onClose={closeModal} onSave={handleSave} />
    </PainelShell>
  )
}
