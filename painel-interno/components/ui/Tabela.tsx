import { cn } from '@/lib/cn'

/**
 * Tabela do painel. O contêiner rola sozinho no eixo X — a página nunca rola
 * de lado, que é o defeito das tabelas largas no mobile.
 */
export function Tabela({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-token border border-line bg-surface">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  )
}

export function Th({
  children,
  className,
  numerica = false,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numerica?: boolean }) {
  return (
    <th
      className={cn(
        'border-b border-line bg-surface-2 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-subtle whitespace-nowrap',
        numerica ? 'text-right' : 'text-left',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className,
  numerica = false,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numerica?: boolean }) {
  return (
    <td
      className={cn(
        'border-b border-line px-4 py-2.5 text-fg',
        numerica && 'tabular text-right',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}

export function Tr({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-surface-2', className)} {...props}>
      {children}
    </tr>
  )
}

/** Cabeçalho clicável para ordenação — o padrão já usado em despesas e receitas. */
export function ThOrdenavel({
  children,
  ativo,
  direcao,
  numerica = false,
  onClick,
}: {
  children: React.ReactNode
  ativo: boolean
  direcao: 'asc' | 'desc'
  numerica?: boolean
  onClick: () => void
}) {
  // aria-sort pertence ao <th>, não ao <button> — o botão só descreve a ação.
  return (
    <Th
      numerica={numerica}
      className="p-0"
      aria-sort={ativo ? (direcao === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-1 px-4 py-2.5 transition-colors hover:text-fg',
          numerica && 'justify-end',
          ativo && 'text-fg'
        )}
      >
        {children}
        <span aria-hidden="true" className={cn('text-[10px]', !ativo && 'opacity-0')}>
          {direcao === 'asc' ? '▲' : '▼'}
        </span>
      </button>
    </Th>
  )
}
