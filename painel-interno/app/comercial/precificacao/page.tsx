import PainelShell from '@/components/PainelShell'
import { PageHeader, Erro } from '@/components/ui'
import { listarSimulacoes } from '@/server/precificacao'
import { listarProdutosSimples } from '@/server/financeiro'
import { Calculadora } from './Calculadora'

export const dynamic = 'force-dynamic'

export default async function PrecificacaoPage() {
  const [simulacoes, produtos] = await Promise.all([
    listarSimulacoes(),
    listarProdutosSimples(),
  ])

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Precificação de SaaS"
          descricao="Do custo real por cliente ao preço dos três planos, com LTV, payback e ponto de equilíbrio."
        />
        {simulacoes.error ? (
          <Erro mensagem={simulacoes.error} />
        ) : (
          <Calculadora
            simulacoes={simulacoes.data ?? []}
            produtos={produtos.data ?? []}
          />
        )}
      </div>
    </PainelShell>
  )
}
