import { Erro } from '@/components/ui'
import { montarRelatorio } from '@/server/relatorio'
import { listarEmpresasProprias } from '@/server/empresa-financeiro'
import { periodoPadrao, mesDoPeriodo } from '@/lib/periodo-relatorio'
import { Documento } from './Documento'

export const dynamic = 'force-dynamic'

/**
 * Rota de relatório. Fica fora do PainelShell de propósito: o que aparece na
 * tela é exatamente o que sai no PDF, sem sidebar nem navegação.
 *
 * O período vem da URL, então cada recorte tem link próprio — dá para mandar
 * "o relatório de setembro" para alguém sem explicar quais botões apertar.
 */
export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; fim?: string; empresa?: string }>
}) {
  const sp = await searchParams
  const agora = new Date()
  const padrao = periodoPadrao(agora)

  const inicio = sp.inicio ?? padrao.inicio
  const fim = sp.fim ?? padrao.fim

  const [relatorio, empresas] = await Promise.all([
    montarRelatorio(inicio, fim, sp.empresa),
    listarEmpresasProprias(),
  ])

  // O documento é o que sai no PDF: precisa dizer de qual empresa ele fala,
  // senão um relatório de um CNPJ passa por consolidado na mão de terceiro.
  const emp = (empresas.data ?? []).find(e => e.id === sp.empresa)
  const escopo = emp ? (emp.nome_fantasia || emp.razao_social) : null

  if (!relatorio.data) {
    return (
      <div className="min-h-screen bg-ground p-6">
        <Erro mensagem={relatorio.error ?? 'Não foi possível montar o relatório.'} />
      </div>
    )
  }

  return (
    <Documento
      r={relatorio.data}
      escopo={escopo}
      mes={mesDoPeriodo({ inicio, fim })}
      ano={agora.getFullYear()}
    />
  )
}
