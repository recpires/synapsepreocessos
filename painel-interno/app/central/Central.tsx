'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { PageHeader, Card, CardBody, Erro, Vazio, Button, Input, Select, Textarea } from '@/components/ui'
import { toast, confirmar } from '@/components/Feedback'
import {
  FRENTES, FRENTE_LABEL, FRENTE_COR, STATUS, STATUS_LABEL, STATUS_COR,
  HORA_INICIO, HORA_FIM, separarPorHorario, porFaixaDeHora, resumoDoDia,
  rotuloDoDia, somarDias,
  type Frente, type ItemRoadmap, type StatusItem, type Tarefa,
} from '@/types/central'
import {
  listarTarefas, criarTarefa, alternarTarefa, apagarTarefa, salvarNota,
  listarRoadmap, criarItemRoadmap, atualizarItemRoadmap, apagarItemRoadmap, semearRoadmap,
} from '@/server/central'
import { ROADMAP_INICIAL } from './roadmap-inicial'

type Aba = 'dia' | 'agenda' | 'roadmap'

function hojeISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function Central({ nome }: { nome: string }) {
  const [aba, setAba] = useState<Aba>('dia')
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [roadmap, setRoadmap] = useState<ItemRoadmap[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, iniciar] = useTransition()

  const recarregar = useCallback(async () => {
    const [t, r] = await Promise.all([listarTarefas(), listarRoadmap()])
    if (t.error || r.error) { setErro(t.error ?? r.error ?? null); return }
    setErro(null)
    setTarefas(t.data ?? [])
    setRoadmap(r.data ?? [])
    return r.data ?? []
  }, [])

  useEffect(() => {
    let vivo = true
    ;(async () => {
      const itens = await recarregar()
      // Primeira abertura: semeia e relê. `semearRoadmap` não faz nada se já
      // houver item, então reabrir a página não duplica.
      if (vivo && itens && itens.length === 0) {
        await semearRoadmap(ROADMAP_INICIAL)
        await recarregar()
      }
      if (vivo) setCarregando(false)
    })()
    return () => { vivo = false }
  }, [recarregar])

  /** Toda escrita passa por aqui: mostra o erro do servidor e recarrega. */
  const executar = (acao: () => Promise<{ ok: boolean; error?: string }>, sucesso?: string) => {
    iniciar(async () => {
      const r = await acao()
      if (!r.ok) { toast.error(r.error ?? 'Não foi possível concluir.'); return }
      if (sucesso) toast.success(sucesso)
      await recarregar()
    })
  }

  const primeiroNome = nome.split(' ')[0]

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <PageHeader
        titulo={`Central ${primeiroNome}`}
        descricao="Agenda do dia a dia separada do roadmap de cada frente — Synapse Code, barbearia, FIAP e pessoal. Só você vê esta página."
      />

      <div className="flex gap-1 rounded-token border border-line bg-surface p-1">
        {(['dia', 'agenda', 'roadmap'] as const).map(a => (
          <button
            key={a}
            type="button"
            onClick={() => setAba(a)}
            className={`flex-1 rounded-token px-3 py-2 text-sm font-medium capitalize transition-colors ${
              aba === a ? 'bg-surface-3 text-fg' : 'text-muted hover:text-fg'
            }`}
          >
            {a === 'dia' ? 'Dia' : a === 'agenda' ? 'Agenda' : 'Roadmap'}
          </button>
        ))}
      </div>

      {erro && <Erro mensagem={erro} />}

      {carregando ? (
        <p className="py-10 text-center text-sm text-subtle">Carregando…</p>
      ) : aba === 'dia' ? (
        <AbaDia tarefas={tarefas} salvando={salvando} executar={executar} />
      ) : aba === 'agenda' ? (
        <AbaAgenda tarefas={tarefas} salvando={salvando} executar={executar} />
      ) : (
        <AbaRoadmap itens={roadmap} salvando={salvando} executar={executar} />
      )}
    </div>
  )
}

/* ── Peças comuns ─────────────────────────────────────────────────────────── */

type Executar = (
  acao: () => Promise<{ ok: boolean; error?: string }>,
  sucesso?: string
) => void

function SeletorFrente({ valor, onChange }: { valor: Frente; onChange: (f: Frente) => void }) {
  return (
    <Select value={valor} onChange={e => onChange(e.target.value as Frente)}>
      {FRENTES.map(f => <option key={f} value={f}>{FRENTE_LABEL[f]}</option>)}
    </Select>
  )
}

function EtiquetaFrente({ frente }: { frente: Frente }) {
  const cor = FRENTE_COR[frente]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ color: cor, backgroundColor: `${cor}22` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cor }} />
      {FRENTE_LABEL[frente]}
    </span>
  )
}

function Caixa({ feito, onClick }: { feito: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={feito}
      aria-label={feito ? 'Desmarcar' : 'Marcar como feita'}
      className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border text-[11px] transition-colors ${
        feito
          ? 'border-ok bg-ok text-ground'
          : 'border-line-strong text-transparent hover:border-accent'
      }`}
    >
      ✓
    </button>
  )
}

function LinhaTarefa({
  t, executar, compacta = false,
}: { t: Tarefa; executar: Executar; compacta?: boolean }) {
  const [anotando, setAnotando] = useState(false)
  const [nota, setNota] = useState(t.nota)

  // A nota pode chegar de outra aba ou de outro aparelho; enquanto o textarea
  // está aberto o que vale é o que está sendo digitado.
  useEffect(() => { if (!anotando) setNota(t.nota) }, [t.nota, anotando])

  const remover = async () => {
    const ok = await confirmar({
      titulo: 'Apagar esta tarefa?',
      mensagem: t.titulo,
      confirmLabel: 'Apagar',
      perigoso: true,
    })
    if (ok) executar(() => apagarTarefa(t.id))
  }

  const gravar = () => {
    executar(() => salvarNota(t.id, nota), 'Anotação salva.')
    setAnotando(false)
  }

  return (
    <div
      className={`rounded-token border border-line bg-surface px-3 py-2.5 ${
        // Feita com anotação não desbota: a nota é justamente o que se quer ler
        // depois, e opacidade de 50% em texto pequeno some.
        t.feito && !t.nota ? 'opacity-50' : ''
      }`}
      style={compacta ? { borderLeft: `3px solid ${FRENTE_COR[t.frente]}` } : undefined}
    >
      <div className="flex items-start gap-2.5">
        <Caixa feito={t.feito} onClick={() => executar(() => alternarTarefa(t.id, !t.feito))} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${t.feito ? 'line-through text-muted' : 'text-fg'}`}>{t.titulo}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {!compacta && <EtiquetaFrente frente={t.frente} />}
            <span className="rounded border border-line px-1.5 py-px text-[10px] text-subtle">
              {t.tipo === 'reuniao' ? 'Reunião' : 'Tarefa'}
            </span>
            {t.hora && <span className="tabular text-[11px] text-subtle">{t.hora}</span>}
            {!anotando && (
              <button
                type="button"
                onClick={() => setAnotando(true)}
                className="text-[11px] text-subtle underline-offset-2 transition-colors hover:text-accent hover:underline"
              >
                {t.nota ? 'editar anotação' : '+ anotar o que foi feito'}
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={remover}
          aria-label="Apagar"
          className="flex-shrink-0 px-1 text-subtle transition-colors hover:text-crit"
        >
          ×
        </button>
      </div>

      {anotando ? (
        <div className="mt-2 space-y-2 pl-[28px]">
          <Textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            onKeyDown={e => {
              // Enter quebra linha; salvar exige gesto explícito ou Ctrl+Enter.
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) gravar()
              if (e.key === 'Escape') { setNota(t.nota); setAnotando(false) }
            }}
            rows={3}
            autoFocus
            placeholder="O que foi feito, o que travou, o que ficou para depois…"
          />
          <div className="flex gap-2">
            <Button tamanho="sm" onClick={gravar}>Salvar anotação</Button>
            <Button tamanho="sm" variante="fantasma"
              onClick={() => { setNota(t.nota); setAnotando(false) }}>Cancelar</Button>
          </div>
        </div>
      ) : t.nota ? (
        <p className="mt-1.5 whitespace-pre-wrap border-l-2 border-line pl-2.5 text-[13px] leading-relaxed text-muted ml-[28px]">
          {t.nota}
        </p>
      ) : null}
    </div>
  )
}

/** Formulário de nova tarefa. A data pode vir fixa (aba Dia) ou ser escolhida. */
function FormTarefa({
  dataFixa, salvando, executar,
}: { dataFixa?: string; salvando: boolean; executar: Executar }) {
  const [titulo, setTitulo] = useState('')
  const [frente, setFrente] = useState<Frente>('synapse')
  const [tipo, setTipo] = useState('tarefa')
  const [data, setData] = useState(() => somarDias(hojeISO(), 1))
  const [hora, setHora] = useState('')
  const [nota, setNota] = useState('')
  const [comNota, setComNota] = useState(false)

  const enviar = () => {
    if (!titulo.trim()) { toast.error('Escreva o que precisa ser feito.'); return }
    executar(
      () => criarTarefa({ titulo, frente, tipo, data: dataFixa ?? data, hora: hora || null, nota }),
      'Adicionado.'
    )
    setTitulo('')
    setHora('')
    setNota('')
    setComNota(false)
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <Input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') enviar() }}
          placeholder="Ex: Reunião com Wilian sobre lumIA"
          rotulo={dataFixa ? 'Adicionar a este dia' : 'Título'}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <SeletorFrente valor={frente} onChange={setFrente} />
          <Select value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="tarefa">Tarefa</option>
            <option value="reuniao">Reunião</option>
          </Select>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {!dataFixa && (
            <Input type="date" value={data} onChange={e => setData(e.target.value)} />
          )}
          <Input
            type="time"
            value={hora}
            onChange={e => setHora(e.target.value)}
            dica="Sem hora, fica no bloco do dia"
          />
        </div>
        {/* Fechada por padrão: no cadastro a anotação é exceção — o comum é
            escrever depois, na própria tarefa, quando já se sabe o que rolou. */}
        {comNota ? (
          <Textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            rows={3}
            autoFocus
            rotulo="Anotação"
            placeholder="Contexto, link, o que precisa levar…"
          />
        ) : (
          <button
            type="button"
            onClick={() => setComNota(true)}
            className="text-[12px] text-subtle underline-offset-2 transition-colors hover:text-accent hover:underline"
          >
            + anotação
          </button>
        )}
        <Button onClick={enviar} carregando={salvando} className="w-full">
          Adicionar
        </Button>
      </CardBody>
    </Card>
  )
}

/* ── Aba Dia ──────────────────────────────────────────────────────────────── */

function AbaDia({
  tarefas, salvando, executar,
}: { tarefas: Tarefa[]; salvando: boolean; executar: Executar }) {
  const [dia, setDia] = useState(hojeISO())
  const doDia = useMemo(() => tarefas.filter(t => t.data === dia), [tarefas, dia])
  const { comHora, semHora } = separarPorHorario(doDia)
  const faixas = porFaixaDeHora(comHora)
  const resumo = resumoDoDia(doDia)

  const horas: number[] = []
  for (let h = HORA_INICIO; h <= HORA_FIM; h++) horas.push(h)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variante="secundario" onClick={() => setDia(d => somarDias(d, -1))} aria-label="Dia anterior">‹</Button>
        <Input type="date" value={dia} onChange={e => setDia(e.target.value || hojeISO())} />
        <Button variante="secundario" onClick={() => setDia(d => somarDias(d, 1))} aria-label="Próximo dia">›</Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { n: resumo.total, r: 'Total' },
          { n: resumo.reunioes, r: 'Reuniões' },
          { n: `${resumo.feitas}/${resumo.total}`, r: 'Concluídas' },
        ].map(c => (
          <div key={c.r} className="rounded-token border border-line bg-surface px-3 py-2.5 text-center">
            <p className="text-lg font-semibold tabular text-fg">{c.n}</p>
            <p className="text-[10px] uppercase tracking-wide text-subtle">{c.r}</p>
          </div>
        ))}
      </div>

      <FormTarefa dataFixa={dia} salvando={salvando} executar={executar} />

      {semHora.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-subtle">Sem horário fixo</p>
          {semHora.map(t => <LinhaTarefa key={t.id} t={t} executar={executar} compacta />)}
        </div>
      )}

      {doDia.length === 0 ? (
        <Vazio titulo="Nada planejado ainda" descricao="Use o campo acima para montar o dia." />
      ) : (
        <div className="rounded-token border border-line">
          {horas.map(h => {
            const itens = faixas.get(h) ?? []
            return (
              <div key={h} className="flex gap-3 border-b border-line px-3 py-2 last:border-b-0">
                <span className="w-10 flex-shrink-0 pt-1 text-[11px] tabular text-subtle">
                  {String(h).padStart(2, '0')}:00
                </span>
                <div className="min-h-[28px] flex-1 space-y-1.5">
                  {itens.map(t => <LinhaTarefa key={t.id} t={t} executar={executar} compacta />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Aba Agenda ───────────────────────────────────────────────────────────── */

function AbaAgenda({
  tarefas, salvando, executar,
}: { tarefas: Tarefa[]; salvando: boolean; executar: Executar }) {
  const hoje = hojeISO()
  const porDia = useMemo(() => {
    const mapa = new Map<string, Tarefa[]>()
    for (const t of tarefas) {
      const lista = mapa.get(t.data) ?? []
      lista.push(t)
      mapa.set(t.data, lista)
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [tarefas])

  return (
    <div className="space-y-4">
      <FormTarefa salvando={salvando} executar={executar} />
      {porDia.length === 0 ? (
        <Vazio titulo="Agenda vazia" descricao="Nada nos últimos 30 dias nem à frente." />
      ) : (
        porDia.map(([data, itens]) => (
          <div key={data} className="space-y-2">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-muted">{rotuloDoDia(data, hoje)}</p>
              <span className="h-px flex-1 bg-line" />
            </div>
            {itens
              .slice()
              .sort((a, b) => (a.hora ?? '99:99').localeCompare(b.hora ?? '99:99'))
              .map(t => <LinhaTarefa key={t.id} t={t} executar={executar} />)}
          </div>
        ))
      )}
    </div>
  )
}

/* ── Aba Roadmap ──────────────────────────────────────────────────────────── */

function AbaRoadmap({
  itens, salvando, executar,
}: { itens: ItemRoadmap[]; salvando: boolean; executar: Executar }) {
  return (
    <div className="space-y-6">
      {FRENTES.map(f => (
        <section key={f} className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FRENTE_COR[f] }} />
            {FRENTE_LABEL[f]}
          </h2>
          {itens.filter(i => i.frente === f).map(i => (
            <CardItem key={i.id} item={i} executar={executar} />
          ))}
          <NovoItem frente={f} salvando={salvando} executar={executar} />
        </section>
      ))}
    </div>
  )
}

function CardItem({ item, executar }: { item: ItemRoadmap; executar: Executar }) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(item.nome)
  const [proximo, setProximo] = useState(item.proximo)

  const salvar = () => {
    executar(() => atualizarItemRoadmap(item.id, { nome, proximo }), 'Salvo.')
    setEditando(false)
  }

  const remover = async () => {
    const ok = await confirmar({
      titulo: 'Remover do roadmap?',
      mensagem: item.nome,
      confirmLabel: 'Remover',
      perigoso: true,
    })
    if (ok) executar(() => apagarItemRoadmap(item.id))
  }

  return (
    <div
      className="rounded-token border border-line bg-surface p-3"
      style={{ borderLeft: `3px solid ${FRENTE_COR[item.frente]}` }}
    >
      {editando ? (
        <div className="space-y-2">
          <Input value={nome} onChange={e => setNome(e.target.value)} rotulo="Nome" />
          <Input value={proximo} onChange={e => setProximo(e.target.value)} rotulo="Próximo passo" />
          <div className="flex gap-2">
            <Button tamanho="sm" onClick={salvar}>Salvar</Button>
            <Button tamanho="sm" variante="fantasma" onClick={() => {
              setNome(item.nome); setProximo(item.proximo); setEditando(false)
            }}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-fg">{item.nome}</p>
            <div className="flex flex-shrink-0 gap-1">
              <Button tamanho="sm" variante="fantasma" onClick={() => setEditando(true)}>editar</Button>
              <Button tamanho="sm" variante="fantasma" onClick={remover}>remover</Button>
            </div>
          </div>
          {item.proximo && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.proximo}</p>}
          <select
            value={item.status}
            onChange={e => executar(() => atualizarItemRoadmap(item.id, { status: e.target.value }))}
            className="mt-2.5 cursor-pointer rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-medium"
            style={{ color: STATUS_COR[item.status] }}
            aria-label={`Status de ${item.nome}`}
          >
            {STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </>
      )}
    </div>
  )
}

function NovoItem({
  frente, salvando, executar,
}: { frente: Frente; salvando: boolean; executar: Executar }) {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [proximo, setProximo] = useState('')

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="w-full rounded-token border border-dashed border-line px-3 py-2.5 text-left text-[13px] text-subtle transition-colors hover:border-accent hover:text-muted"
      >
        + adicionar em {FRENTE_LABEL[frente]}
      </button>
    )
  }

  const criar = () => {
    if (!nome.trim()) { toast.error('Dê um nome ao projeto.'); return }
    executar(() => criarItemRoadmap({ frente, nome, proximo }), 'Adicionado.')
    setNome(''); setProximo(''); setAberto(false)
  }

  return (
    <div className="space-y-2 rounded-token border border-line bg-surface p-3">
      <Input value={nome} onChange={e => setNome(e.target.value)} rotulo="Nome" autoFocus />
      <Input value={proximo} onChange={e => setProximo(e.target.value)} rotulo="Próximo passo (opcional)" />
      <div className="flex gap-2">
        <Button tamanho="sm" onClick={criar} carregando={salvando}>Adicionar</Button>
        <Button tamanho="sm" variante="fantasma" onClick={() => setAberto(false)}>Cancelar</Button>
      </div>
    </div>
  )
}
