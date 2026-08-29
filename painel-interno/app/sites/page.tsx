import PainelShell from '@/components/PainelShell'
import { PageHeader, Erro, Metrica } from '@/components/ui'
import { listarSites, listarEmpresasCompletas } from '@/server/empresas'
import { diasAte } from '@/types/empresas'
import { Lista } from './Lista'

export const dynamic = 'force-dynamic'

export default async function SitesPage() {
  const [{ data: sites, error }, { data: empresas }] = await Promise.all([
    listarSites(),
    listarEmpresasCompletas(),
  ])

  const lista = sites ?? []
  const noAr = lista.filter(s => s.status === 'no_ar')

  // Vence nos próximos 30 dias, ou já venceu.
  const vencendo = lista.filter(s =>
    [s.dominio_expira, s.ssl_expira].some(d => {
      const dias = diasAte(d)
      return dias !== null && dias <= 30
    })
  )

  const manutencao = lista.reduce((a, s) => a + (s.manutencao_mensal ?? 0), 0)

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Sites"
          descricao="Os sites entregues, com o que vence. Domínio e SSL viram alerta a 30 dias."
        />

        {error ? (
          <Erro mensagem={error} />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metrica rotulo="No ar" valor={noAr.length} detalhe={`${lista.length} no total`} />
              <Metrica
                rotulo="Vencendo em 30d"
                valor={vencendo.length}
                detalhe={vencendo.length ? 'Domínio ou certificado' : 'Nada a renovar'}
              />
              <Metrica
                rotulo="Manutenção/mês"
                valor={manutencao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                detalhe="Receita recorrente de manutenção"
              />
              <Metrica
                rotulo="Com contrato"
                valor={lista.filter(s => s.manutencao_mensal).length}
                detalhe="Sites com manutenção ativa"
              />
            </div>

            <Lista sites={lista} empresas={(empresas ?? []).map(e => ({ id: e.id, nome: e.razao_social }))} />
          </>
        )}
      </div>
    </PainelShell>
  )
}
