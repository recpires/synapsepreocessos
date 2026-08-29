'use client'

import { useState, useEffect, useCallback } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'
import { listarPosicoes } from '@/server/empresa-financeiro'
import type { PosicaoEmpresa } from '@/types/empresa-financeiro'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const DIAS  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

/** Cor pela saúde do projeto, que é dado, e não pela posição na lista. */
const COR_SAUDE: Record<string, string> = {
  verde: 'text-emerald-400', amarelo: 'text-amber-400', vermelho: 'text-red-400',
}

const FASE_CURTA: Record<string, string> = {
  descoberta: 'Descoberta', especificacao: 'Especificação',
  desenvolvimento: 'Desenvolvimento', qa: 'QA', homologacao: 'Homologação',
  operacao: 'Em operação', pausado: 'Pausado', encerrado: 'Encerrado',
}

type ProjetoResumo = {
  id: string
  nome: string
  fase_atual: string
  saude: string
  maturidade_pct: number
}

/** Bom dia / boa tarde / boa noite, pelo relógio de quem abriu. */
function saudacao(h: number) {
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

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

type PipelineLead = {
  id: string
  nome: string
  empresa?: string
  proximo_passo: string
  etapa: string
  updated_at: string
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

  // Tasks
  const [tarefas, setTarefas]           = useState<Tarefa[]>([])
  const [pipelineLeads, setPipelineLeads] = useState<PipelineLead[]>([])
  const [doneRefIds, setDoneRefIds]       = useState<Set<string>>(new Set())
  const [atencaoLeads, setAtencaoLeads]   = useState<PipelineLead[]>([])
  const [loadingTasks, setLoadingTasks]   = useState(true)
  const [posicoes, setPosicoes]           = useState<PosicaoEmpresa[]>([])
  const [projetos, setProjetos]           = useState<ProjetoResumo[]>([])
  const [nomeMembro, setNomeMembro]       = useState('')
  const [ola, setOla]                     = useState('Olá')
  const [contagens, setContagens] = useState({
    produtosAtivos: 0, nomesProdutos: '', pessoas: 0,
    projetosAndamento: 0, emRisco: 0, vencidos: 0, criticos: 0,
  })

  // Add modal
  const [addOpen, setAddOpen]     = useState(false)
  const [novaTexto, setNovaTexto] = useState('')
  const [novaArea, setNovaArea]   = useState<string>('Geral')
  const [novaPrio, setNovaPrio]   = useState(2)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    const d = new Date()
    setDataStr(`${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`)
    setOla(saudacao(d.getHours()))
    supabase.auth.getUser().then(async ({ data }) => {
      setUserEmail(data.user?.email ?? '')
      if (!data.user) return
      // O nome vem de `membros`, não do código: quem abre o painel nem sempre
      // é o Rodrigo, e o cabeçalho dava bom dia a ele para qualquer um.
      const { data: m } = await supabase
        .from('membros').select('nome').eq('user_id', data.user.id).maybeSingle()
      if (m?.nome) setNomeMembro(String(m.nome).split(' ')[0])
    })
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoadingTasks(true)
    await Promise.all([fetchTarefas(), fetchPipeline(), fetchPosicoes(), fetchNumeros()])
    setLoadingTasks(false)
  }

  /**
   * Posição financeira das empresas próprias, para a fatia consolidada.
   *
   * Vem por Server Action e não por query direta porque a participação sai do
   * membro da sessão: cada pessoa vê a própria parte, e ninguém consegue
   * pedir a do outro mandando um id.
   */
  /**
   * Números do cabeçalho e do quadro de prioridade.
   *
   * Eram literais: "2 pessoas · 5 produtos ativos" e cinco produtos com notas
   * de 4.1 a 2.0. Todos já estavam errados — são 3 pessoas e 3 produtos
   * ativos, e as notas nunca vieram de lugar nenhum. Número escrito à mão numa
   * tela de acompanhamento envelhece sem avisar.
   */
  async function fetchNumeros() {
    const [{ data: produtos }, { count: pessoas }, { data: projs },
           { data: venc }] = await Promise.all([
      supabase.from('produtos').select('nome, status').eq('status', 'ativo').order('nome'),
      supabase.from('membros').select('id', { count: 'exact', head: true }).eq('ativo', true),
      supabase.from('projetos')
        .select('id, nome, fase_atual, saude, maturidade_pct')
        .eq('arquivado', false).order('maturidade_pct', { ascending: false }),
      supabase.from('vencimentos').select('severidade, silenciado'),
    ])

    const lista = (projs ?? []) as ProjetoResumo[]
    const abertos = (venc ?? []).filter(v => !v.silenciado)
    const andamento = lista.filter(
      p => p.fase_atual !== 'pausado' && p.fase_atual !== 'encerrado'
    )

    setProjetos(lista)
    setContagens({
      produtosAtivos: (produtos ?? []).length,
      nomesProdutos: (produtos ?? []).map(p => p.nome).join(' · '),
      pessoas: pessoas ?? 0,
      projetosAndamento: andamento.length,
      emRisco: andamento.filter(p => p.saude === 'vermelho').length,
      vencidos: abertos.filter(v => v.severidade === 'vencido').length,
      criticos: abertos.filter(v => v.severidade === 'critico').length,
    })
  }

  async function fetchPosicoes() {
    const r = await listarPosicoes()
    setPosicoes(r.data ?? [])
  }

  async function fetchTarefas() {
    const { data } = await supabase
      .from('tarefas')
      .select('*')
      .order('prioridade', { ascending: true })
      .order('created_at', { ascending: false })
    const all = (data ?? []) as Tarefa[]
    setTarefas(all)
    // Collect ref_ids that are already done (pipeline tasks marked by user)
    const done = new Set(
      all.filter(t => t.fonte === 'pipeline' && t.status === 'concluida' && t.ref_id).map(t => t.ref_id!)
    )
    setDoneRefIds(done)
  }

  async function fetchPipeline() {
    const { data } = await supabase
      .from('pipeline_leads')
      .select('id, nome, empresa, proximo_passo, etapa, updated_at')
      .not('proximo_passo', 'is', null)
      .not('proximo_passo', 'eq', '')
      .not('etapa', 'in', '("Ganho","Perdido")')
      .order('updated_at', { ascending: false })

    const leads = (data ?? []) as PipelineLead[]
    setPipelineLeads(leads)

    // Leads que precisam de atenção = etapa Demo ou Proposta
    const atencao = leads.filter(l => ['Demo', 'Proposta', 'Negociação'].includes(l.etapa))
    setAtencaoLeads(atencao)
  }

  // ── Toggle tarefa manual ─────────────────────────────────────────────
  async function toggleManual(id: string, current: string) {
    const novoStatus = current === 'concluida' ? 'pendente' : 'concluida'
    // Optimistic
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, status: novoStatus } : t))
    await supabase
      .from('tarefas')
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  // ── Toggle pipeline task (insert concluida record) ───────────────────
  async function togglePipeline(lead: PipelineLead) {
    const alreadyDone = doneRefIds.has(lead.id)

    if (alreadyDone) {
      // Uncheck: delete the concluida record
      setDoneRefIds(prev => { const s = new Set(prev); s.delete(lead.id); return s })
      await supabase.from('tarefas').delete()
        .eq('fonte', 'pipeline').eq('ref_id', lead.id).eq('status', 'concluida')
    } else {
      // Check: insert concluida record
      setDoneRefIds(prev => new Set([...prev, lead.id]))
      await supabase.from('tarefas').insert({
        texto: `[${lead.etapa}] ${lead.nome}${lead.empresa ? ` · ${lead.empresa}` : ''} — ${lead.proximo_passo}`,
        area: 'Pipeline',
        prioridade: 1,
        status: 'concluida',
        fonte: 'pipeline',
        ref_id: lead.id,
        created_by: userEmail,
      })
    }
  }

  // ── Add tarefa manual ────────────────────────────────────────────────
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

  // ── Build display list ────────────────────────────────────────────────
  // Pipeline tasks: exclude those already done
  const pipelinePending = pipelineLeads
    .filter(l => !doneRefIds.has(l.id))
    .slice(0, 4)

  // Manual tasks split
  const manualPending   = tarefas.filter(t => t.fonte === 'manual' && t.status === 'pendente')
  const manualConcluidas = tarefas.filter(t => t.fonte === 'manual' && t.status === 'concluida').slice(0, 2)

  // All pending (pipeline first, then manual) capped at 8
  const totalPending = [...pipelinePending.map(l => ({ tipo: 'pipeline' as const, lead: l })),
                        ...manualPending.map(t => ({ tipo: 'manual' as const, tarefa: t }))]
    .slice(0, 8)

  // Sua fatia somada das empresas em que você é sócio declarado. Zero com
  // lançamento por atribuir engana: o rodapé diz por que o número é o que é.
  const parte = (() => {
    const minhas = posicoes.filter(p => p.minhaParticipacaoPct !== null)
    if (minhas.length === 0) {
      return {
        valor: 0,
        temSociedade: false,
        explicacao: posicoes.length
          ? 'Você não está declarado como sócio de nenhuma empresa'
          : 'Nenhuma empresa própria cadastrada',
      }
    }
    const valor = minhas.reduce((a, p) => a + (p.minhaParte ?? 0), 0)
    const detalhe = minhas
      .map(p => `${p.empresa.nome_fantasia || p.empresa.razao_social} ${p.minhaParticipacaoPct}%`)
      .join(' · ')
    const semMovimento = minhas.every(p => p.recebidoAno === 0 && p.despesaAno === 0)
    // Despesa lançada e receita zerada dá prejuízo que não existiu. Enquanto a
    // entrada não for reconciliada, o número precisa vir com essa ressalva —
    // negativo sem explicação vira decisão errada.
    const soDespesa = minhas.some(p => p.despesaAno > 0) && minhas.every(p => p.recebidoAno === 0)
    return {
      valor,
      temSociedade: true,
      explicacao: semMovimento
        ? `${detalhe} — sem lançamento atribuído ainda`
        : soDespesa
          ? `${detalhe} — só despesa lançada, receita ainda por reconciliar`
          : detalhe,
    }
  })()

  return (
    <PainelShell>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {ola}{nomeMembro ? `, ${nomeMembro}` : ''} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Synapse Code · Software House · {contagens.pessoas} pessoa{contagens.pessoas === 1 ? '' : 's'}
              {' · '}
              {contagens.produtosAtivos} produto{contagens.produtosAtivos === 1 ? '' : 's'} ativo{contagens.produtosAtivos === 1 ? '' : 's'}
            </p>
          </div>
          <span className="text-sm text-gray-600">{dataStr}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            dot="#34d399"
            label="Produtos ativos"
            value={String(contagens.produtosAtivos)}
            sub={contagens.nomesProdutos || 'Nenhum produto ativo'}
          />
          <StatCard
            dot="#fbbf24"
            label="Projetos em andamento"
            value={String(contagens.projetosAndamento)}
            sub={
              contagens.emRisco > 0
                ? `${contagens.emRisco} em risco`
                : 'Nenhum em risco'
            }
          />
          <StatCard
            dot={contagens.vencidos > 0 ? '#f87171' : '#60a5fa'}
            label="Vencimentos"
            value={String(contagens.vencidos + contagens.criticos)}
            sub={
              contagens.vencidos > 0
                ? `${contagens.vencidos} vencido(s), ${contagens.criticos} nesta semana`
                : contagens.criticos > 0
                  ? `${contagens.criticos} nos próximos 7 dias`
                  : 'Nada vencendo agora'
            }
          />
          <StatCard
            dot={parte.valor < 0 ? '#f87171' : '#a78bfa'}
            label="Sua parte até hoje"
            value={parte.temSociedade ? brl(parte.valor) : '—'}
            sub={parte.explicacao}
          />
        </div>

        {/* Atenção: leads que precisam de ação imediata */}
        {!loadingTasks && atencaoLeads.length > 0 && (
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4">
            <p className="text-xs text-amber-500 uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
              <span>⚠️</span> Leads aguardando ação — Pipeline
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {atencaoLeads.map(l => (
                <div key={l.id} className="flex items-start gap-2.5 bg-[#111118] rounded-lg px-3 py-2.5 border border-[#1e1e2e]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] text-amber-500 font-medium">{l.etapa}</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-xs text-white font-medium truncate">{l.nome}</span>
                    </div>
                    {l.empresa && <p className="text-[11px] text-gray-500 truncate">{l.empresa}</p>}
                    {l.proximo_passo && (
                      <p className="text-[11px] text-amber-400/70 truncate mt-0.5">→ {l.proximo_passo}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority + Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Prioridade dos produtos */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
              Projetos por maturidade
            </p>
            <div className="space-y-4">
              {projetos.length === 0 && (
                <p className="text-xs text-gray-500">Nenhum projeto cadastrado.</p>
              )}
              {projetos.slice(0, 6).map((p, i) => {
                const cor = COR_SAUDE[p.saude] ?? 'text-gray-400'
                const parado = p.fase_atual === 'pausado' || p.fase_atual === 'encerrado'
                return (
                  <div key={p.id} className={`flex items-center gap-3 ${parado ? 'opacity-60' : ''}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${cor} bg-white/5`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{p.nome}</div>
                      <div className="text-xs text-gray-500">
                        {FASE_CURTA[p.fase_atual] ?? p.fase_atual}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-20 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                        <div className="h-full bg-violet-600 rounded-full" style={{ width: `${p.maturidade_pct}%` }} />
                      </div>
                      <span className={`text-xs font-semibold w-9 text-right tabular ${cor}`}>
                        {p.maturidade_pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Próximas ações */}
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
            ) : totalPending.length === 0 && manualConcluidas.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
                <p className="text-xs text-gray-600">Nenhuma ação pendente 🎉</p>
                <button onClick={() => setAddOpen(true)} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Adicionar ação →
                </button>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {/* Pendentes */}
                {totalPending.map((item, i) => {
                  if (item.tipo === 'pipeline') {
                    const l = item.lead
                    const done = doneRefIds.has(l.id)
                    return (
                      <div key={`p-${l.id}`} className="flex items-start gap-3">
                        <button
                          onClick={() => togglePipeline(l)}
                          className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                            done ? 'bg-violet-600 border-violet-600' : 'border-gray-600 hover:border-violet-500'
                          }`}
                        >
                          {done && <span className="text-[10px] text-white">✓</span>}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${done ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                            {l.nome}{l.empresa ? ` · ${l.empresa}` : ''} — {l.proximo_passo}
                          </p>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${AREA_COR['Pipeline']}`}>
                          {l.etapa}
                        </span>
                      </div>
                    )
                  }

                  const t = item.tarefa
                  return (
                    <div key={t.id} className="flex items-start gap-3">
                      <button
                        onClick={() => toggleManual(t.id, t.status)}
                        className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                          t.status === 'concluida' ? 'bg-violet-600 border-violet-600' : 'border-gray-600 hover:border-violet-500'
                        }`}
                      >
                        {t.status === 'concluida' && <span className="text-[10px] text-white">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${t.status === 'concluida' ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                          {t.texto}
                        </p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${AREA_COR[t.area] ?? AREA_COR['Geral']}`}>
                        {t.area}
                      </span>
                    </div>
                  )
                })}

                {/* Concluídas recentes */}
                {manualConcluidas.length > 0 && (
                  <div className="border-t border-[#1e1e2e] pt-3 mt-1 space-y-3">
                    {manualConcluidas.map(t => (
                      <div key={t.id} className="flex items-start gap-3">
                        <button
                          onClick={() => toggleManual(t.id, t.status)}
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add modal */}
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
                autoFocus
                className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
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
              <button onClick={() => setAddOpen(false)} className="flex-1 bg-[#1a1a24] hover:bg-[#222232] text-gray-300 text-sm py-2.5 rounded-lg transition-colors">
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
