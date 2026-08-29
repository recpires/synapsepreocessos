'use client'

import { useState, useTransition } from 'react'
import { Button, Select, Input } from '@/components/ui'
import { toast, confirmar } from '@/components/Feedback'
import { atribuirEmpresa } from '@/server/empresa-financeiro'
import type { EmpresaPropria } from '@/types/empresa-financeiro'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dataBR = (iso: string) => iso.split('-').reverse().join('/')

type Pendencia = {
  despesas: number
  receitas: number
  valorDespesas: number
  valorReceitas: number
  maisAntigo: string | null
}

/**
 * Atribui em lote os lançamentos que nasceram sem empresa.
 *
 * Os 228 anteriores à Fase 06 vieram de quando só havia uma entidade. Fazer
 * isso num backfill de migration gravaria um palpite como fato — aqui você
 * escolhe, vê quantas linhas mudaram e pode refazer com outro recorte.
 */
export function Atribuir({
  empresas,
  pendencia,
}: { empresas: EmpresaPropria[]; pendencia: Pendencia }) {
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? '')
  const [alvo, setAlvo] = useState<'despesas' | 'receitas'>('despesas')
  const [ate, setAte] = useState('')
  const [rodando, iniciar] = useTransition()

  const total = pendencia.despesas + pendencia.receitas
  if (total === 0) return null

  const quantos = alvo === 'despesas' ? pendencia.despesas : pendencia.receitas
  const valor = alvo === 'despesas' ? pendencia.valorDespesas : pendencia.valorReceitas
  const nome = empresas.find(e => e.id === empresaId)?.razao_social ?? ''

  async function atribuir() {
    const ok = await confirmar({
      titulo: `Atribuir ${alvo} a ${nome}?`,
      mensagem:
        `Até ${quantos} lançamento(s) sem empresa vão passar a pertencer a ${nome}` +
        (ate ? `, limitado a ${dataBR(ate)} ou antes.` : '.') +
        ' Nenhum valor muda — só o vínculo. Para corrigir depois, edite o lançamento' +
        ' ou rode de novo com outro recorte.',
      confirmLabel: 'Atribuir',
    })
    if (!ok) return

    iniciar(async () => {
      const r = await atribuirEmpresa({
        tabela: alvo,
        empresa_id: empresaId,
        somente_sem_empresa: true,
        ate: ate || undefined,
      })
      if (r.ok) toast.success(`${r.linhas ?? 0} lançamento(s) atribuído(s) a ${nome}.`)
      else toast.error(r.error ?? 'Não foi possível atribuir.')
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {pendencia.despesas > 0 && (
          <>
            <strong className="text-fg">{pendencia.despesas}</strong> despesa(s) somando{' '}
            {brl(pendencia.valorDespesas)}
          </>
        )}
        {pendencia.despesas > 0 && pendencia.receitas > 0 && ' e '}
        {pendencia.receitas > 0 && (
          <>
            <strong className="text-fg">{pendencia.receitas}</strong> receita(s) somando{' '}
            {brl(pendencia.valorReceitas)}
          </>
        )}{' '}
        ainda não pertencem a nenhuma empresa
        {pendencia.maisAntigo && <> — a mais antiga é de {dataBR(pendencia.maisAntigo)}</>}. Elas
        entram no total geral do painel, mas ficam de fora do resultado por CNPJ.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select rotulo="Atribuir a" value={empresaId} onChange={e => setEmpresaId(e.target.value)}>
          {empresas.map(e => (
            <option key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</option>
          ))}
        </Select>
        <Select
          rotulo="O quê"
          value={alvo}
          onChange={e => setAlvo(e.target.value as 'despesas' | 'receitas')}
        >
          <option value="despesas">Despesas sem empresa ({pendencia.despesas})</option>
          <option value="receitas">Receitas sem empresa ({pendencia.receitas})</option>
        </Select>
        <Input
          rotulo="Só até a data"
          type="date"
          value={ate}
          onChange={e => setAte(e.target.value)}
          dica="Opcional. Serve para dividir o histórico entre CNPJs por período."
        />
      </div>

      <Button
        onClick={atribuir}
        carregando={rodando}
        disabled={!empresaId || quantos === 0}
        variante="secundario"
      >
        Atribuir {quantos} {alvo} {valor > 0 && `(${brl(valor)})`}
      </Button>
    </div>
  )
}
