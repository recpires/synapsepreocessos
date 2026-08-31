import PainelShell from '@/components/PainelShell'
import { PageHeader, Erro, Badge, Card, CardBody, Vazio } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import {
  type Atividade, ACAO_LABEL, ACAO_TOM, ENTIDADE_LABEL,
  nomeDaEmpresa, dinheiro, camposAlterados,
} from '@/lib/log-atividade'

export const dynamic = 'force-dynamic'

export default async function AtividadesPage() {
  let atividades: Atividade[] = []
  let erro: string | null = null

  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb
      .from('atividades')
      .select('id, autor, acao, entidade, resumo, antes, depois, em, empresa_id, empresas(nome_fantasia, razao_social)')
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
                  const valor = dinheiro(a)
                  const campos = camposAlterados(a, valor !== null)
                  const empresa = nomeDaEmpresa(a.empresas)
                  return (
                    <li key={a.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-5 py-2.5">
                      <Badge tom={ACAO_TOM[a.acao]} className="px-1.5 py-0 text-[10px]">
                        {ACAO_LABEL[a.acao]}
                      </Badge>
                      <span className="text-sm text-muted">
                        {ENTIDADE_LABEL[a.entidade] ?? a.entidade}
                      </span>
                      {a.resumo && <span className="text-sm font-medium text-fg">{a.resumo}</span>}
                      {valor && <span className="tabular text-sm text-fg">{valor}</span>}
                      {campos && <span className="text-xs text-subtle">({campos})</span>}
                      <span className="ml-auto flex items-center gap-3 text-xs text-subtle">
                        {empresa && <span className="text-muted">{empresa}</span>}
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
