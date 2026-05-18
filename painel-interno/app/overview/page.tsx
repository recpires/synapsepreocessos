'use client'

import { useState, useEffect } from 'react'
import PainelShell from '@/components/PainelShell'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

const PRODUTOS_PRIORIDADE = [
  { rank: 1, nome: 'Nero Barber',    sub: 'Mais maduro · sprint ativa',     score: 4.1, pct: 82, color: 'text-amber-400'  },
  { rank: 2, nome: 'Psi Aura',       sub: 'Precisa atenção técnica',         score: 3.3, pct: 65, color: 'text-slate-400'  },
  { rank: 3, nome: 'CRM Nexio',      sub: 'MVP em andamento',                score: 2.8, pct: 56, color: 'text-orange-400' },
  { rank: 4, nome: 'Kubic Eng',      sub: 'Validar com clientes',            score: 2.6, pct: 52, color: 'text-blue-400'   },
  { rank: 5, nome: 'Arquetipos App', sub: 'Definir escopo primeiro',         score: 2.0, pct: 40, color: 'text-violet-400' },
]

const ACOES = [
  { texto: 'Configurar pipeline no CRM Nexio com estágios do processo de vendas',  area: 'Comercial',   cor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40'   },
  { texto: 'Gravar primeiros 4 Reels do Nero Barber (semana 1 do calendário)',      area: 'Marketing',   cor: 'bg-violet-900/30 text-violet-400 border border-violet-800/40' },
  { texto: 'Sprint 1: revisar onboarding do cliente no Nero Barber',               area: 'Dev',         cor: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40' },
  { texto: 'Mapear MRR atual e custos fixos mensais',                              area: 'Financeiro',  cor: 'bg-amber-900/30 text-amber-400 border border-amber-800/40'  },
  { texto: 'Formalizar reunião semanal com Wilian (dia e hora fixos)',             area: 'Time',        cor: 'bg-orange-900/30 text-orange-400 border border-orange-800/40' },
  { texto: 'Definir setor e público-alvo do Arquetipos App',                       area: 'Dev',         cor: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40' },
]

function StatCard({ dot, label, value, sub }: { dot?: string; label: string; value: string; sub: string }) {
  return (
    <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot ?? '#7c3aed' }} />
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold text-white leading-none mb-1">{value}</p>
      <p className="text-xs text-gray-500 mt-1.5">{sub}</p>
    </div>
  )
}

export default function OverviewPage() {
  const [dataStr, setDataStr] = useState('')
  const [checks, setChecks] = useState<boolean[]>(ACOES.map(() => false))

  useEffect(() => {
    const d = new Date()
    setDataStr(`${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`)
  }, [])

  function toggle(i: number) {
    setChecks(c => c.map((v, j) => j === i ? !v : v))
  }

  return (
    <PainelShell>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Bom dia, Rodrigo 👋</h1>
            <p className="text-gray-500 text-sm mt-0.5">Synapse Code · Software House · 2 pessoas · 5 produtos ativos</p>
          </div>
          <span className="text-sm text-gray-600">{dataStr}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard dot="#34d399" label="Produtos ativos"           value="5"           sub="Nero Barber · Psi Aura · CRM Nexio · Kubic Eng · Arquetipos" />
          <StatCard dot="#fbbf24" label="Foco atual"                value="Nero Barber" sub="Sprint 1 · Estabilização + Marketing" />
          <StatCard dot="#60a5fa" label="Processos documentados"    value="5"           sub="Dev · Comercial · Marketing · Financeiro · Time" />
        </div>

        {/* Priority + Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Prioridade dos produtos */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
              Prioridade dos produtos
            </p>
            <div className="space-y-4">
              {PRODUTOS_PRIORIDADE.map(p => (
                <div key={p.rank} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${p.color} bg-white/5`}>
                    {p.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{p.nome}</div>
                    <div className="text-xs text-gray-500">{p.sub}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-20 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full" style={{ width: `${p.pct}%` }} />
                    </div>
                    <span className={`text-xs font-semibold w-7 text-right ${p.color}`}>{p.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Próximas ações */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Próximas ações prioritárias
            </p>
            <div className="space-y-3">
              {ACOES.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <button
                    onClick={() => toggle(i)}
                    className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                      checks[i] ? 'bg-violet-600 border-violet-600' : 'border-gray-600 hover:border-violet-500'
                    }`}
                  >
                    {checks[i] && <span className="text-[10px] text-white">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${checks[i] ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                      {a.texto}
                    </p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${a.cor}`}>
                    {a.area}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PainelShell>
  )
}
