import PainelShell from '@/components/PainelShell'
import SubNav from '@/components/SubNav'
import { SUBNAV } from '@/lib/nav'
import { PageHeader, Erro } from '@/components/ui'
import { obterOrcamento, sugerirOrcamento } from '@/server/orcamento'
import { Editor } from './Editor'

export const dynamic = 'force-dynamic'

export default async function OrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>
}) {
  const sp = await searchParams
  const agora = new Date()
  const ano = Number(sp.ano) || agora.getFullYear()
  const mes = Number(sp.mes) || agora.getMonth() + 1

  const [orcamento, sugestao] = await Promise.all([
    obterOrcamento(ano, mes),
    sugerirOrcamento(3),
  ])

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Orçamento"
          descricao="Quanto você planejou gastar por categoria, contra o que saiu de fato."
        />
        <SubNav tabs={SUBNAV.financeiro} />

        {!orcamento.data ? (
          <Erro mensagem={orcamento.error ?? 'Não foi possível carregar o orçamento.'} />
        ) : (
          <Editor orcamento={orcamento.data} sugestao={sugestao.data ?? []} />
        )}
      </div>
    </PainelShell>
  )
}
