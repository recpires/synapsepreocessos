'use client'

import { useEffect, useState, useRef } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────
type Tipo = 'comercial' | 'projeto'

type Lead = {
  id: string
  nome: string
  empresa?: string
  produto: string
  etapa: string
  valor_estimado?: number
  contato_email?: string
  contato_whatsapp?: string
  proximo_passo?: string
  observacao?: string
  tipo: Tipo
  prioridade?: string
  responsavel?: string
  created_at: string
  updated_at: string
  created_by: string
}

type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at'>

// ── Etapas por tipo ────────────────────────────────────────────────────────
const ETAPAS_COMERCIAL = [
  { id: 'Prospecção',  cor: 'border-gray-600',   bg: 'bg-gray-800/40',    dot: 'bg-gray-500'    },
  { id: 'Contato',     cor: 'border-blue-700',   bg: 'bg-blue-900/20',    dot: 'bg-blue-500'    },
  { id: 'Demo',        cor: 'border-violet-700', bg: 'bg-violet-900/20',  dot: 'bg-violet-500'  },
  { id: 'Proposta',    cor: 'border-amber-700',  bg: 'bg-amber-900/20',   dot: 'bg-amber-500'   },
  { id: 'Negociação',  cor: 'border-orange-700', bg: 'bg-orange-900/20',  dot: 'bg-orange-500'  },
  { id: 'Ganho',       cor: 'border-emerald-600',bg: 'bg-emerald-900/20', dot: 'bg-emerald-500' },
  { id: 'Perdido',     cor: 'border-red-800',    bg: 'bg-red-900/15',     dot: 'bg-red-600'     },
] as const

const ETAPAS_PROJETO = [
  { id: 'Backlog',       cor: 'border-gray-600',   bg: 'bg-gray-800/40',    dot: 'bg-gray-500'    },
  { id: 'Em análise',    cor: 'border-blue-700',   bg: 'bg-blue-900/20',    dot: 'bg-blue-500'    },
  { id: 'Em dev',        cor: 'border-violet-700', bg: 'bg-violet-900/20',  dot: 'bg-violet-500'  },
  { id: 'Em revisão',    cor: 'border-amber-700',  bg: 'bg-amber-900/20',   dot: 'bg-amber-500'   },
  { id: 'Concluído',     cor: 'border-emerald-600',bg: 'bg-emerald-900/20', dot: 'bg-emerald-500' },
  { id: 'Pausado',       cor: 'border-red-800',    bg: 'bg-red-900/15',     dot: 'bg-red-600'     },
] as const

// ── Produtos / opções ──────────────────────────────────────────────────────
const PRODUTOS_COMERCIAL = [
  'Geral', 'Nero Barber', 'Psi Aura', 'CRM Nexio',
  'Kubic Eng', 'Arquetipos App', 'Agentes IA', 'Design',
] as const

const PRODUTOS_PROJETO = [
  'Nero Barber', 'Psi Aura', 'CRM Nexio',
  'Kubic Eng', 'Arquetipos App', 'Infraestrutura', 'Marketing', 'Interno',
] as const

const TIPO_TAREFA = [
  'Feature', 'Bug', 'Melhoria', 'Infra', 'QA', 'Docs', 'Design', 'Reunião',
] as const

const PRIORIDADES = [
  { id: 'Alta',  cor: 'bg-red-900/40 text-red-300'    },
  { id: 'Média', cor: 'bg-amber-900/40 text-amber-300' },
  { id: 'Baixa', cor: 'bg-gray-800 text-gray-400'     },
] as const

const RESPONSAVEIS = ['Rodrigo', 'Wilian', 'Equipe'] as const

const PRODUTO_COR: Record<string, string> = {
  'Nero Barber':    'bg-yellow-900/40 text-yellow-300',
  'Psi Aura':       'bg-violet-900/40 text-violet-300',
  'CRM Nexio':      'bg-indigo-900/40 text-indigo-300',
  'Kubic Eng':      'bg-orange-900/40 text-orange-300',
  'Arquetipos App': 'bg-pink-900/40 text-pink-300',
  'Agentes IA':     'bg-cyan-900/40 text-cyan-300',
  'Design':         'bg-rose-900/40 text-rose-300',
  'Infraestrutura': 'bg-slate-800 text-slate-300',
  'Marketing':      'bg-green-900/40 text-green-300',
  'Interno':        'bg-gray-800 text-gray-400',
  'Geral':          'bg-gray-800 text-gray-400',
}

const PRIORIDADE_COR: Record<string, string> = {
  'Alta':  'bg-red-900/40 text-red-300',
  'Média': 'bg-amber-900/40 text-amber-300',
  'Baixa': 'bg-gray-800 text-gray-400',
}

function formatVal(val?: number) {
  if (!val) return null
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function emptyForm(tipo: Tipo, etapa: string, email: string): LeadInsert {
  return {
    nome: '', empresa: '',
    produto: tipo === 'comercial' ? 'Geral' : 'Nero Barber',
    etapa, tipo,
    valor_estimado: undefined,
    contato_email: '', contato_whatsapp: '',
    proximo_passo: '', observacao: '',
    prioridade: tipo === 'projeto' ? 'Média' : undefined,
    responsavel: tipo === 'projeto' ? 'Rodrigo' : undefined,
    created_by: email,
  }
}

// ── Card ───────────────────────────────────────────────────────────────────
function LeadCard({
  lead, tipo, onEdit, onDragStart,
}: {
  lead: Lead; tipo: Tipo
  onEdit: (l: Lead) => void
  onDragStart: (e: React.DragEvent, id: string) => void
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, lead.id)}
      onClick={() => onEdit(lead)}
      className="bg-[#111118] border border-[#1e1e2e] rounded-lg p-3 cursor-pointer hover:border-violet-700/50 hover:-translate-y-0.5 transition-all active:opacity-70 select-none"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-white leading-snug flex-1 min-w-0">{lead.nome}</p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium ${PRODUTO_COR[lead.produto] ?? PRODUTO_COR['Geral']}`}>
          {lead.produto}
        </span>
      </div>

      {tipo === 'comercial' && (
        <>
          {lead.empresa && <p className="text-[11px] text-gray-500 truncate -mt-1 mb-1">{lead.empresa}</p>}
          {lead.valor_estimado ? (
            <p className="text-xs text-emerald-400 font-medium mb-1">{formatVal(lead.valor_estimado)}</p>
          ) : null}
        </>
      )}

      {tipo === 'projeto' && lead.prioridade && (
        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium mb-1.5 ${PRIORIDADE_COR[lead.prioridade] ?? ''}`}>
          {lead.prioridade}
        </span>
      )}

      {lead.proximo_passo && (
        <p className="text-[11px] text-gray-500 leading-snug truncate border-t border-[#1e1e2e] pt-2 mt-1">
          → {lead.proximo_passo}
        </p>
      )}

      {tipo === 'projeto' && lead.responsavel && (
        <p className="text-[10px] text-gray-600 mt-1">{lead.responsavel}</p>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function PipelinePage() {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [tipo, setTipo] = useState<Tipo>('comercial')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [form, setForm] = useState<LeadInsert>(emptyForm('comercial', 'Prospecção', ''))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Drag
  const dragId = useRef<string | null>(null)
  const [dragOverEtapa, setDragOverEtapa] = useState<string | null>(null)

  // Filtro por produto (projetos)
  const [filtroProduto, setFiltroProduto] = useState<string>('Todos')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
    fetchLeads()
  }, [])

  async function fetchLeads() {
    setLoading(true)
    const { data } = await supabase
      .from('pipeline_leads')
      .select('*')
      .order('updated_at', { ascending: false })
    setLeads(data ?? [])
    setLoading(false)
  }

  const ETAPAS = tipo === 'comercial' ? ETAPAS_COMERCIAL : ETAPAS_PROJETO
  const PRODUTOS = tipo === 'comercial' ? PRODUTOS_COMERCIAL : PRODUTOS_PROJETO

  // Leads filtrados por tipo e produto
  const leadsDoTipo = leads.filter(l => (l.tipo ?? 'comercial') === tipo)
  const leadsFiltrados = tipo === 'projeto' && filtroProduto !== 'Todos'
    ? leadsDoTipo.filter(l => l.produto === filtroProduto)
    : leadsDoTipo

  // ── Modal ────────────────────────────────────────────────────────────────
  function openNew(etapa?: string) {
    const etapaDefault = tipo === 'comercial' ? 'Prospecção' : 'Backlog'
    setEditingLead(null)
    setForm(emptyForm(tipo, etapa ?? etapaDefault, userEmail))
    setModalOpen(true)
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead)
    setForm({
      nome: lead.nome, empresa: lead.empresa ?? '',
      produto: lead.produto, etapa: lead.etapa, tipo: lead.tipo ?? 'comercial',
      valor_estimado: lead.valor_estimado,
      contato_email: lead.contato_email ?? '',
      contato_whatsapp: lead.contato_whatsapp ?? '',
      proximo_passo: lead.proximo_passo ?? '',
      observacao: lead.observacao ?? '',
      prioridade: lead.prioridade ?? undefined,
      responsavel: lead.responsavel ?? undefined,
      created_by: lead.created_by,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingLead(null)
  }

  async function handleSave() {
    if (!form.nome.trim()) return
    setSaving(true)
    const payload = {
      ...form,
      nome: form.nome.trim(),
      empresa: form.empresa?.trim() || null,
      contato_email: form.contato_email?.trim() || null,
      contato_whatsapp: form.contato_whatsapp?.trim() || null,
      proximo_passo: form.proximo_passo?.trim() || null,
      observacao: form.observacao?.trim() || null,
      valor_estimado: form.valor_estimado || null,
      updated_at: new Date().toISOString(),
    }
    if (editingLead) {
      await supabase.from('pipeline_leads').update(payload).eq('id', editingLead.id)
    } else {
      await supabase.from('pipeline_leads').insert({ ...payload, created_by: userEmail })
    }
    setSaving(false)
    closeModal()
    fetchLeads()
  }

  async function handleDelete() {
    if (!editingLead) return
    if (!confirm(`Remover "${editingLead.nome}"?`)) return
    setDeleting(true)
    await supabase.from('pipeline_leads').delete().eq('id', editingLead.id)
    setDeleting(false)
    closeModal()
    fetchLeads()
  }

  // ── Drag ─────────────────────────────────────────────────────────────────
  function onDragStart(e: React.DragEvent, id: string) {
    dragId.current = id
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDragOver(e: React.DragEvent, etapa: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverEtapa(etapa)
  }
  async function onDrop(e: React.DragEvent, etapa: string) {
    e.preventDefault()
    setDragOverEtapa(null)
    const id = dragId.current
    if (!id) return
    const lead = leads.find(l => l.id === id)
    if (!lead || lead.etapa === etapa) return
    setLeads(prev => prev.map(l => l.id === id ? { ...l, etapa } : l))
    await supabase.from('pipeline_leads')
      .update({ etapa, updated_at: new Date().toISOString() })
      .eq('id', id)
    dragId.current = null
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalGanho = leadsDoTipo.filter(l => l.etapa === 'Ganho').reduce((s, l) => s + (l.valor_estimado ?? 0), 0)
  const totalPipeline = leadsDoTipo.filter(l => !['Ganho', 'Perdido'].includes(l.etapa)).reduce((s, l) => s + (l.valor_estimado ?? 0), 0)
  const totalConcluido = leadsDoTipo.filter(l => l.etapa === 'Concluído').length
  const totalEmDev = leadsDoTipo.filter(l => l.etapa === 'Em dev').length

  return (
    <PainelShell>
      <div className="flex flex-col h-screen">

        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1e1e2e] flex-shrink-0">
          {/* Tipo tabs */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex gap-1 bg-[#0d0d14] border border-[#1e1e2e] rounded-xl p-1">
              <button
                onClick={() => { setTipo('comercial'); setFiltroProduto('Todos') }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tipo === 'comercial'
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                📊 Comercial
              </button>
              <button
                onClick={() => { setTipo('projeto'); setFiltroProduto('Todos') }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tipo === 'projeto'
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                🏗️ Projetos
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Filtro por produto (projetos) */}
              {tipo === 'projeto' && (
                <select
                  value={filtroProduto}
                  onChange={e => setFiltroProduto(e.target.value)}
                  className="bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-violet-600"
                >
                  <option value="Todos">Todos os produtos</option>
                  {PRODUTOS_PROJETO.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
              <button
                onClick={() => openNew()}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                + {tipo === 'comercial' ? 'Novo lead' : 'Nova tarefa'}
              </button>
            </div>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="flex gap-3 flex-wrap">
              {tipo === 'comercial' ? (
                <>
                  <StatChip label="Em pipeline" value={formatVal(totalPipeline) ?? 'R$ 0'} />
                  <StatChip label="Ganho" value={formatVal(totalGanho) ?? 'R$ 0'} color="emerald" />
                  <StatChip label="Total de leads" value={String(leadsDoTipo.length)} />
                </>
              ) : (
                <>
                  <StatChip label="Em dev" value={String(totalEmDev)} color="violet" />
                  <StatChip label="Concluídas" value={String(totalConcluido)} color="emerald" />
                  <StatChip label="Total" value={String(leadsDoTipo.length)} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Kanban */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">Carregando...</div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-3 p-4 h-full" style={{ minWidth: `${ETAPAS.length * 272 + 48}px` }}>
              {ETAPAS.map(etapa => {
                const colLeads = leadsFiltrados.filter(l => l.etapa === etapa.id)
                const colTotal = colLeads.reduce((s, l) => s + (l.valor_estimado ?? 0), 0)
                const isDragOver = dragOverEtapa === etapa.id

                return (
                  <div
                    key={etapa.id}
                    className={`flex flex-col w-64 flex-shrink-0 rounded-xl border transition-all ${
                      isDragOver ? `${etapa.cor} ${etapa.bg} scale-[1.01]` : 'border-[#1e1e2e] bg-[#0d0d14]'
                    }`}
                    onDragOver={e => onDragOver(e, etapa.id)}
                    onDragLeave={() => setDragOverEtapa(null)}
                    onDrop={e => onDrop(e, etapa.id)}
                  >
                    <div className="px-3 py-3 border-b border-[#1e1e2e] flex-shrink-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${etapa.dot}`} />
                          <span className="text-xs font-semibold text-white">{etapa.id}</span>
                          <span className="text-[10px] bg-[#1e1e2e] text-gray-500 px-1.5 py-0.5 rounded-full">{colLeads.length}</span>
                        </div>
                        <button
                          onClick={() => openNew(etapa.id)}
                          className="text-gray-600 hover:text-white transition-colors text-sm"
                          title={`Adicionar em ${etapa.id}`}
                        >+</button>
                      </div>
                      {tipo === 'comercial' && colTotal > 0 && (
                        <p className="text-[10px] text-gray-600">{formatVal(colTotal)}</p>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
                      {colLeads.map(lead => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          tipo={tipo}
                          onEdit={openEdit}
                          onDragStart={onDragStart}
                        />
                      ))}
                      {colLeads.length === 0 && (
                        <div className={`h-16 rounded-lg border-2 border-dashed ${isDragOver ? etapa.cor : 'border-[#1e1e2e]'} flex items-center justify-center transition-colors`}>
                          <p className="text-[11px] text-gray-700">Solte aqui</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                {editingLead
                  ? tipo === 'comercial' ? 'Editar lead' : 'Editar tarefa'
                  : tipo === 'comercial' ? 'Novo lead' : 'Nova tarefa'
                }
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors text-sm">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Nome */}
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1.5">
                  {tipo === 'comercial' ? 'Nome do contato / empresa *' : 'Título da tarefa *'}
                </label>
                <input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder={tipo === 'comercial' ? 'Nome do prospect' : 'Ex: Implementar notificações WhatsApp'}
                  className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              {/* Campos específicos por tipo */}
              {tipo === 'comercial' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Empresa</label>
                  <input
                    value={form.empresa ?? ''}
                    onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                    placeholder="Razão social"
                    className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
                  />
                </div>
              )}

              {tipo === 'projeto' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Prioridade</label>
                  <select
                    value={form.prioridade ?? 'Média'}
                    onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
                    className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600 transition-colors"
                  >
                    {PRIORIDADES.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
                  </select>
                </div>
              )}

              {/* Produto */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  {tipo === 'comercial' ? 'Produto' : 'Produto / área'}
                </label>
                <select
                  value={form.produto}
                  onChange={e => setForm(f => ({ ...f, produto: e.target.value }))}
                  className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600 transition-colors"
                >
                  {PRODUTOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Etapa */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Etapa</label>
                <select
                  value={form.etapa}
                  onChange={e => setForm(f => ({ ...f, etapa: e.target.value }))}
                  className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600 transition-colors"
                >
                  {ETAPAS.map(e => <option key={e.id} value={e.id}>{e.id}</option>)}
                </select>
              </div>

              {/* Campos comercial */}
              {tipo === 'comercial' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Valor estimado (R$)</label>
                    <input
                      type="number"
                      value={form.valor_estimado ?? ''}
                      onChange={e => setForm(f => ({ ...f, valor_estimado: e.target.value ? Number(e.target.value) : undefined }))}
                      placeholder="0"
                      className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">WhatsApp</label>
                    <input
                      value={form.contato_whatsapp ?? ''}
                      onChange={e => setForm(f => ({ ...f, contato_whatsapp: e.target.value }))}
                      placeholder="(11) 9 0000-0000"
                      className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">E-mail</label>
                    <input
                      type="email"
                      value={form.contato_email ?? ''}
                      onChange={e => setForm(f => ({ ...f, contato_email: e.target.value }))}
                      placeholder="contato@empresa.com"
                      className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
                    />
                  </div>
                </>
              )}

              {/* Campos projeto */}
              {tipo === 'projeto' && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Tipo de tarefa</label>
                    <select
                      value={form.empresa ?? 'Feature'}
                      onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                      className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600 transition-colors"
                    >
                      {TIPO_TAREFA.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Responsável</label>
                    <select
                      value={form.responsavel ?? 'Rodrigo'}
                      onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
                      className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600 transition-colors"
                    >
                      {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* Próximo passo */}
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1.5">
                  {tipo === 'comercial' ? 'Próximo passo' : 'Descrição / próximo passo'}
                </label>
                <input
                  value={form.proximo_passo ?? ''}
                  onChange={e => setForm(f => ({ ...f, proximo_passo: e.target.value }))}
                  placeholder={tipo === 'comercial' ? 'Ex: Enviar proposta até sexta' : 'Ex: Integrar Z-API e criar fila de envio'}
                  className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              {/* Observação */}
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1.5">Observação <span className="text-gray-600">(opcional)</span></label>
                <textarea
                  value={form.observacao ?? ''}
                  onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                  rows={3}
                  placeholder={tipo === 'comercial' ? 'Contexto da conversa...' : 'Detalhes técnicos, links, referências...'}
                  className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              {editingLead && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? '...' : 'Remover'}
                </button>
              )}
              <button onClick={closeModal} className="flex-1 bg-[#1a1a24] hover:bg-[#222232] text-gray-300 text-sm py-2.5 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.nome.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {saving ? 'Salvando...' : editingLead ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PainelShell>
  )
}

// ── Chip de stat ───────────────────────────────────────────────────────────
function StatChip({ label, value, color }: { label: string; value: string; color?: 'emerald' | 'violet' }) {
  const text = color === 'emerald' ? 'text-emerald-400' : color === 'violet' ? 'text-violet-400' : 'text-white'
  const border = color === 'emerald' ? 'border-emerald-900/40' : color === 'violet' ? 'border-violet-900/40' : 'border-[#1e1e2e]'
  return (
    <div className={`bg-[#111118] border ${border} rounded-lg px-4 py-2 flex items-center gap-3`}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${text}`}>{value}</span>
    </div>
  )
}
