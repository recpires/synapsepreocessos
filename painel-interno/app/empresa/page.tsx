'use client'

import { useState, useEffect, useCallback } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'
import {
  type Contrato,
  type ContratoInsert,
  TIPOS_CONTRATO_EMPRESA,
  RESPONSAVEIS,
  STATUS_CORES,
  STATUS_LABEL,
} from '@/types/contratos'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v?: number) =>
  v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'

const fmtData = (d?: string) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—'

function diasParaVencer(dataVenc?: string): number | null {
  if (!dataVenc) return null
  const diff = new Date(dataVenc + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Empty Form ───────────────────────────────────────────────────────────────

const formInicial = (): ContratoInsert => ({
  cliente: '',
  tipo: 'Fornecedor',
  status: 'vigente',
  valor: undefined,
  data_inicio: new Date().toISOString().split('T')[0],
  data_vencimento: undefined,
  responsavel: 'Rodrigo',
  observacao: '',
  gerado_por_template: false,
  lado: 'empresa',
  created_by: 'painel',
})

// ─── Modal: Cadastro / Upload ─────────────────────────────────────────────────

function ModalDocumento({ open, onClose, onSave }: {
  open: boolean
  onClose: () => void
  onSave: (c: ContratoInsert, file?: File) => Promise<void>
}) {
  const [form, setForm]   = useState<ContratoInsert>(() => formInicial())
  const [arquivo, setArq] = useState<File | null>(null)
  const [saving, setSave] = useState(false)

  useEffect(() => { if (open) { setForm(formInicial()); setArq(null) } }, [open])
  if (!open) return null

  const set = (k: keyof ContratoInsert, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSave(true)
    await onSave({ ...form, lado: 'empresa' }, arquivo ?? undefined)
    setSave(false)
  }

  const inp = `w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-white text-sm
    focus:outline-none focus:border-violet-600 transition-colors`
  const lbl = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
          <h2 className="font-semibold text-white">Novo Documento da Empresa</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={lbl}>Fornecedor / Contratado</label>
            <input type="text" value={form.cliente} onChange={e => set('cliente', e.target.value)}
              placeholder="Ex: Imobiliária ABC, Contador João, AWS…" required className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Categoria</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inp}>
                {TIPOS_CONTRATO_EMPRESA.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as ContratoInsert['status'])} className={inp}>
                <option value="vigente">Vigente</option>
                <option value="em_renovacao">Em renovação</option>
                <option value="pendente_assinatura">Pend. assinatura</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Valor mensal (R$) — opcional</label>
              <input type="number" step="0.01" min="0" value={form.valor ?? ''}
                onChange={e => set('valor', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0,00" className={inp} />
            </div>
            <div>
              <label className={lbl}>Responsável</label>
              <select value={form.responsavel} onChange={e => set('responsavel', e.target.value)} className={inp}>
                {RESPONSAVEIS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Data de Início</label>
              <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} required className={inp} />
            </div>
            <div>
              <label className={lbl}>Vencimento — opcional</label>
              <input type="date" value={form.data_vencimento ?? ''}
                onChange={e => set('data_vencimento', e.target.value || undefined)} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Observação — opcional</label>
            <input type="text" value={form.observacao ?? ''} onChange={e => set('observacao', e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>PDF do Documento — opcional</label>
            <label className={`flex items-center gap-3 cursor-pointer border border-dashed rounded-lg px-4 py-3 transition-colors ${
              arquivo ? 'border-violet-600/60 bg-violet-900/10' : 'border-[#2d2d3d] hover:border-[#3d3d4d]'
            }`}>
              <input type="file" accept=".pdf" className="hidden" onChange={e => setArq(e.target.files?.[0] ?? null)} />
              {arquivo ? (
                <div className="flex items-center gap-3 w-full">
                  <span>📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-violet-300 truncate">{arquivo.name}</p>
                    <p className="text-xs text-gray-500">{(arquivo.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button type="button" onClick={e => { e.preventDefault(); setArq(null) }}
                    className="text-gray-500 hover:text-red-400 text-lg">×</button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-500">
                  <span className="text-xl">📎</span>
                  <div><p className="text-sm">Clique para anexar PDF</p><p className="text-xs text-gray-600">máx. 10 MB</p></div>
                </div>
              )}
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#1e1e2e] hover:bg-[#2d2d3d] text-gray-300 font-medium py-2.5 rounded-lg transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmpresaPage() {
  const supabase = createClient()

  const [documentos, setDocumentos] = useState<Contrato[]>([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(false)
  const [busca, setBusca]           = useState('')
  const [tipoFiltro, setTipo]       = useState('Todos')
  const [statusFiltro, setStatus]   = useState('todos')
  const [view, setView]             = useState<'lista' | 'miniatura'>('lista')

  // Persistir preferencia de visualização
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('empresa-view') : null
    if (saved === 'lista' || saved === 'miniatura') setView(saved)
  }, [])
  useEffect(() => {
    try { localStorage.setItem('empresa-view', view) } catch {}
  }, [view])

  const fetchDocumentos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('contratos')
      .select('*')
      .eq('lado', 'empresa')
      .order('data_inicio', { ascending: false })
    setDocumentos((data as Contrato[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchDocumentos() }, [fetchDocumentos])

  async function handleSave(c: ContratoInsert, file?: File) {
    let arquivo_url: string | undefined
    let arquivo_nome: string | undefined

    if (file) {
      const ext  = file.name.split('.').pop()
      const path = `empresa/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data: up, error: upErr } = await supabase.storage
        .from('contratos-arquivos')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (upErr || !up) {
        console.error('[empresa] erro no upload do arquivo:', upErr)
        alert(`Falha ao subir o PDF: ${upErr?.message ?? 'erro desconhecido'}\n\nO documento será salvo sem o anexo.`)
      } else {
        const { data: url } = supabase.storage.from('contratos-arquivos').getPublicUrl(up.path)
        arquivo_url  = url.publicUrl
        arquivo_nome = file.name
      }
    }

    const { error: insertErr } = await supabase
      .from('contratos')
      .insert({ ...c, lado: 'empresa', arquivo_url, arquivo_nome })

    if (insertErr) {
      console.error('[empresa] erro ao inserir contrato:', insertErr)
      alert(`Erro ao salvar: ${insertErr.message}`)
      return
    }

    setModal(false); fetchDocumentos()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este documento?')) return
    await supabase.from('contratos').delete().eq('id', id)
    fetchDocumentos()
  }

  // KPIs
  const vigentes   = documentos.filter(c => c.status === 'vigente').length
  const pendentes  = documentos.filter(c => c.status === 'pendente_assinatura').length
  const vencendo   = documentos.filter(c => {
    const d = diasParaVencer(c.data_vencimento)
    return d !== null && d >= 0 && d <= 30 && c.status === 'vigente'
  }).length
  const custoMensal = documentos
    .filter(c => c.status === 'vigente' && c.valor)
    .reduce((s, c) => s + Number(c.valor), 0)

  // Filtros
  const filtrados = documentos.filter(c => {
    const matchBusca  = !busca || c.cliente.toLowerCase().includes(busca.toLowerCase())
    const matchTipo   = tipoFiltro === 'Todos' || c.tipo === tipoFiltro
    const matchStatus = statusFiltro === 'todos' || c.status === statusFiltro
    return matchBusca && matchTipo && matchStatus
  })

  const alertas = documentos.filter(c => {
    const dias = diasParaVencer(c.data_vencimento)
    return dias !== null && dias >= 0 && dias <= 30 && c.status === 'vigente'
  })

  const sel = `bg-[#111118] border border-[#2d2d3d] text-sm text-gray-300 rounded-lg px-3 py-2
    focus:outline-none focus:border-violet-600 transition-colors`

  return (
    <PainelShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-white">Documentos da Empresa</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Contratos onde a Synapse é a contratante — aluguel, contabilidade, fornecedores, ferramentas…
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Vigentes</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400">{vigentes}</p>
          </div>
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Pend. assinatura</p>
            <p className="text-xl sm:text-2xl font-bold text-orange-400">{pendentes}</p>
          </div>
          <div className={`border rounded-xl p-4 sm:p-5 ${vencendo > 0 ? 'bg-amber-900/20 border-amber-700/50' : 'bg-[#111118] border-[#1e1e2e]'}`}>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Vencendo em 30d</p>
            <p className={`text-xl sm:text-2xl font-bold ${vencendo > 0 ? 'text-amber-400' : 'text-white'}`}>{vencendo}</p>
          </div>
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Custo mensal vigente</p>
            <p className="text-xl sm:text-2xl font-bold text-violet-400">{fmt(custoMensal)}</p>
          </div>
        </div>

        {alertas.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-300 mb-1">
                {alertas.length} documento{alertas.length > 1 ? 's' : ''} vencendo em até 30 dias
              </p>
              {alertas.map(c => (
                <p key={c.id} className="text-xs text-amber-400/80">
                  {c.cliente} ({c.tipo}) — vence em {fmtData(c.data_vencimento)} ({diasParaVencer(c.data_vencimento)} dias)
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Filtros + ação */}
        <div className="flex flex-wrap gap-3 items-center">
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar fornecedor…" className={`${sel} w-full sm:w-48 placeholder-gray-600`} />
          <select value={tipoFiltro} onChange={e => setTipo(e.target.value)} className={sel}>
            <option value="Todos">Todas as categorias</option>
            {TIPOS_CONTRATO_EMPRESA.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={statusFiltro} onChange={e => setStatus(e.target.value)} className={sel}>
            <option value="todos">Todos os status</option>
            <option value="vigente">Vigente</option>
            <option value="em_renovacao">Em renovação</option>
            <option value="pendente_assinatura">Pend. assinatura</option>
            <option value="encerrado">Encerrado</option>
          </select>
          {(busca || tipoFiltro !== 'Todos' || statusFiltro !== 'todos') && (
            <button onClick={() => { setBusca(''); setTipo('Todos'); setStatus('todos') }}
              className="text-xs text-gray-500 hover:text-white transition-colors">Limpar</button>
          )}
          <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">{filtrados.length} doc{filtrados.length !== 1 ? 's' : ''}</span>

            {/* Toggle de visualização */}
            <div className="flex items-center bg-[#111118] border border-[#2d2d3d] rounded-lg p-0.5">
              <button
                onClick={() => setView('lista')}
                title="Visualização em lista"
                aria-label="Visualização em lista"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === 'lista' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6"  x2="21" y2="6"  /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6"  x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Lista
              </button>
              <button
                onClick={() => setView('miniatura')}
                title="Visualização em miniaturas"
                aria-label="Visualização em miniaturas"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === 'miniatura' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
                Miniatura
              </button>
            </div>

            <button onClick={() => setModal(true)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              + Cadastrar
            </button>
          </div>
        </div>

        {/* Conteúdo: lista ou miniatura */}
        {loading ? (
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl flex items-center justify-center py-20 text-gray-600">
            Carregando…
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
            <span className="text-4xl">🏢</span>
            <p>Nenhum documento da empresa cadastrado.</p>
          </div>
        ) : view === 'lista' ? (
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e1e2e]">
                    {['Fornecedor','Categoria','Status','Valor mensal','Início','Vencimento','Responsável','📄',''].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((c, i) => {
                    const dias = diasParaVencer(c.data_vencimento)
                    const venceEmBreve = dias !== null && dias >= 0 && dias <= 30 && c.status === 'vigente'
                    return (
                      <tr key={c.id}
                        className={`border-b border-[#1e1e2e]/60 hover:bg-[#1e1e2e]/40 transition-colors ${i === filtrados.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">{c.cliente}</td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{c.tipo}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CORES[c.status] ?? 'bg-gray-800 text-gray-400'}`}>
                            {STATUS_LABEL[c.status] ?? c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{fmt(c.valor)}</td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtData(c.data_inicio)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.data_vencimento ? (
                            <span className={venceEmBreve ? 'text-amber-400 font-medium' : 'text-gray-400'}>
                              {fmtData(c.data_vencimento)}
                              {venceEmBreve && <span className="ml-1 text-[10px]">({dias}d)</span>}
                            </span>
                          ) : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{c.responsavel}</td>
                        <td className="px-4 py-3 text-center">
                          {c.arquivo_url
                            ? <a href={c.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors">📄</a>
                            : <span className="text-gray-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete(c.id)} className="text-gray-600 hover:text-red-400 transition-colors text-base">×</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* MINIATURA — grid de cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filtrados.map(c => {
              const dias = diasParaVencer(c.data_vencimento)
              const venceEmBreve = dias !== null && dias >= 0 && dias <= 30 && c.status === 'vigente'
              const temPdf = !!c.arquivo_url

              return (
                <div
                  key={c.id}
                  className={`group bg-[#111118] border rounded-xl overflow-hidden flex flex-col transition-all hover:border-violet-600/40 hover:shadow-lg hover:shadow-violet-600/5 ${
                    venceEmBreve ? 'border-amber-700/50' : 'border-[#1e1e2e]'
                  }`}
                >
                  {/* Preview do PDF — área visual */}
                  <a
                    href={c.arquivo_url ?? '#'}
                    target={temPdf ? '_blank' : undefined}
                    rel={temPdf ? 'noopener noreferrer' : undefined}
                    onClick={e => { if (!temPdf) e.preventDefault() }}
                    aria-disabled={!temPdf}
                    className={`relative aspect-[4/3] flex items-center justify-center border-b border-[#1e1e2e] overflow-hidden ${
                      temPdf
                        ? 'bg-gradient-to-br from-[#1a1530] to-[#0a0a0f] cursor-pointer'
                        : 'bg-[#0a0a0f] cursor-default'
                    }`}
                  >
                    {temPdf ? (
                      <>
                        {/* Ícone PDF estilizado */}
                        <div className="flex flex-col items-center gap-2 transition-transform group-hover:scale-105">
                          <div className="relative">
                            <svg width="56" height="64" viewBox="0 0 56 64" fill="none">
                              <path d="M4 4h32l16 16v36a4 4 0 01-4 4H4a4 4 0 01-4-4V8a4 4 0 014-4z" fill="#1e1b3a" stroke="#7c3aed" strokeWidth="1.5"/>
                              <path d="M36 4v12a4 4 0 004 4h12" stroke="#7c3aed" strokeWidth="1.5" fill="none"/>
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-violet-300 tracking-wider mt-2">PDF</span>
                          </div>
                          <span className="text-[10px] text-gray-500 group-hover:text-violet-400 transition-colors">Abrir documento</span>
                        </div>

                        {/* Badge categoria no canto */}
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#0a0a0f]/80 text-gray-300 border border-[#2d2d3d] backdrop-blur-sm">
                          {c.tipo}
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-700">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span className="text-[10px] uppercase tracking-wider">Sem anexo</span>
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#0a0a0f]/80 text-gray-400 border border-[#2d2d3d]">
                          {c.tipo}
                        </span>
                      </div>
                    )}

                    {/* Botão excluir — flutua no canto */}
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(c.id) }}
                      title="Excluir"
                      aria-label="Excluir"
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-md bg-[#0a0a0f]/80 border border-[#2d2d3d] text-gray-500 hover:text-red-400 hover:border-red-700/50 transition-colors text-base leading-none opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                    >
                      ×
                    </button>
                  </a>

                  {/* Conteúdo */}
                  <div className="p-4 flex flex-col gap-2.5 flex-1">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate" title={c.cliente}>{c.cliente}</h3>
                      <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${STATUS_CORES[c.status] ?? 'bg-gray-800 text-gray-400'}`}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </div>

                    {/* Valor */}
                    {c.valor != null && c.valor > 0 ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-violet-400">{fmt(c.valor)}</span>
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider">/mês</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 italic">Sem valor informado</div>
                    )}

                    {/* Metadados */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] mt-auto pt-2 border-t border-[#1e1e2e]">
                      <div>
                        <p className="text-gray-600 uppercase tracking-wider text-[9px]">Início</p>
                        <p className="text-gray-400">{fmtData(c.data_inicio)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 uppercase tracking-wider text-[9px]">Vencimento</p>
                        <p className={venceEmBreve ? 'text-amber-400 font-medium' : 'text-gray-400'}>
                          {c.data_vencimento ? fmtData(c.data_vencimento) : '—'}
                          {venceEmBreve && <span className="ml-1 text-[10px]">({dias}d)</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-600 pt-1">
                      <span>👤 {c.responsavel}</span>
                      {c.arquivo_nome && (
                        <span className="truncate max-w-[60%]" title={c.arquivo_nome}>{c.arquivo_nome}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ModalDocumento open={modal} onClose={() => setModal(false)} onSave={handleSave} />
    </PainelShell>
  )
}
