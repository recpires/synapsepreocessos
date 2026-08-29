import { cn } from '@/lib/cn'

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-token border border-line bg-surface', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  titulo,
  descricao,
  acao,
  className,
}: {
  titulo: React.ReactNode
  descricao?: React.ReactNode
  acao?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-line px-5 py-4', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-fg">{titulo}</h2>
        {descricao && <p className="mt-0.5 text-xs text-subtle">{descricao}</p>}
      </div>
      {acao && <div className="flex-shrink-0">{acao}</div>}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

/**
 * Cartão de número — o bloco que abre praticamente toda tela do painel.
 * `variacao` recebe o percentual já calculado; positivo nem sempre é bom
 * (despesa subindo é ruim), por isso `inverterCor`.
 */
export function Metrica({
  rotulo,
  valor,
  detalhe,
  variacao,
  inverterCor = false,
  className,
}: {
  rotulo: string
  valor: React.ReactNode
  detalhe?: React.ReactNode
  variacao?: number
  inverterCor?: boolean
  className?: string
}) {
  const subiu = typeof variacao === 'number' && variacao > 0
  const bom = inverterCor ? !subiu : subiu
  const corVariacao = variacao === 0 ? 'text-subtle' : bom ? 'text-ok' : 'text-crit'

  return (
    <Card className={cn('px-5 py-4', className)}>
      <div className="text-xs font-medium uppercase tracking-wide text-subtle">{rotulo}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="tabular text-2xl font-semibold text-fg">{valor}</span>
        {typeof variacao === 'number' && (
          <span className={cn('tabular text-xs font-medium', corVariacao)}>
            {variacao > 0 ? '+' : ''}
            {variacao.toFixed(1)}%
          </span>
        )}
      </div>
      {detalhe && <div className="mt-1 text-xs text-subtle">{detalhe}</div>}
    </Card>
  )
}
