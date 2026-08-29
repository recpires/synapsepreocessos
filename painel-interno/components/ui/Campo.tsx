'use client'

import { forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'

const BASE =
  'w-full rounded-token border bg-ground px-3 py-2 text-sm text-fg placeholder:text-subtle ' +
  'transition-colors focus:outline-none focus:border-accent disabled:opacity-50'

const NORMAL = 'border-line-strong'
const COM_ERRO = 'border-crit-line'

function Envolucro({
  id,
  rotulo,
  erro,
  dica,
  children,
}: {
  id: string
  rotulo?: string
  erro?: string
  dica?: string
  children: React.ReactNode
}) {
  return (
    <div>
      {rotulo && (
        <label htmlFor={id} className="mb-1.5 block text-sm text-muted">
          {rotulo}
        </label>
      )}
      {children}
      {/* O erro explica o que fazer, não só que deu errado. */}
      {erro ? (
        <p id={`${id}-erro`} className="mt-1 text-xs text-crit">
          {erro}
        </p>
      ) : dica ? (
        <p className="mt-1 text-xs text-subtle">{dica}</p>
      ) : null}
    </div>
  )
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  rotulo?: string
  erro?: string
  dica?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { rotulo, erro, dica, className, id, ...props },
  ref
) {
  const gerado = useId()
  const idFinal = id ?? gerado
  return (
    <Envolucro id={idFinal} rotulo={rotulo} erro={erro} dica={dica}>
      <input
        ref={ref}
        id={idFinal}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${idFinal}-erro` : undefined}
        className={cn(BASE, erro ? COM_ERRO : NORMAL, className)}
        {...props}
      />
    </Envolucro>
  )
})

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  rotulo?: string
  erro?: string
  dica?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { rotulo, erro, dica, className, id, children, ...props },
  ref
) {
  const gerado = useId()
  const idFinal = id ?? gerado
  return (
    <Envolucro id={idFinal} rotulo={rotulo} erro={erro} dica={dica}>
      <select
        ref={ref}
        id={idFinal}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${idFinal}-erro` : undefined}
        className={cn(BASE, erro ? COM_ERRO : NORMAL, className)}
        {...props}
      >
        {children}
      </select>
    </Envolucro>
  )
})

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  rotulo?: string
  erro?: string
  dica?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { rotulo, erro, dica, className, id, ...props },
  ref
) {
  const gerado = useId()
  const idFinal = id ?? gerado
  return (
    <Envolucro id={idFinal} rotulo={rotulo} erro={erro} dica={dica}>
      <textarea
        ref={ref}
        id={idFinal}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${idFinal}-erro` : undefined}
        className={cn(BASE, 'min-h-20 resize-y', erro ? COM_ERRO : NORMAL, className)}
        {...props}
      />
    </Envolucro>
  )
})
