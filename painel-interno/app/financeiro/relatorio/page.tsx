import { Erro } from '@/components/ui'
import { montarRelatorio } from '@/server/relatorio'
import { Documento } from './Documento'

export const dynamic = 'force-dynamic'

/**
 * Rota de relatório. Fica fora do PainelShell de propósito: o que aparece na
 * tela é exatamente o que sai no PDF, sem sidebar nem navegação.
 */
export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string }>
}) {
  const sp = await searchParams
  const agora = new Date()

  // Padrão: ano corrente até o primeiro dia do mês que vem.
  const inicio = sp.inicio ?? `${agora.getFullYear()}-01-01`
  const fim = sp.fim ?? `${agora.getFullYear()}-${String(agora.getMonth() + 2).padStart(2, '0')}-01`

  const relatorio = await montarRelatorio(inicio, fim)

  if (!relatorio.data) {
    return (
      <div className="min-h-screen bg-ground p-6">
        <Erro mensagem={relatorio.error ?? 'Não foi possível montar o relatório.'} />
      </div>
    )
  }

  return <Documento r={relatorio.data} />
}
