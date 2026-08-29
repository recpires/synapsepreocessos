import PainelShell from '@/components/PainelShell'
import SubNav from '@/components/SubNav'
import { SeletorEmpresa } from '@/components/SeletorEmpresa'
import { listarEmpresasProprias } from '@/server/empresa-financeiro'
import { SUBNAV } from '@/lib/nav'
import { PageHeader, Erro, Metrica, Card, CardHeader, CardBody } from '@/components/ui'
import { montarDRE, montarFluxo, montarRentabilidade } from '@/server/dre'
import { Fluxo } from './Fluxo'
import { Rentabilidade } from './Rentabilidade'
import { cn } from '@/lib/cn'

export const dynamic = 'force-dynamic'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default async function DrePage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; empresa?: string }>
}) {
  const sp = await searchParams
  const ano = Number(sp.ano) || new Date().getFullYear()
  const empresa = sp.empresa

  const [dre, fluxo, rent, empresas] = await Promise.all([
    montarDRE(`${ano}-01-01`, `${ano + 1}-01-01`, empresa),
    montarFluxo(12, empresa),
    montarRentabilidade(120, empresa),
    listarEmpresasProprias(),
  ])

  if (!dre.data) {
    return (
      <PainelShell>
        <div className="p-6"><Erro mensagem={dre.error ?? 'Não foi possível montar o DRE.'} /></div>
      </PainelShell>
    )
  }

  const d = dre.data

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo={`Resultado de ${ano}`}
          descricao="Da receita bruta ao resultado, com o caixa projetado e a margem por projeto."
        />
        <SubNav tabs={SUBNAV.financeiro} />
        <SeletorEmpresa empresas={(empresas.data ?? []).map(e => ({
          id: e.id, nome: e.nome_fantasia || e.razao_social,
        }))} />

        {d.avisos.length > 0 && (
          <Card className="border-warn-line bg-warn-soft">
            <CardBody className="space-y-1 text-sm text-warn">
              {d.avisos.map((a, i) => <p key={i}>· {a}</p>)}
            </CardBody>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metrica rotulo="Receita bruta" valor={brl(d.receitaBruta)} />
          <Metrica rotulo="Margem bruta" valor={d.margemBruta !== null ? `${d.margemBruta}%` : '—'}
            detalhe={d.margemBruta === null ? 'Sem receita no período' : 'Depois do custo direto'} />
          <Metrica rotulo="Resultado" valor={brl(d.resultado)}
            detalhe={d.resultado < 0 ? 'Prejuízo no período' : 'Lucro no período'} />
          <Metrica rotulo="Saldo em caixa" valor={fluxo.data?.temSaldo ? brl(fluxo.data.saldoInicial) : '—'}
            detalhe={fluxo.data?.temSaldo ? 'Informado nas contas' : 'Cadastre em Caixa'} />
        </div>

        <Card>
          <CardHeader titulo="Demonstrativo" descricao="Percentual calculado sobre a receita bruta." />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {d.linhas.map((l, i) => (
                    <tr
                      key={`${l.rotulo}-${i}`}
                      className={cn(
                        'border-b border-line',
                        l.natureza === 'resultado' && 'bg-surface-2 font-semibold'
                      )}
                    >
                      <td className={cn('px-5 py-2', l.nivel === 1 && 'pl-10 text-muted')}>
                        {l.natureza === 'saida' && <span className="mr-1 text-subtle">−</span>}
                        {l.rotulo}
                      </td>
                      <td className={cn(
                        'tabular px-5 py-2 text-right',
                        l.rotulo === 'Resultado do período' && (l.valor < 0 ? 'text-crit' : 'text-ok')
                      )}>
                        {brl(l.valor)}
                      </td>
                      <td className="tabular w-20 px-5 py-2 text-right text-subtle">
                        {l.pctReceita !== null ? `${l.pctReceita}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            titulo="Fluxo de caixa"
            descricao="Realizado até hoje, projetado adiante pelas recorrências e impostos em aberto."
          />
          <CardBody>
            {fluxo.data ? <Fluxo fluxo={fluxo.data} /> : <Erro mensagem={fluxo.error ?? 'Falhou'} />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            titulo="Rentabilidade por projeto"
            descricao="Recebido menos custo alocado menos horas apontadas."
          />
          <CardBody>
            {rent.data ? <Rentabilidade linhas={rent.data} /> : <Erro mensagem={rent.error ?? 'Falhou'} />}
          </CardBody>
        </Card>
      </div>
    </PainelShell>
  )
}
