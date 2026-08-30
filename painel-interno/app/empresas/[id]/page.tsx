import Link from 'next/link'
import { notFound } from 'next/navigation'
import PainelShell from '@/components/PainelShell'
import { ArquivoLink } from '@/components/ArquivoLink'
import { PageHeader, Erro, Badge, Card, CardHeader, CardBody, Vazio } from '@/components/ui'
import { obterEmpresa } from '@/server/empresas'
import { TIPO_EMPRESA_LABEL, diasAte, tomDoVencimento } from '@/types/empresas'
import { FASE_LABEL, SAUDE_LABEL, type Saude } from '@/types/projetos'
import { Contatos } from './Contatos'

export const dynamic = 'force-dynamic'

const TOM_SAUDE: Record<Saude, 'ok' | 'atencao' | 'critico'> = {
  verde: 'ok', amarelo: 'atencao', vermelho: 'critico',
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dia = (d: string | null) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

export default async function EmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resultado = await obterEmpresa(id)

  if (!resultado.data) {
    const mensagem = resultado.error ?? 'Empresa não encontrada.'
    if (/não encontrada|not found|PGRST116/i.test(mensagem)) notFound()
    return (
      <PainelShell>
        <div className="p-6"><Erro mensagem={mensagem} /></div>
      </PainelShell>
    )
  }

  const { empresa, contatos, projetos, documentos, contratos, sites } = resultado.data
  const end = empresa.endereco ?? {}
  const temEndereco = Object.values(end).some(Boolean)

  // Documentos agrupados por categoria — a gaveta fica navegável.
  const porCategoria = new Map<string, typeof documentos>()
  for (const d of documentos) {
    const lista = porCategoria.get(d.categoria) ?? []
    lista.push(d)
    porCategoria.set(d.categoria, lista)
  }

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <div className="text-xs text-subtle">
          <Link href="/empresas" className="hover:text-fg">Empresas</Link>
          <span className="mx-1.5">/</span>
          <span className="text-muted">{empresa.razao_social}</span>
        </div>

        <PageHeader
          titulo={empresa.nome_fantasia || empresa.razao_social}
          descricao={
            <span className="flex flex-wrap items-center gap-2">
              <Badge tom="acento">{TIPO_EMPRESA_LABEL[empresa.tipo]}</Badge>
              {empresa.segmento && <span className="text-sm text-muted">{empresa.segmento}</span>}
              {empresa.site && (
                <a href={empresa.site} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">
                  {empresa.site.replace(/^https?:\/\//, '')}
                </a>
              )}
            </span>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader titulo="Projetos" descricao={`${projetos.length} em andamento`} />
              <CardBody>
                {projetos.length === 0 ? (
                  <p className="text-sm text-subtle">Nenhum projeto ligado a esta empresa.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {projetos.map(p => (
                      <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                        <Link href={`/projetos/${p.id}`} className="text-sm font-medium text-fg hover:text-accent">
                          {p.nome}
                        </Link>
                        <span className="flex items-center gap-2">
                          <span className="tabular text-xs text-subtle">{p.maturidade_pct}%</span>
                          <Badge tom="neutro" className="px-1.5 py-0 text-[10px]">{FASE_LABEL[p.fase_atual]}</Badge>
                          <Badge tom={TOM_SAUDE[p.saude]} ponto className="px-1.5 py-0 text-[10px]">
                            {SAUDE_LABEL[p.saude]}
                          </Badge>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader titulo="Documentos" descricao={`${documentos.length} arquivo(s)`} />
              <CardBody>
                {documentos.length === 0 ? (
                  <p className="text-sm text-subtle">Nenhum documento anexado.</p>
                ) : (
                  <div className="space-y-4">
                    {[...porCategoria.entries()].map(([categoria, itens]) => (
                      <div key={categoria}>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-subtle">{categoria}</p>
                        <ul className="divide-y divide-line">
                          {itens.map(d => (
                            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                              <span className="min-w-0">
                                <span className="block text-sm text-fg">{d.nome}</span>
                                {d.descricao && <span className="block text-xs text-subtle">{d.descricao}</span>}
                              </span>
                              {d.arquivo_url && (
                                <ArquivoLink
                                  bucket="documentos-files"
                                  valor={d.arquivo_url}
                                  className="flex-shrink-0 text-xs text-accent hover:underline"
                                >
                                  Abrir
                                </ArquivoLink>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader titulo="Contratos" descricao={`${contratos.length} registrado(s)`} />
              <CardBody>
                {contratos.length === 0 ? (
                  <p className="text-sm text-subtle">Nenhum contrato com esta empresa.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {contratos.map(c => {
                      const dias = diasAte(c.data_vencimento)
                      return (
                        <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                          <span className="min-w-0">
                            <span className="block text-sm text-fg">{c.cliente}</span>
                            <span className="block text-xs text-subtle">
                              {c.tipo} · desde {dia(c.data_inicio)}
                              {c.valor ? ` · ${brl(c.valor)}` : ''}
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            {c.data_vencimento && (
                              <Badge tom={tomDoVencimento(dias)} className="px-1.5 py-0 text-[10px]">
                                {dias !== null && dias < 0 ? `venceu há ${-dias}d` : `vence em ${dias}d`}
                              </Badge>
                            )}
                            {c.arquivo_url && (
                              <ArquivoLink bucket="contratos-arquivos" valor={c.arquivo_url} className="text-xs text-accent hover:underline">
                                Abrir
                              </ArquivoLink>
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardBody>
            </Card>

            {sites.length > 0 && (
              <Card>
                <CardHeader titulo="Sites" />
                <CardBody>
                  <ul className="divide-y divide-line">
                    {sites.map(s => (
                      <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                        <span className="text-sm text-fg">{s.nome}</span>
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                            {s.dominio ?? s.url}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader titulo="Cadastro" />
              <CardBody>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-subtle">Razão social</dt>
                    <dd className="text-right text-fg">{empresa.razao_social}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-subtle">CNPJ</dt>
                    <dd className="text-right font-mono text-xs text-fg">{empresa.cnpj ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-subtle">Responsável</dt>
                    <dd className="text-right text-fg">{empresa.responsavel ?? '—'}</dd>
                  </div>
                  {temEndereco && (
                    <div className="border-t border-line pt-2.5">
                      <dt className="mb-1 text-subtle">Endereço</dt>
                      <dd className="text-fg">
                        {[end.logradouro, end.numero, end.bairro].filter(Boolean).join(', ')}
                        {end.cidade && <><br />{end.cidade}{end.uf ? ` — ${end.uf}` : ''}</>}
                        {end.cep && <><br />CEP {end.cep}</>}
                      </dd>
                    </div>
                  )}
                </dl>
                {empresa.observacao && (
                  <p className="mt-3 border-t border-line pt-3 text-sm text-muted">{empresa.observacao}</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader titulo="Contatos" />
              <CardBody>
                {contatos.length === 0 && (
                  <Vazio titulo="Nenhum contato" descricao="Adicione quem responde por esta empresa." />
                )}
                <Contatos empresaId={empresa.id} contatos={contatos} />
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </PainelShell>
  )
}
