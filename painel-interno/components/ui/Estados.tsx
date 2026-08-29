import { cn } from '@/lib/cn'
import { Card } from './Card'

/** Cabeçalho de página — título, contexto e ações, sempre no mesmo lugar. */
export function PageHeader({
  titulo,
  descricao,
  acoes,
  className,
}: {
  titulo: string
  descricao?: React.ReactNode
  acoes?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-fg">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-muted">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-shrink-0 flex-wrap gap-2">{acoes}</div>}
    </div>
  )
}

/** Lista vazia: diz por que está vazia e qual é o próximo passo. */
export function Vazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string
  descricao?: string
  acao?: React.ReactNode
}) {
  return (
    <Card className="px-6 py-12 text-center">
      <p className="text-sm font-medium text-fg">{titulo}</p>
      {descricao && <p className="mx-auto mt-1 max-w-sm text-sm text-subtle">{descricao}</p>}
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </Card>
  )
}

/** Falha de carregamento — o que houve e como tentar de novo. */
export function Erro({ mensagem, aoTentarNovamente }: { mensagem: string; aoTentarNovamente?: () => void }) {
  return (
    <div className="rounded-token border border-crit-line bg-crit-soft px-4 py-3">
      <p className="text-sm text-crit">{mensagem}</p>
      {aoTentarNovamente && (
        <button
          type="button"
          onClick={aoTentarNovamente}
          className="mt-2 text-xs font-medium text-crit underline underline-offset-2"
        >
          Tentar de novo
        </button>
      )}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-surface-2', className)} aria-hidden="true" />
}

/** Placeholder de tabela enquanto os dados chegam. */
export function SkeletonTabela({ linhas = 5, colunas = 4 }: { linhas?: number; colunas?: number }) {
  return (
    <div className="rounded-token border border-line bg-surface p-4" role="status" aria-label="Carregando">
      <div className="space-y-3">
        {Array.from({ length: linhas }).map((_, i) => (
          <div key={i} className="flex gap-3">
            {Array.from({ length: colunas }).map((_, j) => (
              <Skeleton key={j} className={cn('h-4', j === 0 ? 'w-1/3' : 'flex-1')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
