'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Badge, Button, Input, Select } from '@/components/ui'
import { toast, confirmar } from '@/components/Feedback'
import { salvarRegraRateio, removerRegraRateio, type RegraRateio } from '@/server/financeiro'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type Produto = { id: string; nome: string }

export function Rateio({ regras, produtos }: { regras: RegraRateio[]; produtos: Produto[] }) {
  const router = useRouter()
  const [editando, setEditando] = useState<string | 'nova' | null>(null)
  const [salvando, iniciar] = useTransition()

  async function remover(regra: RegraRateio) {
    const ok = await confirmar({
      titulo: 'Remover regra',
      mensagem: `"${regra.nome}" deixa de distribuir custo. As despesas voltam para "sem dono".`,
      confirmLabel: 'Remover',
      perigoso: true,
    })
    if (!ok) return
    iniciar(async () => {
      const r = await removerRegraRateio(regra.id)
      if (r.ok) { toast.success('Regra removida.'); router.refresh() }
      else toast.error(r.error ?? 'Não foi possível remover.')
    })
  }

  return (
    <div className="space-y-3">
      {regras.length === 0 && editando !== 'nova' && (
        <p className="text-sm text-subtle">
          Nenhuma regra ainda. Supabase, Vercel e Claude servem vários produtos ao mesmo tempo —
          uma regra distribui esse custo por percentual em vez de forçar um dono só.
        </p>
      )}

      <ul className="space-y-2">
        {regras.map(r => (
          <li key={r.id} className="rounded-token border border-line bg-surface-2 p-3">
            {editando === r.id ? (
              <Formulario
                produtos={produtos}
                regra={r}
                salvando={salvando}
                aoCancelar={() => setEditando(null)}
                aoSalvar={dados => {
                  iniciar(async () => {
                    const res = await salvarRegraRateio({ ...dados, id: r.id })
                    if (res.ok) { toast.success('Regra atualizada.'); setEditando(null); router.refresh() }
                    else toast.error(res.error ?? 'Não foi possível salvar.')
                  })
                }}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-fg">{r.nome}</span>
                  <span className="flex items-center gap-2">
                    {!r.valida && (
                      <Badge tom="critico" className="px-1.5 py-0 text-[10px]">
                        soma {r.soma}%
                      </Badge>
                    )}
                    <span className="tabular text-xs text-subtle">alcança {brl(r.alcance)}</span>
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-subtle">
                  {r.aplica_a === 'descricao' ? 'descrição contém' : 'categoria é'}{' '}
                  <code className="text-[11px]">{r.padrao}</code>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.itens.map(i => (
                    <Badge key={i.produto_id} tom="neutro" className="px-1.5 py-0 text-[10px]">
                      {i.produto_nome} {i.percentual}%
                    </Badge>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button tamanho="sm" variante="fantasma" onClick={() => setEditando(r.id)}>Editar</Button>
                  <Button tamanho="sm" variante="fantasma" onClick={() => remover(r)}>Remover</Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {editando === 'nova' ? (
        <div className="rounded-token border border-line bg-surface-2 p-3">
          <Formulario
            produtos={produtos}
            salvando={salvando}
            aoCancelar={() => setEditando(null)}
            aoSalvar={dados => {
              iniciar(async () => {
                const res = await salvarRegraRateio(dados)
                if (res.ok) { toast.success('Regra criada.'); setEditando(null); router.refresh() }
                else toast.error(res.error ?? 'Não foi possível salvar.')
              })
            }}
          />
        </div>
      ) : (
        <Button tamanho="sm" variante="secundario" onClick={() => setEditando('nova')} className="w-full">
          Nova regra
        </Button>
      )}
    </div>
  )
}

function Formulario({
  produtos,
  regra,
  salvando,
  aoSalvar,
  aoCancelar,
}: {
  produtos: Produto[]
  regra?: RegraRateio
  salvando: boolean
  aoSalvar: (d: {
    nome: string
    aplica_a: 'descricao' | 'categoria'
    padrao: string
    itens: { produto_id: string; percentual: number }[]
  }) => void
  aoCancelar: () => void
}) {
  const [nome, setNome] = useState(regra?.nome ?? '')
  const [aplicaA, setAplicaA] = useState<'descricao' | 'categoria'>(regra?.aplica_a ?? 'descricao')
  const [padrao, setPadrao] = useState(regra?.padrao ?? '')
  const [pcts, setPcts] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      produtos.map(p => [p.id, regra?.itens.find(i => i.produto_id === p.id)?.percentual ?? 0])
    )
  )

  const soma = Object.values(pcts).reduce((a, v) => a + v, 0)
  const fecha = Math.abs(soma - 100) < 0.01

  /** Divide 100 igualmente entre os produtos que já têm algum percentual. */
  function dividirIgual() {
    const ativos = produtos.filter(p => (pcts[p.id] ?? 0) > 0)
    const alvo = ativos.length ? ativos : produtos
    const fatia = Math.floor((100 / alvo.length) * 100) / 100
    const novo = Object.fromEntries(produtos.map(p => [p.id, 0]))
    alvo.forEach(p => { novo[p.id] = fatia })
    // O resto vai no primeiro, para fechar exatamente 100.
    novo[alvo[0].id] = Math.round((100 - fatia * (alvo.length - 1)) * 100) / 100
    setPcts(novo)
  }

  return (
    <div className="space-y-3">
      <Input rotulo="Nome da regra" value={nome} onChange={e => setNome(e.target.value)}
        placeholder="Infra compartilhada" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select rotulo="Casa por" value={aplicaA}
          onChange={e => setAplicaA(e.target.value as 'descricao' | 'categoria')}>
          <option value="descricao">Descrição contém</option>
          <option value="categoria">Categoria é</option>
        </Select>
        <Input rotulo="Padrão" value={padrao} onChange={e => setPadrao(e.target.value)}
          placeholder={aplicaA === 'descricao' ? 'Supabase' : 'Infraestrutura'} />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-sm text-muted">Distribuição</span>
          <span className="flex items-center gap-2">
            <button type="button" onClick={dividirIgual} className="text-xs text-accent hover:underline">
              dividir igual
            </button>
            <span className={cn('tabular text-xs font-medium', fecha ? 'text-ok' : 'text-crit')}>
              {soma}%
            </span>
          </span>
        </div>
        <ul className="space-y-1.5">
          {produtos.map(p => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="flex-1 truncate text-sm text-muted">{p.nome}</span>
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={pcts[p.id] ?? 0}
                onChange={e => setPcts(s => ({ ...s, [p.id]: Number(e.target.value) }))}
                aria-label={`Percentual de ${p.nome}`}
                className="tabular w-20 rounded-token border border-line-strong bg-ground px-2 py-1 text-right text-sm text-fg focus:border-accent focus:outline-none"
              />
              <span className="w-4 text-xs text-subtle">%</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <Button
          tamanho="sm"
          carregando={salvando}
          disabled={!fecha}
          title={fecha ? undefined : 'Os percentuais precisam somar 100%'}
          onClick={() =>
            aoSalvar({
              nome, aplica_a: aplicaA, padrao,
              itens: produtos.map(p => ({ produto_id: p.id, percentual: pcts[p.id] ?? 0 })),
            })
          }
        >
          Salvar
        </Button>
        <Button tamanho="sm" variante="fantasma" onClick={aoCancelar}>Cancelar</Button>
      </div>
    </div>
  )
}
