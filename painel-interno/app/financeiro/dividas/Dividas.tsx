'use client'

import { useState, useTransition } from 'react'
import {
  Button, Input, Select, Textarea, Badge, Vazio, Card, CardBody,
} from '@/components/ui'
import { toast, confirmar } from '@/components/Feedback'
import { criarDivida, pagarParcela, alterarStatusDivida } from '@/server/empresa-financeiro'
import {
  TIPOS_DIVIDA, TIPO_DIVIDA_LABEL, STATUS_DIVIDA_LABEL, gerarParcelas,
  type DividaResumo, type Parcela, type TipoDivida, type EmpresaPropria,
} from '@/types/empresa-financeiro'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const hoje = () => new Date().toISOString().slice(0, 10)
const dataBR = (iso: string) => iso.split('-').reverse().join('/')

type Props = {
  empresas: EmpresaPropria[]
  dividas: DividaResumo[]
  parcelas: Parcela[]
}

const VAZIO = {
  empresa_id: '', tipo: 'emprestimo' as TipoDivida, credor: '', descricao: '',
  documento: '', valor_principal: '', valor_total: '', taxa_juros_mes: '',
  parcelas_total: '12', data_contratacao: hoje(), primeiro_vencimento: hoje(),
  observacao: '',
}

export function Dividas({ empresas, dividas, parcelas }: Props) {
  const [aberto, setAberto] = useState(false)
  const [f, setF] = useState({ ...VAZIO, empresa_id: empresas[0]?.id ?? '' })
  const [expandida, setExpandida] = useState<string | null>(null)
  const [salvando, iniciar] = useTransition()

  const total = Number(f.valor_total) || 0
  const qtd = Math.max(1, Number(f.parcelas_total) || 1)
  // A prévia usa a mesma função que grava, então o que você vê é o carnê real,
  // sobra de arredondamento incluída.
  const previa = total > 0 ? gerarParcelas(total, qtd, f.primeiro_vencimento) : []

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    iniciar(async () => {
      const r = await criarDivida({
        empresa_id: f.empresa_id,
        tipo: f.tipo,
        credor: f.credor,
        descricao: f.descricao,
        documento: f.documento,
        valor_principal: Number(f.valor_principal) || 0,
        valor_total: total,
        taxa_juros_mes: f.taxa_juros_mes ? Number(f.taxa_juros_mes) : null,
        parcelas_total: qtd,
        data_contratacao: f.data_contratacao,
        primeiro_vencimento: f.primeiro_vencimento,
        observacao: f.observacao,
      })
      if (r.ok) {
        toast.success(`Dívida criada com ${qtd} parcela(s).`)
        setAberto(false)
        setF({ ...VAZIO, empresa_id: empresas[0]?.id ?? '' })
      } else toast.error(r.error ?? 'Não foi possível criar a dívida.')
    })
  }

  async function pagar(p: Parcela, d: DividaResumo) {
    const ok = await confirmar({
      titulo: `Pagar a parcela ${p.numero}/${d.parcelas_total}?`,
      mensagem:
        `${brl(p.valor)} de ${d.credor}, vencida em ${dataBR(p.vencimento)}. ` +
        'A parcela baixa e uma despesa é lançada na mesma data, na empresa da dívida — ' +
        'assim o dinheiro que saiu aparece no DRE uma vez só.',
      confirmLabel: 'Pagar e lançar despesa',
    })
    if (!ok) return

    const r = await pagarParcela({
      parcela_id: p.id,
      pago_em: hoje(),
      valor_pago: p.valor,
      lancar_despesa: true,
    })
    if (r.ok) toast.success('Parcela baixada e despesa lançada.')
    else toast.error(r.error ?? 'Não foi possível baixar a parcela.')
  }

  async function encerrar(d: DividaResumo) {
    const ok = await confirmar({
      titulo: `Cancelar a dívida de ${d.credor}?`,
      mensagem:
        'As parcelas em aberto somem dos vencimentos e do saldo devedor. ' +
        'O histórico continua gravado — use isto quando a dívida não existe mais, ' +
        'não para esconder o que ainda se deve.',
      confirmLabel: 'Cancelar dívida',
      perigoso: true,
    })
    if (!ok) return
    const r = await alterarStatusDivida(d.id, 'cancelada')
    if (r.ok) toast.success('Dívida cancelada.')
    else toast.error(r.error ?? 'Não foi possível cancelar.')
  }

  if (empresas.length === 0) {
    return (
      <Vazio
        titulo="Nenhuma empresa própria cadastrada"
        descricao="Toda dívida pertence a um CNPJ. Cadastre a empresa antes de lançar."
      />
    )
  }

  return (
    <div className="space-y-4">
      {!aberto && <Button onClick={() => setAberto(true)}>Lançar dívida</Button>}

      {aberto && (
        <Card>
          <CardBody>
            <form onSubmit={enviar} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Select
                  rotulo="Empresa" required value={f.empresa_id}
                  onChange={e => setF({ ...f, empresa_id: e.target.value })}
                >
                  {empresas.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.nome_fantasia || e.razao_social}
                    </option>
                  ))}
                </Select>
                <Select
                  rotulo="Tipo" value={f.tipo}
                  onChange={e => setF({ ...f, tipo: e.target.value as TipoDivida })}
                >
                  {TIPOS_DIVIDA.map(t => (
                    <option key={t} value={t}>{TIPO_DIVIDA_LABEL[t]}</option>
                  ))}
                </Select>
                <Input
                  rotulo="Credor" required value={f.credor}
                  onChange={e => setF({ ...f, credor: e.target.value })}
                  placeholder="Banco, fornecedor, Receita Federal…"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  rotulo="Descrição" value={f.descricao}
                  onChange={e => setF({ ...f, descricao: e.target.value })}
                />
                <Input
                  rotulo="Documento" value={f.documento}
                  onChange={e => setF({ ...f, documento: e.target.value })}
                  dica="Número do contrato ou do parcelamento."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <Input
                  rotulo="Principal" type="number" step="0.01" min="0"
                  value={f.valor_principal}
                  onChange={e => setF({ ...f, valor_principal: e.target.value })}
                  dica="Sem juros."
                />
                <Input
                  rotulo="Total a pagar" type="number" step="0.01" min="0" required
                  value={f.valor_total}
                  onChange={e => setF({ ...f, valor_total: e.target.value })}
                  dica="Com juros."
                />
                <Input
                  rotulo="Juros ao mês %" type="number" step="0.001" min="0"
                  value={f.taxa_juros_mes}
                  onChange={e => setF({ ...f, taxa_juros_mes: e.target.value })}
                />
                <Input
                  rotulo="Parcelas" type="number" min="1" required
                  value={f.parcelas_total}
                  onChange={e => setF({ ...f, parcelas_total: e.target.value })}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  rotulo="Contratação" type="date" required value={f.data_contratacao}
                  onChange={e => setF({ ...f, data_contratacao: e.target.value })}
                />
                <Input
                  rotulo="1º vencimento" type="date" required value={f.primeiro_vencimento}
                  onChange={e => setF({ ...f, primeiro_vencimento: e.target.value })}
                />
              </div>

              <Textarea
                rotulo="Observação" rows={2} value={f.observacao}
                onChange={e => setF({ ...f, observacao: e.target.value })}
              />

              {previa.length > 0 && (
                <p className="rounded-token bg-surface-2 px-3 py-2 text-xs text-subtle">
                  {previa.length} parcela(s) de {brl(previa[0].valor)}
                  {previa.length > 1 && previa[previa.length - 1].valor !== previa[0].valor && (
                    <> — a última de {brl(previa[previa.length - 1].valor)}, que absorve a sobra
                    do arredondamento</>
                  )}
                  , de {dataBR(previa[0].vencimento)} a{' '}
                  {dataBR(previa[previa.length - 1].vencimento)}.
                </p>
              )}

              <div className="flex gap-2">
                <Button type="submit" carregando={salvando}>Criar dívida e carnê</Button>
                <Button type="button" variante="fantasma" onClick={() => setAberto(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {dividas.length === 0 ? (
        <Vazio
          titulo="Nenhuma dívida lançada"
          descricao="Empréstimo, financiamento, compra e imposto parcelados e conta a pagar entram aqui — e as parcelas aparecem sozinhas na central de vencimentos."
        />
      ) : (
        <div className="space-y-3">
          {dividas.map(d => {
            const minhas = parcelas.filter(p => p.divida_id === d.id)
            const aberta = expandida === d.id
            return (
              <Card key={d.id} className={d.status !== 'ativa' ? 'opacity-70' : undefined}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-fg">{d.credor}</span>
                        <Badge tom="neutro">{TIPO_DIVIDA_LABEL[d.tipo]}</Badge>
                        {d.status !== 'ativa' && (
                          <Badge tom={d.status === 'quitada' ? 'ok' : 'neutro'}>
                            {STATUS_DIVIDA_LABEL[d.status]}
                          </Badge>
                        )}
                        {d.parcelas_atrasadas > 0 && (
                          <Badge tom="critico">{d.parcelas_atrasadas} atrasada(s)</Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-subtle">
                        {d.empresa_nome}
                        {d.descricao && <> · {d.descricao}</>}
                        {d.documento && <> · doc {d.documento}</>}
                        {d.proximo_vencimento && d.status === 'ativa' && (
                          <> · próxima em {dataBR(d.proximo_vencimento)}</>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="tabular text-sm font-semibold text-fg">
                        {brl(d.saldo_devedor)}
                      </div>
                      <div className="text-[11px] text-subtle">
                        de {brl(d.valor_total)} · {d.parcelas_abertas}/{d.parcelas_total} em aberto
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-3 border-t border-line pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setExpandida(aberta ? null : d.id)}
                      className="text-accent-text hover:underline"
                    >
                      {aberta ? 'esconder parcelas' : 'ver parcelas'}
                    </button>
                    {d.status === 'ativa' && (
                      <button
                        type="button"
                        onClick={() => encerrar(d)}
                        className="text-subtle transition-colors hover:text-crit"
                      >
                        cancelar dívida
                      </button>
                    )}
                  </div>

                  {aberta && (
                    <ul className="mt-3 space-y-1">
                      {minhas.map(p => {
                        const atrasada = !p.pago_em && p.vencimento < hoje()
                        return (
                          <li
                            key={p.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-token px-2 py-1.5 text-xs odd:bg-surface-2"
                          >
                            <span className="tabular text-muted">
                              {p.numero}/{d.parcelas_total} · {dataBR(p.vencimento)}
                            </span>
                            <span className="flex items-center gap-3">
                              <span className="tabular text-fg">{brl(p.valor)}</span>
                              {p.pago_em ? (
                                <Badge tom="ok" className="px-1.5 py-0 text-[10px]">
                                  pago em {dataBR(p.pago_em)}
                                </Badge>
                              ) : (
                                <>
                                  {atrasada && (
                                    <Badge tom="critico" className="px-1.5 py-0 text-[10px]">
                                      vencida
                                    </Badge>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => pagar(p, d)}
                                    className="text-accent-text hover:underline"
                                  >
                                    pagar
                                  </button>
                                </>
                              )}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
