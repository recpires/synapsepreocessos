import PainelShell from '@/components/PainelShell'
import SubNav from '@/components/SubNav'
import { SUBNAV } from '@/lib/nav'
import { PageHeader, Erro, Card, CardBody } from '@/components/ui'
import { listarTemplates } from '@/server/templates'
import { Editor } from './Editor'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const templates = await listarTemplates()

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Templates de contrato"
          descricao="O texto jurídico mora no banco. Mudar uma cláusula não exige deploy."
        />
        <SubNav tabs={SUBNAV.empresa} />

        <Card>
          <CardBody className="text-sm text-muted">
            Use <code>{'{{campo}}'}</code> para inserir um valor, <code>{'{{valor|moeda}}'}</code> para
            formatar número em reais e <code>{'{{data|data}}'}</code> para data em dd/mm/aaaa.{' '}
            <code>{'{{_hoje}}'}</code> vira a data de emissão. Todo valor é escapado antes de entrar
            no HTML — nome com <code>&lt;</code> não vira tag.
          </CardBody>
        </Card>

        {templates.error ? (
          <Erro mensagem={templates.error} />
        ) : (
          <Editor templates={templates.data ?? []} />
        )}
      </div>
    </PainelShell>
  )
}
