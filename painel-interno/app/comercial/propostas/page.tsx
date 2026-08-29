import PainelShell from '@/components/PainelShell'
import SubNav from '@/components/SubNav'
import { SUBNAV } from '@/lib/nav'
import { PageHeader, Erro, Metrica } from '@/components/ui'
import { listarPropostas } from '@/server/propostas'
import { listarEmpresasCompletas } from '@/server/empresas'
import { estaAberta } from '@/types/propostas'
import { Lista } from './Lista'

export const dynamic = 'force-dynamic'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default async function PropostasPage() {
  const [propostas, empresas] = await Promise.all([
    listarPropostas(),
    listarEmpresasCompletas(),
  ])

  const lista = propostas.data ?? []
  const abertas = lista.filter(p => estaAberta(p.status))
  const aceitas = lista.filter(p => p.status === 'aceita')
  const decididas = lista.filter(p => p.status === 'aceita' || p.status === 'recusada')

  // Conversão só faz sentido sobre o que já foi decidido.
  const conversao = decididas.length
    ? Math.round((aceitas.length / decididas.length) * 100)
    : null

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Propostas"
          descricao="Numeradas, com validade e status. Aceitar cria o projeto com as fases já preenchidas."
        />
        <SubNav tabs={SUBNAV.comercial} />

        {propostas.error ? (
          <Erro mensagem={propostas.error} />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metrica
                rotulo="Em aberto"
                valor={abertas.length}
                detalhe={brl(abertas.reduce((a, p) => a + p.valor_total, 0)) + ' em jogo'}
              />
              <Metrica
                rotulo="Aceitas"
                valor={aceitas.length}
                detalhe={brl(aceitas.reduce((a, p) => a + p.valor_total, 0))}
              />
              <Metrica
                rotulo="Conversão"
                valor={conversao !== null ? `${conversao}%` : '—'}
                detalhe={decididas.length ? `${decididas.length} decidida(s)` : 'Nada decidido ainda'}
              />
              <Metrica
                rotulo="Recorrente ganho"
                valor={brl(aceitas.reduce((a, p) => a + p.valor_mensal, 0))}
                detalhe="Por mês, das propostas aceitas"
              />
            </div>

            <Lista
              propostas={lista}
              empresas={(empresas.data ?? []).map(e => ({ id: e.id, nome: e.razao_social }))}
            />
          </>
        )}
      </div>
    </PainelShell>
  )
}
