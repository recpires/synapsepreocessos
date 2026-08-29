'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Badge, Button, Card, CardHeader, CardBody, Textarea } from '@/components/ui'
import { toast, confirmar } from '@/components/Feedback'
import { salvarTemplate, arquivarTemplate } from '@/server/templates'
import { renderizar, chavesDoTemplate, type TemplateContrato } from '@/lib/templates'

/** Valores de exemplo para a prévia — nunca gravados. */
function amostra(t: TemplateContrato): Record<string, string> {
  const exemplos: Record<string, string> = {
    text: 'Barbearia Modelo LTDA',
    number: '4900',
    date: '2026-09-01',
    textarea: 'Descrição de exemplo do escopo contratado.',
  }
  return Object.fromEntries(
    t.campos.map(c => [c.key, c.tipo === 'select' ? (c.opcoes?.[0] ?? 'Rodrigo Eufrasio') : exemplos[c.tipo] ?? '—'])
  )
}

export function Editor({ templates }: { templates: TemplateContrato[] }) {
  const router = useRouter()
  const [selecionado, setSelecionado] = useState(templates[0]?.id ?? null)
  const [html, setHtml] = useState(templates[0]?.conteudo_html ?? '')
  const [editando, setEditando] = useState(false)
  const [salvando, iniciar] = useTransition()

  const atual = templates.find(t => t.id === selecionado) ?? null

  function escolher(t: TemplateContrato) {
    setSelecionado(t.id)
    setHtml(t.conteudo_html)
    setEditando(false)
  }

  // Chaves usadas no texto que não estão declaradas — o mesmo teste do servidor,
  // adiantado para a tela avisar antes de tentar salvar.
  const orfas = useMemo(() => {
    if (!atual) return []
    const declaradas = new Set(atual.campos.map(c => c.key))
    return chavesDoTemplate(html).filter(c => c !== '_hoje' && !declaradas.has(c))
  }, [html, atual])

  const previa = useMemo(
    () => (atual ? renderizar(html, amostra(atual)) : ''),
    [html, atual]
  )

  function salvar() {
    if (!atual) return
    iniciar(async () => {
      const r = await salvarTemplate({
        id: atual.id,
        nome: atual.nome,
        descricao: atual.descricao ?? undefined,
        tipo: atual.tipo,
        conteudo_html: html,
        campos: atual.campos,
      })
      if (r.ok) {
        toast.success('Template salvo.')
        r.avisos?.forEach(a => toast.info(a))
        setEditando(false)
        router.refresh()
      } else {
        toast.error(r.error ?? 'Não foi possível salvar.')
      }
    })
  }

  async function arquivar(t: TemplateContrato) {
    const ok = await confirmar({
      titulo: 'Arquivar template',
      mensagem: `"${t.nome}" sai da lista. Contratos já gerados continuam intactos.`,
      confirmLabel: 'Arquivar',
      perigoso: true,
    })
    if (!ok) return
    iniciar(async () => {
      const r = await arquivarTemplate(t.id)
      if (r.ok) { toast.success('Template arquivado.'); router.refresh() }
      else toast.error(r.error ?? 'Não foi possível arquivar.')
    })
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardBody className="text-sm text-subtle">
          Nenhum template ativo. A migration de Fase 04 deveria ter carregado
          Desenvolvimento, SaaS e NDA.
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="space-y-2">
        {templates.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => escolher(t)}
            className={cn(
              'w-full rounded-token border p-3 text-left transition-colors',
              selecionado === t.id
                ? 'border-accent bg-accent-soft'
                : 'border-line bg-surface hover:bg-surface-2'
            )}
          >
            <span className={cn('block text-sm font-medium',
              selecionado === t.id ? 'text-accent-text' : 'text-fg')}>
              {t.nome}
            </span>
            <span className="mt-0.5 block text-[11px] text-subtle">
              {t.campos.length} campo(s) · {t.tipo}
            </span>
          </button>
        ))}
      </div>

      {atual && (
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader
              titulo={atual.nome}
              descricao={atual.descricao ?? undefined}
              acao={
                <div className="flex gap-2">
                  {editando ? (
                    <>
                      <Button tamanho="sm" carregando={salvando} disabled={orfas.length > 0} onClick={salvar}>
                        Salvar
                      </Button>
                      <Button tamanho="sm" variante="fantasma"
                        onClick={() => { setHtml(atual.conteudo_html); setEditando(false) }}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button tamanho="sm" variante="secundario" onClick={() => setEditando(true)}>
                        Editar texto
                      </Button>
                      <Button tamanho="sm" variante="fantasma" onClick={() => arquivar(atual)}>
                        Arquivar
                      </Button>
                    </>
                  )}
                </div>
              }
            />
            <CardBody>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {atual.campos.map(c => (
                  <Badge key={c.key} tom="neutro" className="px-1.5 py-0 font-mono text-[10px]">
                    {`{{${c.key}}}`}
                  </Badge>
                ))}
              </div>

              {orfas.length > 0 && (
                <div className="mb-3 rounded-token border border-crit-line bg-crit-soft px-3 py-2 text-sm text-crit">
                  O texto usa {orfas.map(o => `{{${o}}}`).join(', ')} sem campo declarado.
                  Renderizaria vazio no contrato — corrija antes de salvar.
                </div>
              )}

              {editando ? (
                <Textarea
                  value={html}
                  onChange={e => setHtml(e.target.value)}
                  rows={20}
                  className="font-mono text-xs"
                  aria-label="Conteúdo do template"
                />
              ) : (
                <p className="text-sm text-subtle">
                  {html.length} caracteres. Clique em &ldquo;Editar texto&rdquo; para alterar as cláusulas.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              titulo="Prévia"
              descricao="Com valores de exemplo. Nada aqui é gravado."
            />
            <CardBody>
              <div className="overflow-x-auto rounded-token border border-line bg-white p-4">
                {/* O HTML vem do próprio template; os valores passam por escape
                    em renderizar(). */}
                <div dangerouslySetInnerHTML={{ __html: previa }} />
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}
