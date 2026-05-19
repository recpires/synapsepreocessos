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

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateDB = {
  id: string
  nome: string
  descricao?: string
  tipo: string
  conteudo_html: string
  campos: { key: string; label: string }[]
  created_at: string
}

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

function extrairCampos(html: string): string[] {
  const matches = html.match(/\{\{(\w+)\}\}/g) ?? []
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
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

// ─── WYSIWYG Editor ───────────────────────────────────────────────────────────

const TOOL_BTNS = [
  { cmd: 'bold',      icon: 'B', title: 'Negrito',    style: 'font-bold' },
  { cmd: 'italic',    icon: 'I', title: 'Itálico',    style: 'italic' },
  { cmd: 'underline', icon: 'U', title: 'Sublinhado', style: 'underline' },
]

function WysiwygEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value
    }
  }, []) // eslint-disable-line

  function exec(cmd: string) {
    ref.current?.focus()
    document.execCommand(cmd, false)
    onChange(ref.current?.innerHTML ?? '')
  }

  function insertHeading(tag: string) {
    ref.current?.focus()
    document.execCommand('formatBlock', false, tag)
    onChange(ref.current?.innerHTML ?? '')
  }

  function insertPlaceholder() {
    const campo = prompt('Nome do campo (ex: cliente_nome, valor, data_inicio):')
    if (!campo) return
    ref.current?.focus()
    document.execCommand('insertText', false, `{{${campo.trim()}}}`)
    onChange(ref.current?.innerHTML ?? '')
  }

  return (
    <div className="border border-[#2d2d3d] rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[#0a0a0f] border-b border-[#2d2d3d] flex-wrap">
        {TOOL_BTNS.map(b => (
          <button key={b.cmd} type="button" title={b.title}
            onMouseDown={e => { e.preventDefault(); exec(b.cmd) }}
            className={`w-7 h-7 rounded text-xs text-gray-300 hover:bg-[#2d2d3d] hover:text-white transition-colors ${b.style}`}>
            {b.icon}
          </button>
        ))}
        <div className="w-px h-4 bg-[#2d2d3d] mx-1" />
        {[{ tag: 'h1', label: 'H1' }, { tag: 'h2', label: 'H2' }, { tag: 'p', label: 'P' }].map(b => (
          <button key={b.tag} type="button"
            onMouseDown={e => { e.preventDefault(); insertHeading(b.tag) }}
            className="px-2 h-7 rounded text-xs text-gray-300 hover:bg-[#2d2d3d] hover:text-white transition-colors font-medium">
            {b.label}
          </button>
        ))}
        <div className="w-px h-4 bg-[#2d2d3d] mx-1" />
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList') }}
          className="px-2 h-7 rounded text-xs text-gray-300 hover:bg-[#2d2d3d] hover:text-white transition-colors">
          • Lista
        </button>
        <div className="w-px h-4 bg-[#2d2d3d] mx-1" />
        <button type="button" onMouseDown={e => { e.preventDefault(); insertPlaceholder() }}
          className="px-2 h-7 rounded text-[11px] bg-violet-900/40 text-violet-300 border border-violet-700/50 hover:bg-violet-800/40 transition-colors font-mono">
          + {'{{campo}}'}
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? '')}
        className="min-h-[300px] p-4 text-gray-200 text-sm bg-[#0a0a0f] focus:outline-none
          [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-2 [&_h1]:mt-4
          [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mb-2 [&_h2]:mt-3
          [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2"
      />
    </div>
  )
}

// ─── Modal: Template ──────────────────────────────────────────────────────────

function ModalTemplate({ open, template, onClose, onSave }: {
  open: boolean
  template: TemplateDB | null
  onClose: () => void
  onSave: (t: Omit<TemplateDB, 'id' | 'created_at'>) => Promise<void>
}) {
  const [nome, setNome]     = useState('')
  const [descricao, setDesc]= useState('')
  const [tipo, setTipo]     = useState('Desenvolvimento')
  const [html, setHtml]     = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setNome(template?.nome ?? '')
      setDesc(template?.descricao ?? '')
      setTipo(template?.tipo ?? 'Desenvolvimento')
      setHtml(template?.conteudo_html ?? '')
    }
  }, [open, template])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const campos = extrairCampos(html).map(key => ({ key, label: key.replace(/_/g, ' ') }))
    await onSave({ nome, descricao, tipo, conteudo_html: html, campos, created_by: 'painel' })
    setSaving(false)
  }

  const inp = `w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-white text-sm
    focus:outline-none focus:border-violet-600 transition-colors`
  const lbl = 'block text-xs text-gray-400 mb-1'
  const campos = extrairCampos(html)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
          <h2 className="font-semibold text-white">{template ? 'Editar Template' : 'Novo Template'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={lbl}>Nome do template</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                placeholder="ex: Contrato de Manutenção Mensal" required className={inp} />
            </div>
            <div>
              <label className={lbl}>Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} className={inp}>
                {TIPOS_CONTRATO.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Descrição — opcional</label>
              <input type="text" value={descricao} onChange={e => setDesc(e.target.value)}
                placeholder="Para que serve este template…" className={inp} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={lbl}>Conteúdo do contrato</label>
              {campos.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {campos.map(c => (
                    <span key={c} className="text-[10px] font-mono bg-violet-900/30 text-violet-400 border border-violet-700/40 rounded px-1.5 py-0.5">
                      {`{{${c}}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <WysiwygEditor value={html} onChange={setHtml} />
            <p className="text-[11px] text-gray-600 mt-1">
              Use {'{{campo}}'} para campos variáveis. Clique em "+ campo" na barra para inserir.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#1e1e2e] hover:bg-[#2d2d3d] text-gray-300 font-medium py-2.5 rounded-lg transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving || !html.trim()}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
              {saving ? 'Salvando…' : 'Salvar Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal: Usar template (preencher campos) ──────────────────────────────────

function ModalUsarTemplate({ open, template, onClose, onGerar }: {
  open: boolean
  template: TemplateDB | null
  onClose: () => void
  onGerar: (html: string) => void
}) {
  const [dados, setDados] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && template) {
      const init: Record<string, string> = {}
      template.campos.forEach(c => { init[c.key] = '' })
      setDados(init)
    }
  }, [open, template])

  if (!open || !template) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let html = template!.conteudo_html
    Object.entries(dados).forEach(([key, val]) => {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val)
    })
    onGerar(html)
  }

  const inp = `w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-white text-sm
    focus:outline-none focus:border-violet-600 transition-colors`
  const lbl = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
          <h2 className="font-semibold text-white">Preencher: {template.nome}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {template.campos.length === 0 ? (
            <p className="text-gray-500 text-sm">Este template não tem campos variáveis.</p>
          ) : template.campos.map(campo => (
            <div key={campo.key}>
              <label className={lbl}>{campo.label || campo.key}</label>
              <input type="text" value={dados[campo.key] ?? ''} required
                onChange={e => setDados(d => ({ ...d, [campo.key]: e.target.value }))}
                placeholder={`{{${campo.key}}}`} className={inp} />
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
      </div>
    </div>
  )
}

// ─── Modal: Cadastro / Upload ─────────────────────────────────────────────────

function ModalContrato({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (c: ContratoInsert, file?: File) => Promise<void>
}) {
  const [form, setForm]   = useState<ContratoInsert>({ ...EMPTY_FORM })
  const [arquivo, setArq] = useState<File | null>(null)
  const [saving, setSave] = useState(false)

  useEffect(() => { if (open) { setForm({ ...EMPTY_FORM }); setArq(null) } }, [open])
  if (!open) return null

  const set = (k: keyof ContratoInsert, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSave(true)
    await onSave(form, arquivo ?? undefined)
    setSave(false)
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
              <label className={lbl}>Tipo</label>
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
            <label className={lbl}>PDF do Contrato — opcional</label>
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

// ─── Modal: Gerar via templates built-in ─────────────────────────────────────

function ModalGerador({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (c: ContratoInsert) => Promise<void>
}) {
  const [etapa, setEtapa]   = useState<'escolha' | 'preenche' | 'preview'>('escolha')
  const [template, setTpl]  = useState<Template | null>(null)
  const [dados, setDados]   = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const printRef            = useRef<HTMLDivElement>(null)

  useEffect(() => { if (open) { setEtapa('escolha'); setTpl(null); setDados({}) } }, [open])
  if (!open) return null

  function escolher(t: Template) {
    setTpl(t)
    const init: Record<string, string> = {}
    t.campos.forEach(c => { init[c.key] = '' })
    setDados(init); setEtapa('preenche')
  }

  function handleImprimir() {
    if (!printRef.current || !template) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>${template.nome}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fff}</style>
    </head><body>${printRef.current.innerHTML}</body></html>`)
    win.document.close(); win.focus(); win.print()
  }

  async function handleSalvar() {
    if (!template) return; setSaving(true)
    const clienteKey = template.campos.find(c => c.key.includes('cliente_nome') || c.key.includes('parte_nome'))?.key ?? ''
    const valorKey   = template.campos.find(c => c.key.includes('valor'))?.key
    await onSave({
      cliente: dados[clienteKey] ?? '—',
      tipo: template.id === 'nda' ? 'NDA' : template.id === 'saas' ? 'SaaS' : 'Desenvolvimento',
      status: 'pendente_assinatura',
      valor: valorKey ? parseFloat(dados[valorKey]) || undefined : undefined,
      data_inicio: dados['data_inicio'] ?? new Date().toISOString().split('T')[0],
      responsavel: dados['responsavel'] ?? 'Rodrigo',
      observacao: `Gerado via template: ${template.nome}`,
      gerado_por_template: true, template_tipo: template.id, created_by: 'painel',
    })
    setSaving(false)
  }

  const inp = `w-full bg-[#0a0a0f] border border-[#2d2d3d] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-600 transition-colors`
  const lbl = 'block text-xs text-gray-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-h-[90vh] overflow-y-auto ${etapa === 'preview' ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-3">
            {etapa !== 'escolha' && (
              <button onClick={() => setEtapa(etapa === 'preview' ? 'preenche' : 'escolha')}
                className="text-gray-500 hover:text-white text-sm transition-colors">← Voltar</button>
            )}
            <h2 className="font-semibold text-white">
              {etapa === 'escolha' ? 'Gerar Contrato' : etapa === 'preenche' ? template?.nome : 'Pré-visualização'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
        </div>

        {etapa === 'escolha' && (
          <div className="p-5 space-y-3">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => escolher(t)}
                className="w-full text-left bg-[#0a0a0f] hover:bg-[#1e1e2e] border border-[#2d2d3d] hover:border-violet-600/40 rounded-xl p-4 transition-all group">
                <p className="font-medium text-white group-hover:text-violet-300 transition-colors">{t.nome}</p>
                <p className="text-xs text-gray-500 mt-1">{t.descricao}</p>
              </button>
            ))}
          </div>
        )}

        {etapa === 'preenche' && template && (
          <form onSubmit={e => { e.preventDefault(); setEtapa('preview') }} className="p-5 space-y-4">
            {template.campos.map(campo => (
              <div key={campo.key}>
                <label className={lbl}>{campo.label}</label>
                {campo.tipo === 'textarea' ? (
                  <textarea value={dados[campo.key] ?? ''} rows={3} required
                    onChange={e => setDados(d => ({ ...d, [campo.key]: e.target.value }))}
                    placeholder={campo.placeholder} className={`${inp} resize-none`} />
                ) : campo.tipo === 'select' ? (
                  <select value={dados[campo.key] ?? ''} required
                    onChange={e => setDados(d => ({ ...d, [campo.key]: e.target.value }))} className={inp}>
                    <option value="">Selecione…</option>
                    {campo.opcoes?.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={campo.tipo} value={dados[campo.key] ?? ''} required
                    onChange={e => setDados(d => ({ ...d, [campo.key]: e.target.value }))}
                    placeholder={campo.placeholder} className={inp} />
                )}
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 bg-[#1e1e2e] hover:bg-[#2d2d3d] text-gray-300 font-medium py-2.5 rounded-lg transition-colors text-sm">Cancelar</button>
              <button type="submit"
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">Visualizar →</button>
            </div>
          </form>
        )}

        {etapa === 'preview' && template && (
          <div className="p-5">
            <div className="flex gap-3 mb-5">
              <button onClick={handleImprimir}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                🖨️ Imprimir / PDF
              </button>
              <button onClick={handleSalvar} disabled={saving}
                className="flex items-center gap-2 bg-[#1e1e2e] hover:bg-[#2d2d3d] disabled:opacity-50 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {saving ? 'Salvando…' : '💾 Salvar no painel'}
              </button>
            </div>
            <div ref={printRef} className="bg-white rounded-xl overflow-hidden"
              dangerouslySetInnerHTML={{ __html: template.gerar(dados) }} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Aba: Templates customizados ─────────────────────────────────────────────

function AbaTemplates({ onUsar }: { onUsar: (t: TemplateDB) => void }) {
  const supabase = createClient()
  const [templates, setTemplates] = useState<TemplateDB[]>([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [editando, setEditando]   = useState<TemplateDB | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('contrato_templates').select('*').order('created_at', { ascending: false })
    setTemplates((data as TemplateDB[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetch_() }, [fetch_])

  async function handleSave(t: Omit<TemplateDB, 'id' | 'created_at'>) {
    if (editando) {
      await supabase.from('contrato_templates').update(t).eq('id', editando.id)
    } else {
      await supabase.from('contrato_templates').insert(t)
    }
    setModal(false); setEditando(null); fetch_()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este template?')) return
    await supabase.from('contrato_templates').delete().eq('id', id)
    fetch_()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{templates.length} template{templates.length !== 1 ? 's' : ''} salvos</p>
        <button onClick={() => { setEditando(null); setModal(true) }}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Novo template
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-600">Carregando…</div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#111118] border border-[#1e1e2e] rounded-xl gap-3 text-gray-600">
          <span className="text-4xl">📄</span>
          <p>Nenhum template ainda. Crie o primeiro clicando em "+ Novo template".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-5 flex flex-col gap-3 hover:border-[#2d2d3d] transition-colors">
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{t.nome}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.tipo}</p>
                {t.descricao && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{t.descricao}</p>}
              </div>
              {t.campos.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {t.campos.slice(0, 5).map(c => (
                    <span key={c.key} className="text-[10px] font-mono bg-violet-900/20 text-violet-400 border border-violet-800/30 rounded px-1.5 py-0.5">
                      {`{{${c.key}}}`}
                    </span>
                  ))}
                  {t.campos.length > 5 && <span className="text-[10px] text-gray-600">+{t.campos.length - 5}</span>}
                </div>
              )}
              <div className="flex gap-2 mt-auto pt-1">
                <button onClick={() => onUsar(t)}
                  className="flex-1 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-medium py-1.5 rounded-lg transition-colors border border-violet-700/30">
                  Usar
                </button>
                <button onClick={() => { setEditando(t); setModal(true) }}
                  className="flex-1 bg-[#1e1e2e] hover:bg-[#2d2d3d] text-gray-400 text-xs font-medium py-1.5 rounded-lg transition-colors">
                  Editar
                </button>
                <button onClick={() => handleDelete(t.id)}
                  className="px-2 text-gray-600 hover:text-red-400 transition-colors text-base">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalTemplate open={modal} template={editando}
        onClose={() => { setModal(false); setEditando(null) }} onSave={handleSave} />
    </div>
  )
}

// ─── Lista de contratos ───────────────────────────────────────────────────────

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

  const alertas = contratos.filter(c => {
    const dias = diasParaVencer(c.data_vencimento)
    return dias !== null && dias >= 0 && dias <= 30 && c.status === 'vigente'
  })

  const sel = `bg-[#111118] border border-[#2d2d3d] text-sm text-gray-300 rounded-lg px-3 py-2
    focus:outline-none focus:border-violet-600 transition-colors`

  return (
    <div className="space-y-4">
      {alertas.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-1">
              {alertas.length} contrato{alertas.length > 1 ? 's' : ''} vencendo em até 30 dias
            </p>
            {alertas.map(c => (
              <p key={c.id} className="text-xs text-amber-400/80">
                {c.cliente} ({c.tipo}) — vence em {fmtData(c.data_vencimento)} ({diasParaVencer(c.data_vencimento)} dias)
              </p>
            ))}
          </div>
        </div>
      )}

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
            📝 Gerar
          </button>
          <button onClick={onAdd}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Cadastrar
          </button>
        </div>
      </div>

      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
            <span className="text-4xl">📁</span><p>Nenhum contrato encontrado.</p>
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
                        {c.gerado_por_template && <span className="ml-1.5 text-violet-400 text-[10px]">✦</span>}
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
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{c.responsavel}</td>
                      <td className="px-4 py-3 text-center">
                        {c.arquivo_url
                          ? <a href={c.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors">📄</a>
                          : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => onDelete(c.id)} className="text-gray-600 hover:text-red-400 transition-colors text-base">×</button>
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
  const [aba, setAba]                   = useState<'contratos' | 'templates'>('contratos')
  const [modalUpload, setModalUpload]   = useState(false)
  const [modalGerador, setModalGerador] = useState(false)
  const [modalUsarTpl, setModalUsarTpl] = useState(false)
  const [tplParaUsar, setTplParaUsar]   = useState<TemplateDB | null>(null)
  const [previewHtml, setPreviewHtml]   = useState<string | null>(null)

  const fetchContratos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('contratos').select('*').order('data_inicio', { ascending: false })
    setContratos((data as Contrato[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchContratos() }, [fetchContratos])

  async function handleSave(c: ContratoInsert, file?: File) {
    let arquivo_url: string | undefined
    let arquivo_nome: string | undefined
    if (file) {
      const ext  = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data: up, error } = await supabase.storage.from('contratos-arquivos').upload(path, file, { contentType: file.type, upsert: false })
      if (!error && up) {
        const { data: url } = supabase.storage.from('contratos-arquivos').getPublicUrl(up.path)
        arquivo_url = url.publicUrl; arquivo_nome = file.name
      }
    }
    await supabase.from('contratos').insert({ ...c, arquivo_url, arquivo_nome })
    setModalUpload(false); fetchContratos()
  }

  async function handleSaveGerado(c: ContratoInsert) {
    await supabase.from('contratos').insert(c)
    setModalGerador(false); fetchContratos()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este contrato?')) return
    await supabase.from('contratos').delete().eq('id', id)
    fetchContratos()
  }

  const vigentes   = contratos.filter(c => c.status === 'vigente').length
  const pendentes  = contratos.filter(c => c.status === 'pendente_assinatura').length
  const vencendo   = contratos.filter(c => { const d = diasParaVencer(c.data_vencimento); return d !== null && d >= 0 && d <= 30 && c.status === 'vigente' }).length
  const valorTotal = contratos.filter(c => c.status === 'vigente' && c.valor).reduce((s, c) => s + Number(c.valor), 0)

  return (
    <PainelShell>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Contratos</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {contratos.length} contrato{contratos.length !== 1 ? 's' : ''} cadastrado{contratos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-[#111118] border border-[#1e1e2e] rounded-xl p-1">
            {([
              { id: 'contratos', label: '📁 Contratos' },
              { id: 'templates', label: '📄 Templates' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setAba(t.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  aba === t.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs — só na aba contratos */}
        {aba === 'contratos' && (
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
        )}

        {/* Conteúdo */}
        {aba === 'contratos' ? (
          loading ? (
            <div className="flex items-center justify-center py-32 text-gray-600">Carregando…</div>
          ) : (
            <ListaContratos
              contratos={contratos}
              onDelete={handleDelete}
              onAdd={() => setModalUpload(true)}
              onGerar={() => setModalGerador(true)}
            />
          )
        ) : (
          <AbaTemplates onUsar={t => { setTplParaUsar(t); setModalUsarTpl(true) }} />
        )}
      </div>

      {/* Preview de template customizado preenchido */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
              <h2 className="font-semibold text-white">Pré-visualização</h2>
              <button onClick={() => setPreviewHtml(null)} className="text-gray-500 hover:text-white text-xl leading-none">&times;</button>
            </div>
            <div className="p-5">
              <button onClick={() => {
                const win = window.open('', '_blank')
                if (!win) return
                win.document.write(`<!DOCTYPE html><html><head><title>Contrato</title>
                  <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fff}</style>
                </head><body>${previewHtml}</body></html>`)
                win.document.close(); win.focus(); win.print()
              }} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors mb-5">
                🖨️ Imprimir / PDF
              </button>
              <div className="bg-white rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>
      )}

      <ModalContrato  open={modalUpload}  onClose={() => setModalUpload(false)}  onSave={handleSave} />
      <ModalGerador   open={modalGerador} onClose={() => setModalGerador(false)} onSave={handleSaveGerado} />
      <ModalUsarTemplate
        open={modalUsarTpl}
        template={tplParaUsar}
        onClose={() => setModalUsarTpl(false)}
        onGerar={html => { setModalUsarTpl(false); setPreviewHtml(html) }}
      />
    </PainelShell>
  )
}
