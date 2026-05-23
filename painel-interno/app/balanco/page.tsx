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

        {/* Versão impressa: header limpo */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Balanço Semestral — Synapse Code</h1>
          <p className="text-gray-700 text-base">
            {semestre === 'S1' ? '1º Semestre' : '2º Semestre'} de {ano} —
            {' '}{semestre === 'S1' ? 'Janeiro a Junho' : 'Julho a Dezembro'}
          </p>
          <p className="text-gray-500 text-sm mt-1">Emitido em {hoje.toLocaleDateString('pt-BR')}</p>
          <hr className="mt-4 border-gray-300" />
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
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#1e1e2e] print:border-gray-300">
                          {['#','Data','Descrição','Categoria','Produto','Tipo','Valor'].map(h => (
                            <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap print:text-gray-700">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {top10.map((d, i) => (
                          <tr key={d.id} className="border-b border-[#1e1e2e]/60 print:border-gray-200">
                            <td className="px-4 py-2.5 text-gray-500 print:text-gray-700">{i + 1}</td>
                            <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap print:text-gray-700">{fmtDataPT(d.data)}</td>
                            <td className="px-4 py-2.5 text-white max-w-[260px] truncate print:text-black">{d.descricao}</td>
                            <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap print:text-gray-700">{d.categoria}</td>
                            <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap print:text-gray-700">{d.produto}</td>
                            <td className="px-4 py-2.5 text-gray-500 capitalize whitespace-nowrap print:text-gray-700">{d.tipo}</td>
                            <td className="px-4 py-2.5 text-red-400 font-semibold whitespace-nowrap print:text-red-700">{fmt(Number(d.valor))}</td>
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
          @page { size: A4; margin: 1.5cm; }
          body { background: white !important; color: black !important; }
          aside, header { display: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </PainelShell>
  )
}
