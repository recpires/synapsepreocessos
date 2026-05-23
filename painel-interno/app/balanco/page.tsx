'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { type Despesa, CATEGORIAS, PRODUTOS_LISTA } from '@/types/financeiro'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtCompacto = (v: number) =>
  v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v.toFixed(0)}`

const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const CHART_COLORS = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#84cc16','#f97316']

type Semestre = 'S1' | 'S2'

function mesesDoSemestre(semestre: Semestre): number[] {
  return semestre === 'S1' ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11]
}

function rangeSemestre(ano: number, semestre: Semestre): { inicio: string; fim: string } {
  if (semestre === 'S1') {
    return { inicio: `${ano}-01-01`, fim: `${ano}-06-30` }
  }
  return { inicio: `${ano}-07-01`, fim: `${ano}-12-31` }
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BalancoPage() {
  const supabase = createClient()
  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const semestreAtual: Semestre = hoje.getMonth() < 6 ? 'S1' : 'S2'

  const [ano, setAno]             = useState<number>(anoAtual)
  const [semestre, setSemestre]   = useState<Semestre>(semestreAtual)
  const [despesas, setDespesas]   = useState<Despesa[]>([])
  const [loading, setLoading]     = useState(true)
  const [receitas, setReceitas]   = useState<Record<string, number>>({})

  // Buscar despesas do semestre
  const fetchDespesas = useCallback(async () => {
    setLoading(true)
    const { inicio, fim } = rangeSemestre(ano, semestre)
    const { data } = await supabase
      .from('despesas')
      .select('*')
      .gte('data', inicio)
      .lte('data', fim)
      .order('data', { ascending: true })
    setDespesas((data as Despesa[]) ?? [])
    setLoading(false)
  }, [supabase, ano, semestre])

  useEffect(() => { fetchDespesas() }, [fetchDespesas])

  // Carregar receitas do localStorage
  const storageKey = `balanco-receitas-${ano}-${semestre}`
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      setReceitas(stored ? JSON.parse(stored) : {})
    } catch {
      setReceitas({})
    }
  }, [storageKey])

  function atualizarReceita(produto: string, valor: number) {
    const nova = { ...receitas, [produto]: valor }
    setReceitas(nova)
    try { localStorage.setItem(storageKey, JSON.stringify(nova)) } catch {}
  }

  // Anos disponíveis (do atual a 3 anos atrás)
  const anosDisponiveis = useMemo(
    () => Array.from({ length: 4 }, (_, i) => anoAtual - i),
    [anoAtual]
  )

  // Cálculos
  const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0)
  const totalReceitas = Object.values(receitas).reduce((s, v) => s + (Number(v) || 0), 0)
  const lucroLiquido  = totalReceitas - totalDespesas
  const margem        = totalReceitas > 0 ? (lucroLiquido / totalReceitas) * 100 : 0

  // Por mês
  const meses = mesesDoSemestre(semestre)
  const porMes = meses.map(m => {
    const desp = despesas
      .filter(d => new Date(d.data + 'T00:00:00').getMonth() === m)
      .reduce((s, d) => s + Number(d.valor), 0)
    return { mes: MESES_LABEL[m], despesas: desp }
  })

  // Por categoria
  const porCategoria = CATEGORIAS.map(cat => {
    const valor = despesas
      .filter(d => d.categoria === cat)
      .reduce((s, d) => s + Number(d.valor), 0)
    return { name: cat, value: valor }
  }).filter(c => c.value > 0).sort((a, b) => b.value - a.value)

  // Por produto
  const porProduto = PRODUTOS_LISTA.map(prod => {
    const desp = despesas
      .filter(d => d.produto === prod)
      .reduce((s, d) => s + Number(d.valor), 0)
    const rec = Number(receitas[prod]) || 0
    return {
      produto: prod,
      receita: rec,
      despesas: desp,
      lucro: rec - desp,
      margem: rec > 0 ? ((rec - desp) / rec) * 100 : 0,
    }
  }).filter(p => p.despesas > 0 || p.receita > 0)

  // Por tipo (fixo / variável / pontual)
  const porTipo = ['fixo', 'variavel', 'pontual'].map(t => ({
    tipo: t,
    valor: despesas.filter(d => d.tipo === t).reduce((s, d) => s + Number(d.valor), 0),
  }))

  // Top 10 maiores despesas
  const top10 = [...despesas]
    .sort((a, b) => Number(b.valor) - Number(a.valor))
    .slice(0, 10)

  function imprimir() {
    window.print()
  }

  const fmtDataPT = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

  return (
    <PainelShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 print:px-0 print:py-0">
        {/* Cabeçalho + controles */}
        <div className="flex items-start sm:items-center justify-between flex-wrap gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-white">Balanço Semestral</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Relatório financeiro consolidado para fechamento do período.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={ano}
              onChange={e => setAno(parseInt(e.target.value))}
              className="bg-[#111118] border border-[#2d2d3d] text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-600 transition-colors"
            >
              {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <div className="flex items-center gap-1 bg-[#111118] border border-[#1e1e2e] rounded-xl p-1">
              {(['S1', 'S2'] as const).map(s => (
                <button key={s} onClick={() => setSemestre(s)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    semestre === s ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}>
                  {s === 'S1' ? '1º Semestre' : '2º Semestre'}
                </button>
              ))}
            </div>

            <button onClick={imprimir}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              🖨️ Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Versão impressa: cabeçalho executivo */}
        <div className="hidden print:block print-header">
          <div className="print-header-top">
            <div>
              <p className="print-eyebrow">SYNAPSE CODE</p>
              <h1 className="print-title">Balanço Semestral</h1>
              <p className="print-subtitle">
                {semestre === 'S1' ? '1º Semestre' : '2º Semestre'} de {ano}
                {' · '}
                {semestre === 'S1' ? 'Janeiro a Junho' : 'Julho a Dezembro'}
              </p>
            </div>
            <div className="print-header-meta">
              <p><strong>Emitido em</strong></p>
              <p>{hoje.toLocaleDateString('pt-BR')}</p>
              <p className="print-meta-small">Painel Interno · Confidencial</p>
            </div>
          </div>
          <div className="print-divider" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32 text-gray-600">Carregando…</div>
        ) : (
          <>
            {/* Resumo */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-white print:text-black print:text-xl">Resumo</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-5 print:bg-white print:border-gray-300">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1 print:text-gray-700">Receita total</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400 print:text-emerald-700">{fmt(totalReceitas)}</p>
                </div>
                <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-5 print:bg-white print:border-gray-300">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1 print:text-gray-700">Despesa total</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-400 print:text-red-700">{fmt(totalDespesas)}</p>
                  <p className="text-xs text-gray-500 mt-1">{despesas.length} lançamentos</p>
                </div>
                <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-5 print:bg-white print:border-gray-300">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1 print:text-gray-700">Lucro líquido</p>
                  <p className={`text-xl sm:text-2xl font-bold ${lucroLiquido >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-red-400 print:text-red-700'}`}>
                    {fmt(lucroLiquido)}
                  </p>
                </div>
                <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-5 print:bg-white print:border-gray-300">
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1 print:text-gray-700">Margem</p>
                  <p className={`text-xl sm:text-2xl font-bold ${margem >= 0 ? 'text-violet-400 print:text-violet-700' : 'text-red-400 print:text-red-700'}`}>
                    {totalReceitas > 0 ? `${margem.toFixed(1)}%` : '—'}
                  </p>
                </div>
              </div>
            </section>

            {/* Receitas — input manual */}
            <section className="space-y-3 print:break-inside-avoid">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <h2 className="text-lg font-semibold text-white print:text-black print:text-xl">Receitas por Produto</h2>
                <p className="text-xs text-gray-500 print:hidden">
                  Receitas ainda não estão no banco — informe abaixo para incluir no balanço (salvo localmente).
                </p>
              </div>
              <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden print:bg-white print:border-gray-300">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1e1e2e] print:border-gray-300">
                        {['Produto', 'Receita (R$)', 'Despesas', 'Lucro', 'Margem'].map(h => (
                          <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap print:text-gray-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PRODUTOS_LISTA.map(prod => {
                        const p = porProduto.find(x => x.produto === prod) ?? { produto: prod, receita: 0, despesas: 0, lucro: 0, margem: 0 }
                        return (
                          <tr key={prod} className="border-b border-[#1e1e2e]/60 print:border-gray-200">
                            <td className="px-4 py-2.5 text-white font-medium print:text-black">{prod}</td>
                            <td className="px-4 py-2.5">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={receitas[prod] ?? ''}
                                onChange={e => atualizarReceita(prod, parseFloat(e.target.value) || 0)}
                                placeholder="0,00"
                                className="w-32 bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-violet-600 transition-colors print:hidden"
                              />
                              <span className="hidden print:inline text-black">{fmt(p.receita)}</span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-400 print:text-gray-700">{fmt(p.despesas)}</td>
                            <td className={`px-4 py-2.5 font-medium ${p.lucro >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-red-400 print:text-red-700'}`}>
                              {fmt(p.lucro)}
                            </td>
                            <td className="px-4 py-2.5 text-gray-400 print:text-gray-700">
                              {p.receita > 0 ? `${p.margem.toFixed(1)}%` : '—'}
                            </td>
                          </tr>
                        )
                      })}
                      <tr className="bg-[#0a0a0f] font-bold print:bg-gray-100">
                        <td className="px-4 py-3 text-white print:text-black">TOTAL</td>
                        <td className="px-4 py-3 text-emerald-400 print:text-emerald-700">{fmt(totalReceitas)}</td>
                        <td className="px-4 py-3 text-red-400 print:text-red-700">{fmt(totalDespesas)}</td>
                        <td className={`px-4 py-3 ${lucroLiquido >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-red-400 print:text-red-700'}`}>
                          {fmt(lucroLiquido)}
                        </td>
                        <td className="px-4 py-3 text-violet-400 print:text-violet-700">
                          {totalReceitas > 0 ? `${margem.toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Gráficos: Por mês e Por categoria */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:break-inside-avoid">
              <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 print:bg-white print:border-gray-300">
                <h3 className="text-sm font-semibold text-white mb-4 print:text-black">Despesas por mês</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={porMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="mes" stroke="#666" fontSize={12} />
                    <YAxis tickFormatter={fmtCompacto} stroke="#666" fontSize={12} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="despesas" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Despesas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 print:bg-white print:border-gray-300">
                <h3 className="text-sm font-semibold text-white mb-4 print:text-black">Despesas por categoria</h3>
                {porCategoria.length === 0 ? (
                  <div className="flex items-center justify-center h-[260px] text-gray-600 text-sm">Sem dados</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={porCategoria}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {porCategoria.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Tipo de despesa */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 print:break-inside-avoid">
              {porTipo.map(t => {
                const pct = totalDespesas > 0 ? (t.valor / totalDespesas) * 100 : 0
                const cor =
                  t.tipo === 'fixo'     ? 'text-blue-400 print:text-blue-700' :
                  t.tipo === 'variavel' ? 'text-yellow-400 print:text-yellow-700' :
                                          'text-gray-400 print:text-gray-700'
                const label =
                  t.tipo === 'fixo'     ? 'Despesas Fixas' :
                  t.tipo === 'variavel' ? 'Despesas Variáveis' :
                                          'Despesas Pontuais'
                return (
                  <div key={t.tipo} className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 print:bg-white print:border-gray-300">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 print:text-gray-700">{label}</p>
                    <p className={`text-xl font-bold ${cor}`}>{fmt(t.valor)}</p>
                    <p className="text-xs text-gray-500 mt-1 print:text-gray-700">{pct.toFixed(1)}% do total</p>
                  </div>
                )
              })}
            </section>

            {/* Top 10 maiores despesas */}
            <section className="space-y-3 print:break-inside-avoid">
              <h2 className="text-lg font-semibold text-white print:text-black print:text-xl">Top 10 — Maiores Despesas</h2>
              <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden print:bg-white print:border-gray-300">
                {top10.length === 0 ? (
                  <div className="text-center py-10 text-gray-600 text-sm">Sem despesas no período</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm top10-table">
                      <colgroup className="hidden print:table-column-group">
                        <col style={{ width: '4%'  }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '38%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '16%' }} />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-[#1e1e2e] print:border-gray-400">
                          <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap print:text-gray-800">#</th>
                          <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap print:text-gray-800">Data</th>
                          <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap print:text-gray-800">Descrição</th>
                          <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap print:text-gray-800">Categoria</th>
                          <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap print:text-gray-800 print:hidden">Produto</th>
                          <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap print:text-gray-800 print:hidden">Tipo</th>
                          <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap print:text-gray-800 hidden print:table-cell">Produto</th>
                          <th className="text-right text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap print:text-gray-800">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {top10.map((d, i) => (
                          <tr key={d.id} className="border-b border-[#1e1e2e]/60 print:border-gray-200">
                            <td className="px-4 py-2.5 text-gray-500 print:text-gray-700">{i + 1}</td>
                            <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap print:text-gray-700 print:whitespace-normal">{fmtDataPT(d.data)}</td>
                            <td className="px-4 py-2.5 text-white max-w-[260px] truncate print:text-black print:max-w-none print:whitespace-normal print:overflow-visible">{d.descricao}</td>
                            <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap print:text-gray-700 print:whitespace-normal">{d.categoria}</td>
                            <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap print:text-gray-700 print:hidden">{d.produto}</td>
                            <td className="px-4 py-2.5 text-gray-500 capitalize whitespace-nowrap print:text-gray-700 print:hidden">{d.tipo}</td>
                            <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap print:text-gray-700 print:whitespace-normal hidden print:table-cell">{d.produto}</td>
                            <td className="px-4 py-2.5 text-right text-red-400 font-semibold whitespace-nowrap print:text-red-700">{fmt(Number(d.valor))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* Conclusão */}
            <section className="bg-[#0f0f17] border border-[#1e1e2e] rounded-xl p-5 print:bg-gray-50 print:border-gray-300 print:break-inside-avoid">
              <h3 className="text-sm font-semibold text-white mb-3 print:text-black">Síntese do Período</h3>
              <ul className="space-y-2 text-sm text-gray-300 print:text-gray-800">
                <li>• Período analisado: <strong className="text-white print:text-black">{semestre === 'S1' ? 'Janeiro a Junho' : 'Julho a Dezembro'} de {ano}</strong> ({despesas.length} lançamentos).</li>
                <li>• Receita declarada: <strong className="text-emerald-400 print:text-emerald-700">{fmt(totalReceitas)}</strong> · Despesa total: <strong className="text-red-400 print:text-red-700">{fmt(totalDespesas)}</strong>.</li>
                <li>• Resultado líquido: <strong className={lucroLiquido >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-red-400 print:text-red-700'}>{fmt(lucroLiquido)}</strong> ({totalReceitas > 0 ? `margem ${margem.toFixed(1)}%` : 'sem receita declarada'}).</li>
                {porCategoria[0] && (
                  <li>• Maior categoria de despesa: <strong className="text-white print:text-black">{porCategoria[0].name}</strong> ({fmt(porCategoria[0].value)} — {((porCategoria[0].value / totalDespesas) * 100).toFixed(1)}% do total).</li>
                )}
              </ul>
              <p className="text-xs text-gray-600 mt-4 print:text-gray-600">
                Documento gerado em {hoje.toLocaleDateString('pt-BR')} · Synapse Code · Painel Interno
              </p>
            </section>
          </>
        )}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.8cm 1.5cm 1.8cm 1.5cm;
          }

          /* Reset agressivo para nada estourar a margem */
          * {
            box-sizing: border-box !important;
            max-width: 100% !important;
          }

          html, body {
            background: #ffffff !important;
            color: #111 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Helvetica Neue', Helvetica, Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
            font-size: 9pt !important;
            line-height: 1.5 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Esconder shell, sidebar, topbar mobile, controles interativos */
          aside,
          .md\\:hidden,
          .print\\:hidden {
            display: none !important;
          }

          /* Anular layout flex do PainelShell e overflow horizontal */
          body > div,
          body > div > div,
          .flex {
            display: block !important;
            background: #ffffff !important;
            width: 100% !important;
            overflow: visible !important;
          }
          .min-h-screen { min-height: auto !important; }

          /* Container principal — usa toda a área disponível */
          .max-w-7xl {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          main {
            overflow: visible !important;
            width: 100% !important;
          }

          /* Override universal: nada whitespace-nowrap no print (quebra elegante) */
          .whitespace-nowrap { white-space: normal !important; }
          .truncate {
            text-overflow: clip !important;
            overflow: visible !important;
            white-space: normal !important;
          }

          /* Cabeçalho executivo */
          .print-header {
            margin: 0 0 20pt 0 !important;
            padding-bottom: 12pt;
            border-bottom: 2pt solid #111;
            width: 100% !important;
          }
          .print-header-top {
            display: table !important;
            width: 100% !important;
            table-layout: fixed;
          }
          .print-header-top > div {
            display: table-cell !important;
            vertical-align: top;
          }
          .print-header-top > div:last-child {
            text-align: right;
            width: 35% !important;
          }
          .print-eyebrow {
            font-size: 7.5pt;
            letter-spacing: 2.5pt;
            color: #7c3aed !important;
            font-weight: 700;
            margin: 0 0 6pt 0;
            text-transform: uppercase;
          }
          .print-title {
            font-size: 24pt;
            font-weight: 700;
            color: #0a0a0f !important;
            letter-spacing: -0.6pt;
            margin: 0 0 6pt 0;
            line-height: 1.05;
          }
          .print-subtitle {
            font-size: 10.5pt;
            color: #4a4a55 !important;
            margin: 0;
            font-weight: 400;
          }
          .print-header-meta {
            text-align: right;
            font-size: 8.5pt;
            color: #4a4a55 !important;
          }
          .print-header-meta p { margin: 0 0 2pt 0; }
          .print-header-meta strong { color: #0a0a0f !important; }
          .print-meta-small {
            font-size: 7pt !important;
            color: #888 !important;
            letter-spacing: 1pt;
            text-transform: uppercase;
            margin-top: 8pt !important;
            font-weight: 600;
          }
          .print-divider {
            display: none;
          }

          /* Títulos de seção */
          section { margin-bottom: 14pt !important; width: 100% !important; }
          .space-y-6 > section { margin-bottom: 16pt !important; }
          h2 {
            font-size: 11pt !important;
            font-weight: 700 !important;
            color: #0a0a0f !important;
            margin: 14pt 0 8pt 0 !important;
            padding-bottom: 5pt;
            border-bottom: 0.6pt solid #999;
            letter-spacing: 0.3pt;
            text-transform: uppercase;
          }
          h3 {
            font-size: 9.5pt !important;
            font-weight: 700 !important;
            color: #0a0a0f !important;
            margin: 0 0 8pt 0 !important;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
          }

          /* Cards / boxes — bordas suaves, sem fundo cinza pra economizar tinta */
          .bg-\\[\\#111118\\],
          .bg-\\[\\#0a0a0f\\],
          .bg-\\[\\#0f0f17\\] {
            background: #ffffff !important;
          }
          .border-\\[\\#1e1e2e\\],
          .border-\\[\\#2d2d3d\\] {
            border-color: #d4d4d8 !important;
          }
          .rounded-xl { border-radius: 4pt !important; }

          /* Grids */
          .grid {
            display: grid !important;
            gap: 6pt !important;
            width: 100% !important;
          }
          .grid-cols-2 { grid-template-columns: repeat(2, 1fr) !important; }
          .lg\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr) !important; }
          .sm\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr) !important; }
          .lg\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr) !important; }

          /* KPI cards — compactos */
          .p-4, .p-5, .sm\\:p-5 {
            padding: 8pt 10pt !important;
          }
          .text-xl, .sm\\:text-2xl, .text-2xl {
            font-size: 13pt !important;
            letter-spacing: -0.3pt;
          }
          .text-\\[10px\\], .text-xs, .sm\\:text-xs {
            font-size: 7pt !important;
          }
          .text-sm { font-size: 8.5pt !important; }
          .text-lg { font-size: 11pt !important; }

          /* Tabelas — espaçamento e tipografia profissional */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 8.5pt !important;
            table-layout: fixed !important;
          }
          table th {
            font-weight: 700 !important;
            font-size: 7pt !important;
            text-transform: uppercase;
            letter-spacing: 0.6pt;
            color: #444 !important;
            padding: 6pt 5pt !important;
            border-bottom: 1pt solid #333 !important;
            background: transparent !important;
            text-align: left;
          }
          table th.text-right { text-align: right !important; }
          table td {
            padding: 5pt !important;
            border-bottom: 0.4pt solid #e5e5e7 !important;
            vertical-align: top;
            word-break: break-word;
            overflow-wrap: anywhere;
            line-height: 1.4;
          }
          table tbody tr:last-child td { border-bottom: 0.6pt solid #333 !important; }

          /* Tabela Top 10 — compactar ainda mais */
          .top10-table { font-size: 8pt !important; }
          .top10-table td { padding: 4pt 5pt !important; }

          /* Remover overflow horizontal */
          .overflow-x-auto, .overflow-hidden, .overflow-y-auto {
            overflow: visible !important;
            width: 100% !important;
          }

          /* Inputs (receita por produto) — exibir valor em vez do campo */
          input { display: none !important; }

          /* Page breaks — proteger blocos coesos */
          .print\\:break-inside-avoid,
          section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table, thead, tbody, tr { break-inside: avoid !important; page-break-inside: avoid !important; }
          h2, h3 { break-after: avoid; page-break-after: avoid; }

          /* Recharts */
          .recharts-wrapper, .recharts-surface {
            max-width: 100% !important;
            width: 100% !important;
          }

          /* Cores explícitas (escape para forçar) */
          .print\\:text-black { color: #0a0a0f !important; }
          .print\\:text-gray-700 { color: #525252 !important; }
          .print\\:text-gray-800 { color: #333 !important; }
          .print\\:text-emerald-700 { color: #047857 !important; }
          .print\\:text-red-700 { color: #b91c1c !important; }
          .print\\:text-violet-700 { color: #6d28d9 !important; }
          .print\\:text-blue-700 { color: #1d4ed8 !important; }
          .print\\:text-yellow-700 { color: #a16207 !important; }
          .print\\:bg-white { background: #ffffff !important; }
          .print\\:bg-gray-50 { background: #fafafa !important; }
          .print\\:bg-gray-100 { background: #f3f3f5 !important; }
          .print\\:border-gray-200 { border-color: #e5e5e7 !important; }
          .print\\:border-gray-300 { border-color: #d4d4d8 !important; }
          .print\\:border-gray-400 { border-color: #888 !important; }

          /* Linha de totais na tabela de receitas */
          .bg-\\[\\#0a0a0f\\].font-bold,
          tr.bg-\\[\\#0a0a0f\\] {
            background: #f4f4f5 !important;
          }
          tr.bg-\\[\\#0a0a0f\\] td {
            border-top: 1pt solid #333 !important;
            border-bottom: 1pt solid #333 !important;
            font-weight: 700 !important;
            padding-top: 6pt !important;
            padding-bottom: 6pt !important;
          }

          /* Síntese final */
          ul {
            list-style: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          ul li {
            margin-bottom: 5pt;
            font-size: 9pt;
            line-height: 1.5;
            padding-left: 10pt;
            position: relative;
          }
          ul li::before {
            content: '▸';
            position: absolute;
            left: 0;
            color: #7c3aed;
            font-weight: 700;
          }

          /* Rodapé com número de página em cada folha */
          @page {
            @bottom-right {
              content: counter(page) ' / ' counter(pages);
              font-size: 8pt;
              color: #888;
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            }
            @bottom-left {
              content: 'Synapse Code · Balanço Semestral';
              font-size: 8pt;
              color: #888;
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            }
          }
        }
      `}</style>
    </PainelShell>
  )
}
