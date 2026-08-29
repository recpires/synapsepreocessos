'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card, Input, Select, Tabela, Th, Td, Tr, Vazio } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { salvarSite } from '@/server/empresas'
import {
  STATUS_SITE, STATUS_SITE_LABEL, diasAte, tomDoVencimento, type SiteLinha,
} from '@/types/empresas'

const dia = (d: string | null) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

/** Célula de vencimento: a data e, ao lado, quanto falta em cor. */
function Vencimento({ data }: { data: string | null }) {
  const dias = diasAte(data)
  if (dias === null) return <span className="text-subtle">—</span>
  return (
    <span className="flex items-center justify-end gap-1.5">
      <span className="tabular text-xs text-muted">{dia(data)}</span>
      <Badge tom={tomDoVencimento(dias)} className="px-1.5 py-0 text-[10px]">
        {dias < 0 ? `há ${-dias}d` : `${dias}d`}
      </Badge>
    </span>
  )
}

export function Lista({
  sites,
  empresas,
}: {
  sites: SiteLinha[]
  empresas: { id: string; nome: string }[]
}) {
  const router = useRouter()
  const [novo, setNovo] = useState(false)
  const [salvando, iniciar] = useTransition()

  function criar(form: FormData) {
    const nome = String(form.get('nome') ?? '').trim()
    if (!nome) {
      toast.error('Dê um nome ao site.')
      return
    }
    iniciar(async () => {
      const bruto = String(form.get('manutencao_mensal') ?? '').replace(',', '.')
      const r = await salvarSite({
        nome,
        empresa_id: String(form.get('empresa_id') ?? '') || null,
        dominio: String(form.get('dominio') ?? '') || undefined,
        url: String(form.get('url') ?? '') || undefined,
        hospedagem: String(form.get('hospedagem') ?? '') || undefined,
        registrar: String(form.get('registrar') ?? '') || undefined,
        status: String(form.get('status') ?? 'no_ar'),
        publicado_em: String(form.get('publicado_em') ?? '') || null,
        ssl_expira: String(form.get('ssl_expira') ?? '') || null,
        dominio_expira: String(form.get('dominio_expira') ?? '') || null,
        manutencao_mensal: bruto ? Number(bruto) : null,
      })
      if (r.ok) {
        toast.success('Site cadastrado.')
        setNovo(false)
        router.refresh()
      } else {
        toast.error(r.error ?? 'Não foi possível salvar o site.')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button tamanho="sm" variante={novo ? 'secundario' : 'primario'} onClick={() => setNovo(v => !v)}>
          {novo ? 'Cancelar' : 'Novo site'}
        </Button>
      </div>

      {novo && (
        <Card>
          <form action={criar} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <Input name="nome" rotulo="Nome" placeholder="Landing Nero Barber" />
            <Input name="dominio" rotulo="Domínio" placeholder="nerobarber.com.br" />
            <Input name="url" rotulo="URL" placeholder="https://" />
            <Select name="empresa_id" rotulo="Empresa" defaultValue="">
              <option value="">Sem empresa</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </Select>
            <Input name="hospedagem" rotulo="Hospedagem" placeholder="Vercel, Hostinger…" />
            <Input name="registrar" rotulo="Registrador" placeholder="Registro.br, GoDaddy…" />
            <Select name="status" rotulo="Status" defaultValue="no_ar">
              {STATUS_SITE.map(s => <option key={s} value={s}>{STATUS_SITE_LABEL[s]}</option>)}
            </Select>
            <Input name="publicado_em" rotulo="Publicado em" type="date" />
            <Input
              name="manutencao_mensal"
              rotulo="Manutenção mensal"
              inputMode="decimal"
              placeholder="0,00"
              dica="Deixe vazio se não há contrato."
            />
            <Input name="dominio_expira" rotulo="Domínio vence em" type="date" />
            <Input name="ssl_expira" rotulo="SSL vence em" type="date" />
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" tamanho="sm" carregando={salvando}>Cadastrar</Button>
            </div>
          </form>
        </Card>
      )}

      {sites.length === 0 ? (
        <Vazio
          titulo="Nenhum site cadastrado"
          descricao="Cadastre os sites entregues para acompanhar domínio, certificado e contrato de manutenção em um lugar só."
        />
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Site</Th>
              <Th>Empresa</Th>
              <Th>Hospedagem</Th>
              <Th>Status</Th>
              <Th numerica>Domínio vence</Th>
              <Th numerica>SSL vence</Th>
              <Th numerica>Manutenção</Th>
            </tr>
          </thead>
          <tbody>
            {sites.map(s => (
              <Tr key={s.id}>
                <Td>
                  <span className="font-medium text-fg">{s.nome}</span>
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-accent hover:underline"
                    >
                      {s.dominio ?? s.url}
                    </a>
                  ) : (
                    s.dominio && <span className="block text-xs text-subtle">{s.dominio}</span>
                  )}
                </Td>
                <Td className="text-muted">{s.empresa_nome ?? '—'}</Td>
                <Td className="text-muted">{s.hospedagem ?? '—'}</Td>
                <Td>
                  <Badge tom={s.status === 'no_ar' ? 'ok' : s.status === 'encerrado' ? 'neutro' : 'atencao'}>
                    {STATUS_SITE_LABEL[s.status] ?? s.status}
                  </Badge>
                </Td>
                <Td numerica><Vencimento data={s.dominio_expira} /></Td>
                <Td numerica><Vencimento data={s.ssl_expira} /></Td>
                <Td numerica>
                  {s.manutencao_mensal
                    ? s.manutencao_mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '—'}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </div>
  )
}
