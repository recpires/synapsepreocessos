'use client'

import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/cn'

export type Tema = 'claro' | 'escuro' | 'sistema'

const CHAVE = 'painel-tema'
const EVENTO = 'painel-tema-mudou'

/**
 * Script injetado antes da primeira pintura. Sem ele a página aparece no tema
 * errado por um frame antes do React hidratar.
 *
 * Mantenha em sincronia com `aplicar()` abaixo.
 */
export const SCRIPT_ANTI_FLASH = `
try {
  var t = localStorage.getItem('${CHAVE}');
  if (t === 'claro') document.documentElement.dataset.theme = 'light';
  else if (t === 'escuro') document.documentElement.dataset.theme = 'dark';
} catch (e) {}
`.trim()

function aplicar(tema: Tema) {
  const raiz = document.documentElement
  if (tema === 'sistema') delete raiz.dataset.theme
  else raiz.dataset.theme = tema === 'claro' ? 'light' : 'dark'
}

/* ── Store externo ─────────────────────────────────────────────────────────
   O tema mora no localStorage, não no React. useSyncExternalStore lê de lá
   sem setState em efeito e já entrega 'sistema' na renderização do servidor,
   então a hidratação não diverge.
   ────────────────────────────────────────────────────────────────────────── */

function inscrever(aoMudar: () => void) {
  window.addEventListener(EVENTO, aoMudar)
  window.addEventListener('storage', aoMudar) // outra aba
  return () => {
    window.removeEventListener(EVENTO, aoMudar)
    window.removeEventListener('storage', aoMudar)
  }
}

function lerCliente(): Tema {
  try {
    const t = localStorage.getItem(CHAVE)
    if (t === 'claro' || t === 'escuro' || t === 'sistema') return t
  } catch {}
  return 'sistema'
}

const lerServidor = (): Tema => 'sistema'

function definir(tema: Tema) {
  try {
    localStorage.setItem(CHAVE, tema)
  } catch {}
  aplicar(tema)
  window.dispatchEvent(new Event(EVENTO))
}

export function useTema(): [Tema, (t: Tema) => void] {
  const tema = useSyncExternalStore(inscrever, lerCliente, lerServidor)
  return [tema, definir]
}

/* ── UI ───────────────────────────────────────────────────────────────────── */

const OPCOES: { valor: Tema; rotulo: string; icone: string }[] = [
  { valor: 'claro', rotulo: 'Claro', icone: '☀' },
  { valor: 'escuro', rotulo: 'Escuro', icone: '☾' },
  { valor: 'sistema', rotulo: 'Sistema', icone: '⌾' },
]

export function TemaToggle({ compacto = false }: { compacto?: boolean }) {
  const [tema, escolher] = useTema()

  if (compacto) {
    const proximo: Tema = tema === 'escuro' ? 'claro' : tema === 'claro' ? 'sistema' : 'escuro'
    const atual = OPCOES.find(o => o.valor === tema)!
    return (
      <button
        type="button"
        onClick={() => escolher(proximo)}
        title={`Tema: ${atual.rotulo}`}
        aria-label={`Tema: ${atual.rotulo}. Trocar.`}
        className="flex h-8 w-8 items-center justify-center rounded-token text-subtle transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <span aria-hidden="true">{atual.icone}</span>
      </button>
    )
  }

  return (
    <div role="group" aria-label="Tema" className="inline-flex rounded-token border border-line bg-surface-2 p-0.5">
      {OPCOES.map(o => (
        <button
          key={o.valor}
          type="button"
          onClick={() => escolher(o.valor)}
          aria-pressed={tema === o.valor}
          title={o.rotulo}
          className={cn(
            'flex h-7 w-8 items-center justify-center rounded text-xs transition-colors',
            tema === o.valor ? 'bg-surface text-fg shadow-sm' : 'text-subtle hover:text-fg'
          )}
        >
          <span aria-hidden="true">{o.icone}</span>
          <span className="sr-only">{o.rotulo}</span>
        </button>
      ))}
    </div>
  )
}
