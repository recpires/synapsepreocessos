import Link from 'next/link'
import { notFound } from 'next/navigation'
import PainelShell from '@/components/PainelShell'
import { PageHeader, Erro, Badge, Card, CardBody, Metrica } from '@/components/ui'
import { obterProposta } from '@/server/propostas'
import { listarEmpresasCompletas } from '@/server/empresas'
import {
  STATUS_PROPOSTA_LABEL, STATUS_PROPOSTA_TOM, diasDeValidade,
} from '@/types/propostas'
import { Editor } from './Editor'

export const dynamic = 'force-dynamic'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default async function PropostaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [resultado, empresas] = await Promise.all([
    obterProposta(id),
    listarEmpresasCompletas(),
  ])

  if (!resultado.data) {
    const mensagem = resultado.error ?? 'Proposta não encontrada.'
    if (/não encontrada|not found|PGRST116/i.test(mensagem)) notFound()
    return (
      <PainelShell>
        <div className="p-6"><Erro mensagem={mensagem} /></div>
      </PainelShell>
    )
  }

  const p = resultado.data
  const dias = diasDeValidade(p.validade)
  const horas = p.itens.reduce((a, i) => a + (i.horas_est ?? 0) * i.quantidade, 0)

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <div className="text-xs text-subtle">
          <Link href="/comercial/propostas" className="hover:text-fg">Propostas</Link>
          <span className="mx-1.5">/</span>
          <span className="font-mono text-muted">{p.numero}</span>
        </div>

        <PageHeader
          titulo={p.titulo}
          descricao={
            <span className="flex flex-wrap items-center gap-2">
              <Badge tom={STATUS_PROPOSTA_TOM[p.status]}>{STATUS_PROPOSTA_LABEL[p.status]}</Badge>
              {p.empresa_nome && <span className="text-sm text-muted">{p.empresa_nome}</span>}
              {dias !== null && (
                <Badge tom={dias < 0 ? 'critico' : dias <= 3 ? 'atencao' : 'neutro'}
                  className="px-1.5 py-0 text-[10px]">
                  {dias < 0 ? `expirou há ${-dias}d` : `válida por ${dias}d`}
                </Badge>
              )}
            </span>
          }
          acoes={
            <Link
              href={`/comercial/propostas/${p.id}/documento`}
              className="inline-flex h-8 items-center rounded-token bg-accent px-3 text-xs font-medium text-accent-fg hover:bg-accent-hover"
            >
              Ver documento
            </Link>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metrica rotulo="Valor único" valor={brl(p.valor_total)} detalhe="Itens não opcionais" />
          <Metrica rotulo="Mensal" valor={brl(p.valor_mensal)} detalhe="Recorrente proposto" />
          <Metrica rotulo="Itens" valor={p.itens.length}
            detalhe={`${p.itens.filter(i => i.opcional).length} opcional(is)`} />
          <Metrica rotulo="Horas estimadas" valor={horas > 0 ? `${horas}h` : '—'}
            detalhe={horas > 0 && p.valor_total > 0 ? `${brl(p.valor_total / horas)}/h` : 'Sem estimativa'} />
        </div>

        {p.status === 'aceita' && (
          <Card className="border-ok-line bg-ok-soft">
            <CardBody className="text-sm text-ok">
              Proposta aceita{p.aceita_em ? ` em ${new Date(p.aceita_em).toLocaleDateString('pt-BR')}` : ''}.
              Os valores estão congelados e os itens não podem mais ser editados.
              {p.projeto_id && (
                <> O projeto foi criado —{' '}
                  <Link href={`/projetos/${p.projeto_id}`} className="underline">abrir</Link>.
                </>
              )}
            </CardBody>
          </Card>
        )}

        {p.status === 'recusada' && p.motivo_recusa && (
          <Card className="border-crit-line bg-crit-soft">
            <CardBody className="text-sm text-crit">
              <span className="font-medium">Recusada:</span> {p.motivo_recusa}
            </CardBody>
          </Card>
        )}

        <Editor
          proposta={p}
          empresas={(empresas.data ?? []).map(e => ({ id: e.id, nome: e.razao_social }))}
        />
      </div>
    </PainelShell>
  )
}
