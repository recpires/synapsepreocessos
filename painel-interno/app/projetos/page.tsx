import PainelShell from '@/components/PainelShell'
import { PageHeader, Erro, Card } from '@/components/ui'
import { listarProjetos } from '@/server/projetos'
import { Kanban } from './Kanban'

// Server Component: a lista vem pronta do servidor, sem fetch no navegador.
export const dynamic = 'force-dynamic'

export default async function ProjetosPage() {
  const { data: projetos, error } = await listarProjetos()

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Projetos"
          descricao="Cada projeto na sua fase, com saúde, maturidade e erros abertos."
        />

        {error ? (
          <Erro mensagem={error} />
        ) : projetos && projetos.length > 0 ? (
          <Kanban projetos={projetos} />
        ) : (
          <Card className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-fg">Nenhum projeto ainda</p>
            <p className="mt-1 text-sm text-subtle">
              O seed do portfólio não rodou. Confira a migration de Fase 02.
            </p>
          </Card>
        )}
      </div>
    </PainelShell>
  )
}
