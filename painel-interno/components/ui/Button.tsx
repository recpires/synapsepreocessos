'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo'
type Tamanho = 'sm' | 'md' | 'lg'

const VARIANTES: Record<Variante, string> = {
  primario:   'bg-accent text-accent-fg hover:bg-accent-hover',
  secundario: 'bg-surface-2 text-fg border border-line hover:bg-surface-3 hover:border-line-strong',
  fantasma:   'text-muted hover:text-fg hover:bg-surface-2',
  perigo:     'bg-crit-soft text-crit border border-crit-line hover:bg-crit/20',
}

const TAMANHOS: Record<Tamanho, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante
  tamanho?: Tamanho
  carregando?: boolean
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variante = 'primario', tamanho = 'md', carregando = false, disabled, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-token font-medium transition-colors',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTES[variante],
        TAMANHOS[tamanho],
        className
      )}
      {...props}
    >
      {carregando && (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  )
})
