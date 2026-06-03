'use client'

import { useEffect, useState } from 'react'

/* ──────────────────────────────────────────────────────────────────────────
   Toasts + Confirmação — store leve (event-based, sem provider/context).
   Use de qualquer lugar:
     import { toast, confirmar } from '@/components/Feedback'
     toast.success('Salvo!')
     if (await confirmar({ titulo: 'Excluir?', confirmLabel: 'Excluir' })) { ... }
   Monte <FeedbackHost /> uma vez no layout raiz.
─────────────────────────────────────────────────────────────────────────── */

export type ToastTipo = 'success' | 'error' | 'info'
type ToastItem = { id: number; tipo: ToastTipo; msg: string }

let toasts: ToastItem[] = []
let seq = 0
const toastListeners = new Set<(t: ToastItem[]) => void>()
const emitToasts = () => toastListeners.forEach(l => l([...toasts]))

function pushToast(tipo: ToastTipo, msg: string) {
  const id = ++seq
  toasts = [...toasts, { id, tipo, msg }]
  emitToasts()
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    emitToasts()
  }, 3500)
}

export const toast = {
  success: (msg: string) => pushToast('success', msg),
  error:   (msg: string) => pushToast('error', msg),
  info:    (msg: string) => pushToast('info', msg),
}

export type ConfirmOpts = {
  titulo: string
  mensagem?: string
  confirmLabel?: string
  cancelLabel?: string
  perigoso?: boolean
}
type ConfirmState = (ConfirmOpts & { resolve: (ok: boolean) => void }) | null

let confirmState: ConfirmState = null
const confirmListeners = new Set<(s: ConfirmState) => void>()
const emitConfirm = () => confirmListeners.forEach(l => l(confirmState))

export function confirmar(opts: ConfirmOpts): Promise<boolean> {
  return new Promise(resolve => {
    confirmState = { ...opts, resolve }
    emitConfirm()
  })
}

function resolverConfirm(ok: boolean) {
  confirmState?.resolve(ok)
  confirmState = null
  emitConfirm()
}

/* ─── Host (montar no layout) ─────────────────────────────────────────────── */

export default function FeedbackHost() {
  const [lista, setLista]   = useState<ToastItem[]>([])
  const [conf, setConf]     = useState<ConfirmState>(null)

  useEffect(() => {
    toastListeners.add(setLista)
    confirmListeners.add(setConf)
    return () => { toastListeners.delete(setLista); confirmListeners.delete(setConf) }
  }, [])

  const cor = (t: ToastTipo) =>
    t === 'success' ? 'border-emerald-700/60 bg-emerald-900/40 text-emerald-200'
    : t === 'error' ? 'border-red-700/60 bg-red-900/40 text-red-200'
    : 'border-violet-700/60 bg-violet-900/40 text-violet-200'
  const icone = (t: ToastTipo) => (t === 'success' ? '✓' : t === 'error' ? '⚠️' : 'ℹ️')

  return (
    <>
      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm">
        {lista.map(t => (
          <div key={t.id}
            className={`flex items-start gap-2.5 border rounded-lg px-4 py-3 text-sm shadow-xl backdrop-blur ${cor(t.tipo)}`}>
            <span className="leading-none mt-0.5">{icone(t.tipo)}</span>
            <span className="flex-1">{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Confirmação */}
      {conf && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
          onClick={() => resolverConfirm(false)}>
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl w-full max-w-sm p-5"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white text-lg">{conf.titulo}</h3>
            {conf.mensagem && <p className="text-sm text-gray-400 mt-2 whitespace-pre-line">{conf.mensagem}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => resolverConfirm(false)}
                className="flex-1 bg-[#1e1e2e] hover:bg-[#2d2d3d] text-gray-300 font-medium py-2.5 rounded-lg transition-colors text-sm">
                {conf.cancelLabel ?? 'Cancelar'}
              </button>
              <button onClick={() => resolverConfirm(true)}
                className={`flex-1 text-white font-medium py-2.5 rounded-lg transition-colors text-sm ${
                  conf.perigoso ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'
                }`}>
                {conf.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
