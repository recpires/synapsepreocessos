import Link from 'next/link'
import { notFound } from 'next/navigation'
import PainelShell from '@/components/PainelShell'
import { PageHeader, Erro, Badge, Card, CardHeader, CardBody, Metrica } from '@/components/ui'
import { obterProjeto, listarCamadasMaturidade } from '@/server/projetos'
import {
  FASE_LABEL, SAUDE_LABEL, TIPO_PROJETO_LABEL,
  type Saude,
} from '@/types/projetos'
import { Fases } from './Fases'
import { Erros } from './Erros'
import { Maturidade } from './Maturidade'

export const dynamic = 'force-dynamic'

const TOM_SAUDE: Record<Saude, 'ok' | 'atencao' | 'critico'> = {
  verde: 'ok', amarelo: 'atencao', vermelho: 'critico',
}

export default async function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [resultado, camadas] = await Promise.all([obterProjeto(id), listarCamadasMaturidade()])

  if (!resultado.data) {
    const mensagem = resultado.error ?? 'Projeto não encontrado.'
    // Id inexistente devolve "não encontrado" do Postgres — vira 404, não erro.
    if (/não encontrado|not found|PGRST116/i.test(mensagem)) notFound()
    return (
      <PainelShell>
        <div className="p-6"><Erro mensagem={mensagem} /></div>
      </PainelShell>
    )
  }

  const { projeto, fases, erros, maturidade } = resultado.data
  const abertos = erros.filter(e => e.status === 'aberto' || e.status === 'investigando')
  const resolvidos = erros.filter(e => e.resolvido_em)

  // Tempo médio até resolver, em horas — só faz sentido com erro já fechado.
  const mediaHoras = resolvidos.length
    ? resolvidos.reduce((a, e) => {
        const dt = new Date(e.resolvido_em!).getTime() - new Date(e.detectado_em).getTime()
        return a + dt / 3_600_000
      }, 0) / resolvidos.length
    : null

  const ficha: { rotulo: string; valor: string | null }[] = [
    { rotulo: 'Responsável', valor: projeto.responsavel },
    { rotulo: 'Início', valor: projeto.data_inicio },
    { rotulo: 'Prazo', valor: projeto.prazo },
    {
      rotulo: 'Valor contratado',
      valor: projeto.valor_contratado
        ? projeto.valor_contratado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : null,
    },
    { rotulo: 'Repositório', valor: projeto.repo },
  ]

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <div className="text-xs text-subtle">
          <Link href="/projetos" className="hover:text-fg">Projetos</Link>
          <span className="mx-1.5">/</span>
          <span className="text-muted">{projeto.nome}</span>
        </div>

        <PageHeader
          titulo={projeto.nome}
          descricao={
            <span className="flex flex-wrap items-center gap-2">
              <Badge tom={TOM_SAUDE[projeto.saude]} ponto>{SAUDE_LABEL[projeto.saude]}</Badge>
              <Badge tom="acento">{FASE_LABEL[projeto.fase_atual]}</Badge>
              <Badge tom="neutro">{TIPO_PROJETO_LABEL[projeto.tipo]}</Badge>
              {projeto.empresa_nome && <span className="text-sm text-muted">{projeto.empresa_nome}</span>}
            </span>
          }
        />

        {projeto.observacao && (
          <Card>
            <CardBody className="text-sm text-muted">{projeto.observacao}</CardBody>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metrica rotulo="Maturidade" valor={`${projeto.maturidade_pct}%`}
            detalhe={maturidade.length ? `${new Set(maturidade.map(m => m.camada)).size} camadas avaliadas` : 'Nunca avaliado por camada'} />
          <Metrica rotulo="Erros abertos" valor={abertos.length}
            detalhe={projeto.erros_criticos > 0 ? `${projeto.erros_criticos} crítico(s)` : 'Nenhum crítico'} />
          <Metrica rotulo="Erros resolvidos" valor={resolvidos.length}
            detalhe={mediaHoras !== null ? `Média de ${mediaHoras.toFixed(1)}h até resolver` : 'Sem histórico'} />
          <Metrica rotulo="Fases" valor={`${fases.filter(f => f.status === 'concluida').length}/${fases.length}`}
            detalhe={fases.length ? 'concluídas' : 'Nenhuma fase definida'} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader
                titulo="Fases"
                descricao="Previsto contra real. O desvio aparece quando a data real passa da prevista."
              />
              <CardBody><Fases projetoId={projeto.id} fases={fases} /></CardBody>
            </Card>

            <Card>
              <CardHeader
                titulo="Erros"
                descricao="Cada erro com severidade, causa raiz e tempo até a correção."
              />
              <CardBody><Erros projetoId={projeto.id} erros={erros} /></CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader titulo="Maturidade por camada" />
              <CardBody>
                <Maturidade
                  projetoId={projeto.id}
                  camadas={camadas.data ?? []}
                  notas={maturidade}
                  fallbackPct={projeto.maturidade_pct}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader titulo="Ficha" />
              <CardBody>
                <dl className="space-y-2.5 text-sm">
                  {ficha.map(({ rotulo, valor }) => (
                    <div key={rotulo} className="flex justify-between gap-3">
                      <dt className="text-subtle">{rotulo}</dt>
                      <dd className="text-right text-fg">{valor ?? <span className="text-subtle">—</span>}</dd>
                    </div>
                  ))}
                </dl>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </PainelShell>
  )
}
