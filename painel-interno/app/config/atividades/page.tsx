import PainelShell from '@/components/PainelShell'
import { PageHeader, Erro, Badge, Card, CardBody, Vazio } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'

export const dynamic = 'force-dynamic'

type Atividade = {
  id: string
  autor: string | null
  acao: 'insert' | 'update' | 'delete'
  entidade: string
  resumo: string | null
  antes: Record<string, unknown> | null
  depois: Record<string, unknown> | null
  em: string
}

const ACAO_LABEL: Record<string, string> = {
  insert: 'criou', update: 'alterou', delete: 'removeu',
}

const ACAO_TOM: Record<string, 'ok' | 'info' | 'critico'> = {
  insert: 'ok', update: 'info', delete: 'critico',
}

const ENTIDADE_LABEL: Record<string, string> = {
  empresas: 'empresa',
  projetos: 'projeto',
  contratos: 'contrato',
  propostas: 'proposta',
  proposta_itens: 'item de proposta',
  sites: 'site',
  impostos: 'imposto',
  contas_bancarias: 'conta bancária',
  membros: 'membro',
  contrato_templates: 'template',
  rateio_regras: 'regra de rateio',
  projeto_erros: 'erro de projeto',
}

/** Campos alterados, em texto curto. O log guarda só o diff em UPDATE. */
function camposAlterados(a: Atividade): string | null {
  if (a.acao !== 'update' || !a.depois) return null
  const chaves = Object.keys(a.depois).filter(k => k !== 'id')
  if (chaves.length === 0) return null
  return chaves.slice(0, 4).join(', ') + (chaves.length > 4 ? ` e mais ${chaves.length - 4}` : '')
}

export default async function AtividadesPage() {
  let atividades: Atividade[] = []
  let erro: string | null = null

  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb
      .from('atividades')
      .select('id, autor, acao, entidade, resumo, antes, depois, em')
      .order('em', { ascending: false })
      .limit(200)
    if (error) erro = `atividades: ${error.message}`
    else atividades = (data ?? []) as Atividade[]
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e)
  }

  return (
    <PainelShell>
      <div className="space-y-6 p-6">
        <PageHeader
          titulo="Log de atividades"
          descricao="Quem mudou o quê. Gravado por gatilho no banco, não pela aplicação — não tem como esquecer de registrar."
        />

        {erro ? (
          <Erro mensagem={erro} />
        ) : atividades.length === 0 ? (
          <Vazio
            titulo="Nada registrado ainda"
            descricao="O log começou a rodar agora. Toda criação, alteração e remoção nas tabelas principais aparece aqui."
          />
        ) : (
          <Card>
            <CardBody className="p-0">
              <ul className="divide-y divide-line">
                {atividades.map(a => {
                  const campos = camposAlterados(a)
                  return (
                    <li key={a.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-5 py-2.5">
                      <Badge tom={ACAO_TOM[a.acao]} className="px-1.5 py-0 text-[10px]">
                        {ACAO_LABEL[a.acao]}
                      </Badge>
                      <span className="text-sm text-muted">
                        {ENTIDADE_LABEL[a.entidade] ?? a.entidade}
                      </span>
                      {a.resumo && <span className="text-sm font-medium text-fg">{a.resumo}</span>}
                      {campos && <span className="text-xs text-subtle">({campos})</span>}
                      <span className="ml-auto flex items-center gap-3 text-xs text-subtle">
                        <span>{a.autor ?? 'sistema'}</span>
                        <span className="tabular">
                          {new Date(a.em).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </PainelShell>
  )
}
