import PainelShell from '@/components/PainelShell'
import { PageHeader, Erro } from '@/components/ui'
import { listarEmpresasCompletas } from '@/server/empresas'
import { Lista } from './Lista'

export const dynamic = 'force-dynamic'

export default async function EmpresasPage() {
  const { data: empresas, error } = await listarEmpresasCompletas()

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Empresas"
          descricao="Clientes, fornecedores e parceiros na mesma estrutura. É aqui que documento, contrato e projeto ganham dono."
        />
        {error ? <Erro mensagem={error} /> : <Lista empresas={empresas ?? []} />}
      </div>
    </PainelShell>
  )
}
