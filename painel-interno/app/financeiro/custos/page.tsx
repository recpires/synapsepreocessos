import PainelShell from '@/components/PainelShell'
import SubNav from '@/components/SubNav'
import { SeletorEmpresa } from '@/components/SeletorEmpresa'
import { listarEmpresasProprias } from '@/server/empresa-financeiro'
import { SUBNAV } from '@/lib/nav'
import { PageHeader, Erro, Metrica, Card, CardHeader, CardBody } from '@/components/ui'
import {
  obterPanoramaCustos, listarRegrasRateio, listarProdutosSimples, listarSemDono,
} from '@/server/financeiro'
import { Rateio } from './Rateio'
import { SemDono } from './SemDono'

export const dynamic = 'force-dynamic'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default async function CustosPage({
  searchParams,
}: {
  searchParams: Promise<{ empresa?: string }>
}) {
  const { empresa } = await searchParams
  const [panorama, regras, produtos, semDono, empresas] = await Promise.all([
    obterPanoramaCustos(empresa),
    listarRegrasRateio(empresa),
    listarProdutosSimples(),
    listarSemDono(empresa),
    listarEmpresasProprias(),
  ])

  // Guard por `data`, não por `error`: é o que o TypeScript consegue estreitar.
  if (!panorama.data) {
    return (
      <PainelShell>
        <div className="p-6">
          <Erro mensagem={panorama.error ?? 'Não foi possível carregar os custos.'} />
        </div>
      </PainelShell>
    )
  }

  const p = panorama.data
  const pctAlocado = p.totalRealizado > 0
    ? Math.round(((p.totalRealizado - p.semDono) / p.totalRealizado) * 100)
    : 0
  const maiorCusto = p.produtos[0]

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Custo por produto"
          descricao="Quanto cada SaaS custa de verdade — o direto mais a fatia da infra compartilhada."
        />
        <SubNav tabs={SUBNAV.financeiro} />
        <SeletorEmpresa empresas={(empresas.data ?? []).map(e => ({
          id: e.id, nome: e.nome_fantasia || e.razao_social,
        }))} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metrica
            rotulo="Despesa realizada"
            valor={brl(p.totalRealizado)}
            detalhe={`${pctAlocado}% com dono`}
          />
          <Metrica
            rotulo="Sem dono"
            valor={brl(p.semDono)}
            detalhe={p.semDono > 0 ? 'Crie regras para distribuir' : 'Tudo alocado'}
          />
          <Metrica
            rotulo="Burn mensal"
            valor={brl(p.burnMensal)}
            detalhe="Média dos 3 meses fechados"
          />
          <Metrica
            rotulo="Runway"
            valor={p.runwayMeses !== null ? `${p.runwayMeses} meses` : '—'}
            detalhe={
              p.runwayMeses !== null
                ? `Saldo de ${brl(p.saldoTotal)}`
                : 'Cadastre o saldo das contas'
            }
          />
        </div>

        <Card>
          <CardHeader
            titulo="Custo por produto"
            descricao={
              maiorCusto
                ? `${maiorCusto.produto_nome} é o mais caro: ${brl(maiorCusto.total)}`
                : 'Nenhum custo alocado ainda'
            }
          />
          <CardBody>
            {p.produtos.length === 0 ? (
              <p className="text-sm text-subtle">
                Nenhuma despesa tem produto definido nem regra de rateio. Comece pela fila abaixo.
              </p>
            ) : (
              <ul className="space-y-3">
                {p.produtos.map(c => {
                  const larguraTotal = (c.total / p.produtos[0].total) * 100
                  const fatiaDireto = c.total > 0 ? (c.direto / c.total) * 100 : 0
                  return (
                    <li key={c.produto_id}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="text-fg">{c.produto_nome}</span>
                        <span className="tabular text-fg">{brl(c.total)}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                        <div className="flex h-full" style={{ width: `${larguraTotal}%` }}>
                          <div className="h-full bg-accent" style={{ width: `${fatiaDireto}%` }} />
                          <div className="h-full flex-1 bg-accent/40" />
                        </div>
                      </div>
                      <div className="mt-0.5 flex gap-3 text-[11px] text-subtle">
                        {c.direto > 0 && <span className="tabular">direto {brl(c.direto)}</span>}
                        {c.rateado > 0 && <span className="tabular">rateado {brl(c.rateado)}</span>}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              titulo="Regras de rateio"
              descricao="Uma regra só vale quando os percentuais somam 100%."
            />
            <CardBody>
              <Rateio regras={regras.data ?? []} produtos={produtos.data ?? []} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              titulo="Fila do que falta ratear"
              descricao="As maiores despesas que nenhuma regra alcança."
            />
            <CardBody>
              <SemDono itens={semDono.data ?? []} />
            </CardBody>
          </Card>
        </div>
      </div>
    </PainelShell>
  )
}
