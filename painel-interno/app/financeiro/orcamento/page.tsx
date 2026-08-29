import PainelShell from '@/components/PainelShell'
import SubNav from '@/components/SubNav'
import { SeletorEmpresa } from '@/components/SeletorEmpresa'
import { listarEmpresasProprias } from '@/server/empresa-financeiro'
import { SUBNAV } from '@/lib/nav'
import { PageHeader, Erro } from '@/components/ui'
import { obterOrcamento, sugerirOrcamento } from '@/server/orcamento'
import { Editor } from './Editor'

export const dynamic = 'force-dynamic'

export default async function OrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string; empresa?: string }>
}) {
  const sp = await searchParams
  const agora = new Date()
  const ano = Number(sp.ano) || agora.getFullYear()
  const mes = Number(sp.mes) || agora.getMonth() + 1

  const [orcamento, sugestao, empresas] = await Promise.all([
    obterOrcamento(ano, mes, sp.empresa),
    sugerirOrcamento(3),
    listarEmpresasProprias(),
  ])

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Orçamento"
          descricao="Quanto você planejou gastar por categoria, contra o que saiu de fato."
        />
        <SubNav tabs={SUBNAV.financeiro} />
        <SeletorEmpresa empresas={(empresas.data ?? []).map(e => ({
          id: e.id, nome: e.nome_fantasia || e.razao_social,
        }))} />

        {!orcamento.data ? (
          <Erro mensagem={orcamento.error ?? 'Não foi possível carregar o orçamento.'} />
        ) : (
          <Editor orcamento={orcamento.data} sugestao={sugestao.data ?? []} />
        )}
      </div>
    </PainelShell>
  )
}
