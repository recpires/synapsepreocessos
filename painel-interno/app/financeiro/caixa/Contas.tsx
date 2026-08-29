'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Button, Input, Select } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { salvarConta, type Conta } from '@/server/caixa'
import { TIPOS_CONTA, LABEL_TIPO_CONTA } from '@/types/caixa'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function diasDesde(iso: string) {
  const hoje = new Date()
  const zero = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate())
  const [a, m, d] = iso.split('-').map(Number)
  return Math.round((zero - Date.UTC(a, m - 1, d)) / 86_400_000)
}

/** Fora do componente pai: definir componente durante o render remonta o form a cada tecla. */
function Formulario({
  conta,
  empresas,
  salvando,
  aoEnviar,
  aoCancelar,
}: {
  conta?: Conta
  empresas: { id: string; nome: string }[]
  salvando: boolean
  aoEnviar: (form: FormData, id?: string) => void
  aoCancelar: () => void
}) {
  return (
    <form action={f => aoEnviar(f, conta?.id)} className="grid gap-3 sm:grid-cols-2">
      <Input name="nome" rotulo="Nome" defaultValue={conta?.nome} placeholder="Conta PJ" />
      <Input name="banco" rotulo="Banco" defaultValue={conta?.banco ?? ''} placeholder="Santander" />
      <Select name="tipo" rotulo="Tipo" defaultValue={conta?.tipo ?? 'corrente'}>
        {TIPOS_CONTA.map(t => <option key={t} value={t}>{LABEL_TIPO_CONTA[t]}</option>)}
      </Select>
      {/* O saldo de uma empresa não paga a conta da outra: sem dono, a conta
          entra em todo recorte e mostra folga que aquele CNPJ não tem. */}
      <Select
        name="empresa_id"
        rotulo="Empresa"
        defaultValue={conta?.empresa_id ?? ''}
        dica={empresas.length > 1 ? undefined : 'Cadastre mais de uma empresa para separar.'}
      >
        <option value="">Não atribuída</option>
        {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
      </Select>
      <Input
        name="saldo_atual"
        rotulo="Saldo atual"
        inputMode="decimal"
        defaultValue={conta ? String(conta.saldo_atual).replace('.', ',') : ''}
        placeholder="0,00"
        dica="Salvar carimba a data de hoje."
      />
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" tamanho="sm" carregando={salvando}>Salvar</Button>
        <Button type="button" tamanho="sm" variante="fantasma" onClick={aoCancelar}>Cancelar</Button>
      </div>
    </form>
  )
}

export function Contas({
  contas, empresas,
}: { contas: Conta[]; empresas: { id: string; nome: string }[] }) {
  const router = useRouter()
  const [editando, setEditando] = useState<string | 'nova' | null>(null)
  const [salvando, iniciar] = useTransition()

  function gravar(form: FormData, id?: string) {
    // Aceita "1.234,56" e "1234.56" — quem digita não deve pensar no formato.
    const bruto = String(form.get('saldo_atual') ?? '').replace(/\./g, '').replace(',', '.')
    const saldo = Number(bruto)
    if (!Number.isFinite(saldo)) {
      toast.error('Saldo inválido. Use apenas números, com vírgula para centavos.')
      return
    }
    iniciar(async () => {
      const r = await salvarConta({
        id,
        empresa_id: String(form.get('empresa_id') ?? '') || null,
        nome: String(form.get('nome') ?? ''),
        banco: String(form.get('banco') ?? '') || undefined,
        tipo: String(form.get('tipo') ?? 'corrente'),
        saldo_atual: saldo,
      })
      if (r.ok) {
        toast.success(id ? 'Saldo atualizado.' : 'Conta cadastrada.')
        setEditando(null)
        router.refresh()
      } else {
        toast.error(r.error ?? 'Não foi possível salvar.')
      }
    })
  }

  return (
    <div className="space-y-3">
      {contas.length === 0 && editando !== 'nova' && (
        <p className="text-sm text-subtle">
          Sem conta cadastrada não há runway. Informe o saldo das contas que a Synapse usa —
          o painel não conecta no banco, o número é seu.
        </p>
      )}

      <ul className="space-y-2">
        {contas.map(c => {
          const dias = diasDesde(c.atualizado_em)
          return (
            <li key={c.id} className="rounded-token border border-line bg-surface-2 p-3">
              {editando === c.id ? (
                <Formulario empresas={empresas}
                  conta={c}
                  salvando={salvando}
                  aoEnviar={gravar}
                  aoCancelar={() => setEditando(null)}
                />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">{c.nome}</span>
                    <span className="block text-xs text-subtle">
                      {[c.banco, LABEL_TIPO_CONTA[c.tipo] ?? c.tipo].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-right">
                      <span className="tabular block text-sm font-medium text-fg">
                        {brl(c.saldo_atual)}
                      </span>
                      <span className={cn('block text-[11px]', dias > 7 ? 'text-warn' : 'text-subtle')}>
                        {dias === 0 ? 'hoje' : `há ${dias}d`}
                      </span>
                    </span>
                    <Button tamanho="sm" variante="fantasma" onClick={() => setEditando(c.id)}>
                      Atualizar
                    </Button>
                  </span>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {editando === 'nova' ? (
        <div className="rounded-token border border-line bg-surface-2 p-3">
          <Formulario empresas={empresas}
            salvando={salvando}
            aoEnviar={gravar}
            aoCancelar={() => setEditando(null)}
          />
        </div>
      ) : (
        <Button tamanho="sm" variante="secundario" onClick={() => setEditando('nova')} className="w-full">
          Nova conta
        </Button>
      )}
    </div>
  )
}
