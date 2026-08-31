import PainelShell from '@/components/PainelShell'
import SubNav from '@/components/SubNav'
import { SUBNAV } from '@/lib/nav'
import { PageHeader } from '@/components/ui'
import { Servicos } from './Servicos'

export const dynamic = 'force-dynamic'

export default function PrecificacaoServicosPage() {
  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Precificação de serviços"
          descricao="Serviço cobrado por tempo, produto de revenda e evento rateado por inscrito — cada um com sua lógica de custo e a alíquota certa do Simples."
        />
        <SubNav tabs={SUBNAV.comercial} />
        <Servicos />
      </div>
    </PainelShell>
  )
}
