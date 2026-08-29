'use client'

import { useState, useTransition } from 'react'
import {
  Button, Input, Select, Textarea, Badge, Vazio,
  Tabela, Th, Td, Tr,
} from '@/components/ui'
import { toast, confirmar } from '@/components/Feedback'
import { salvarNota, cancelarNota } from '@/server/empresa-financeiro'
import {
  RETENCOES, RETENCAO_LABEL, STATUS_NF_LABEL,
  type NotaFiscal, type Retencao,
} from '@/types/empresa-financeiro'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const hoje = () => new Date().toISOString().slice(0, 10)

type Props = {
  empresaId: string
  notas: NotaFiscal[]
  clientes: { id: string; razao_social: string }[]
}

const VAZIO = {
  numero: '', serie: '', tipo: 'servico' as 'servico' | 'produto',
  data_emissao: hoje(), competencia: hoje().slice(0, 8) + '01',
  valor: '', tomador_id: '', tomador_nome: '', observacao: '',
}

export function Notas({ empresaId, notas, clientes }: Props) {
  const [aberto, setAberto] = useState(false)
  const [f, setF] = useState(VAZIO)
  const [ret, setRet] = useState<Record<Retencao, string>>({
    iss: '', irrf: '', pis: '', cofins: '', csll: '', inss: '',
  })
  const [salvando, iniciar] = useTransition()

  const valor = Number(f.valor) || 0
  const retido = RETENCOES.reduce((a, r) => a + (Number(ret[r]) || 0), 0)
  const liquido = valor - retido

  function fechar() {
    setAberto(false)
    setF(VAZIO)
    setRet({ iss: '', irrf: '', pis: '', cofins: '', csll: '', inss: '' })
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    iniciar(async () => {
      const r = await salvarNota({
        empresa_id: empresaId,
        numero: f.numero,
        serie: f.serie || null,
        tipo: f.tipo,
        data_emissao: f.data_emissao,
        competencia: f.competencia,
        valor_servicos: valor,
        iss: Number(ret.iss) || 0,
        irrf: Number(ret.irrf) || 0,
        pis: Number(ret.pis) || 0,
        cofins: Number(ret.cofins) || 0,
        csll: Number(ret.csll) || 0,
        inss: Number(ret.inss) || 0,
        tomador_id: f.tomador_id || null,
        tomador_nome: f.tomador_nome || null,
        observacao: f.observacao || null,
      })
      if (r.ok) { toast.success('Nota lançada.'); fechar() }
      else toast.error(r.error ?? 'Não foi possível lançar a nota.')
    })
  }

  async function cancelar(nf: NotaFiscal) {
    const ok = await confirmar({
      titulo: `Cancelar a nota ${nf.numero}?`,
      mensagem:
        'A nota sai do faturamento e do cálculo do teto, mas continua registrada com o número. ' +
        'É o que a Receita espera: nota cancelada não some, muda de estado.',
      confirmLabel: 'Cancelar nota',
      perigoso: true,
    })
    if (!ok) return
    const r = await cancelarNota(nf.id)
    if (r.ok) toast.success('Nota cancelada.')
    else toast.error(r.error ?? 'Não foi possível cancelar.')
  }

  return (
    <div className="space-y-4">
      {!aberto && (
        <Button variante="secundario" onClick={() => setAberto(true)}>Lançar nota</Button>
      )}

      {aberto && (
        <form onSubmit={enviar} className="space-y-3 rounded-token border border-line bg-surface-2 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              rotulo="Número" required value={f.numero}
              onChange={e => setF({ ...f, numero: e.target.value })}
            />
            <Input
              rotulo="Série" value={f.serie}
              onChange={e => setF({ ...f, serie: e.target.value })}
            />
            <Select
              rotulo="Tipo" value={f.tipo}
              onChange={e => setF({ ...f, tipo: e.target.value as 'servico' | 'produto' })}
            >
              <option value="servico">Serviço</option>
              <option value="produto">Produto</option>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              rotulo="Emissão" type="date" required value={f.data_emissao}
              onChange={e => setF({ ...f, data_emissao: e.target.value })}
            />
            <Input
              rotulo="Competência" type="date" required value={f.competencia}
              onChange={e => setF({ ...f, competencia: e.target.value })}
              dica="O mês a que a nota se refere, que nem sempre é o da emissão."
            />
            <Input
              rotulo="Valor dos serviços" type="number" step="0.01" min="0" required
              value={f.valor} onChange={e => setF({ ...f, valor: e.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              rotulo="Tomador cadastrado" value={f.tomador_id}
              onChange={e => setF({ ...f, tomador_id: e.target.value })}
            >
              <option value="">Nenhum</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.razao_social}</option>
              ))}
            </Select>
            <Input
              rotulo="Ou tomador avulso" value={f.tomador_nome}
              onChange={e => setF({ ...f, tomador_nome: e.target.value })}
              dica="Para cliente que não vale cadastrar como empresa."
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">
              Retenções
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {RETENCOES.map(r => (
                <Input
                  key={r} rotulo={RETENCAO_LABEL[r]} type="number" step="0.01" min="0"
                  value={ret[r]} onChange={e => setRet({ ...ret, [r]: e.target.value })}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <div className="text-sm text-muted">
              Líquido{' '}
              <strong className={liquido < 0 ? 'tabular text-crit' : 'tabular text-fg'}>
                {brl(liquido)}
              </strong>
              {retido > 0 && (
                <span className="text-subtle"> · {brl(retido)} retido</span>
              )}
              {liquido < 0 && (
                <span className="ml-2 text-crit">As retenções passam do valor da nota.</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variante="fantasma" onClick={fechar}>Cancelar</Button>
              <Button type="submit" carregando={salvando} disabled={liquido < 0}>Lançar</Button>
            </div>
          </div>

          <Textarea
            rotulo="Observação" rows={2} value={f.observacao}
            onChange={e => setF({ ...f, observacao: e.target.value })}
          />
        </form>
      )}

      {notas.length === 0 ? (
        <Vazio
          titulo="Nenhuma nota lançada"
          descricao="O faturamento e o uso do teto saem daqui — enquanto não houver nota, os dois ficam em zero."
        />
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Nota</Th>
              <Th>Competência</Th>
              <Th>Tomador</Th>
              <Th numerica>Bruto</Th>
              <Th numerica>Retido</Th>
              <Th numerica>Líquido</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {notas.map(nf => {
              const r = RETENCOES.reduce((a, k) => a + nf[k], 0)
              return (
                <Tr key={nf.id} className={nf.status !== 'emitida' ? 'opacity-60' : undefined}>
                  <Td>
                    <span className="tabular font-medium text-fg">{nf.numero}</span>
                    {nf.serie && <span className="text-subtle"> / {nf.serie}</span>}
                  </Td>
                  <Td className="tabular">
                    {nf.competencia.slice(0, 7).split('-').reverse().join('/')}
                  </Td>
                  <Td>{nf.tomador_nome ?? '—'}</Td>
                  <Td numerica>{brl(nf.valor_servicos)}</Td>
                  <Td numerica>{r > 0 ? brl(r) : '—'}</Td>
                  <Td numerica>{brl(nf.valor_liquido)}</Td>
                  <Td>
                    <Badge tom={nf.status === 'emitida' ? 'ok' : 'neutro'}>
                      {STATUS_NF_LABEL[nf.status]}
                    </Badge>
                  </Td>
                  <Td>
                    {nf.status === 'emitida' && (
                      <button
                        type="button"
                        onClick={() => cancelar(nf)}
                        className="text-xs text-subtle transition-colors hover:text-crit"
                      >
                        cancelar
                      </button>
                    )}
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </Tabela>
      )}
    </div>
  )
}
