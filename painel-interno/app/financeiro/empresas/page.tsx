import Link from 'next/link'
import PainelShell from '@/components/PainelShell'
import SubNav from '@/components/SubNav'
import { SUBNAV } from '@/lib/nav'
import {
  PageHeader, Erro, Card, CardHeader, CardBody, Badge, Vazio, Tabela, Th, Td, Tr,
} from '@/components/ui'
import { listarPosicoes, contarSemEmpresa } from '@/server/empresa-financeiro'
import { REGIME_LABEL } from '@/types/empresa-financeiro'
import { Atribuir } from './Atribuir'

export const dynamic = 'force-dynamic'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default async function EmpresasFinanceiroPage() {
  const [{ data: posicoes, error }, { data: pendencia }] = await Promise.all([
    listarPosicoes(),
    contarSemEmpresa(),
  ])

  const totalFaturado = (posicoes ?? []).reduce((a, p) => a + p.faturadoAno, 0)
  const totalDevedor = (posicoes ?? []).reduce((a, p) => a + p.saldoDevedor, 0)

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Empresas"
          descricao="Cada CNPJ com seu faturamento, seu resultado e o que ainda deve. Do dia 1º de janeiro até hoje."
        />
        <SubNav tabs={SUBNAV.financeiro} />

        {error ? (
          <Erro mensagem={error} />
        ) : !posicoes || posicoes.length === 0 ? (
          <Vazio
            titulo="Nenhuma empresa própria cadastrada"
            descricao="Cadastre em Empresas com tipo “própria”. Só elas emitem nota e recebem rateio de resultado."
          />
        ) : (
          <>
            <Card>
              <Tabela>
                <thead>
                  <tr>
                    <Th>Empresa</Th>
                    <Th>Regime</Th>
                    <Th numerica>Faturado</Th>
                    <Th numerica>Recebido</Th>
                    <Th numerica>Despesa</Th>
                    <Th numerica>Resultado</Th>
                    <Th numerica>Sua parte</Th>
                    <Th numerica>Dívida</Th>
                    <Th>Teto</Th>
                  </tr>
                </thead>
                <tbody>
                  {posicoes.map(p => {
                    const uso = p.teto?.uso_pct ?? null
                    return (
                      <Tr key={p.empresa.id}>
                        <Td>
                          <Link
                            href={`/financeiro/empresas/${p.empresa.id}`}
                            className="font-medium text-fg hover:text-accent-text"
                          >
                            {p.empresa.nome_fantasia || p.empresa.razao_social}
                          </Link>
                          {p.empresa.cnpj && (
                            <div className="text-[11px] text-subtle tabular">{p.empresa.cnpj}</div>
                          )}
                        </Td>
                        <Td>
                          {p.empresa.regime_tributario
                            ? <Badge tom="neutro">{REGIME_LABEL[p.empresa.regime_tributario]}</Badge>
                            : <span className="text-xs text-subtle">não definido</span>}
                        </Td>
                        <Td numerica>{brl(p.faturadoAno)}</Td>
                        <Td numerica>{brl(p.recebidoAno)}</Td>
                        <Td numerica>{brl(p.despesaAno)}</Td>
                        <Td numerica>
                          <span className={p.resultadoAno < 0 ? 'text-crit' : 'text-ok'}>
                            {brl(p.resultadoAno)}
                          </span>
                        </Td>
                        <Td numerica>
                          {p.minhaParticipacaoPct === null ? (
                            <span
                              className="text-xs text-subtle"
                              title="Você não está declarado como sócio desta empresa — o que é diferente de ter 0%."
                            >
                              —
                            </span>
                          ) : (
                            <>
                              <span className={p.minhaParte! < 0 ? 'text-crit' : 'text-fg'}>
                                {brl(p.minhaParte!)}
                              </span>
                              <div className="text-[11px] text-subtle">
                                {p.minhaParticipacaoPct}%
                                {p.participacaoVariou && (
                                  <span
                                    title="Sua participação mudou dentro do período, então o valor não é a porcentagem de hoje vezes o resultado — cada lançamento foi pesado pela fatia vigente na data dele."
                                  >
                                    {' '}· mudou no ano
                                  </span>
                                )}
                                {p.declaradoPct < 99.999 && (
                                  <span
                                    className="text-warn"
                                    title={`Só ${p.declaradoPct}% do capital está declarado.`}
                                  >
                                    {' '}· cadastro incompleto
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </Td>
                        <Td numerica>
                          {p.saldoDevedor > 0 ? brl(p.saldoDevedor) : '—'}
                          {p.parcelasAtrasadas > 0 && (
                            <div className="text-[11px] text-crit">
                              {p.parcelasAtrasadas} atrasada(s)
                            </div>
                          )}
                        </Td>
                        <Td>
                          {uso === null ? (
                            <span className="text-xs text-subtle">sem teto</span>
                          ) : (
                            <div className="min-w-24">
                              <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                                <div
                                  className={
                                    uso >= 90 ? 'h-full bg-crit'
                                    : uso >= 70 ? 'h-full bg-warn'
                                    : 'h-full bg-ok'
                                  }
                                  style={{ width: `${Math.min(uso, 100)}%` }}
                                />
                              </div>
                              <div className="mt-1 text-[11px] text-subtle tabular">
                                {uso}% em 12 meses
                              </div>
                            </div>
                          )}
                        </Td>
                      </Tr>
                    )
                  })}
                </tbody>
              </Tabela>
            </Card>

            {pendencia && (pendencia.despesas > 0 || pendencia.receitas > 0) && (
              <Card>
                <CardHeader
                  titulo="Lançamentos sem empresa"
                  descricao="Vieram de quando só havia uma entidade. Atribuir é escolha sua, e pode ser refeita."
                />
                <CardBody>
                  <Atribuir
                    empresas={posicoes.map(p => p.empresa)}
                    pendencia={pendencia}
                  />
                </CardBody>
              </Card>
            )}

            <Card>
              <CardBody className="text-xs text-subtle">
                <strong className="text-muted">Faturado</strong> é nota fiscal emitida na
                competência; <strong className="text-muted">recebido</strong> é dinheiro que
                entrou. A distância entre os dois é o que você vendeu e ainda não recebeu — somar
                os dois numa linha só apagaria justamente isso. O resultado usa recebido menos
                despesa, não a nota: caixa, não competência. A janela termina{' '}
                <strong className="text-muted">hoje</strong>, não em 31 de dezembro: a tabela de
                despesas guarda também as parcelas que o cron já gerou para as recorrências, e
                incluí-las transformaria a posição numa projeção disfarçada de fato.{' '}
                <strong className="text-muted">Sua parte</strong> é o resultado vezes a sua
                participação societária, e aparece só nas empresas em que você está declarado
                como sócio — cada pessoa que abre esta tela vê a própria fatia, não a dos outros.
                O cálculo é por lançamento, não pelo total do período: quem entrou em maio não
                leva o que aconteceu em março, e quem saiu em junho não leva o de agosto. Por
                isso o valor às vezes não é a porcentagem vezes o resultado — quando isso
                acontece, a linha diz “mudou no ano”.
                {totalFaturado === 0 && totalDevedor === 0 && (
                  <> Ainda não há nota nem dívida lançada, então a tabela mostra zeros reais.</>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </PainelShell>
  )
}
