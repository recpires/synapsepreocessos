'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import PainelShell from '@/components/PainelShell'
import { createClient } from '@/lib/supabase/client'
import {
  type Contrato,
  type ContratoInsert,
  type Template,
  TIPOS_CONTRATO,
  RESPONSAVEIS,
  STATUS_CORES,
  STATUS_LABEL,
  TEMPLATES,
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

const EMPTY_FORM: ContratoInsert = {
  cliente: '',
  tipo: 'Desenvolvimento',
  status: 'vigente',
  valor: undefined,
  data_inicio: new Date().toISOString().split('T')[0],
  data_vencimento: undefined,
  responsavel: 'Rodrigo',
  observacao: '',
  gerado_por_template: false,
  created_by: 'painel',
}

// ─── Modal: Upload / Cadastro ─────────────────────────────────────────────────

function ModalContrato({ open, onClose, onSave }: {
  open: boolean
  onClose: () => void
  onSave: (c: ContratoInsert, file?: File) => Promise<void>
}) {
  const [form, setForm] = useState<ContratoInsert>(EMPTY_FORM)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) { setForm(EMPTY_FORM); setArquivo(null) } }, [open])
  if (!open) return null

  const set = (k: keyof ContratoInsert, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form, arquivo ?? undefined)
    setSaving(false)
  }

  const inp = `w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-white text-sm
    focus:outline-none focus:border-violet-600 transition-colors`
  const lbl = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
          <h2 className="font-semibold text-white">Novo Contrato</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={lbl}>Cliente / Empresa</label>
            <input type="text" value={form.cliente} onChange={e => set('cliente', e.target.value)}
              placeholder="Nome ou razão social" required className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Tipo de Contrato</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inp}>
                {TIPOS_CONTRATO.map(t => <option key={t}>{t}</option>)}
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Valor (R$) — opcional</label>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Data de Início</label>
              <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} required className={inp} />
            </div>
            <div>
              <label className={lbl}>Data de Vencimento — opcional</label>
              <input type="date" value={form.data_vencimento ?? ''}
                onChange={e => set('data_vencimento', e.target.value || undefined)} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Observação — opcional</label>
            <input type="text" value={form.observacao ?? ''} onChange={e => set('observacao', e.target.value)} className={inp} />
          </div>

          {/* Upload PDF */}
          <div>
            <label className={lbl}>PDF do Contrato — opcional</label>
            <label className={`flex items-center gap-3 cursor-pointer border border-dashed rounded-lg px-4 py-3 transition-colors ${
              arquivo ? 'border-violet-600/60 bg-violet-900/10' : 'border-[#2d2d3d] hover:border-[#3d3d4d]'
            }`}>
              <input type="file" accept=".pdf" className="hidden"
                onChange={e => setArquivo(e.target.files?.[0] ?? null)} />
              {arquivo ? (
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-violet-300 truncate">{arquivo.name}</p>
                    <p className="text-xs text-gray-500">{(arquivo.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button type="button" onClick={e => { e.preventDefault(); setArquivo(null) }}
                    className="text-gray-500 hover:text-red-400 text-lg leading-none">×</button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-500">
                  <span className="text-xl">📎</span>
                  <div>
                    <p className="text-sm">Clique para anexar PDF</p>
                    <p className="text-xs text-gray-600">máx. 10 MB</p>
                  </div>
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

// ─── Modal: Gerador de Templates ──────────────────────────────────────────────

function ModalGerador({ open, onClose, onSave }: {
  open: boolean
  onClose: () => void
  onSave: (c: ContratoInsert) => Promise<void>
}) {
  const [etapa, setEtapa] = useState<'escolha' | 'preenche' | 'preview'>('escolha')
  const [template, setTemplate] = useState<Template | null>(null)
  const [dados, setDados] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) { setEtapa('escolha'); setTemplate(null); setDados({}) }
  }, [open])
  if (!open) return null

  function escolherTemplate(t: Template) {
    setTemplate(t)
    const init: Record<string, string> = {}
    t.campos.forEach(c => { init[c.key] = '' })
    setDados(init)
    setEtapa('preenche')
  }

  function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    setEtapa('preview')
  }

  function handleImprimir() {
    if (!printRef.current) return
    const html = printRef.current.innerHTML
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>${template?.nome}</title>
      <style>* { margin: 0; padding: 0; box-sizing: border-box; } body { background: white; }</style>
    </head><body>${html}</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  async function handleSalvarRegistro() {
    if (!template) return
    setSaving(true)
    const clienteKey = template.campos.find(c =>
      c.key.includes('cliente_nome') || c.key.includes('parte_nome')
    )?.key ?? ''
    const valorKey = template.campos.find(c =>
      c.key.includes('valor')
    )?.key

    await onSave({
      cliente: dados[clienteKey] ?? '—',
      tipo: template.id === 'nda' ? 'NDA' : template.id === 'saas' ? 'SaaS' : 'Desenvolvimento',
      status: 'pendente_assinatura',
      valor: valorKey ? parseFloat(dados[valorKey]) || undefined : undefined,
      data_inicio: dados['data_inicio'] ?? new Date().toISOString().split('T')[0],
      data_vencimento: undefined,
      responsavel: dados['responsavel'] ?? 'Rodrigo',
      observacao: `Gerado a partir do template: ${template.nome}`,
      gerado_por_template: true,
      template_tipo: template.id,
      created_by: 'painel',
    })
    setSaving(false)
  }

  const inp = `w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-white text-sm
    focus:outline-none focus:border-violet-600 transition-colors`
  const lbl = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-h-[90vh] overflow-y-auto ${
        etapa === 'preview' ? 'max-w-4xl' : 'max-w-lg'
      }`}>
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-3">
            {etapa !== 'escolha' && (
              <button onClick={() => setEtapa(etapa === 'preview' ? 'preenche' : 'escolha')}
                className="text-gray-500 hover:text-white transition-colors text-sm">← Voltar</button>
            )}
            <h2 className="font-semibold text-white">
              {etapa === 'escolha' ? 'Gerar Contrato' : etapa === 'preenche' ? template?.nome : 'Pré-visualização'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>

        {/* Escolha de template */}
        {etapa === 'escolha' && (
          <div className="p-5 space-y-3">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => escolherTemplate(t)}
                className="w-full text-left bg-[#0a0a0f] hover:bg-[#1e1e2e] border border-[#2d2d3d] hover:border-violet-600/40 rounded-xl p-4 transition-all group">
                <p className="font-medium text-white group-hover:text-violet-300 transition-colors">{t.nome}</p>
                <p className="text-xs text-gray-500 mt-1">{t.descricao}</p>
              </button>
            ))}
          </div>
        )}

        {/* Preencher campos */}
        {etapa === 'preenche' && template && (
          <form onSubmit={handlePreview} className="p-5 space-y-4">
            {template.campos.map(campo => (
              <div key={campo.key}>
                <label className={lbl}>{campo.label}</label>
                {campo.tipo === 'textarea' ? (
                  <textarea value={dados[campo.key] ?? ''} rows={3}
                    onChange={e => setDados(d => ({ ...d, [campo.key]: e.target.value }))}
                    placeholder={campo.placeholder} required className={`${inp} resize-none`} />
                ) : campo.tipo === 'select' ? (
                  <select value={dados[campo.key] ?? ''} required
                    onChange={e => setDados(d => ({ ...d, [campo.key]: e.target.value }))}
                    className={inp}>
                    <option value="">Selecione…</option>
                    {campo.opcoes?.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={campo.tipo} value={dados[campo.key] ?? ''}
                    onChange={e => setDados(d => ({ ...d, [campo.key]: e.target.value }))}
                    placeholder={campo.placeholder} required className={inp} />
                )}
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 bg-[#1e1e2e] hover:bg-[#2d2d3d] text-gray-300 font-medium py-2.5 rounded-lg transition-colors text-sm">
                Cancelar
              </button>
              <button type="submit"
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                Visualizar →
              </button>
            </div>
          </form>
        )}

        {/* Preview */}
        {etapa === 'preview' && template && (
          <div className="p-5">
            {/* Ações */}
            <div className="flex gap-3 mb-5">
              <button onClick={handleImprimir}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                🖨️ Imprimir / Salvar PDF
              </button>
              <button onClick={handleSalvarRegistro} disabled={saving}
                className="flex items-center gap-2 bg-[#1e1e2e] hover:bg-[#2d2d3d] disabled:opacity-50 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {saving ? 'Salvando…' : '💾 Salvar no painel'}
              </button>
            </div>
            {/* Contrato renderizado */}
            <div ref={printRef} className="bg-white rounded-xl overflow-hidden"
              dangerouslySetInnerHTML={{ __html: template.gerar(dados) }} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Lista de Contratos ───────────────────────────────────────────────────────

function ListaContratos({ contratos, onDelete, onAdd, onGerar }: {
  contratos: Contrato[]
  onDelete: (id: string) => void
  onAdd: () => void
  onGerar: () => void
}) {
  const [busca, setBusca]         = useState('')
  const [tipoFiltro, setTipo]     = useState('Todos')
  const [statusFiltro, setStatus] = useState('todos')

  const filtrados = contratos.filter(c => {
    const matchBusca  = !busca || c.cliente.toLowerCase().includes(busca.toLowerCase())
    const matchTipo   = tipoFiltro === 'Todos' || c.tipo === tipoFiltro
    const matchStatus = statusFiltro === 'todos' || c.status === statusFiltro
    return matchBusca && matchTipo && matchStatus
  })

  // Alertas: contratos com vencimento em ≤30 dias e status vigente
  const alertas = contratos.filter(c => {
    const dias = diasParaVencer(c.data_vencimento)
    return dias !== null && dias >= 0 && dias <= 30 && c.status === 'vigente'
  })

  const sel = `bg-[#111118] border border-[#2d2d3d] text-sm text-gray-300 rounded-lg px-3 py-2
    focus:outline-none focus:border-violet-600 transition-colors`

  return (
    <div className="space-y-4">
      {/* Alertas vencimento */}
      {alertas.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-1">
              {alertas.length} contrato{alertas.length > 1 ? 's' : ''} vencendo em até 30 dias
            </p>
            <div className="space-y-0.5">
              {alertas.map(c => (
                <p key={c.id} className="text-xs text-amber-400/80">
                  {c.cliente} ({c.tipo}) — vence em {fmtData(c.data_vencimento)}
                  {' '}({diasParaVencer(c.data_vencimento)} dias)
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtros + ações */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar cliente…" className={`${sel} w-48 placeholder-gray-600`} />
        <select value={tipoFiltro} onChange={e => setTipo(e.target.value)} className={sel}>
          <option value="Todos">Todos os tipos</option>
          {TIPOS_CONTRATO.map(t => <option key={t}>{t}</option>)}
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
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">{filtrados.length} contrato{filtrados.length !== 1 ? 's' : ''}</span>
          <button onClick={onGerar}
            className="flex items-center gap-1.5 bg-[#1e1e2e] hover:bg-[#2d2d3d] border border-[#2d2d3d] text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            📝 Gerar contrato
          </button>
          <button onClick={onAdd}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <span className="text-base leading-none">+</span> Cadastrar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
            <span className="text-4xl">📁</span>
            <p>Nenhum contrato encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e2e]">
                  {['Cliente','Tipo','Status','Valor','Início','Vencimento','Responsável','📄',''].map(h => (
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
                      <td className="px-4 py-3 text-white font-medium max-w-[180px] truncate">
                        {c.cliente}
                        {c.gerado_por_template && <span className="ml-1.5 text-violet-400 text-[10px]">✦ gerado</span>}
                      </td>
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
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{c.responsavel}</td>
                      <td className="px-4 py-3 text-center">
                        {c.arquivo_url ? (
                          <a href={c.arquivo_url} target="_blank" rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 transition-colors" title="Ver PDF">
                            📄
                          </a>
                        ) : (
                          <span className="text-gray-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => onDelete(c.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors text-base">×</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContratosPage() {
  const supabase = createClient()

  const [contratos, setContratos]       = useState<Contrato[]>([])
  const [loading, setLoading]           = useState(true)
  const [modalUpload, setModalUpload]   = useState(false)
  const [modalGerador, setModalGerador] = useState(false)

  const fetchContratos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('contratos').select('*').order('data_inicio', { ascending: false })
    setContratos(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchContratos() }, [fetchContratos])

  async function handleSave(c: ContratoInsert, file?: File) {
    let arquivo_url: string | undefined
    let arquivo_nome: string | undefined

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data: uploadData, error } = await supabase.storage
        .from('contratos-arquivos')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (!error && uploadData) {
        const { data: urlData } = supabase.storage
          .from('contratos-arquivos')
          .getPublicUrl(uploadData.path)
        arquivo_url = urlData.publicUrl
        arquivo_nome = file.name
      }
    }

    await supabase.from('contratos').insert({ ...c, arquivo_url, arquivo_nome })
    setModalUpload(false)
    fetchContratos()
  }

  async function handleSaveGerado(c: ContratoInsert) {
    await supabase.from('contratos').insert(c)
    setModalGerador(false)
    fetchContratos()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este contrato?')) return
    await supabase.from('contratos').delete().eq('id', id)
    fetchContratos()
  }

  // KPIs
  const vigentes  = contratos.filter(c => c.status === 'vigente').length
  const pendentes = contratos.filter(c => c.status === 'pendente_assinatura').length
  const vencendo  = contratos.filter(c => {
    const d = diasParaVencer(c.data_vencimento)
    return d !== null && d >= 0 && d <= 30 && c.status === 'vigente'
  }).length
  const valorTotal = contratos
    .filter(c => c.status === 'vigente' && c.valor)
    .reduce((s, c) => s + Number(c.valor), 0)

  return (
    <PainelShell>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-white">Contratos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{contratos.length} contrato{contratos.length !== 1 ? 's' : ''} cadastrado{contratos.length !== 1 ? 's' : ''}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vigentes</p>
            <p className="text-2xl font-bold text-emerald-400">{vigentes}</p>
          </div>
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pend. assinatura</p>
            <p className="text-2xl font-bold text-orange-400">{pendentes}</p>
          </div>
          <div className={`border rounded-xl p-5 ${vencendo > 0 ? 'bg-amber-900/20 border-amber-700/50' : 'bg-[#111118] border-[#1e1e2e]'}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vencendo em 30d</p>
            <p className={`text-2xl font-bold ${vencendo > 0 ? 'text-amber-400' : 'text-white'}`}>{vencendo}</p>
          </div>
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Valor em vigência</p>
            <p className="text-2xl font-bold text-violet-400">{fmt(valorTotal)}</p>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-32 text-gray-600">Carregando…</div>
        ) : (
          <ListaContratos
            contratos={contratos}
            onDelete={handleDelete}
            onAdd={() => setModalUpload(true)}
            onGerar={() => setModalGerador(true)}
          />
        )}
      </div>

      <ModalContrato  open={modalUpload}  onClose={() => setModalUpload(false)}  onSave={handleSave} />
      <ModalGerador   open={modalGerador} onClose={() => setModalGerador(false)} onSave={handleSaveGerado} />
    </PainelShell>
  )
}
