'use client'

import { useState } from 'react'
import {
  Card, CardHeader, CardBody, Input, Metrica, Tabela, Th, Td, Tr, Button,
} from '@/components/ui'
import {
  calcularServicos, PREMISSAS_PADRAO,
  SERVICOS_PADRAO, PRODUTOS_PADRAO, EVENTOS_PADRAO,
  type Premissas, type ItemServico, type ItemProduto, type ItemEvento,
} from '@/types/precificacao-servicos'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (v: number) => `${Math.round(v * 100)}%`

/** Campo numérico compacto para dentro de tabela. */
function Num({
  valor, onChange, largura = 'w-20',
}: { valor: number; onChange: (n: number) => void; largura?: string }) {
  return (
    <input
      type="number"
      value={valor}
      onChange={e => onChange(Number(e.target.value) || 0)}
      className={`${largura} rounded border border-line-strong bg-surface-2 px-2 py-1 text-right text-sm tabular text-fg focus:border-accent focus:outline-none`}
    />
  )
}

/**
 * Precificação de serviço, revenda e evento.
 *
 * Três blocos porque são três lógicas: serviço custa tempo, produto custa
 * compra mais frete, evento rateia um custo fixo entre inscritos. O que os une
 * é a fórmula do preço — custo dividido pelo que sobra depois de margem e
 * imposto.
 */
export function Servicos() {
  const [p, setP] = useState<Premissas>(PREMISSAS_PADRAO)
  const [servicos, setServicos] = useState<ItemServico[]>(SERVICOS_PADRAO)
  const [produtos, setProdutos] = useState<ItemProduto[]>(PRODUTOS_PADRAO)
  const [eventos, setEventos] = useState<ItemEvento[]>(EVENTOS_PADRAO)

  const r = calcularServicos(p, servicos, produtos, eventos)

  const mudarPremissa = (k: keyof Premissas, v: number) => setP(a => ({ ...a, [k]: v }))
  const mudar = <T,>(
    lista: T[], set: (v: T[]) => void, i: number, campo: keyof T, valor: T[keyof T]
  ) => set(lista.map((item, j) => (j === i ? { ...item, [campo]: valor } : item)))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          titulo="Premissas"
          descricao="Valem para todos os blocos. O rateio do fixo entra no custo de cada serviço."
        />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              rotulo="Mão de obra" type="number" value={p.custoHora}
              onChange={e => mudarPremissa('custoHora', Number(e.target.value) || 0)}
              dica="R$ por hora de quem executa."
            />
            <Input
              rotulo="Custo fixo mensal" type="number" value={p.custoFixoMensal}
              onChange={e => mudarPremissa('custoFixoMensal', Number(e.target.value) || 0)}
              dica="Aluguel, contas, o que não muda com o movimento."
            />
            <Input
              rotulo="Atendimentos/mês" type="number" value={p.atendimentosMes}
              onChange={e => mudarPremissa('atendimentosMes', Number(e.target.value) || 0)}
              dica="Divide o fixo. Chutar para cima barateia o preço na conta."
            />
            <Input
              rotulo="Simples — serviço %" type="number" step="0.01" value={p.aliquotaServicos}
              onChange={e => mudarPremissa('aliquotaServicos', Number(e.target.value) || 0)}
              dica="Anexo III ou V."
            />
            <Input
              rotulo="Simples — comércio %" type="number" step="0.01" value={p.aliquotaComercio}
              onChange={e => mudarPremissa('aliquotaComercio', Number(e.target.value) || 0)}
              dica="Anexo I, para revenda."
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metrica
              rotulo="Custo fixo por atendimento"
              valor={brl(r.custoFixoRateado)}
              detalhe={`${brl(p.custoFixoMensal)} ÷ ${p.atendimentosMes}`}
            />
            <Metrica
              rotulo="Serviços precificados"
              valor={String(r.servicos.length)}
              detalhe={r.servicos.length ? `de ${brl(Math.min(...r.servicos.map(s => s.preco)))} a ${brl(Math.max(...r.servicos.map(s => s.preco)))}` : '—'}
            />
            <Metrica
              rotulo="Receita dos eventos"
              valor={brl(r.eventos.reduce((a, e) => a + e.receitaTotal, 0))}
              detalhe={`${r.eventos.length} evento(s) lotado(s)`}
            />
          </div>
        </CardBody>
      </Card>

      {/* ── Serviços ── */}
      <Card>
        <CardHeader
          titulo="Serviços"
          descricao="O preço cobre a hora trabalhada, o insumo e a fatia do aluguel."
          acao={
            <Button
              tamanho="sm" variante="secundario"
              onClick={() => setServicos([...servicos, { nome: 'Novo serviço', minutos: 30, materiais: 0, margem: 35 }])}
            >
              + Serviço
            </Button>
          }
        />
        <CardBody className="p-0">
          <Tabela>
            <thead>
              <tr>
                <Th>Serviço</Th>
                <Th numerica>Min</Th>
                <Th numerica>Insumos</Th>
                <Th numerica>Margem %</Th>
                <Th numerica>Custo</Th>
                <Th numerica>Preço</Th>
                <Th numerica>Markup</Th>
                <Th numerica>Sobra</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((s, i) => {
                const linha = r.servicos[i]
                return (
                  <Tr key={i}>
                    <Td>
                      <input
                        value={s.nome}
                        onChange={e => mudar(servicos, setServicos, i, 'nome', e.target.value)}
                        className="w-40 rounded border border-line-strong bg-surface-2 px-2 py-1 text-sm text-fg focus:border-accent focus:outline-none"
                      />
                    </Td>
                    <Td numerica><Num valor={s.minutos} largura="w-16"
                      onChange={v => mudar(servicos, setServicos, i, 'minutos', v)} /></Td>
                    <Td numerica><Num valor={s.materiais}
                      onChange={v => mudar(servicos, setServicos, i, 'materiais', v)} /></Td>
                    <Td numerica><Num valor={s.margem} largura="w-16"
                      onChange={v => mudar(servicos, setServicos, i, 'margem', v)} /></Td>
                    <Td numerica title={`${brl(linha.custoMaoObra)} mão de obra + ${brl(linha.custoMateriais)} insumo + ${brl(linha.custoFixoRateado)} rateio`}>
                      {brl(linha.custoTotal)}
                    </Td>
                    <Td numerica className="font-semibold">{brl(linha.preco)}</Td>
                    <Td numerica>{pct(linha.markup)}</Td>
                    <Td numerica>
                      <span className={linha.lucro < 0 ? 'text-crit' : 'text-ok'}>{brl(linha.lucro)}</span>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => setServicos(servicos.filter((_, j) => j !== i))}
                        className="text-xs text-subtle transition-colors hover:text-crit"
                      >
                        remover
                      </button>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Tabela>
        </CardBody>
      </Card>

      {/* ── Revenda ── */}
      <Card>
        <CardHeader
          titulo="Revenda de produtos"
          descricao="O imposto da compra entra no custo; o da venda, no preço. São impostos diferentes."
          acao={
            <Button
              tamanho="sm" variante="secundario"
              onClick={() => setProdutos([...produtos, { nome: 'Novo produto', aquisicao: 0, frete: 0, impostoCompra: 8, margem: 40 }])}
            >
              + Produto
            </Button>
          }
        />
        <CardBody className="p-0">
          <Tabela>
            <thead>
              <tr>
                <Th>Produto</Th>
                <Th numerica>Compra</Th>
                <Th numerica>Frete</Th>
                <Th numerica>Imp. compra %</Th>
                <Th numerica>Margem %</Th>
                <Th numerica>Custo</Th>
                <Th numerica>Preço</Th>
                <Th numerica>Markup</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((x, i) => {
                const linha = r.produtos[i]
                return (
                  <Tr key={i}>
                    <Td>
                      <input
                        value={x.nome}
                        onChange={e => mudar(produtos, setProdutos, i, 'nome', e.target.value)}
                        className="w-44 rounded border border-line-strong bg-surface-2 px-2 py-1 text-sm text-fg focus:border-accent focus:outline-none"
                      />
                    </Td>
                    <Td numerica><Num valor={x.aquisicao}
                      onChange={v => mudar(produtos, setProdutos, i, 'aquisicao', v)} /></Td>
                    <Td numerica><Num valor={x.frete} largura="w-16"
                      onChange={v => mudar(produtos, setProdutos, i, 'frete', v)} /></Td>
                    <Td numerica><Num valor={x.impostoCompra} largura="w-16"
                      onChange={v => mudar(produtos, setProdutos, i, 'impostoCompra', v)} /></Td>
                    <Td numerica><Num valor={x.margem} largura="w-16"
                      onChange={v => mudar(produtos, setProdutos, i, 'margem', v)} /></Td>
                    <Td numerica>{brl(linha.custoUnitario)}</Td>
                    <Td numerica className="font-semibold">{brl(linha.preco)}</Td>
                    <Td numerica>{pct(linha.markup)}</Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => setProdutos(produtos.filter((_, j) => j !== i))}
                        className="text-xs text-subtle transition-colors hover:text-crit"
                      >
                        remover
                      </button>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Tabela>
        </CardBody>
      </Card>

      {/* ── Eventos ── */}
      <Card>
        <CardHeader
          titulo="Eventos e workshops"
          descricao="O custo fixo do evento se dilui entre os inscritos — por isso o preço cai quando a turma cresce."
          acao={
            <Button
              tamanho="sm" variante="secundario"
              onClick={() => setEventos([...eventos, { nome: 'Novo evento', custoFixo: 0, materialPorParticipante: 0, participantes: 10, margem: 40 }])}
            >
              + Evento
            </Button>
          }
        />
        <CardBody className="p-0">
          <Tabela>
            <thead>
              <tr>
                <Th>Evento</Th>
                <Th numerica>Custo fixo</Th>
                <Th numerica>Material/pessoa</Th>
                <Th numerica>Inscritos</Th>
                <Th numerica>Margem %</Th>
                <Th numerica>Custo/pessoa</Th>
                <Th numerica>Preço</Th>
                <Th numerica>Receita</Th>
                <Th numerica>Sobra</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((ev, i) => {
                const linha = r.eventos[i]
                return (
                  <Tr key={i}>
                    <Td>
                      <input
                        value={ev.nome}
                        onChange={e => mudar(eventos, setEventos, i, 'nome', e.target.value)}
                        className="w-48 rounded border border-line-strong bg-surface-2 px-2 py-1 text-sm text-fg focus:border-accent focus:outline-none"
                      />
                    </Td>
                    <Td numerica><Num valor={ev.custoFixo}
                      onChange={v => mudar(eventos, setEventos, i, 'custoFixo', v)} /></Td>
                    <Td numerica><Num valor={ev.materialPorParticipante}
                      onChange={v => mudar(eventos, setEventos, i, 'materialPorParticipante', v)} /></Td>
                    <Td numerica><Num valor={ev.participantes} largura="w-16"
                      onChange={v => mudar(eventos, setEventos, i, 'participantes', v)} /></Td>
                    <Td numerica><Num valor={ev.margem} largura="w-16"
                      onChange={v => mudar(eventos, setEventos, i, 'margem', v)} /></Td>
                    <Td numerica>{brl(linha.custoPorParticipante)}</Td>
                    <Td numerica className="font-semibold">{brl(linha.precoPorParticipante)}</Td>
                    <Td numerica>{brl(linha.receitaTotal)}</Td>
                    <Td numerica>
                      <span className={linha.lucroTotal < 0 ? 'text-crit' : 'text-ok'}>
                        {brl(linha.lucroTotal)}
                      </span>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => setEventos(eventos.filter((_, j) => j !== i))}
                        className="text-xs text-subtle transition-colors hover:text-crit"
                      >
                        remover
                      </button>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Tabela>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="text-xs text-subtle">
          <strong className="text-muted">Preço = custo ÷ (1 − margem − alíquota).</strong>{' '}
          É margem sobre o preço de venda, não sobre o custo — por isso o markup ao lado costuma
          ser bem maior que a margem. Imposto entra no divisor porque incide sobre o que o cliente
          paga, não sobre o que você gastou. As alíquotas são estimativas de faixa: confirme o
          enquadramento e o efetivo com a contabilidade antes de fechar tabela de preço.
        </CardBody>
      </Card>
    </div>
  )
}
