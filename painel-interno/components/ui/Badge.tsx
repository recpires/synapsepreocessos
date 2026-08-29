import { cn } from '@/lib/cn'

export type Tom = 'neutro' | 'ok' | 'atencao' | 'critico' | 'info' | 'acento'

const TONS: Record<Tom, string> = {
  neutro:  'bg-surface-2 text-muted border-line',
  ok:      'bg-ok-soft text-ok border-ok-line',
  atencao: 'bg-warn-soft text-warn border-warn-line',
  critico: 'bg-crit-soft text-crit border-crit-line',
  info:    'bg-info-soft text-info border-info-line',
  acento:  'bg-accent-soft text-accent-text border-accent/40',
}

type Props = {
  tom?: Tom
  children: React.ReactNode
  /** Bolinha à esquerda — para status que se lê de relance numa lista. */
  ponto?: boolean
  className?: string
}

export function Badge({ tom = 'neutro', ponto = false, children, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONS[tom],
        className
      )}
    >
      {ponto && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
