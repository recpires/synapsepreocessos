'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Badge, Button, Input, Select, Textarea, Vazio } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { registrarErro, resolverErro } from '@/server/projetos'
import {
  SEVERIDADE_LABEL, STATUS_ERRO_LABEL,
  type ProjetoErro, type Severidade, type Ambiente, type StatusErro,
} from '@/types/projetos'

const TOM_SEVERIDADE: Record<Severidade, 'critico' | 'atencao' | 'info' | 'neutro'> = {
  critica: 'critico', alta: 'atencao', media: 'info', baixa: 'neutro',
}

const ABERTOS: StatusErro[] = ['aberto', 'investigando']

function horasEntre(de: string, ate: string) {
  return (new Date(ate).getTime() - new Date(de).getTime()) / 3_600_000
}

export function Erros({ projetoId, erros }: { projetoId: string; erros: ProjetoErro[] }) {
  const router = useRouter()
  const [novo, setNovo] = useState(false)
  const [resolvendo, setResolvendo] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [salvando, iniciar] = useTransition()

  function criar(form: FormData) {
    const titulo = String(form.get('titulo') ?? '').trim()
    if (!titulo) {
      toast.error('Descreva o erro em uma frase antes de registrar.')
      return
    }
    iniciar(async () => {
      const r = await registrarErro(projetoId, {
        titulo,
        descricao: String(form.get('descricao') ?? '') || undefined,
        severidade: form.get('severidade') as Severidade,
        ambiente: form.get('ambiente') as Ambiente,
        origem: String(form.get('origem') ?? '') || undefined,
        reproducao: String(form.get('reproducao') ?? '') || undefined,
      })
      if (r.ok) {
        toast.success(`Erro ${r.codigo} registrado.`)
        setNovo(false)
        router.refresh()
      } else {
        toast.error(r.error ?? 'Não foi possível registrar o erro.')
      }
    })
  }

  function fechar(erroId: string, form: FormData) {
    const causa = String(form.get('causa_raiz') ?? '').trim()
    const correcao = String(form.get('correcao') ?? '').trim()
    if (!causa || !correcao) {
      toast.error('Preencha causa raiz e correção — é o que dá valor ao histórico.')
      return
    }
    iniciar(async () => {
      const r = await resolverErro(erroId, {
        causa_raiz: causa,
        correcao,
        commit_fix: String(form.get('commit_fix') ?? '') || undefined,
      })
      if (r.ok) {
        toast.success('Erro marcado como corrigido.')
        setResolvendo(null)
        router.refresh()
      } else {
        toast.error(r.error ?? 'Não foi possível fechar o erro.')
      }
    })
  }

  const abertos = erros.filter(e => ABERTOS.includes(e.status))
  const fechados = erros.filter(e => !ABERTOS.includes(e.status))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-subtle">
          {abertos.length} aberto{abertos.length !== 1 ? 's' : ''} · {fechados.length} fechado{fechados.length !== 1 ? 's' : ''}
        </p>
        <Button tamanho="sm" variante={novo ? 'secundario' : 'primario'} onClick={() => setNovo(v => !v)}>
          {novo ? 'Cancelar' : 'Registrar erro'}
        </Button>
      </div>

      {novo && (
        <form action={criar} className="grid gap-3 rounded-token border border-line bg-surface-2 p-4 sm:grid-cols-2">
          <Input name="titulo" rotulo="O que aconteceu" placeholder="Cancelar assinatura devolve erro do Postgres" className="sm:col-span-2" />
          <Select name="severidade" rotulo="Severidade" defaultValue="media">
            {(Object.keys(SEVERIDADE_LABEL) as Severidade[]).map(s => (
              <option key={s} value={s}>{SEVERIDADE_LABEL[s]}</option>
            ))}
          </Select>
          <Select name="ambiente" rotulo="Ambiente" defaultValue="producao">
            <option value="producao">Produção</option>
            <option value="homologacao">Homologação</option>
            <option value="desenvolvimento">Desenvolvimento</option>
          </Select>
          <Input name="origem" rotulo="Como foi descoberto" placeholder="Cliente, QA, monitoramento…" className="sm:col-span-2" />
          <Textarea name="reproducao" rotulo="Passos para reproduzir" className="sm:col-span-2" />
          <Textarea name="descricao" rotulo="Detalhes" className="sm:col-span-2" />
          <div className="sm:col-span-2">
            <Button type="submit" tamanho="sm" carregando={salvando}>Registrar</Button>
          </div>
        </form>
      )}

      {erros.length === 0 && !novo && (
        <Vazio
          titulo="Nenhum erro registrado"
          descricao="Quando registrar aqui, o padrão entre projetos aparece: o mesmo bug em três SaaS vira item de arquitetura, não de sprint."
        />
      )}

      <ul className="space-y-2">
        {[...abertos, ...fechados].map(e => {
          const aberto = ABERTOS.includes(e.status)
          const horas = e.resolvido_em ? horasEntre(e.detectado_em, e.resolvido_em) : null
          return (
            <li key={e.id} className={cn('rounded-token border border-line bg-surface', !aberto && 'opacity-70')}>
              <button
                type="button"
                onClick={() => setExpandido(a => (a === e.id ? null : e.id))}
                className="flex w-full items-start gap-3 px-4 py-3 text-left"
              >
                <span className="tabular mt-0.5 font-mono text-[11px] text-subtle">{e.codigo}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-fg">{e.titulo}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tom={TOM_SEVERIDADE[e.severidade]} className="px-1.5 py-0 text-[10px]">
                      {SEVERIDADE_LABEL[e.severidade]}
                    </Badge>
                    <Badge tom={aberto ? 'atencao' : 'ok'} className="px-1.5 py-0 text-[10px]">
                      {STATUS_ERRO_LABEL[e.status]}
                    </Badge>
                    <span className="text-[11px] text-subtle">{e.ambiente}</span>
                    {horas !== null && (
                      <span className="tabular text-[11px] text-subtle">· {horas.toFixed(1)}h até resolver</span>
                    )}
                  </span>
                </span>
              </button>

              {expandido === e.id && (
                <div className="space-y-3 border-t border-line px-4 py-3 text-sm">
                  {e.descricao && <p className="text-muted">{e.descricao}</p>}
                  {e.reproducao && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-subtle">Reprodução</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-muted">{e.reproducao}</p>
                    </div>
                  )}
                  {e.causa_raiz && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-subtle">Causa raiz</p>
                      <p className="mt-0.5 text-muted">{e.causa_raiz}</p>
                    </div>
                  )}
                  {e.correcao && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-subtle">Correção</p>
                      <p className="mt-0.5 text-muted">{e.correcao}</p>
                      {e.commit_fix && <code className="mt-1 inline-block text-xs">{e.commit_fix}</code>}
                    </div>
                  )}

                  {aberto && resolvendo !== e.id && (
                    <Button tamanho="sm" variante="secundario" onClick={() => setResolvendo(e.id)}>
                      Marcar como corrigido
                    </Button>
                  )}

                  {resolvendo === e.id && (
                    <form action={f => fechar(e.id, f)} className="grid gap-3 rounded-token bg-surface-2 p-3">
                      <Textarea name="causa_raiz" rotulo="Causa raiz" dica="Por que aconteceu, não o que aconteceu." />
                      <Textarea name="correcao" rotulo="O que foi feito" />
                      <Input name="commit_fix" rotulo="Commit da correção" placeholder="d3e738b" />
                      <div className="flex gap-2">
                        <Button type="submit" tamanho="sm" carregando={salvando}>Fechar erro</Button>
                        <Button type="button" tamanho="sm" variante="fantasma" onClick={() => setResolvendo(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
