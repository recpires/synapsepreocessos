import Link from 'next/link'
import { notFound } from 'next/navigation'
import PainelShell from '@/components/PainelShell'
import { PageHeader, Erro, Badge } from '@/components/ui'
import { obterDocumento } from '@/server/conhecimento'
import { EditorMarkdown } from './EditorMarkdown'

export const dynamic = 'force-dynamic'

export default async function DocumentoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const r = await obterDocumento(slug)

  if (!r.data) {
    const mensagem = r.error ?? 'Documento não encontrado.'
    if (/não encontrado|not found|PGRST116/i.test(mensagem)) notFound()
    return (
      <PainelShell>
        <div className="p-6"><Erro mensagem={mensagem} /></div>
      </PainelShell>
    )
  }

  const d = r.data

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <div className="text-xs text-subtle">
          <Link href="/conhecimento" className="hover:text-fg">Conhecimento</Link>
          <span className="mx-1.5">/</span>
          <span className="text-muted">{d.area}</span>
        </div>

        <PageHeader
          titulo={d.titulo}
          descricao={
            <span className="flex flex-wrap items-center gap-2">
              <Badge tom="neutro">{d.area}</Badge>
              {d.origem && <span className="font-mono text-xs text-subtle">{d.origem}</span>}
              {d.atualizado_por && (
                <span className="text-xs text-subtle">
                  editado por {d.atualizado_por} em{' '}
                  {new Date(d.updated_at).toLocaleDateString('pt-BR')}
                </span>
              )}
            </span>
          }
        />

        <EditorMarkdown id={d.id} inicial={d.conteudo_md} />
      </div>
    </PainelShell>
  )
}
