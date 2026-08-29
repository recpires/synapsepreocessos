import Link from 'next/link'
import PainelShell from '@/components/PainelShell'
import { PageHeader, Erro, Card, CardBody, Badge } from '@/components/ui'
import { listarConhecimento } from '@/server/conhecimento'

export const dynamic = 'force-dynamic'

export default async function ConhecimentoPage() {
  const r = await listarConhecimento()
  const itens = r.data ?? []

  // Agrupa por área para a lista não virar uma parede de títulos.
  const porArea = new Map<string, typeof itens>()
  for (const i of itens) {
    const lista = porArea.get(i.area) ?? []
    lista.push(i)
    porArea.set(i.area, lista)
  }

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Conhecimento"
          descricao="Playbooks, processos e ICP. O que antes só existia para quem abria a pasta."
        />

        {r.error ? (
          <Erro mensagem={r.error} />
        ) : itens.length === 0 ? (
          <Card>
            <CardBody className="space-y-2 text-sm text-muted">
              <p className="font-medium text-fg">Nada importado ainda.</p>
              <p>
                Os 15 documentos de <code>comercial/</code>, <code>dev/</code>,{' '}
                <code>marketing/</code>, <code>time-rh/</code> e <code>financeiro/</code> já viraram
                uma migration. Para carregá-los:
              </p>
              <pre className="overflow-x-auto rounded-token bg-surface-2 px-3 py-2 font-mono text-xs">
                npx supabase db push
              </pre>
              <p className="text-subtle">
                Se quiser regerar a migration a partir dos arquivos atuais:{' '}
                <code>npm run importar-conhecimento</code>.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {[...porArea.entries()].map(([area, docs]) => (
              <div key={area}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
                  {area}
                </h2>
                <Card>
                  <CardBody className="p-0">
                    <ul className="divide-y divide-line">
                      {docs.map(d => (
                        <li key={d.id}>
                          <Link
                            href={`/conhecimento/${d.slug}`}
                            className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3 transition-colors hover:bg-surface-2"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-fg">{d.titulo}</span>
                              {d.origem && (
                                <span className="block font-mono text-[11px] text-subtle">{d.origem}</span>
                              )}
                            </span>
                            <span className="flex items-center gap-3 text-[11px] text-subtle">
                              {d.atualizado_por && <Badge tom="neutro" className="px-1.5 py-0 text-[10px]">
                                editado por {d.atualizado_por}
                              </Badge>}
                              <span className="tabular">{(d.tamanho / 1000).toFixed(1)}k</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </PainelShell>
  )
}
