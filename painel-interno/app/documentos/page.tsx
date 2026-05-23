'use client'

import { useEffect, useState, useRef } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'
import SubNav from '@/components/SubNav'
import { SUBNAV } from '@/lib/nav'

type Documento = {
  id: string
  nome: string
  descricao?: string
  categoria: string
  arquivo_url?: string
  arquivo_nome?: string
  arquivo_tipo?: string
  tamanho_bytes?: number
  created_at: string
  created_by: string
}

const CATEGORIAS = ['Todos', 'Comercial', 'Marketing', 'Financeiro', 'Jurídico', 'Produto', 'Interno'] as const

const CATEGORIA_COR: Record<string, string> = {
  'Comercial':  'bg-blue-900/40 text-blue-300 border border-blue-800',
  'Marketing':  'bg-pink-900/40 text-pink-300 border border-pink-800',
  'Financeiro': 'bg-amber-900/40 text-amber-300 border border-amber-800',
  'Jurídico':   'bg-red-900/40 text-red-300 border border-red-800',
  'Produto':    'bg-emerald-900/40 text-emerald-300 border border-emerald-800',
  'Interno':    'bg-gray-800 text-gray-400 border border-gray-700',
}

function fileIcon(tipo?: string) {
  if (!tipo) return '📄'
  if (tipo === 'pdf') return '📕'
  if (['doc', 'docx'].includes(tipo)) return '📝'
  if (tipo === 'md') return '📋'
  if (['xls', 'xlsx'].includes(tipo)) return '📊'
  if (['png', 'jpg', 'jpeg', 'webp'].includes(tipo)) return '🖼️'
  return '📄'
}

function formatBytes(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DocumentosPage() {
  const supabase = createClient()
  const [docs, setDocs] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<string>('Todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // Form state
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('Interno')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
    fetchDocs()
  }, [])

  async function fetchDocs() {
    setLoading(true)
    const { data } = await supabase
      .from('documentos')
      .select('*')
      .order('created_at', { ascending: false })
    setDocs(data ?? [])
    setLoading(false)
  }

  function resetForm() {
    setNome('')
    setDescricao('')
    setCategoria('Interno')
    setArquivo(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleUpload() {
    if (!nome.trim()) return
    setSaving(true)

    let arquivo_url: string | undefined
    let arquivo_nome: string | undefined
    let arquivo_tipo: string | undefined
    let tamanho_bytes: number | undefined

    if (arquivo) {
      const ext = arquivo.name.split('.').pop()?.toLowerCase()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data: up, error: upErr } = await supabase.storage
        .from('documentos-files')
        .upload(path, arquivo, { contentType: arquivo.type, upsert: false })

      if (!upErr && up) {
        const { data: urlData } = supabase.storage.from('documentos-files').getPublicUrl(up.path)
        arquivo_url = urlData.publicUrl
        arquivo_nome = arquivo.name
        arquivo_tipo = ext
        tamanho_bytes = arquivo.size
      }
    }

    await supabase.from('documentos').insert({
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      categoria,
      arquivo_url,
      arquivo_nome,
      arquivo_tipo,
      tamanho_bytes,
      created_by: userEmail,
    })

    setSaving(false)
    setModalOpen(false)
    resetForm()
    fetchDocs()
  }

  async function handleDelete(doc: Documento) {
    if (!confirm(`Remover "${doc.nome}"?`)) return

    if (doc.arquivo_url && doc.arquivo_nome) {
      // Extract path from URL
      const parts = doc.arquivo_url.split('/documentos-files/')
      if (parts[1]) {
        await supabase.storage.from('documentos-files').remove([parts[1]])
      }
    }

    await supabase.from('documentos').delete().eq('id', doc.id)
    fetchDocs()
  }

  const filtered = filtro === 'Todos' ? docs : docs.filter(d => d.categoria === filtro)

  const counts = CATEGORIAS.reduce((acc, cat) => {
    acc[cat] = cat === 'Todos' ? docs.length : docs.filter(d => d.categoria === cat).length
    return acc
  }, {} as Record<string, number>)

  return (
    <PainelShell>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <SubNav tabs={SUBNAV.empresa} />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Documentos</h1>
            <p className="text-gray-500 text-sm mt-0.5">Templates, propostas e materiais internos</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <span>+</span> Novo documento
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filtro === cat
                  ? 'bg-violet-600 text-white font-medium'
                  : 'bg-[#111118] border border-[#1e1e2e] text-gray-400 hover:text-white hover:border-[#2d2d3d]'
              }`}
            >
              {cat}
              {counts[cat] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filtro === cat ? 'bg-white/20' : 'bg-[#1e1e2e] text-gray-500'
                }`}>
                  {counts[cat]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-gray-600 text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-600 text-sm">Nenhum documento nesta categoria.</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-3 text-violet-400 text-sm hover:text-violet-300 transition-colors"
            >
              Adicionar o primeiro →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(doc => (
              <div
                key={doc.id}
                className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 hover:border-violet-700/40 transition-colors group flex flex-col"
              >
                {/* Icon + category */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-[#1a1a24] rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                    {fileIcon(doc.arquivo_tipo)}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORIA_COR[doc.categoria] ?? CATEGORIA_COR['Interno']}`}>
                    {doc.categoria}
                  </span>
                </div>

                {/* Name + description */}
                <h3 className="text-sm font-semibold text-white leading-snug mb-1 group-hover:text-violet-300 transition-colors">
                  {doc.nome}
                </h3>
                {doc.descricao && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">{doc.descricao}</p>
                )}

                {/* Meta */}
                <div className="mt-auto pt-3 border-t border-[#1e1e2e] flex items-center justify-between">
                  <div className="text-[10px] text-gray-600 space-y-0.5">
                    <p>{formatDate(doc.created_at)}</p>
                    {doc.tamanho_bytes && <p>{formatBytes(doc.tamanho_bytes)}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.arquivo_url ? (
                      <a
                        href={doc.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 bg-violet-900/20 rounded-md"
                      >
                        ↓ Baixar
                      </a>
                    ) : (
                      <span className="text-xs text-gray-600 px-2 py-1">sem arquivo</span>
                    )}
                    <button
                      onClick={() => handleDelete(doc)}
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors px-1.5 py-1"
                      title="Remover"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add card */}
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#111118] border border-dashed border-[#2d2d3d] rounded-xl p-4 hover:border-violet-700/50 hover:opacity-100 opacity-50 transition-all flex flex-col items-center justify-center gap-2 min-h-[160px]"
            >
              <div className="w-10 h-10 bg-violet-900/15 rounded-lg flex items-center justify-center text-xl">+</div>
              <p className="text-sm text-gray-400">Novo documento</p>
            </button>
          </div>
        )}
      </div>

      {/* Upload modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-white">Novo documento</h2>
              <button
                onClick={() => { setModalOpen(false); resetForm() }}
                className="text-gray-500 hover:text-white transition-colors text-sm"
              >✕</button>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Nome do documento *</label>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Template de Proposta Comercial"
                className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Categoria</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600 transition-colors"
              >
                {CATEGORIAS.filter(c => c !== 'Todos').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Descrição <span className="text-gray-600">(opcional)</span></label>
              <input
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Ex: Template para novos projetos de desenvolvimento"
                className="w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
              />
            </div>

            {/* Arquivo */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Arquivo <span className="text-gray-600">(opcional)</span></label>
              <label className={`flex items-center gap-3 cursor-pointer border border-dashed rounded-lg px-4 py-3 transition-colors ${
                arquivo
                  ? 'border-violet-600/60 bg-violet-900/10'
                  : 'border-[#2d2d3d] hover:border-[#3d3d4d]'
              }`}>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.md,.txt,.xls,.xlsx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={e => setArquivo(e.target.files?.[0] ?? null)}
                />
                <span className="text-xl">{arquivo ? fileIcon(arquivo.name.split('.').pop()?.toLowerCase()) : '📎'}</span>
                <div className="min-w-0 flex-1">
                  {arquivo ? (
                    <>
                      <p className="text-xs text-violet-300 truncate">{arquivo.name}</p>
                      <p className="text-[10px] text-gray-600">{formatBytes(arquivo.size)}</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Clique para selecionar — PDF, DOCX, MD, XLSX...</p>
                  )}
                </div>
                {arquivo && (
                  <button
                    type="button"
                    onClick={e => { e.preventDefault(); setArquivo(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="text-gray-600 hover:text-white transition-colors text-xs ml-1"
                  >✕</button>
                )}
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setModalOpen(false); resetForm() }}
                className="flex-1 bg-[#1a1a24] hover:bg-[#222232] text-gray-300 text-sm py-2.5 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={saving || !nome.trim()}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PainelShell>
  )
}
