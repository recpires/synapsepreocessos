'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast, confirmar } from '@/components/Feedback'
import { resolverPendencias } from '@/server/financeiro'

type Pendencia = {
  id: string; data: string; descricao: string; categoria: string; valor: number
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dataBR = (iso: string) => iso.split('-').reverse().join('/')

/**
 * Fila do que venceu e ninguém confirmou.
 *
 * Existe porque tirar a previsão vencida do resultado só é honesto se ela
 * aparecer em algum lugar — senão a correção vira sumiço. Foi o caso do Barber
 * Pro: três parcelas criadas de uma vez, duas viraram "realizado" sozinhas e
 * inflaram o resultado em R$ 4.500 até alguém reparar.
 */
export function AConfirmar({ pendencias }: { pendencias: Pendencia[] }) {
  const router = useRouter()
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [processando, iniciar] = useTransition()

  if (pendencias.length === 0) return null

  const total = pendencias.reduce((a, p) => a + p.valor, 0)
  const alvo = marcados.size > 0 ? [...marcados] : pendencias.map(p => p.id)
  const rotulo = marcados.size > 0 ? `${marcados.size} selecionada(s)` : 'todas'

  function alternar(id: string) {
    setMarcados(atual => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  async function resolver(acao: 'confirmar' | 'apagar') {
    if (acao === 'apagar') {
      const ok = await confirmar({
        titulo: `Apagar ${rotulo}?`,
        mensagem:
          'Use quando a cobrança não vai acontecer — assinatura encerrada, serviço ' +
          'cancelado. A linha era previsão e nunca virou despesa, então some sem ' +
          'deixar buraco no histórico.',
        confirmLabel: 'Apagar',
        perigoso: true,
      })
      if (!ok) return
    }
    iniciar(async () => {
      const r = await resolverPendencias(alvo, acao)
      if (!r.ok) { toast.error(r.error ?? 'Não foi possível concluir.'); return }
      toast.success(
        acao === 'confirmar'
          ? `${r.linhas} lançamento(s) confirmado(s).`
          : `${r.linhas} previsão(ões) apagada(s).`
      )
      setMarcados(new Set())
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-500">
        ⏳ {pendencias.length} previsão(ões) venceram sem confirmação · {brl(total)}
      </p>
      <p className="mb-3 text-xs text-amber-600/90">
        A recorrência gera estas linhas com antecedência. Elas <strong>não</strong> entram no
        resultado enquanto ninguém disser que o dinheiro saiu — confirme o que pagou, apague o
        que não vai acontecer.
      </p>

      <ul className="mb-3 space-y-1">
        {pendencias.slice(0, 12).map(p => (
          <li key={p.id} className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={marcados.has(p.id)}
              onChange={() => alternar(p.id)}
              className="accent-violet-600"
            />
            <span className="tabular text-gray-500">{dataBR(p.data)}</span>
            <span className="min-w-0 flex-1 truncate text-gray-300">{p.descricao}</span>
            <span className="text-gray-600">{p.categoria}</span>
            <span className="tabular text-gray-300">{brl(p.valor)}</span>
          </li>
        ))}
        {pendencias.length > 12 && (
          <li className="text-[11px] text-amber-600/80">
            e mais {pendencias.length - 12} — a ação vale para todas se nada estiver marcado.
          </li>
        )}
      </ul>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={processando}
          onClick={() => resolver('confirmar')}
          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
        >
          Confirmar {rotulo}
        </button>
        <button
          type="button"
          disabled={processando}
          onClick={() => resolver('apagar')}
          className="rounded-lg bg-[#1a1a24] px-3 py-1.5 text-xs text-gray-400 transition-colors hover:text-red-400 disabled:opacity-50"
        >
          Apagar {rotulo}
        </button>
      </div>
    </div>
  )
}
