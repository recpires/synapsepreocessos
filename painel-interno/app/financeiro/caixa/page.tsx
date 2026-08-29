import PainelShell from '@/components/PainelShell'
import SubNav from '@/components/SubNav'
import { SUBNAV } from '@/lib/nav'
import { PageHeader, Erro, Metrica, Card, CardHeader, CardBody } from '@/components/ui'
import { obterCaixa } from '@/server/caixa'
import { Contas } from './Contas'
import { Impostos } from './Impostos'

export const dynamic = 'force-dynamic'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default async function CaixaPage() {
  const caixa = await obterCaixa()

  if (!caixa.data) {
    return (
      <PainelShell>
        <div className="p-6">
          <Erro mensagem={caixa.error ?? 'Não foi possível carregar o caixa.'} />
        </div>
      </PainelShell>
    )
  }

  const c = caixa.data
  const velho = c.saldoDesatualizadoHa !== null && c.saldoDesatualizadoHa > 7

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Caixa e obrigações"
          descricao="Saldo das contas, quanto tempo ele dura e o que o governo espera receber."
        />
        <SubNav tabs={SUBNAV.financeiro} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metrica
            rotulo="Saldo em caixa"
            valor={c.contas.length ? brl(c.saldoTotal) : '—'}
            detalhe={
              !c.contas.length
                ? 'Nenhuma conta cadastrada'
                : velho
                  ? `Atualizado há ${c.saldoDesatualizadoHa} dias`
                  : 'Atualizado'
            }
          />
          <Metrica
            rotulo="Burn mensal"
            valor={brl(c.burnMensal)}
            detalhe="Média dos 3 meses fechados"
          />
          <Metrica
            rotulo="Runway"
            valor={c.runwayMeses !== null ? `${c.runwayMeses} meses` : '—'}
            detalhe={c.runwayMeses !== null ? 'No ritmo atual de gasto' : 'Cadastre o saldo'}
          />
          <Metrica
            rotulo="Impostos a pagar"
            valor={brl(c.aPagar)}
            detalhe={c.vencidos > 0 ? `${c.vencidos} vencido(s)` : 'Nada vencido'}
          />
        </div>

        {velho && (
          <Card className="border-warn-line bg-warn-soft">
            <CardBody className="text-sm text-warn">
              O saldo mais antigo foi informado há {c.saldoDesatualizadoHa} dias. Runway calculado
              sobre saldo velho engana mais do que não ter runway — atualize antes de decidir
              qualquer coisa com esse número.
            </CardBody>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              titulo="Contas"
              descricao="O saldo é informado por você. O painel não conecta no banco."
            />
            <CardBody><Contas contas={c.contas} /></CardBody>
          </Card>

          <Card>
            <CardHeader titulo="Impostos" descricao="Competência, vencimento e baixa." />
            <CardBody><Impostos impostos={c.impostos} /></CardBody>
          </Card>
        </div>
      </div>
    </PainelShell>
  )
}
