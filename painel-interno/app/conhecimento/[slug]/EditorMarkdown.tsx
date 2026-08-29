'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Button, Card, CardBody } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { salvarDocumento } from '@/server/conhecimento'

/**
 * Renderizador de Markdown enxuto: heading, lista, tabela, código, negrito,
 * itálico e link. Não usa biblioteca porque o conteúdo é interno e conhecido —
 * e porque todo texto passa por escape antes de virar HTML.
 */
function escapar(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(s: string) {
  return escapar(s)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-surface-2 px-1 py-0.5 text-[0.85em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-fg">$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent hover:underline">$1</a>')
}

function paraHtml(md: string): string {
  const saida: string[] = []
  const linhas = md.split('\n')
  let emLista = false
  let emCodigo = false
  let tabela: string[][] = []

  const fecharLista = () => { if (emLista) { saida.push('</ul>'); emLista = false } }
  const fecharTabela = () => {
    if (tabela.length === 0) return
    const [cab, ...corpo] = tabela
    saida.push('<div class="overflow-x-auto"><table class="w-full text-sm my-3">')
    saida.push('<thead><tr>' + cab.map(c =>
      `<th class="border-b border-line py-1.5 pr-3 text-left text-xs uppercase tracking-wide text-subtle">${inline(c)}</th>`
    ).join('') + '</tr></thead><tbody>')
    for (const l of corpo) {
      saida.push('<tr>' + l.map(c =>
        `<td class="border-b border-line py-1.5 pr-3 align-top">${inline(c)}</td>`
      ).join('') + '</tr>')
    }
    saida.push('</tbody></table></div>')
    tabela = []
  }

  for (const linha of linhas) {
    if (linha.trim().startsWith('```')) {
      fecharLista(); fecharTabela()
      saida.push(emCodigo ? '</code></pre>' : '<pre class="overflow-x-auto rounded-token bg-surface-2 p-3 my-3 text-xs"><code>')
      emCodigo = !emCodigo
      continue
    }
    if (emCodigo) { saida.push(escapar(linha)); continue }

    // Tabela: linha com pipes. A linha de separação (---|---) é descartada.
    if (/^\s*\|.*\|\s*$/.test(linha)) {
      fecharLista()
      const celulas = linha.trim().slice(1, -1).split('|').map(c => c.trim())
      if (!celulas.every(c => /^:?-+:?$/.test(c))) tabela.push(celulas)
      continue
    }
    fecharTabela()

    const h = linha.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      fecharLista()
      const nivel = h[1].length
      const classe = ['text-xl font-bold mt-6 mb-2', 'text-lg font-semibold mt-5 mb-2',
                      'text-base font-semibold mt-4 mb-1.5', 'text-sm font-semibold mt-3 mb-1'][nivel - 1]
      saida.push(`<h${nivel} class="${classe} text-fg">${inline(h[2])}</h${nivel}>`)
      continue
    }

    const item = linha.match(/^\s*[-*]\s+(.*)$/)
    if (item) {
      if (!emLista) { saida.push('<ul class="list-disc pl-5 my-2 space-y-1">'); emLista = true }
      // Caixinha de tarefa vira símbolo, não checkbox clicável.
      const texto = item[1].replace(/^\[([ xX])\]\s*/, (_m, c) =>
        c.trim() ? '<span class="text-ok">✓</span> ' : '<span class="text-subtle">○</span> ')
      saida.push(`<li>${inline(texto).replace(/&lt;span/g, '<span').replace(/&lt;\/span&gt;/g, '</span>')}</li>`)
      continue
    }
    fecharLista()

    if (/^\s*(---|___|\*\*\*)\s*$/.test(linha)) { saida.push('<hr class="my-4 border-line">'); continue }
    if (linha.trim() === '') continue

    saida.push(`<p class="my-2 leading-relaxed">${inline(linha)}</p>`)
  }

  fecharLista(); fecharTabela()
  if (emCodigo) saida.push('</code></pre>')
  return saida.join('\n')
}

export function EditorMarkdown({ id, inicial }: { id: string; inicial: string }) {
  const router = useRouter()
  const [md, setMd] = useState(inicial)
  const [editando, setEditando] = useState(false)
  const [salvando, iniciar] = useTransition()

  const html = useMemo(() => paraHtml(md), [md])
  const sujo = md !== inicial

  function salvar() {
    iniciar(async () => {
      const r = await salvarDocumento(id, md)
      if (r.ok) { toast.success('Documento salvo.'); setEditando(false); router.refresh() }
      else toast.error(r.error ?? 'Não foi possível salvar.')
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          tamanho="sm"
          variante={editando ? 'secundario' : 'primario'}
          onClick={() => { if (editando && sujo) setMd(inicial); setEditando(e => !e) }}
        >
          {editando ? 'Descartar' : 'Editar'}
        </Button>
        {editando && (
          <Button tamanho="sm" carregando={salvando} disabled={!sujo} onClick={salvar}>
            Salvar
          </Button>
        )}
        {sujo && editando && (
          <span className="text-xs text-warn">Alterações não salvas</span>
        )}
      </div>

      <div className={cn('grid gap-4', editando && 'lg:grid-cols-2')}>
        {editando && (
          <textarea
            value={md}
            onChange={e => setMd(e.target.value)}
            rows={30}
            aria-label="Conteúdo em Markdown"
            className="w-full rounded-token border border-line-strong bg-ground p-4 font-mono text-xs text-fg focus:border-accent focus:outline-none"
          />
        )}
        <Card>
          <CardBody>
            <div
              className="max-w-none text-sm text-muted"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
