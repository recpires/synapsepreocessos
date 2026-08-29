'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Badge, Button, Vazio } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { silenciar, reativar, type Vencimento, type Severidade } from '@/server/vencimentos'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dia = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

const ROTULO_ORIGEM: Record<string, string> = {
  contrato: 'Contrato',
  dominio: 'Domínio',
  ssl: 'Certificado SSL',
  imposto: 'Imposto',
  proposta: 'Proposta',
  projeto: 'Prazo de projeto',
}

const TOM: Record<Severidade, 'critico' | 'atencao' | 'info' | 'neutro'> = {
  vencido: 'critico', critico: 'critico', atencao: 'atencao', ok: 'neutro',
}

const BORDA: Record<Severidade, string> = {
  vencido: 'border-crit-line bg-crit-soft',
  critico: 'border-crit-line bg-surface',
  atencao: 'border-warn-line bg-surface',
  ok: 'border-line bg-surface',
}

function prazoEmTexto(dias: number) {
  if (dias < 0) return `venceu há ${-dias} dia${dias === -1 ? '' : 's'}`
  if (dias === 0) return 'vence hoje'
  if (dias === 1) return 'vence amanhã'
  return `em ${dias} dias`
}

export function Lista({ itens }: { itens: Vencimento[] }) {
  const router = useRouter()
  const [mostrarSilenciados, setMostrarSilenciados] = useState(false)
  const [mostrarDistantes, setMostrarDistantes] = useState(false)
  const [ocupado, iniciar] = useTransition()

  const { visiveis, silenciados, distantes } = useMemo(() => {
    const silenciados = itens.filter(i => i.silenciado)
    const ativos = itens.filter(i => !i.silenciado)
    return {
      silenciados,
      distantes: ativos.filter(i => i.severidade === 'ok'),
      visiveis: ativos.filter(i => i.severidade !== 'ok'),
    }
  }, [itens])

  function alternarSilencio(v: Vencimento) {
    iniciar(async () => {
      const r = v.silenciado
        ? await reativar(v.origem, v.entidade_id)
        : await silenciar(v.origem, v.entidade_id, null)
      if (r.ok) {
        toast.success(v.silenciado ? 'Alerta reativado.' : 'Alerta silenciado.')
        router.refresh()
      } else {
        toast.error(r.error ?? 'Não foi possível atualizar o alerta.')
      }
    })
  }

  function Linha({ v }: { v: Vencimento }) {
    return (
      <li className={cn('rounded-token border p-3', BORDA[v.severidade], v.silenciado && 'opacity-60')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <Link href={v.link} className="text-sm font-medium text-fg hover:text-accent">
                {v.titulo}
              </Link>
              <Badge tom="neutro" className="px-1.5 py-0 text-[10px]">
                {ROTULO_ORIGEM[v.origem] ?? v.origem}
              </Badge>
            </span>
            {v.detalhe && <span className="mt-0.5 block text-xs text-subtle">{v.detalhe}</span>}
          </span>

          <span className="flex items-center gap-3">
            {v.valor !== null && (
              <span className="tabular text-sm text-fg">{brl(v.valor)}</span>
            )}
            <span className="text-right">
              <Badge tom={TOM[v.severidade]} className="px-1.5 py-0 text-[10px]">
                {prazoEmTexto(v.dias)}
              </Badge>
              <span className="tabular mt-0.5 block text-[11px] text-subtle">{dia(v.vence_em)}</span>
            </span>
            <Button
              tamanho="sm"
              variante="fantasma"
              carregando={ocupado}
              onClick={() => alternarSilencio(v)}
            >
              {v.silenciado ? 'Reativar' : 'Silenciar'}
            </Button>
          </span>
        </div>
      </li>
    )
  }

  if (itens.length === 0) {
    return (
      <Vazio
        titulo="Nada com data cadastrada"
        descricao="Contratos, sites, impostos, propostas e projetos com data de vencimento aparecem aqui automaticamente."
      />
    )
  }

  return (
    <div className="space-y-6">
      {visiveis.length === 0 ? (
        <Vazio
          titulo="Nada vencendo nos próximos 30 dias"
          descricao="O que tem data mais distante está agrupado abaixo."
        />
      ) : (
        <ul className="space-y-2">
          {visiveis.map(v => <Linha key={`${v.origem}-${v.entidade_id}`} v={v} />)}
        </ul>
      )}

      {distantes.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setMostrarDistantes(m => !m)}
            className="text-sm text-subtle hover:text-fg"
          >
            {mostrarDistantes ? 'Ocultar' : 'Ver'} {distantes.length} com prazo acima de 30 dias
          </button>
          {mostrarDistantes && (
            <ul className="mt-3 space-y-2">
              {distantes.map(v => <Linha key={`${v.origem}-${v.entidade_id}`} v={v} />)}
            </ul>
          )}
        </div>
      )}

      {silenciados.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setMostrarSilenciados(m => !m)}
            className="text-sm text-subtle hover:text-fg"
          >
            {mostrarSilenciados ? 'Ocultar' : 'Ver'} {silenciados.length} silenciado(s)
          </button>
          {mostrarSilenciados && (
            <ul className="mt-3 space-y-2">
              {silenciados.map(v => <Linha key={`${v.origem}-${v.entidade_id}`} v={v} />)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
