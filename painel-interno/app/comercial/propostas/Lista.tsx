'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card, Input, Select, Tabela, Th, Td, Tr, Vazio } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { criarProposta } from '@/server/propostas'
import {
  STATUS_PROPOSTA_LABEL, STATUS_PROPOSTA_TOM, CONDICOES_PADRAO,
  diasDeValidade, type PropostaLinha,
} from '@/types/propostas'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dia = (d: string | null) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

/** Validade padrão: 15 dias. Proposta sem prazo não cria urgência. */
function daquiA(dias: number) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

export function Lista({
  propostas,
  empresas,
}: {
  propostas: PropostaLinha[]
  empresas: { id: string; nome: string }[]
}) {
  const router = useRouter()
  const [nova, setNova] = useState(false)
  const [salvando, iniciar] = useTransition()

  function criar(form: FormData) {
    iniciar(async () => {
      const r = await criarProposta({
        titulo: String(form.get('titulo') ?? ''),
        empresa_id: String(form.get('empresa_id') ?? '') || null,
        validade: String(form.get('validade') ?? '') || null,
        contexto: String(form.get('contexto') ?? '') || undefined,
        condicoes: CONDICOES_PADRAO,
      })
      if (r.ok && r.id) {
        toast.success('Proposta criada.')
        router.push(`/comercial/propostas/${r.id}`)
      } else {
        toast.error(r.error ?? 'Não foi possível criar a proposta.')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button tamanho="sm" variante={nova ? 'secundario' : 'primario'} onClick={() => setNova(v => !v)}>
          {nova ? 'Cancelar' : 'Nova proposta'}
        </Button>
      </div>

      {nova && (
        <Card>
          <form action={criar} className="grid gap-4 p-5 sm:grid-cols-2">
            <Input name="titulo" rotulo="Título" placeholder="Sistema de gestão para a Barbearia X" />
            <Select name="empresa_id" rotulo="Empresa" defaultValue="">
              <option value="">Definir depois</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </Select>
            <Input name="validade" rotulo="Válida até" type="date" defaultValue={daquiA(15)}
              dica="Proposta sem prazo não cria urgência." />
            <div />
            <Input name="contexto" rotulo="O que entendemos do negócio" className="sm:col-span-2"
              placeholder="Atende 40 clientes por semana e agenda tudo pelo WhatsApp…" />
            <div className="sm:col-span-2">
              <Button type="submit" tamanho="sm" carregando={salvando}>Criar e editar</Button>
            </div>
          </form>
        </Card>
      )}

      {propostas.length === 0 ? (
        <Vazio
          titulo="Nenhuma proposta ainda"
          descricao="Cada proposta ganha número, validade e status. Ao aceitar, ela vira projeto com as fases já preenchidas pelos itens de escopo."
        />
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Número</Th>
              <Th>Proposta</Th>
              <Th>Empresa</Th>
              <Th>Status</Th>
              <Th>Validade</Th>
              <Th numerica>Único</Th>
              <Th numerica>Mensal</Th>
            </tr>
          </thead>
          <tbody>
            {propostas.map(p => {
              const dias = diasDeValidade(p.validade)
              const vencendo = dias !== null && dias >= 0 && dias <= 3
              const vencida = dias !== null && dias < 0 && p.status !== 'aceita' && p.status !== 'recusada'
              return (
                <Tr key={p.id}>
                  <Td className="font-mono text-xs text-subtle">{p.numero}</Td>
                  <Td>
                    <Link href={`/comercial/propostas/${p.id}`} className="font-medium text-fg hover:text-accent">
                      {p.titulo}
                    </Link>
                  </Td>
                  <Td className="text-muted">{p.empresa_nome ?? '—'}</Td>
                  <Td>
                    <Badge tom={STATUS_PROPOSTA_TOM[p.status]}>
                      {STATUS_PROPOSTA_LABEL[p.status]}
                    </Badge>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-muted">{dia(p.validade)}</span>
                      {vencida && (
                        <Badge tom="critico" className="px-1.5 py-0 text-[10px]">expirou</Badge>
                      )}
                      {vencendo && (
                        <Badge tom="atencao" className="px-1.5 py-0 text-[10px]">{dias}d</Badge>
                      )}
                    </span>
                  </Td>
                  <Td numerica>{p.valor_total > 0 ? brl(p.valor_total) : '—'}</Td>
                  <Td numerica>{p.valor_mensal > 0 ? brl(p.valor_mensal) : '—'}</Td>
                </Tr>
              )
            })}
          </tbody>
        </Tabela>
      )}
    </div>
  )
}
