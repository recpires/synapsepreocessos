'use client'

import { useState, useEffect, useCallback } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'

const DIAS  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

const PRODUTOS_PRIORIDADE = [
  { rank: 1, nome: 'Nero Barber',    sub: 'Mais maduro · sprint ativa',     score: 4.1, pct: 82, color: 'text-amber-400'  },
  { rank: 2, nome: 'Psi Aura',       sub: 'Precisa atenção técnica',         score: 3.3, pct: 65, color: 'text-slate-400'  },
  { rank: 3, nome: 'CRM Nexio',      sub: 'MVP em andamento',                score: 2.8, pct: 56, color: 'text-orange-400' },
  { rank: 4, nome: 'Kubic Eng',      sub: 'Validar com clientes',            score: 2.6, pct: 52, color: 'text-blue-400'   },
  { rank: 5, nome: 'Arquetipos App', sub: 'Definir escopo primeiro',         score: 2.0, pct: 40, color: 'text-violet-400' },
]

// ── Area colors ──────────────────────────────────────────────────────────
const AREA_COR: Record<string, string> = {
  'Comercial':  'bg-blue-900/30 text-blue-400 border border-blue-800/40',
  'Marketing':  'bg-violet-900/30 text-violet-400 border border-violet-800/40',
  'Dev':        'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40',
  'Financeiro': 'bg-amber-900/30 text-amber-400 border border-amber-800/40',
  'Time':       'bg-orange-900/30 text-orange-400 border border-orange-800/40',
  'Pipeline':   'bg-cyan-900/30 text-cyan-400 border border-cyan-800/40',
  'Geral':      'bg-gray-800 text-gray-400 border border-gray-700',
}

const AREAS = ['Comercial','Marketing','Dev','Financeiro','Time','Geral'] as const

type Tarefa = {
  id: string
  texto: string
  area: string
  prioridade: number
  status: string
  fonte: string
  ref_id?: string
  created_at: string
}

// ── Pipeline próximos passos → tarefas virtuais ───────────────────────────
type PipelineLead = {
  id: string
  nome: string
  empresa?: string
  proximo_passo: string
  etapa: string
}

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
  const supabase = createClient()
  const [dataStr, setDataStr]     = useState('')
  const [userEmail, setUserEmail] = useState('')

  // Tasks state
  const [tarefas, setTarefas]         = useState<Tarefa[]>([])
  const [pipelineTasks, setPipelineTasks] = useState<(Tarefa & { _virtual: true })[]>([])
  const [loadingTasks, setLoadingTasks]   = useState(true)

  // Add modal
  const [addOpen, setAddOpen]     = useState(false)
  const [novaTexto, setNovaTexto] = useState('')
  const [novaArea, setNovaArea]   = useState<string>('Geral')
  const [novaPrio, setNovaPrio]   = useState(2)
  const [saving, setSaving]       = useState(false)

  // ── Init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const d = new Date()
    setDataStr(`${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`)
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
    fetchAll()
  }, [])

  const fetchAll = useCallback(async () => {
    setLoadingTasks(true)
    await Promise.all([fetchTarefas(), fetchPipeline()])
    setLoadingTasks(false)
  }, [])

  // ── Fetch tarefas manuais ─────────────────────────────────────────────
  async function fetchTarefas() {
    const { data } = await supabase
      .from('tarefas')
      .select('*')
      .order('prioridade', { ascending: true })
      .order('created_at', { ascending: false })
    setTarefas(data ?? [])
  }

  // ── Fetch pipeline próximos passos ────────────────────────────────────
  async function fetchPipeline() {
    const { data } = await supabase
      .from('pipeline_leads')
      .select('id, nome, empresa, proximo_passo, etapa')
      .not('proximo_passo', 'is', null)
      .not('proximo_passo', 'eq', '')
      .not('etapa', 'in', '("Ganho","Perdido")')
      .order('updated_at', { ascending: false })
      .limit(4)

    const leads = (data ?? []) as PipelineLead[]
    const virtual = leads.map(l => ({
      id:         `pipeline-${l.id}`,
      texto:      `[${l.etapa}] ${l.nome}${l.empresa ? ` · ${l.empresa}` : ''} — ${l.proximo_passo}`,
      area:       'Pipeline',
      prioridade: 1,
      status:     'pendente',
      fonte:      'pipeline',
      ref_id:     l.id,
      created_at: new Date().toISOString(),
      _virtual:   true as const,
    }))
    setPipelineTasks(virtual)
  }

  // ── Toggle tarefa manual ──────────────────────────────────────────────
  async function toggleTarefa(id: string, current: string) {
    const novoStatus = current === 'concluida' ? 'pendente' : 'concluida'
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, status: novoStatus } : t))
    await supabase
      .from('tarefas')
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  // ── Add tarefa manual ─────────────────────────────────────────────────
  async function handleAdd() {
    if (!novaTexto.trim()) return
    setSaving(true)
    await supabase.from('tarefas').insert({
      texto: novaTexto.trim(),
      area: novaArea,
      prioridade: novaPrio,
      status: 'pendente',
      fonte: 'manual',
      created_by: userEmail,
    })
    setSaving(false)
    setAddOpen(false)
    setNovaTexto('')
    setNovaArea('Geral')
    setNovaPrio(2)
    fetchTarefas()
  }

  // ── Merge + display (pipeline first, then manual pending, then done) ──
  const pendentes  = tarefas.filter(t => t.status === 'pendente')
  const concluidas = tarefas.filter(t => t.status === 'concluida')

  // Show pipeline tasks + manual pending, cap at 8 total
  const allPending = [...pipelineTasks, ...pendentes].slice(0, 8)
  const showDone   = concluidas.slice(0, 3)

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
          <StatCard dot="#34d399" label="Produtos ativos"        value="5"           sub="Nero Barber · Psi Aura · CRM Nexio · Kubic Eng · Arquetipos" />
          <StatCard dot="#fbbf24" label="Foco atual"             value="Nero Barber" sub="Sprint 1 · Estabilização + Marketing" />
          <StatCard dot="#60a5fa" label="Processos documentados" value="5"           sub="Dev · Comercial · Marketing · Financeiro · Time" />
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

          {/* Próximas ações — dinâmico */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                Próximas ações prioritárias
              </p>
              <button
                onClick={() => setAddOpen(true)}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                + Adicionar
              </button>
            </div>

            {loadingTasks ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-gray-600">Carregando...</p>
              </div>
            ) : allPending.length === 0 && showDone.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
                <p className="text-xs text-gray-600">Nenhuma ação pendente.</p>
                <button
                  onClick={() => setAddOpen(true)}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Adicionar primeira ação →
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 flex-1">
                {allPending.map(t => (
                  <div key={t.id} className="flex items-start gap-3">
                    {/* Pipeline tasks não são toggleáveis */}
                    {t.fonte === 'pipeline' ? (
                      <div className="w-4 h-4 rounded border border-cyan-800 flex-shrink-0 mt-0.5 flex items-center justify-center">
                        <span className="text-[8px] text-cyan-600">→</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleTarefa(t.id, t.status)}
                        className="w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all border-gray-600 hover:border-violet-500"
                      >
                        <span className="text-[10px] text-white opacity-0 hover:opacity-100 transition-opacity">✓</span>
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug text-gray-300 line-clamp-2">{t.texto}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${AREA_COR[t.area] ?? AREA_COR['Geral']}`}>
                      {t.area}
                    </span>
                  </div>
                ))}

                {/* Concluídas */}
                {showDone.length > 0 && (
                  <>
                    <div className="border-t border-[#1e1e2e] pt-2 mt-1">
                      <p className="text-[10px] text-gray-700 mb-2">Concluídas recentes</p>
                      {showDone.map(t => (
                        <div key={t.id} className="flex items-start gap-3 mb-2">
                          <button
                            onClick={() => toggleTarefa(t.id, t.status)}
                            className="w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all bg-violet-600 border-violet-600"
                          >
                            <span className="text-[10px] text-white">✓</span>
                          </button>
                          <p className="text-sm leading-snug line-through text-gray-600 flex-1">{t.texto}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 opacity-40 ${AREA_COR[t.area] ?? AREA_COR['Geral']}`}>
                            {t.area}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add tarefa modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Nova ação</h2>
              <button onClick={() => setAddOpen(false)} className="text-gray-500 hover:text-white transition-colors text-sm">✕</button>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Descrição *</label>
              <input
                value={novaTexto}
                onChange={e => setNovaTexto(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Ex: Enviar proposta para cliente X"
                className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Área</label>
                <select
                  value={novaArea}
                  onChange={e => setNovaArea(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600 transition-colors"
                >
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Prioridade</label>
                <select
                  value={novaPrio}
                  onChange={e => setNovaPrio(Number(e.target.value))}
                  className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600 transition-colors"
                >
                  <option value={1}>🔴 Alta</option>
                  <option value={2}>🟡 Média</option>
                  <option value={3}>🟢 Baixa</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setAddOpen(false)}
                className="flex-1 bg-[#1a1a24] hover:bg-[#222232] text-gray-300 text-sm py-2.5 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !novaTexto.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PainelShell>
  )
}
