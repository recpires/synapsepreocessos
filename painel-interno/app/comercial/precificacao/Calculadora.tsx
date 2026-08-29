'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Badge, Button, Card, CardHeader, CardBody, Input, Select, Metrica } from '@/components/ui'
import { toast, confirmar } from '@/components/Feedback'
import { salvarSimulacao, removerSimulacao, type SimulacaoSalva } from '@/server/precificacao'
import { calcular, ENTRADAS_PADRAO, CAMPOS, type Entradas } from '@/types/precificacao'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const brl0 = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

/** Projeção de MRR em SVG — três cenários na mesma escala. */
function Projecao({ dados }: { dados: ReturnType<typeof calcular>['mrrProjetado'] }) {
  const maximo = Math.max(...dados.map(d => d.otimista), 1)
  const L = 520, A = 150, base = A - 20

  const linha = (chave: 'pessimista' | 'base' | 'otimista') =>
    dados
      .map((d, i) => `${(i / (dados.length - 1)) * L},${base - (d[chave] / maximo) * base}`)
      .join(' ')

  return (
    <div>
      <svg viewBox={`0 0 ${L} ${A}`} className="w-full" role="img"
        aria-label="Projeção de MRR em 12 meses nos três cenários">
        {[0, 0.5, 1].map(f => (
          <line key={f} x1="0" x2={L} y1={base - base * f} y2={base - base * f}
            stroke="currentColor" opacity="0.12" />
        ))}
        <polyline points={linha('otimista')} fill="none" className="stroke-ok" strokeWidth="2" />
        <polyline points={linha('base')} fill="none" className="stroke-accent" strokeWidth="2.5" />
        <polyline points={linha('pessimista')} fill="none" className="stroke-warn" strokeWidth="2"
          strokeDasharray="4 3" />
        <text x="0" y={A - 4} className="fill-current text-[10px]" opacity="0.6">mês 1</text>
        <text x={L} y={A - 4} textAnchor="end" className="fill-current text-[10px]" opacity="0.6">mês 12</text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-subtle">
        <span><span className="mr-1 inline-block h-2 w-3 rounded-sm bg-ok" />Otimista {brl0(dados[11].otimista)}</span>
        <span><span className="mr-1 inline-block h-2 w-3 rounded-sm bg-accent" />Base {brl0(dados[11].base)}</span>
        <span><span className="mr-1 inline-block h-2 w-3 rounded-sm bg-warn" />Pessimista {brl0(dados[11].pessimista)}</span>
      </div>
    </div>
  )
}

export function Calculadora({
  simulacoes,
  produtos,
}: {
  simulacoes: SimulacaoSalva[]
  produtos: { id: string; nome: string }[]
}) {
  const router = useRouter()
  const [e, setE] = useState<Entradas>(ENTRADAS_PADRAO)
  const [nome, setNome] = useState('')
  const [produtoId, setProdutoId] = useState('')
  const [carregada, setCarregada] = useState<string | null>(null)
  const [salvando, iniciar] = useTransition()

  const r = useMemo(() => calcular(e), [e])
  const plano = r.planos.find(p => p.destaque)!

  function campo(chave: keyof Entradas, valor: string) {
    const n = Number(valor.replace(',', '.'))
    setE(atual => ({ ...atual, [chave]: Number.isFinite(n) ? n : 0 }))
  }

  function carregar(s: SimulacaoSalva) {
    setE({ ...ENTRADAS_PADRAO, ...s.entradas })
    setNome(s.nome)
    setProdutoId(s.produto_id ?? '')
    setCarregada(s.id)
    toast.info(`Simulação "${s.nome}" carregada.`)
  }

  function salvar() {
    if (!nome.trim()) {
      toast.error('Dê um nome à simulação antes de salvar.')
      return
    }
    iniciar(async () => {
      const res = await salvarSimulacao({
        id: carregada ?? undefined,
        nome,
        produto_id: produtoId || null,
        entradas: e,
      })
      if (res.ok) {
        toast.success(carregada ? 'Simulação atualizada.' : 'Simulação salva.')
        router.refresh()
      } else {
        toast.error(res.error ?? 'Não foi possível salvar.')
      }
    })
  }

  async function remover(s: SimulacaoSalva) {
    const ok = await confirmar({
      titulo: 'Remover simulação',
      mensagem: `"${s.nome}" será apagada.`,
      confirmLabel: 'Remover',
      perigoso: true,
    })
    if (!ok) return
    iniciar(async () => {
      const res = await removerSimulacao(s.id)
      if (res.ok) {
        toast.success('Simulação removida.')
        if (carregada === s.id) setCarregada(null)
        router.refresh()
      } else {
        toast.error(res.error ?? 'Não foi possível remover.')
      }
    })
  }

  const ltvSaudavel = r.ltvSobreCac !== null && r.ltvSobreCac >= 3

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* ── Entradas ── */}
      <div className="space-y-4">
        <Card>
          <CardHeader titulo="Premissas" descricao="Mexa e veja o preço mudar." />
          <CardBody className="space-y-3">
            {CAMPOS.map(c => (
              <div key={c.chave}>
                <label className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-sm text-muted" title={c.ajuda}>{c.rotulo}</span>
                  {c.sufixo && <span className="text-[11px] text-subtle">{c.sufixo}</span>}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0}
                  value={e[c.chave]}
                  onChange={ev => campo(c.chave, ev.target.value)}
                  aria-label={c.rotulo}
                  className="tabular w-full rounded-token border border-line-strong bg-ground px-3 py-1.5 text-right text-sm text-fg focus:border-accent focus:outline-none"
                />
                <p className="mt-0.5 text-[11px] text-subtle">{c.ajuda}</p>
              </div>
            ))}
            <Button tamanho="sm" variante="fantasma" onClick={() => { setE(ENTRADAS_PADRAO); setCarregada(null) }}>
              Voltar ao padrão
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader titulo="Salvar cenário" />
          <CardBody className="space-y-3">
            <Input rotulo="Nome" value={nome} onChange={ev => setNome(ev.target.value)}
              placeholder="Nero Barber — 2027" />
            <Select rotulo="Produto" value={produtoId} onChange={ev => setProdutoId(ev.target.value)}>
              <option value="">Sem produto</option>
              {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </Select>
            <Button tamanho="sm" carregando={salvando} onClick={salvar} className="w-full">
              {carregada ? 'Atualizar simulação' : 'Salvar simulação'}
            </Button>
          </CardBody>
        </Card>

        {simulacoes.length > 0 && (
          <Card>
            <CardHeader titulo="Salvas" />
            <CardBody>
              <ul className="divide-y divide-line">
                {simulacoes.map(s => (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-2 first:pt-0">
                    <button type="button" onClick={() => carregar(s)} className="min-w-0 text-left">
                      <span className={cn('block truncate text-sm', carregada === s.id ? 'text-accent' : 'text-fg')}>
                        {s.nome}
                      </span>
                      {s.produto_nome && <span className="block text-[11px] text-subtle">{s.produto_nome}</span>}
                    </button>
                    <Button tamanho="sm" variante="fantasma" onClick={() => remover(s)}>Remover</Button>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>

      {/* ── Resultado ── */}
      <div className="min-w-0 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metrica rotulo="Custo por cliente" valor={brl(r.custoTotalCliente)}
            detalhe={`${brl(r.custoVariavel)} variável + ${brl(r.custoFixoRateado)} rateado`} />
          <Metrica rotulo="Preço mínimo" valor={brl(r.precoMinimo)}
            detalhe={`Para margem de ${e.margemAlvo}%`} />
          <Metrica rotulo="LTV" valor={r.ltv !== null ? brl(r.ltv) : '—'}
            detalhe={r.vidaMediaMeses !== null ? `${r.vidaMediaMeses.toFixed(1)} meses de vida média` : 'Sem churn informado'} />
          <Metrica rotulo="Equilíbrio" valor={r.breakEvenClientes !== null ? `${r.breakEvenClientes} clientes` : '—'}
            detalhe="Para cobrir o custo fixo" />
        </div>

        <Card>
          <CardHeader
            titulo="Três planos"
            descricao="O do meio é o que se quer vender — os outros dois existem para ancorar."
          />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-3">
              {r.planos.map(p => (
                <div
                  key={p.nome}
                  className={cn(
                    'rounded-token border p-4 text-center',
                    p.destaque ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2'
                  )}
                >
                  <div className="text-xs font-medium uppercase tracking-wide text-subtle">{p.nome}</div>
                  <div className={cn('tabular mt-1 text-2xl font-semibold',
                    p.destaque ? 'text-accent-text' : 'text-fg')}>
                    {brl0(p.preco)}
                  </div>
                  <div className="text-[11px] text-subtle">por mês</div>
                  <div className="tabular mt-2 border-t border-line pt-2 text-xs text-muted">
                    {brl0(p.anual)}/ano
                  </div>
                  <div className="text-[11px] text-subtle">2 meses de desconto</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader titulo="Saúde da unidade" />
            <CardBody>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">LTV / CAC</dt>
                  <dd className="flex items-center gap-2">
                    <span className="tabular text-fg">
                      {r.ltvSobreCac !== null ? `${r.ltvSobreCac.toFixed(1)}×` : '—'}
                    </span>
                    {r.ltvSobreCac !== null && (
                      <Badge tom={ltvSaudavel ? 'ok' : 'atencao'} className="px-1.5 py-0 text-[10px]">
                        {ltvSaudavel ? 'saudável' : 'abaixo de 3×'}
                      </Badge>
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">Payback do CAC</dt>
                  <dd className="tabular text-fg">
                    {r.paybackMeses !== null ? `${r.paybackMeses.toFixed(1)} meses` : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">Margem por cliente</dt>
                  <dd className="tabular text-fg">{brl(plano.preco - r.custoVariavel)}</dd>
                </div>
              </dl>
              <p className="mt-3 border-t border-line pt-3 text-xs text-subtle">
                A referência de mercado é LTV pelo menos 3× o CAC e payback abaixo de 12 meses.
                Abaixo disso, cada cliente novo aperta o caixa antes de ajudar.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader titulo="MRR em 12 meses" descricao="Com o plano do meio e o churn informado." />
            <CardBody><Projecao dados={r.mrrProjetado} /></CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
