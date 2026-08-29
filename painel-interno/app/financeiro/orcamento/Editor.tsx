'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Badge, Button, Card, CardBody, Metrica, Tabela, Th, Td, Tr } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { salvarOrcamento, type Orcamento } from '@/server/orcamento'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** Estouro só é vermelho quando passou; até 90% é verde, entre 90 e 100 é aviso. */
function tomDoConsumo(consumo: number | null): 'ok' | 'atencao' | 'critico' | 'neutro' {
  if (consumo === null) return 'neutro'
  if (consumo > 100) return 'critico'
  if (consumo >= 90) return 'atencao'
  return 'ok'
}

export function Editor({
  orcamento,
  sugestao,
}: {
  orcamento: Orcamento
  sugestao: { categoria: string; media: number }[]
}) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [salvando, iniciar] = useTransition()
  const [rascunho, setRascunho] = useState<Record<string, number>>(() =>
    Object.fromEntries(orcamento.linhas.map(l => [l.categoria, l.previsto]))
  )

  const media = useMemo(
    () => new Map(sugestao.map(s => [s.categoria, s.media])),
    [sugestao]
  )

  // Categorias que aparecem no histórico mas ainda não estão no mês.
  const extras = sugestao
    .map(s => s.categoria)
    .filter(c => !orcamento.linhas.some(l => l.categoria === c))

  const categorias = [...orcamento.linhas.map(l => l.categoria), ...extras]

  const previstoRascunho = Object.values(rascunho).reduce((a, v) => a + (v || 0), 0)
  const saldo = previstoRascunho - orcamento.totalRealizado

  function trocarMes(delta: number) {
    let ano = orcamento.ano
    let mes = orcamento.mes + delta
    if (mes < 1) { mes = 12; ano-- }
    if (mes > 12) { mes = 1; ano++ }
    router.push(`/financeiro/orcamento?ano=${ano}&mes=${mes}`)
  }

  function usarMedia() {
    setRascunho(r => {
      const novo = { ...r }
      for (const c of categorias) {
        const m = media.get(c)
        if (m) novo[c] = m
      }
      return novo
    })
    toast.info('Preenchido com a média dos 3 meses fechados. Ajuste antes de salvar.')
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarOrcamento(
        orcamento.ano,
        orcamento.mes,
        categorias.map(c => ({ categoria: c, valor_previsto: rascunho[c] ?? 0 }))
      )
      if (r.ok) {
        toast.success('Orçamento salvo.')
        setEditando(false)
        router.refresh()
      } else {
        toast.error(r.error ?? 'Não foi possível salvar o orçamento.')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button tamanho="sm" variante="secundario" onClick={() => trocarMes(-1)} aria-label="Mês anterior">←</Button>
          <span className="min-w-40 px-2 text-center text-sm font-medium text-fg">
            {MESES[orcamento.mes - 1]} de {orcamento.ano}
          </span>
          <Button tamanho="sm" variante="secundario" onClick={() => trocarMes(1)} aria-label="Próximo mês">→</Button>
        </div>

        <div className="ml-auto flex gap-2">
          {editando && (
            <Button tamanho="sm" variante="fantasma" onClick={usarMedia}>
              Usar média de 3 meses
            </Button>
          )}
          <Button
            tamanho="sm"
            variante={editando ? 'secundario' : 'primario'}
            onClick={() => setEditando(v => !v)}
          >
            {editando ? 'Cancelar' : 'Editar previsto'}
          </Button>
          {editando && (
            <Button tamanho="sm" carregando={salvando} onClick={salvar}>Salvar</Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metrica rotulo="Previsto" valor={brl(editando ? previstoRascunho : orcamento.totalPrevisto)} />
        <Metrica rotulo="Realizado" valor={brl(orcamento.totalRealizado)} />
        <Metrica
          rotulo={saldo >= 0 ? 'Folga' : 'Estouro'}
          valor={brl(Math.abs(saldo))}
          detalhe={
            orcamento.totalPrevisto === 0 && !editando
              ? 'Nada orçado neste mês'
              : saldo >= 0 ? 'Dentro do previsto' : 'Acima do previsto'
          }
        />
      </div>

      {orcamento.semPrevisao.length > 0 && !editando && (
        <Card>
          <CardBody className="text-sm text-muted">
            Gastou sem orçar em:{' '}
            <span className="text-fg">{orcamento.semPrevisao.join(', ')}</span>. Um previsto
            nessas categorias faz o desvio significar alguma coisa.
          </CardBody>
        </Card>
      )}

      <Tabela>
        <thead>
          <tr>
            <Th>Categoria</Th>
            <Th numerica>Previsto</Th>
            <Th numerica>Realizado</Th>
            <Th numerica>Desvio</Th>
            <Th>Consumo</Th>
          </tr>
        </thead>
        <tbody>
          {categorias.map(categoria => {
            const linha = orcamento.linhas.find(l => l.categoria === categoria)
            const realizado = linha?.realizado ?? 0
            const previsto = editando ? (rascunho[categoria] ?? 0) : (linha?.previsto ?? 0)
            const desvio = Math.round((realizado - previsto) * 100) / 100
            const consumo = previsto > 0 ? Math.round((realizado / previsto) * 100) : null

            return (
              <Tr key={categoria}>
                <Td>
                  {categoria}
                  {media.get(categoria) !== undefined && editando && (
                    <span className="tabular ml-2 text-[11px] text-subtle">
                      média {brl(media.get(categoria)!)}
                    </span>
                  )}
                </Td>
                <Td numerica>
                  {editando ? (
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={rascunho[categoria] ?? 0}
                      onChange={e => setRascunho(r => ({ ...r, [categoria]: Number(e.target.value) }))}
                      aria-label={`Previsto para ${categoria}`}
                      className="tabular w-28 rounded-token border border-line-strong bg-ground px-2 py-1 text-right text-sm text-fg focus:border-accent focus:outline-none"
                    />
                  ) : previsto > 0 ? brl(previsto) : <span className="text-subtle">—</span>}
                </Td>
                <Td numerica>{realizado > 0 ? brl(realizado) : <span className="text-subtle">—</span>}</Td>
                <Td numerica className={cn(desvio > 0 && previsto > 0 && 'text-crit', desvio < 0 && 'text-ok')}>
                  {previsto > 0 ? `${desvio > 0 ? '+' : ''}${brl(desvio)}` : '—'}
                </Td>
                <Td>
                  {consumo === null ? (
                    <span className="text-subtle">—</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
                        <span
                          className={cn(
                            'block h-full',
                            consumo > 100 ? 'bg-crit' : consumo >= 90 ? 'bg-warn' : 'bg-ok'
                          )}
                          style={{ width: `${Math.min(consumo, 100)}%` }}
                        />
                      </span>
                      <Badge tom={tomDoConsumo(consumo)} className="px-1.5 py-0 text-[10px]">
                        {consumo}%
                      </Badge>
                    </span>
                  )}
                </Td>
              </Tr>
            )
          })}
        </tbody>
      </Tabela>
    </div>
  )
}
