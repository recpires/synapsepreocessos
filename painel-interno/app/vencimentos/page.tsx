import PainelShell from '@/components/PainelShell'
import { PageHeader, Erro, Metrica } from '@/components/ui'
import { obterVencimentos } from '@/server/vencimentos'
import { Lista } from './Lista'

export const dynamic = 'force-dynamic'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default async function VencimentosPage() {
  const r = await obterVencimentos()

  if (!r.data) {
    return (
      <PainelShell>
        <div className="p-6">
          <Erro mensagem={r.error ?? 'Não foi possível carregar os vencimentos.'} />
        </div>
      </PainelShell>
    )
  }

  const v = r.data

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Vencimentos"
          descricao="Contrato, domínio, certificado, imposto, proposta e prazo de projeto — tudo que tem data, num lugar só."
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metrica
            rotulo="Vencidos"
            valor={v.vencidos}
            detalhe={v.vencidos > 0 ? 'Já passou da data' : 'Nada atrasado'}
          />
          <Metrica
            rotulo="Próximos 7 dias"
            valor={v.criticos}
            detalhe={v.criticos > 0 ? 'Age esta semana' : 'Semana tranquila'}
          />
          <Metrica
            rotulo="Próximos 30 dias"
            valor={v.atencao}
            detalhe="Ainda dá tempo de planejar"
          />
          <Metrica
            rotulo="A pagar em 30d"
            valor={brl(v.aPagar30)}
            detalhe="Impostos e contratos com valor"
          />
        </div>

        <Lista itens={v.itens} />
      </div>
    </PainelShell>
  )
}
