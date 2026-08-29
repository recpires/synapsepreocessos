import Link from 'next/link'
import { notFound } from 'next/navigation'
import PainelShell from '@/components/PainelShell'
import SubNav from '@/components/SubNav'
import { SUBNAV } from '@/lib/nav'
import {
  PageHeader, Erro, Card, CardHeader, CardBody, Metrica, Badge,
} from '@/components/ui'
import {
  listarPosicoes, listarNotas, listarDividas, listarSocios,
} from '@/server/empresa-financeiro'
import { listarEmpresasCompletas } from '@/server/empresas'
import { REGIME_LABEL, TIPO_DIVIDA_LABEL } from '@/types/empresa-financeiro'
import { Fiscal } from './Fiscal'
import { Notas } from './Notas'
import { Socios } from './Socios'

export const dynamic = 'force-dynamic'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default async function EmpresaFinanceiroPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [posicoes, notas, dividas, todasEmpresas, socios] = await Promise.all([
    listarPosicoes(),
    listarNotas(id),
    listarDividas(id),
    listarEmpresasCompletas(),
    listarSocios(id),
  ])

  if (posicoes.error) {
    return (
      <PainelShell>
        <div className="p-6"><Erro mensagem={posicoes.error} /></div>
      </PainelShell>
    )
  }

  const p = posicoes.data?.find(x => x.empresa.id === id)
  if (!p) notFound()

  // Tomador de nota é qualquer empresa que não seja a emitente.
  const clientes = (todasEmpresas.data ?? [])
    .filter(e => e.id !== id)
    .map(e => ({ id: e.id, razao_social: e.razao_social }))

  const uso = p.teto?.uso_pct ?? null
  const dividasAtivas = (dividas.data?.dividas ?? []).filter(d => d.status === 'ativa')

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <div className="text-xs text-subtle">
          <Link href="/financeiro/empresas" className="hover:text-fg">Empresas</Link>
          <span className="mx-1.5">/</span>
          <span className="text-muted">{p.empresa.razao_social}</span>
        </div>

        <PageHeader
          titulo={p.empresa.nome_fantasia || p.empresa.razao_social}
          descricao={
            <span className="flex flex-wrap items-center gap-2">
              {p.empresa.regime_tributario
                ? <Badge tom="neutro">{REGIME_LABEL[p.empresa.regime_tributario]}</Badge>
                : <Badge tom="atencao">Regime não definido</Badge>}
              {p.empresa.cnpj && <span className="tabular text-sm text-muted">{p.empresa.cnpj}</span>}
            </span>
          }
        />
        <SubNav tabs={SUBNAV.financeiro} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metrica
            rotulo="Faturado até hoje"
            valor={brl(p.faturadoAno)}
            detalhe={`${p.notas} nota(s) emitida(s)`}
          />
          <Metrica
            rotulo="Recebido até hoje"
            valor={brl(p.recebidoAno)}
            detalhe="Confirmada ou recebida, no ano até hoje"
          />
          <Metrica
            rotulo="Resultado"
            valor={brl(p.resultadoAno)}
            detalhe={
              p.minhaParticipacaoPct !== null
                ? `${brl(p.minhaParte ?? 0)} é sua (${p.minhaParticipacaoPct}%)`
                : `${brl(p.despesaAno)} de despesa`
            }
          />
          <Metrica
            rotulo="Dívida em aberto"
            valor={p.saldoDevedor > 0 ? brl(p.saldoDevedor) : '—'}
            detalhe={
              p.parcelasAtrasadas > 0
                ? `${p.parcelasAtrasadas} parcela(s) atrasada(s)`
                : dividasAtivas.length
                  ? `${dividasAtivas.length} dívida(s) ativa(s)`
                  : 'Nenhuma dívida ativa'
            }
            inverterCor
          />
        </div>

        {uso !== null && uso >= 70 && (
          <Card className={uso >= 90 ? 'border-crit-line bg-crit-soft' : 'border-warn-line bg-warn-soft'}>
            <CardBody className={uso >= 90 ? 'text-sm text-crit' : 'text-sm text-warn'}>
              Faturamento de {brl(p.teto!.faturado_12m)} nos últimos 12 meses corridos —{' '}
              <strong>{uso}%</strong> do teto de {brl(p.teto!.teto_faturamento ?? 0)}.
              {uso >= 100
                ? ' O teto já estourou: o desenquadramento é retroativo, então vale conversar com a contabilidade agora.'
                : ' A janela é móvel, então isso muda todo mês mesmo sem emitir nota nova.'}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader
            titulo="Dados fiscais"
            descricao="Regime e teto alimentam o alerta dos 12 meses corridos."
          />
          <CardBody><Fiscal empresa={p.empresa} /></CardBody>
        </Card>

        <Card>
          <CardHeader
            titulo="Sócios"
            descricao="Quem é dono de quanto. Sem isto o painel trata a empresa como inteira sua."
          />
          <CardBody>
            <Socios
              empresaId={id}
              socios={socios.data?.socios ?? []}
              membros={socios.data?.membros ?? []}
              resultadoAno={p.resultadoAno}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            titulo="Notas fiscais"
            descricao="Faturar é emitir. Receber é outra coisa, e mora em Receitas."
          />
          <CardBody>
            <Notas empresaId={id} notas={notas.data ?? []} clientes={clientes} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            titulo="Dívidas desta empresa"
            descricao="Saldo devedor e parcelas."
            acao={
              <Link
                href="/financeiro/dividas"
                className="text-xs text-accent-text hover:underline"
              >
                gerenciar
              </Link>
            }
          />
          <CardBody>
            {dividasAtivas.length === 0 ? (
              <p className="text-sm text-subtle">Nenhuma dívida ativa nesta empresa.</p>
            ) : (
              <ul className="space-y-2">
                {dividasAtivas.map(d => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2 last:border-0"
                  >
                    <span className="text-sm text-fg">
                      {d.credor}
                      <span className="ml-2 text-xs text-subtle">
                        {TIPO_DIVIDA_LABEL[d.tipo]}
                        {' · '}
                        {d.parcelas_abertas} de {d.parcelas_total} em aberto
                      </span>
                    </span>
                    <span className="tabular text-sm text-fg">
                      {brl(d.saldo_devedor)}
                      {d.parcelas_atrasadas > 0 && (
                        <span className="ml-2 text-xs text-crit">
                          {d.parcelas_atrasadas} atrasada(s)
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </PainelShell>
  )
}
