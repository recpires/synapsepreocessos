'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Badge, Button, Input, Select } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { salvarImposto, marcarImpostoPago, type Imposto } from '@/server/caixa'
import { TIPOS_IMPOSTO } from '@/types/caixa'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dia = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

const MES_ANO = (d: string) => {
  const [a, m] = d.split('-').map(Number)
  return `${String(m).padStart(2, '0')}/${a}`
}

function diasAte(iso: string) {
  const hoje = new Date()
  const zero = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate())
  const [a, m, d] = iso.split('-').map(Number)
  return Math.round((Date.UTC(a, m - 1, d) - zero) / 86_400_000)
}

export function Impostos({ impostos }: { impostos: Imposto[] }) {
  const router = useRouter()
  const [novo, setNovo] = useState(false)
  const [mostrarPagos, setMostrarPagos] = useState(false)
  const [salvando, iniciar] = useTransition()

  const abertos = impostos.filter(i => !i.pago_em)
  const pagos = impostos.filter(i => i.pago_em)
  const visiveis = mostrarPagos ? [...abertos, ...pagos] : abertos

  function criar(form: FormData) {
    const bruto = String(form.get('valor') ?? '').replace(/\./g, '').replace(',', '.')
    iniciar(async () => {
      const r = await salvarImposto({
        // A competência é um mês; o dia 01 padroniza o armazenamento.
        competencia: `${String(form.get('competencia') ?? '')}-01`,
        tipo: String(form.get('tipo') ?? 'Outro'),
        valor: Number(bruto),
        vencimento: String(form.get('vencimento') ?? ''),
        observacao: String(form.get('observacao') ?? '') || undefined,
      })
      if (r.ok) {
        toast.success('Imposto registrado.')
        setNovo(false)
        router.refresh()
      } else {
        toast.error(r.error ?? 'Não foi possível registrar.')
      }
    })
  }

  function alternarPago(i: Imposto) {
    iniciar(async () => {
      const r = await marcarImpostoPago(i.id, !i.pago_em)
      if (r.ok) {
        toast.success(i.pago_em ? 'Baixa desfeita.' : 'Marcado como pago.')
        router.refresh()
      } else {
        toast.error(r.error ?? 'Não foi possível atualizar.')
      }
    })
  }

  return (
    <div className="space-y-3">
      {impostos.length === 0 && !novo && (
        <p className="text-sm text-subtle">
          Nenhum imposto registrado. DAS, ISS e DARE com vencimento aqui viram alerta antes
          de virar multa.
        </p>
      )}

      <ul className="space-y-2">
        {visiveis.map(i => {
          const dias = diasAte(i.vencimento)
          const vencido = !i.pago_em && dias < 0
          const proximo = !i.pago_em && dias >= 0 && dias <= 7
          return (
            <li
              key={i.id}
              className={cn(
                'flex flex-wrap items-center justify-between gap-2 rounded-token border p-3',
                vencido ? 'border-crit-line bg-crit-soft'
                  : proximo ? 'border-warn-line bg-warn-soft'
                  : 'border-line bg-surface-2',
                i.pago_em && 'opacity-60'
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-fg">{i.tipo}</span>
                <span className="block text-xs text-subtle">
                  competência {MES_ANO(i.competencia)} · vence {dia(i.vencimento)}
                </span>
                {i.observacao && <span className="block text-xs text-subtle">{i.observacao}</span>}
              </span>
              <span className="flex items-center gap-3">
                <span className="tabular text-sm font-medium text-fg">{brl(i.valor)}</span>
                {i.pago_em ? (
                  <Badge tom="ok" className="px-1.5 py-0 text-[10px]">pago {dia(i.pago_em)}</Badge>
                ) : (
                  <Badge tom={vencido ? 'critico' : proximo ? 'atencao' : 'neutro'}
                    className="px-1.5 py-0 text-[10px]">
                    {vencido ? `venceu há ${-dias}d` : `em ${dias}d`}
                  </Badge>
                )}
                <Button tamanho="sm" variante="fantasma" onClick={() => alternarPago(i)}>
                  {i.pago_em ? 'Desfazer' : 'Dar baixa'}
                </Button>
              </span>
            </li>
          )
        })}
      </ul>

      {pagos.length > 0 && (
        <button
          type="button"
          onClick={() => setMostrarPagos(v => !v)}
          className="text-xs text-accent hover:underline"
        >
          {mostrarPagos ? 'Ocultar pagos' : `Ver ${pagos.length} pago(s)`}
        </button>
      )}

      {novo ? (
        <form action={criar} className="grid gap-3 rounded-token bg-surface-2 p-3 sm:grid-cols-2">
          <Select name="tipo" rotulo="Tipo" defaultValue="DAS (Simples Nacional)">
            {TIPOS_IMPOSTO.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input name="valor" rotulo="Valor" inputMode="decimal" placeholder="0,00" />
          <Input name="competencia" rotulo="Competência" type="month" />
          <Input name="vencimento" rotulo="Vencimento" type="date" />
          <Input name="observacao" rotulo="Observação" className="sm:col-span-2" />
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" tamanho="sm" carregando={salvando}>Registrar</Button>
            <Button type="button" tamanho="sm" variante="fantasma" onClick={() => setNovo(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button tamanho="sm" variante="secundario" onClick={() => setNovo(true)} className="w-full">
          Novo imposto
        </Button>
      )}
    </div>
  )
}
