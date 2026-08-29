import PainelShell from '@/components/PainelShell'
import SubNav from '@/components/SubNav'
import { SUBNAV } from '@/lib/nav'
import { PageHeader, Erro, Metrica } from '@/components/ui'
import { listarDividas, listarEmpresasProprias } from '@/server/empresa-financeiro'
import { Dividas } from './Dividas'

export const dynamic = 'force-dynamic'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default async function DividasPage() {
  const [dividas, empresas] = await Promise.all([listarDividas(), listarEmpresasProprias()])

  if (dividas.error || empresas.error) {
    return (
      <PainelShell>
        <div className="p-6">
          <Erro mensagem={dividas.error ?? empresas.error ?? 'Falha ao carregar.'} />
        </div>
      </PainelShell>
    )
  }

  const ativas = dividas.data!.dividas.filter(d => d.status === 'ativa')
  const saldo = ativas.reduce((a, d) => a + d.saldo_devedor, 0)
  const atrasadas = ativas.reduce((a, d) => a + d.parcelas_atrasadas, 0)

  // Doze meses à frente: é o horizonte que responde "quanto isso pesa no ano".
  const limite = new Date()
  limite.setUTCFullYear(limite.getUTCFullYear() + 1)
  const ate = limite.toISOString().slice(0, 10)
  const idsAtivas = new Set(ativas.map(d => d.id))
  const proximos12 = dividas.data!.parcelas
    .filter(p => !p.pago_em && p.vencimento <= ate && idsAtivas.has(p.divida_id))
    .reduce((a, p) => a + p.valor, 0)

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Dívidas"
          descricao="Empréstimo, financiamento, compra e imposto parcelados e conta a pagar. Cada parcela em aberto vira vencimento sozinha."
        />
        <SubNav tabs={SUBNAV.financeiro} />

        <div className="grid gap-3 sm:grid-cols-3">
          <Metrica
            rotulo="Saldo devedor"
            valor={brl(saldo)}
            detalhe={`${ativas.length} dívida(s) ativa(s)`}
            inverterCor
          />
          <Metrica
            rotulo="A pagar em 12 meses"
            valor={brl(proximos12)}
            detalhe="Parcelas em aberto até esta data no ano que vem"
            inverterCor
          />
          <Metrica
            rotulo="Parcelas atrasadas"
            valor={String(atrasadas)}
            detalhe={atrasadas > 0 ? 'Vencidas e não baixadas' : 'Nada vencido'}
            inverterCor
          />
        </div>

        <Dividas
          empresas={empresas.data ?? []}
          dividas={dividas.data!.dividas}
          parcelas={dividas.data!.parcelas}
        />
      </div>
    </PainelShell>
  )
}
