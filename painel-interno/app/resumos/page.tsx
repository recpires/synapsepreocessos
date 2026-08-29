import PainelShell from '@/components/PainelShell'
import { PageHeader, Erro, Card, CardBody, Badge, Vazio } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'

export const dynamic = 'force-dynamic'

type Resumo = {
  id: string
  competencia: string
  titulo: string
  corpo_md: string
  dados: Record<string, number>
  enviado_em: string | null
  canal: string | null
  atualizado_em: string
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Markdown mínimo: só o que o gerador do resumo produz. */
function renderizar(md: string) {
  return md
    .split('\n')
    .map(l => {
      const esc = l.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      if (esc.startsWith('## ')) {
        return `<h2 class="mt-5 mb-2 text-sm font-semibold text-fg">${esc.slice(3)}</h2>`
      }
      const inline = esc
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-fg">$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="rounded bg-surface-2 px-1 text-[0.85em]">$1</code>')
      if (inline.startsWith('- ')) return `<li class="ml-4 list-disc">${inline.slice(2)}</li>`
      return inline.trim() ? `<p class="my-1">${inline}</p>` : ''
    })
    .join('')
}

export default async function ResumosPage() {
  let resumos: Resumo[] = []
  let erro: string | null = null

  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb
      .from('resumos')
      .select('*')
      .order('competencia', { ascending: false })
      .limit(26)
    if (error) erro = `resumos: ${error.message}`
    else resumos = (data ?? []) as Resumo[]
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e)
  }

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Resumo semanal"
          descricao="Gerado toda segunda de manhã pelo cron. Junta o que mudou e o que exige ação."
        />

        {erro ? (
          <Erro mensagem={erro} />
        ) : resumos.length === 0 ? (
          <Vazio
            titulo="Nenhum resumo ainda"
            descricao="O primeiro sai na próxima segunda-feira. Para gerar agora, chame /api/cron/resumo com o CRON_SECRET."
          />
        ) : (
          <div className="space-y-4">
            {resumos.map((r, i) => (
              <Card key={r.id}>
                <CardBody>
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-fg">{r.titulo}</span>
                      {i === 0 && <Badge tom="acento" className="px-1.5 py-0 text-[10px]">mais recente</Badge>}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-subtle">
                      {r.enviado_em
                        ? <Badge tom="ok" className="px-1.5 py-0 text-[10px]">enviado por {r.canal}</Badge>
                        : <Badge tom="neutro" className="px-1.5 py-0 text-[10px]">só no painel</Badge>}
                      <span className="tabular" title={`Atualizado em ${new Date(r.atualizado_em).toLocaleString('pt-BR')}`}>
                        {new Date(r.competencia + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </span>
                  </div>

                  <div
                    className="text-sm text-muted"
                    dangerouslySetInnerHTML={{ __html: renderizar(r.corpo_md) }}
                  />

                  {r.dados && Object.keys(r.dados).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-2 text-[11px] text-subtle">
                      <span className="tabular">saiu {brl(Number(r.dados.saiu ?? 0))}</span>
                      <span className="tabular">entrou {brl(Number(r.dados.entrou ?? 0))}</span>
                      {Number(r.dados.vencidos) > 0 && <span>{r.dados.vencidos} vencido(s)</span>}
                      {Number(r.dados.erros_criticos) > 0 && (
                        <span>{r.dados.erros_criticos} erro(s) crítico(s)</span>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PainelShell>
  )
}
