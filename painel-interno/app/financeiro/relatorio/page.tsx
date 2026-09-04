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
  const proprias = (empresas.data ?? []).map(e => ({
    id: e.id,
    nome: e.nome_fantasia || e.razao_social,
  }))
  const emp = proprias.find(e => e.id === sp.empresa)
  const escopo = emp?.nome ?? null

  // Um relatório financeiro que sai da empresa precisa dizer qual é a
  // entidade: nome de fantasia não identifica ninguém num processo ou numa
  // prestação de contas. No consolidado não há um CNPJ único a declarar.
  const dados = (empresas.data ?? []).find(e => e.id === sp.empresa)
  const identificacao = dados
    ? {
        razaoSocial: dados.razao_social,
        cnpj: dados.cnpj ?? null,
        regime: dados.regime_tributario ?? null,
      }
    : null

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
      empresas={proprias}
      identificacao={identificacao}
    />
  )
}
