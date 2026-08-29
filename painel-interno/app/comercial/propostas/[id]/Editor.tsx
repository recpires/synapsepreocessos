'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Badge, Button, Card, CardHeader, CardBody, Input, Select, Textarea } from '@/components/ui'
import { toast, confirmar } from '@/components/Feedback'
import {
  atualizarProposta, salvarItem, removerItem, mudarStatus, aceitarProposta,
} from '@/server/propostas'
import {
  TRANSICOES, STATUS_PROPOSTA_LABEL,
  type PropostaCompleta, type ItemProposta, type StatusProposta,
} from '@/types/propostas'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Aceita "1.234,56" e "1234.56". */
function numero(v: FormDataEntryValue | null) {
  const n = Number(String(v ?? '').replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function Editor({
  proposta: p,
  empresas,
}: {
  proposta: PropostaCompleta
  empresas: { id: string; nome: string }[]
}) {
  const router = useRouter()
  const [editandoItem, setEditandoItem] = useState<string | 'novo' | null>(null)
  const [salvando, iniciar] = useTransition()

  const travada = p.status === 'aceita'

  function gravarCampos(form: FormData) {
    iniciar(async () => {
      const r = await atualizarProposta(p.id, {
        titulo: String(form.get('titulo') ?? ''),
        empresa_id: String(form.get('empresa_id') ?? '') || null,
        validade: String(form.get('validade') ?? '') || null,
        contexto: String(form.get('contexto') ?? '') || null,
        escopo: String(form.get('escopo') ?? '') || null,
        condicoes: String(form.get('condicoes') ?? '') || null,
      })
      if (r.ok) { toast.success('Proposta atualizada.'); router.refresh() }
      else toast.error(r.error ?? 'Não foi possível salvar.')
    })
  }

  function gravarItem(form: FormData, item?: ItemProposta) {
    iniciar(async () => {
      const r = await salvarItem(p.id, {
        id: item?.id,
        ordem: item?.ordem ?? p.itens.length + 1,
        descricao: String(form.get('descricao') ?? ''),
        detalhe: String(form.get('detalhe') ?? '') || null,
        quantidade: numero(form.get('quantidade')) || 1,
        valor_unit: numero(form.get('valor_unit')),
        cobranca: (String(form.get('cobranca')) === 'mensal' ? 'mensal' : 'unico'),
        horas_est: form.get('horas_est') ? numero(form.get('horas_est')) : null,
        opcional: form.get('opcional') === 'on',
      })
      if (r.ok) { toast.success('Item salvo.'); setEditandoItem(null); router.refresh() }
      else toast.error(r.error ?? 'Não foi possível salvar o item.')
    })
  }

  async function excluirItem(item: ItemProposta) {
    const ok = await confirmar({
      titulo: 'Remover item',
      mensagem: `"${item.descricao}" sai da proposta e os totais são recalculados.`,
      confirmLabel: 'Remover',
      perigoso: true,
    })
    if (!ok) return
    iniciar(async () => {
      const r = await removerItem(p.id, item.id)
      if (r.ok) { toast.success('Item removido.'); router.refresh() }
      else toast.error(r.error ?? 'Não foi possível remover.')
    })
  }

  async function transicionar(novo: StatusProposta) {
    if (novo === 'aceita') {
      const ok = await confirmar({
        titulo: 'Aceitar proposta',
        mensagem: 'Os valores são congelados e um projeto é criado com uma fase por item de escopo. Não dá para desfazer.',
        confirmLabel: 'Aceitar',
      })
      if (!ok) return
      iniciar(async () => {
        const r = await aceitarProposta(p.id)
        if (r.ok) {
          toast.success('Proposta aceita. Projeto criado.')
          if (r.projetoId) router.push(`/projetos/${r.projetoId}`)
          else router.refresh()
        } else {
          toast.error(r.error ?? 'Não foi possível aceitar.')
        }
      })
      return
    }

    let motivo: string | undefined
    if (novo === 'recusada') {
      const texto = window.prompt('Por que foi recusada? Isso é o que ensina na próxima proposta.')
      if (texto === null) return
      motivo = texto
    }

    iniciar(async () => {
      const r = await mudarStatus(p.id, novo, motivo)
      if (r.ok) { toast.success(`Status: ${STATUS_PROPOSTA_LABEL[novo]}.`); router.refresh() }
      else toast.error(r.error ?? 'Não foi possível mudar o status.')
    })
  }

  const proximos = TRANSICOES[p.status]

  return (
    <div className="space-y-6">
      {proximos.length > 0 && (
        <Card>
          <CardBody className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">Avançar para:</span>
            {proximos.map(s => (
              <Button
                key={s}
                tamanho="sm"
                variante={s === 'aceita' ? 'primario' : s === 'recusada' ? 'perigo' : 'secundario'}
                carregando={salvando}
                onClick={() => transicionar(s)}
              >
                {STATUS_PROPOSTA_LABEL[s]}
              </Button>
            ))}
          </CardBody>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="min-w-0">
          <CardHeader
            titulo="Itens de escopo"
            descricao={travada ? 'Congelados — a proposta foi aceita.' : 'Cada item vira uma fase do projeto ao aceitar.'}
          />
          <CardBody className="space-y-3">
            {p.itens.length === 0 && editandoItem !== 'novo' && (
              <p className="text-sm text-subtle">
                Nenhum item. Some o escopo em partes entregáveis — elas viram as fases do projeto.
              </p>
            )}

            <ul className="space-y-2">
              {p.itens.map(i => (
                <li key={i.id} className="rounded-token border border-line bg-surface-2 p-3">
                  {editandoItem === i.id ? (
                    <FormItem item={i} salvando={salvando} aoEnviar={gravarItem}
                      aoCancelar={() => setEditandoItem(null)} />
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium text-fg">{i.descricao}</span>
                          {i.opcional && (
                            <Badge tom="neutro" className="px-1.5 py-0 text-[10px]">opcional</Badge>
                          )}
                          {i.cobranca === 'mensal' && (
                            <Badge tom="info" className="px-1.5 py-0 text-[10px]">mensal</Badge>
                          )}
                        </span>
                        {i.detalhe && <span className="mt-0.5 block text-xs text-subtle">{i.detalhe}</span>}
                        <span className="mt-0.5 block text-[11px] text-subtle">
                          {i.quantidade} × {brl(i.valor_unit)}
                          {i.horas_est ? ` · ${i.horas_est}h` : ''}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className={cn('tabular text-sm', i.opcional ? 'text-subtle' : 'text-fg')}>
                          {brl(i.quantidade * i.valor_unit)}
                        </span>
                        {!travada && (
                          <>
                            <Button tamanho="sm" variante="fantasma" onClick={() => setEditandoItem(i.id)}>
                              Editar
                            </Button>
                            <Button tamanho="sm" variante="fantasma" onClick={() => excluirItem(i)}>
                              Remover
                            </Button>
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {!travada && (
              editandoItem === 'novo' ? (
                <div className="rounded-token border border-line bg-surface-2 p-3">
                  <FormItem salvando={salvando} aoEnviar={gravarItem}
                    aoCancelar={() => setEditandoItem(null)} />
                </div>
              ) : (
                <Button tamanho="sm" variante="secundario" onClick={() => setEditandoItem('novo')}
                  className="w-full">
                  Adicionar item
                </Button>
              )
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader titulo="Dados da proposta" />
          <CardBody>
            <form action={gravarCampos} className="space-y-3">
              <Input name="titulo" rotulo="Título" defaultValue={p.titulo} disabled={travada} />
              <Select name="empresa_id" rotulo="Empresa" defaultValue={p.empresa_id ?? ''} disabled={travada}>
                <option value="">Sem empresa</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </Select>
              <Input name="validade" rotulo="Válida até" type="date"
                defaultValue={p.validade ?? ''} disabled={travada} />
              <Textarea name="contexto" rotulo="O que entendemos do negócio"
                defaultValue={p.contexto ?? ''} disabled={travada}
                dica="Use as palavras do cliente. É o parágrafo que faz ele se reconhecer." />
              <Textarea name="escopo" rotulo="O que propomos"
                defaultValue={p.escopo ?? ''} disabled={travada} />
              <Textarea name="condicoes" rotulo="Condições"
                defaultValue={p.condicoes ?? ''} disabled={travada} />
              {!travada && (
                <Button type="submit" tamanho="sm" carregando={salvando} className="w-full">
                  Salvar
                </Button>
              )}
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function FormItem({
  item,
  salvando,
  aoEnviar,
  aoCancelar,
}: {
  item?: ItemProposta
  salvando: boolean
  aoEnviar: (form: FormData, item?: ItemProposta) => void
  aoCancelar: () => void
}) {
  return (
    <form action={f => aoEnviar(f, item)} className="grid gap-3 sm:grid-cols-2">
      <Input name="descricao" rotulo="Item" defaultValue={item?.descricao}
        placeholder="Módulo de agendamento" className="sm:col-span-2" />
      <Textarea name="detalhe" rotulo="Detalhe" defaultValue={item?.detalhe ?? ''}
        className="sm:col-span-2" dica="Vira o entregável da fase no projeto." />
      <Input name="quantidade" rotulo="Quantidade" inputMode="decimal"
        defaultValue={item?.quantidade ?? 1} />
      <Input name="valor_unit" rotulo="Valor unitário" inputMode="decimal"
        defaultValue={item ? String(item.valor_unit).replace('.', ',') : ''} placeholder="0,00" />
      <Select name="cobranca" rotulo="Cobrança" defaultValue={item?.cobranca ?? 'unico'}>
        <option value="unico">Valor único</option>
        <option value="mensal">Mensal</option>
      </Select>
      <Input name="horas_est" rotulo="Horas estimadas" inputMode="decimal"
        defaultValue={item?.horas_est ?? ''} />
      <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
        <input type="checkbox" name="opcional" defaultChecked={item?.opcional} className="accent-accent" />
        Opcional — aparece na proposta mas fica fora do total
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" tamanho="sm" carregando={salvando}>Salvar item</Button>
        <Button type="button" tamanho="sm" variante="fantasma" onClick={aoCancelar}>Cancelar</Button>
      </div>
    </form>
  )
}
