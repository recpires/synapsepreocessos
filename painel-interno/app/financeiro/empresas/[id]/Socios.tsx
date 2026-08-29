'use client'

import { useState, useTransition } from 'react'
import { Button, Input, Select, Badge, Vazio } from '@/components/ui'
import { toast, confirmar } from '@/components/Feedback'
import { salvarSocio, encerrarSocio } from '@/server/empresa-financeiro'
import type { Socio } from '@/types/empresa-financeiro'

const dataBR = (iso: string) => iso.split('-').reverse().join('/')
const hoje = () => new Date().toISOString().slice(0, 10)
const pct = (v: number) =>
  `${v.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}%`

type Props = {
  empresaId: string
  socios: Socio[]
  membros: { id: string; nome: string }[]
  /** Resultado do ano, para mostrar quanto cabe a cada um. */
  resultadoAno: number
}

const VAZIO = { nome: '', membro_id: '', participacao_pct: '', papel: '', entrada: '' }

export function Socios({ empresaId, socios, membros, resultadoAno }: Props) {
  const [aberto, setAberto] = useState(false)
  const [f, setF] = useState(VAZIO)
  const [salvando, iniciar] = useTransition()

  const ativos = socios.filter(s => !s.saida)
  const saidos = socios.filter(s => s.saida)
  const declarado = ativos.reduce((a, s) => a + s.participacao_pct, 0)
  const restante = Math.round((100 - declarado) * 1000) / 1000

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  /**
   * Escolher um membro preenche o nome, mas dá para sobrescrever: o nome no
   * contrato social nem sempre é o que a pessoa usa no painel.
   */
  function escolherMembro(id: string) {
    const m = membros.find(x => x.id === id)
    setF(atual => ({ ...atual, membro_id: id, nome: m && !atual.nome ? m.nome : atual.nome }))
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    iniciar(async () => {
      const r = await salvarSocio({
        empresa_id: empresaId,
        nome: f.nome,
        membro_id: f.membro_id || null,
        participacao_pct: Number(f.participacao_pct),
        papel: f.papel || null,
        entrada: f.entrada || null,
      })
      if (r.ok) { toast.success('Sócio cadastrado.'); setF(VAZIO); setAberto(false) }
      else toast.error(r.error ?? 'Não foi possível cadastrar.')
    })
  }

  async function sair(s: Socio) {
    const ok = await confirmar({
      titulo: `Registrar a saída de ${s.nome}?`,
      mensagem:
        `A participação de ${pct(s.participacao_pct)} deixa de contar e libera essa fatia ` +
        'para redistribuir. A linha continua gravada — quem era sócio quando o resultado ' +
        'foi apurado importa depois.',
      confirmLabel: 'Registrar saída',
    })
    if (!ok) return
    const r = await encerrarSocio(s.id, hoje())
    if (r.ok) toast.success('Saída registrada.')
    else toast.error(r.error ?? 'Não foi possível registrar.')
  }

  return (
    <div className="space-y-4">
      {ativos.length === 0 ? (
        <Vazio
          titulo="Nenhum sócio declarado"
          descricao="Sem isso o painel trata a empresa como 100% sua, e o resultado que ele mostra não é o que chega no seu bolso."
        />
      ) : (
        <>
          <div className="flex h-2 overflow-hidden rounded-full bg-surface-3">
            {ativos.map((s, i) => (
              <div
                key={s.id}
                title={`${s.nome} — ${pct(s.participacao_pct)}`}
                style={{ width: `${s.participacao_pct}%` }}
                className={['bg-accent', 'bg-ok', 'bg-warn', 'bg-info'][i % 4]}
              />
            ))}
          </div>

          <ul className="space-y-1">
            {ativos.map(s => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2 last:border-0"
              >
                <span className="min-w-0">
                  <span className="text-sm text-fg">{s.nome}</span>
                  {s.membro_id && (
                    <Badge tom="acento" className="ml-2 px-1.5 py-0 text-[10px]">usa o painel</Badge>
                  )}
                  <span className="ml-2 text-xs text-subtle">
                    {s.papel}
                    {s.entrada && <> · desde {dataBR(s.entrada)}</>}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular text-sm font-medium text-fg">
                    {pct(s.participacao_pct)}
                  </span>
                  {resultadoAno !== 0 && (
                    <span className="tabular text-xs text-subtle">
                      {brl(Math.round(resultadoAno * s.participacao_pct) / 100)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => sair(s)}
                    className="text-xs text-subtle transition-colors hover:text-crit"
                  >
                    saída
                  </button>
                </span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-subtle">
            {restante > 0.001 ? (
              <>
                <strong className="text-warn">{pct(restante)} ainda não declarado.</strong>{' '}
                Enquanto faltar, a soma das fatias não fecha o resultado da empresa.
              </>
            ) : (
              <>Capital 100% declarado entre {ativos.length} sócio(s).</>
            )}
          </p>
        </>
      )}

      {saidos.length > 0 && (
        <p className="text-xs text-subtle">
          Já saíram: {saidos.map(s => `${s.nome} (${dataBR(s.saida!)})`).join(', ')}.
        </p>
      )}

      {!aberto ? (
        <Button variante="secundario" onClick={() => setAberto(true)}>Adicionar sócio</Button>
      ) : (
        <form onSubmit={enviar} className="space-y-3 rounded-token border border-line bg-surface-2 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              rotulo="É usuário do painel?"
              value={f.membro_id}
              onChange={e => escolherMembro(e.target.value)}
              dica="Quem estiver ligado aqui vê a própria fatia na lista de empresas."
            >
              <option value="">Não / externo</option>
              {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </Select>
            <Input
              rotulo="Nome no contrato" required value={f.nome}
              onChange={e => setF({ ...f, nome: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              rotulo="Participação %" type="number" step="0.001" min="0.001" max="100" required
              value={f.participacao_pct}
              onChange={e => setF({ ...f, participacao_pct: e.target.value })}
              dica={restante > 0.001 ? `Restam ${pct(restante)}` : 'Já está em 100%'}
            />
            <Input
              rotulo="Papel" value={f.papel}
              onChange={e => setF({ ...f, papel: e.target.value })}
              placeholder="Sócio administrador…"
            />
            <Input
              rotulo="Entrada" type="date" value={f.entrada}
              onChange={e => setF({ ...f, entrada: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" carregando={salvando}>Cadastrar</Button>
            <Button type="button" variante="fantasma" onClick={() => { setAberto(false); setF(VAZIO) }}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
