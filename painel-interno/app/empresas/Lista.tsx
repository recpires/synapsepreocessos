'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Badge, Button, Card, Input, Select, Tabela, Th, Td, Tr, Vazio } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { criarEmpresa } from '@/server/empresas'
import { TIPO_EMPRESA_LABEL, TIPOS_EMPRESA, type EmpresaLinha } from '@/types/empresas'
import type { TipoEmpresa } from '@/types/projetos'

const TOM: Record<TipoEmpresa, 'info' | 'atencao' | 'acento' | 'ok'> = {
  cliente: 'info', fornecedor: 'atencao', parceiro: 'acento', propria: 'ok',
}

function formatarCnpj(cnpj: string | null) {
  if (!cnpj) return null
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function Lista({ empresas }: { empresas: EmpresaLinha[] }) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<TipoEmpresa | 'todas'>('todas')
  const [busca, setBusca] = useState('')
  const [novo, setNovo] = useState(false)
  const [salvando, iniciar] = useTransition()

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return empresas.filter(e => {
      if (filtro !== 'todas' && e.tipo !== filtro) return false
      if (!termo) return true
      return [e.razao_social, e.nome_fantasia, e.cnpj, e.segmento]
        .some(v => v?.toLowerCase().includes(termo))
    })
  }, [empresas, filtro, busca])

  const porTipo = useMemo(() => {
    const m = new Map<TipoEmpresa, number>()
    for (const e of empresas) m.set(e.tipo, (m.get(e.tipo) ?? 0) + 1)
    return m
  }, [empresas])

  function criar(form: FormData) {
    iniciar(async () => {
      const r = await criarEmpresa({
        tipo: form.get('tipo') as TipoEmpresa,
        razao_social: String(form.get('razao_social') ?? ''),
        nome_fantasia: String(form.get('nome_fantasia') ?? '') || undefined,
        cnpj: String(form.get('cnpj') ?? '') || undefined,
        segmento: String(form.get('segmento') ?? '') || undefined,
        site: String(form.get('site') ?? '') || undefined,
      })
      if (r.ok) {
        toast.success('Empresa cadastrada.')
        setNovo(false)
        router.refresh()
      } else {
        toast.error(r.error ?? 'Não foi possível cadastrar a empresa.')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setFiltro('todas')}
            className={cn(
              'rounded-token border px-2.5 py-1 text-xs transition-colors',
              filtro === 'todas'
                ? 'border-accent bg-accent-soft text-accent-text'
                : 'border-line text-muted hover:text-fg'
            )}
          >
            Todas <span className="tabular ml-1 text-subtle">{empresas.length}</span>
          </button>
          {TIPOS_EMPRESA.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltro(t)}
              className={cn(
                'rounded-token border px-2.5 py-1 text-xs transition-colors',
                filtro === t
                  ? 'border-accent bg-accent-soft text-accent-text'
                  : 'border-line text-muted hover:text-fg'
              )}
            >
              {TIPO_EMPRESA_LABEL[t]} <span className="tabular ml-1 text-subtle">{porTipo.get(t) ?? 0}</span>
            </button>
          ))}
        </div>

        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, CNPJ ou segmento"
          aria-label="Buscar empresa"
          className="ml-auto w-full rounded-token border border-line-strong bg-ground px-3 py-1.5 text-sm text-fg placeholder:text-subtle focus:border-accent focus:outline-none sm:w-64"
        />

        <Button tamanho="sm" variante={novo ? 'secundario' : 'primario'} onClick={() => setNovo(v => !v)}>
          {novo ? 'Cancelar' : 'Nova empresa'}
        </Button>
      </div>

      {novo && (
        <Card>
          <form action={criar} className="grid gap-4 p-5 sm:grid-cols-2">
            <Input name="razao_social" rotulo="Razão social" placeholder="Empresa LTDA" />
            <Input name="nome_fantasia" rotulo="Nome fantasia" />
            <Select name="tipo" rotulo="Tipo" defaultValue="cliente">
              {TIPOS_EMPRESA.map(t => (
                <option key={t} value={t}>{TIPO_EMPRESA_LABEL[t]}</option>
              ))}
            </Select>
            <Input name="cnpj" rotulo="CNPJ" placeholder="00.000.000/0001-00" dica="Só números também serve." />
            <Input name="segmento" rotulo="Segmento" placeholder="Barbearia, construtora…" />
            <Input name="site" rotulo="Site" placeholder="https://" />
            <div className="sm:col-span-2">
              <Button type="submit" tamanho="sm" carregando={salvando}>Cadastrar</Button>
            </div>
          </form>
        </Card>
      )}

      {visiveis.length === 0 ? (
        <Vazio
          titulo={busca || filtro !== 'todas' ? 'Nada encontrado com esse filtro' : 'Nenhuma empresa cadastrada'}
          descricao={
            busca || filtro !== 'todas'
              ? 'Ajuste a busca ou volte para "Todas".'
              : 'Cadastre clientes, fornecedores e parceiros para pendurar documento, contrato e projeto neles.'
          }
        />
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Empresa</Th>
              <Th>Tipo</Th>
              <Th>CNPJ</Th>
              <Th numerica>Projetos</Th>
              <Th numerica>Contratos</Th>
              <Th numerica>Documentos</Th>
              <Th numerica>Contatos</Th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map(e => (
              <Tr key={e.id}>
                <Td>
                  <Link href={`/empresas/${e.id}`} className="font-medium text-fg hover:text-accent">
                    {e.razao_social}
                  </Link>
                  {e.segmento && <div className="text-xs text-subtle">{e.segmento}</div>}
                </Td>
                <Td><Badge tom={TOM[e.tipo]}>{TIPO_EMPRESA_LABEL[e.tipo]}</Badge></Td>
                <Td className="font-mono text-xs text-muted">{formatarCnpj(e.cnpj) ?? '—'}</Td>
                <Td numerica>{e.projetos || '—'}</Td>
                <Td numerica>{e.contratos || '—'}</Td>
                <Td numerica>{e.documentos || '—'}</Td>
                <Td numerica>{e.contatos || '—'}</Td>
              </Tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </div>
  )
}
