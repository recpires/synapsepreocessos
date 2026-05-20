'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import PainelShell from '@/components/PainelShell'

// ───────────────────────────────────────────────────────────────────────────────
// Calendário Instagram — Sem 1 (20 → 26/mai/2026)
// Reflete o calendario-editorial-synapse-code.md (D:\Synapse Code\instagram\sem1)
// ───────────────────────────────────────────────────────────────────────────────
const CALENDARIO = [
  { dia: 'Qua 20/05', tipo: 'Carrossel', tipoCor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40',     titulo: 'Synapse Code — institucional',         desc: 'Boutique de engenharia · 5 slides · 19h00' },
  { dia: 'Qui 21/05', tipo: 'Carrossel', tipoCor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40',     titulo: 'Nero Barber — 30% da agenda',          desc: 'Premium preto+dourado · 4 slides · 18h30' },
  { dia: 'Sex 22/05', tipo: 'Post',      tipoCor: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40', titulo: 'Nexio CRM — agência brasileira',       desc: 'Midnight+indigo · post único · 12h00' },
  { dia: 'Sáb 23/05', tipo: 'Carrossel', tipoCor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40',     titulo: 'PsiAura — cuide de quem cuida',        desc: 'Navy+teal · 3 slides · 10h00' },
  { dia: 'Dom 24/05', tipo: 'Post',      tipoCor: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40', titulo: 'Kubic Eng — pare de perder obra',      desc: 'Brutalist amarelo · post único · 11h00' },
  { dia: 'Seg 25/05', tipo: 'Carrossel', tipoCor: 'bg-blue-900/30 text-blue-400 border border-blue-800/40',     titulo: 'Agentes IA — domingo 22h',             desc: 'Dark+verde WhatsApp · 4 slides · 09h00' },
  { dia: 'Ter 26/05', tipo: 'Carrossel', tipoCor: 'bg-violet-900/30 text-violet-400 border border-violet-800/40', titulo: 'Ecossistema — 5 produtos · 1 marca',   desc: 'Recap multi-paleta · 6 slides · 19h30' },
]

const PILARES = [
  { icon: '📚', bg: 'bg-violet-900/15',  titulo: 'Educação (40%)',     desc: 'Como resolver problemas do nicho com tecnologia' },
  { icon: '⭐', bg: 'bg-emerald-900/15', titulo: 'Prova social (30%)', desc: 'Resultados, antes/depois, números reais de clientes' },
  { icon: '🛠️', bg: 'bg-blue-900/15',    titulo: 'Produto (20%)',      desc: 'Demos, features, atualizações dos SaaS' },
  { icon: '🎬', bg: 'bg-amber-900/15',   titulo: 'Bastidores (10%)',   desc: 'Como a Synapse Code trabalha e pensa' },
]

// ───────────────────────────────────────────────────────────────────────────────
// Prioridades — derivadas da proximidade do calendário Instagram (hoje = 20/05)
// ───────────────────────────────────────────────────────────────────────────────
type Prio = 'Urgente' | 'Alta' | 'Média' | 'Baixa'

const PRIO_COR: Record<Prio, string> = {
  Urgente: 'bg-red-900/30 text-red-400 border border-red-800/40',
  Alta:    'bg-amber-900/30 text-amber-400 border border-amber-800/40',
  Média:   'bg-blue-900/30 text-blue-400 border border-blue-800/40',
  Baixa:   'bg-gray-800/40 text-gray-400 border border-gray-700/40',
}

type Tarefa = {
  id: string
  texto: string
  prio: Prio
  feito?: boolean
}

// Seed baseado no calendário Instagram real (sem1 → sem4)
const TAREFAS_INICIAIS: Tarefa[] = [
  // URGENTE — semana corrente (sem1)
  { id: 't1',  texto: 'Postar carrossel institucional Synapse Code hoje às 19h00',         prio: 'Urgente' },
  { id: 't2',  texto: 'Otimizar bio e perfil do Instagram da Synapse Code',                prio: 'Urgente' },
  { id: 't3',  texto: 'Produzir carrossel Nero Barber (4 slides) — postar 21/05 às 18h30', prio: 'Urgente' },
  { id: 't4',  texto: 'Produzir post único Nexio CRM — postar 22/05 às 12h00',             prio: 'Urgente' },

  // ALTA — resto da sem1 + arranque do funil
  { id: 't5',  texto: 'Produzir carrossel PsiAura (3 slides) — postar 23/05 às 10h00',     prio: 'Alta' },
  { id: 't6',  texto: 'Produzir post único Kubic Eng — postar 24/05 às 11h00',             prio: 'Alta' },
  { id: 't7',  texto: 'Produzir carrossel Agentes IA (4 slides) — postar 25/05 às 09h00',  prio: 'Alta' },
  { id: 't8',  texto: 'Produzir recap Ecossistema Synapse (6 slides) — 26/05 às 19h30',    prio: 'Alta' },
  { id: 't9',  texto: 'Criar LP dedicada para Nero Barber com CTA de trial 14 dias',        prio: 'Alta' },

  // MÉDIA — sem2 (thought leadership + cases) e LinkedIn
  { id: 't10', texto: 'Produzir conteúdo sem2: thought leadership Synapse + mini-case Nero', prio: 'Média' },
  { id: 't11', texto: 'Produzir sem2: Nexio (planilha vs CRM) + PsiAura (CFP 11/2018)',      prio: 'Média' },
  { id: 't12', texto: 'Produzir sem2: Kubic (Curva-S) + Agentes IA (bot vs RAG) + bastidores', prio: 'Média' },
  { id: 't13', texto: 'Ativar LinkedIn pessoal do Rodrigo com 3 posts/semana',                 prio: 'Média' },
  { id: 't14', texto: 'Responder DMs e comentários qualificados dos posts da semana',          prio: 'Média' },

  // BAIXA — sem3, sem4 e LPs dos demais produtos
  { id: 't15', texto: 'Planejar conteúdo sem3: mitos + FAQs (quebra de objeções)',           prio: 'Baixa' },
  { id: 't16', texto: 'Planejar conteúdo sem4: stack técnica + storytelling + RAG',           prio: 'Baixa' },
  { id: 't17', texto: 'Criar LPs para Psi Aura, CRM Nexio e Kubic Eng',                       prio: 'Baixa' },
  { id: 't18', texto: 'Configurar pixel Meta + GA4 nas LPs para medir DM-iniciadas',          prio: 'Baixa' },
]

const STORAGE_KEY = 'synapse-marketing-tarefas-v1'

// ───────────────────────────────────────────────────────────────────────────────
// Page
// ───────────────────────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>(TAREFAS_INICIAIS)
  const [hidratado, setHidratado] = useState(false)
  const [novoTexto, setNovoTexto] = useState('')
  const [novaPrio, setNovaPrio] = useState<Prio>('Média')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editTexto, setEditTexto] = useState('')
  const [destacarId, setDestacarId] = useState<string | null>(null)
  const dragIdRef = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  // Hidratação client-side (persistência localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Tarefa[]
        if (Array.isArray(parsed) && parsed.length) setTarefas(parsed)
      }
    } catch {}
    setHidratado(true)
  }, [])

  useEffect(() => {
    if (!hidratado) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas))
    } catch {}
  }, [tarefas, hidratado])

  // ── ações ────────────────────────────────────────────────────────────────────
  const moverPara = (idx: number, novoIdx: number) => {
    if (novoIdx < 0 || novoIdx >= tarefas.length) return
    setTarefas(prev => {
      const copia = [...prev]
      const [item] = copia.splice(idx, 1)
      copia.splice(novoIdx, 0, item)
      return copia
    })
  }

  const subir = (idx: number) => moverPara(idx, idx - 1)
  const descer = (idx: number) => moverPara(idx, idx + 1)

  const adicionar = () => {
    const texto = novoTexto.trim()
    if (!texto) return
    const id = 't' + Date.now() + '-' + Math.floor(Math.random() * 1000)
    setTarefas(prev => [{ id, texto, prio: novaPrio }, ...prev])
    setNovoTexto('')
    setNovaPrio('Média')
    setDestacarId(id)
    setTimeout(() => setDestacarId(null), 1500)
  }

  const remover = (id: string) => setTarefas(prev => prev.filter(t => t.id !== id))

  const toggleFeito = (id: string) =>
    setTarefas(prev => prev.map(t => (t.id === id ? { ...t, feito: !t.feito } : t)))

  const ciclarPrio = (id: string) => {
    const ordem: Prio[] = ['Urgente', 'Alta', 'Média', 'Baixa']
    setTarefas(prev =>
      prev.map(t => {
        if (t.id !== id) return t
        const i = ordem.indexOf(t.prio)
        return { ...t, prio: ordem[(i + 1) % ordem.length] }
      })
    )
  }

  const iniciarEdicao = (t: Tarefa) => {
    setEditandoId(t.id)
    setEditTexto(t.texto)
  }
  const confirmarEdicao = () => {
    if (!editandoId) return
    const texto = editTexto.trim()
    if (!texto) return setEditandoId(null)
    setTarefas(prev => prev.map(t => (t.id === editandoId ? { ...t, texto } : t)))
    setEditandoId(null)
  }
  const cancelarEdicao = () => setEditandoId(null)

  const ordenarPorPrioridade = () => {
    const peso: Record<Prio, number> = { Urgente: 0, Alta: 1, Média: 2, Baixa: 3 }
    setTarefas(prev => [...prev].sort((a, b) => peso[a.prio] - peso[b.prio]))
  }

  const resetar = () => {
    if (confirm('Restaurar lista padrão de tarefas? Suas alterações serão perdidas.')) {
      setTarefas(TAREFAS_INICIAIS)
    }
  }

  // ── drag and drop ────────────────────────────────────────────────────────────
  const onDragStart = (id: string) => (e: React.DragEvent) => {
    dragIdRef.current = id
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverId !== id) setDragOverId(id)
  }
  const onDragLeave = () => setDragOverId(null)
  const onDrop = (id: string) => (e: React.DragEvent) => {
    e.preventDefault()
    const fromId = dragIdRef.current
    setDragOverId(null)
    dragIdRef.current = null
    if (!fromId || fromId === id) return
    setTarefas(prev => {
      const fromIdx = prev.findIndex(t => t.id === fromId)
      const toIdx = prev.findIndex(t => t.id === id)
      if (fromIdx < 0 || toIdx < 0) return prev
      const copia = [...prev]
      const [item] = copia.splice(fromIdx, 1)
      copia.splice(toIdx, 0, item)
      return copia
    })
  }

  // ── contadores ───────────────────────────────────────────────────────────────
  const contagem = useMemo(() => {
    const c = { Urgente: 0, Alta: 0, Média: 0, Baixa: 0 } as Record<Prio, number>
    tarefas.forEach(t => { if (!t.feito) c[t.prio]++ })
    return c
  }, [tarefas])

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <PainelShell>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketing</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Calendário Instagram ativo · Sem 1 (20 → 26/mai) · Foco: lançamento dos 5 produtos no Instagram
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Calendário */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
              Calendário Instagram — semana 1
            </p>
            <div className="space-y-3">
              {CALENDARIO.map((item, i) => (
                <div key={i} className="bg-[#1a1a24] border border-[#1e1e2e] rounded-lg p-3 hover:border-[#2d2d3d] transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-medium w-16 flex-shrink-0">{item.dia}</span>
                      <p className="text-sm text-white font-medium leading-snug">{item.titulo}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${item.tipoCor}`}>{item.tipo}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-[4.5rem]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pilares */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Pilares de conteúdo
            </p>
            <div className="space-y-3">
              {PILARES.map((p, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-[#1e1e2e] last:border-0">
                  <div className={`w-9 h-9 rounded-lg ${p.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                    {p.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{p.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tarefas */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Tarefas de marketing pendentes
            </p>
            <div className="flex items-center gap-2">
              <Pill cor={PRIO_COR.Urgente}>{contagem.Urgente} urgente</Pill>
              <Pill cor={PRIO_COR.Alta}>{contagem.Alta} alta</Pill>
              <Pill cor={PRIO_COR.Média}>{contagem.Média} média</Pill>
              <Pill cor={PRIO_COR.Baixa}>{contagem.Baixa} baixa</Pill>
            </div>
          </div>

          {/* Form de adicionar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={novoTexto}
              onChange={e => setNovoTexto(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') adicionar() }}
              placeholder="Adicionar nova tarefa..."
              className="flex-1 bg-[#1a1a24] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-700/60"
            />
            <select
              value={novaPrio}
              onChange={e => setNovaPrio(e.target.value as Prio)}
              className="bg-[#1a1a24] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-700/60"
            >
              <option value="Urgente">Urgente</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
            <button
              type="button"
              onClick={adicionar}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Adicionar
            </button>
          </div>

          {/* Ações de lista */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={ordenarPorPrioridade}
              className="text-[11px] px-2.5 py-1 rounded-md bg-[#1a1a24] border border-[#1e1e2e] text-gray-400 hover:text-white hover:border-[#2d2d3d] transition-colors"
            >
              Ordenar por prioridade
            </button>
            <button
              type="button"
              onClick={resetar}
              className="text-[11px] px-2.5 py-1 rounded-md bg-[#1a1a24] border border-[#1e1e2e] text-gray-400 hover:text-white hover:border-[#2d2d3d] transition-colors"
            >
              Restaurar padrão
            </button>
            <span className="text-[11px] text-gray-600 ml-auto">
              Arraste, use setas ↑↓ ou clique na prioridade para alterar
            </span>
          </div>

          {/* Lista */}
          <div className="space-y-2">
            {tarefas.map((t, i) => {
              const editando = editandoId === t.id
              const sendoArrastada = dragOverId === t.id
              return (
                <div
                  key={t.id}
                  draggable={!editando}
                  onDragStart={onDragStart(t.id)}
                  onDragOver={onDragOver(t.id)}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop(t.id)}
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg border transition-all ${
                    destacarId === t.id
                      ? 'border-emerald-600/60 bg-emerald-900/10'
                      : sendoArrastada
                      ? 'border-violet-700/60 bg-[#1a1a24]'
                      : 'border-transparent hover:border-[#1e1e2e] hover:bg-[#15151f]'
                  } ${t.feito ? 'opacity-50' : ''}`}
                >
                  {/* Handle de drag */}
                  <span
                    title="Arraste para reordenar"
                    className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 select-none px-1"
                  >
                    ⋮⋮
                  </span>

                  {/* Setas */}
                  <div className="flex flex-col">
                    <button
                      onClick={() => subir(i)}
                      disabled={i === 0}
                      className="text-gray-600 hover:text-violet-400 disabled:opacity-20 disabled:hover:text-gray-600 text-xs leading-none px-1"
                      title="Subir"
                    >▲</button>
                    <button
                      onClick={() => descer(i)}
                      disabled={i === tarefas.length - 1}
                      className="text-gray-600 hover:text-violet-400 disabled:opacity-20 disabled:hover:text-gray-600 text-xs leading-none px-1"
                      title="Descer"
                    >▼</button>
                  </div>

                  {/* Checkbox */}
                  <button
                    onClick={() => toggleFeito(t.id)}
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] transition-colors ${
                      t.feito
                        ? 'bg-emerald-600/30 border-emerald-600/60 text-emerald-400'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    title={t.feito ? 'Desmarcar' : 'Marcar como feita'}
                  >
                    {t.feito ? '✓' : ''}
                  </button>

                  {/* Texto / edição */}
                  {editando ? (
                    <input
                      autoFocus
                      type="text"
                      value={editTexto}
                      onChange={e => setEditTexto(e.target.value)}
                      onBlur={confirmarEdicao}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmarEdicao()
                        if (e.key === 'Escape') cancelarEdicao()
                      }}
                      className="flex-1 bg-[#1a1a24] border border-violet-700/60 rounded px-2 py-1 text-sm text-white focus:outline-none"
                    />
                  ) : (
                    <p
                      onDoubleClick={() => iniciarEdicao(t)}
                      className={`flex-1 text-sm cursor-text ${t.feito ? 'text-gray-500 line-through' : 'text-gray-300'}`}
                      title="Duplo clique para editar"
                    >
                      {t.texto}
                    </p>
                  )}

                  {/* Prioridade clicável */}
                  <button
                    onClick={() => ciclarPrio(t.id)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 transition-opacity hover:opacity-80 ${PRIO_COR[t.prio]}`}
                    title="Clique para trocar prioridade"
                  >
                    {t.prio}
                  </button>

                  {/* Excluir */}
                  <button
                    onClick={() => remover(t.id)}
                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm px-1"
                    title="Excluir tarefa"
                  >
                    ✕
                  </button>
                </div>
              )
            })}

            {tarefas.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-600">
                Nenhuma tarefa. Adicione a primeira acima ou restaure o padrão.
              </div>
            )}
          </div>
        </div>
      </div>
    </PainelShell>
  )
}

function Pill({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cor}`}>
      {children}
    </span>
  )
}
