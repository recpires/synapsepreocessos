'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Input } from '@/components/ui'
import { toast } from '@/components/Feedback'
import { adicionarContato } from '@/server/empresas'
import type { Contato } from '@/types/empresas'

/** WhatsApp em link direto: o número vira wa.me sem máscara. */
function linkWhatsapp(numero: string) {
  const d = numero.replace(/\D/g, '')
  return `https://wa.me/${d.length <= 11 ? '55' + d : d}`
}

export function Contatos({ empresaId, contatos }: { empresaId: string; contatos: Contato[] }) {
  const router = useRouter()
  const [novo, setNovo] = useState(false)
  const [salvando, iniciar] = useTransition()

  function adicionar(form: FormData) {
    const nome = String(form.get('nome') ?? '').trim()
    if (!nome) {
      toast.error('Informe o nome do contato.')
      return
    }
    iniciar(async () => {
      const r = await adicionarContato(empresaId, {
        nome,
        cargo: String(form.get('cargo') ?? '') || undefined,
        email: String(form.get('email') ?? '') || undefined,
        whatsapp: String(form.get('whatsapp') ?? '') || undefined,
        principal: form.get('principal') === 'on',
      })
      if (r.ok) {
        toast.success('Contato adicionado.')
        setNovo(false)
        router.refresh()
      } else {
        toast.error(r.error ?? 'Não foi possível adicionar o contato.')
      }
    })
  }

  return (
    <div className="space-y-3">
      {contatos.length > 0 && (
        <ul className="divide-y divide-line">
          {contatos.map(c => (
            <li key={c.id} className="py-2.5 first:pt-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-fg">{c.nome}</span>
                {c.principal && <Badge tom="ok" className="px-1.5 py-0 text-[10px]">Principal</Badge>}
              </div>
              {c.cargo && <div className="text-xs text-subtle">{c.cargo}</div>}
              <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="text-accent hover:underline">{c.email}</a>
                )}
                {c.whatsapp && (
                  <a
                    href={linkWhatsapp(c.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {c.whatsapp}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {novo ? (
        <form action={adicionar} className="space-y-3 rounded-token bg-surface-2 p-3">
          <Input name="nome" rotulo="Nome" />
          <Input name="cargo" rotulo="Cargo" />
          <Input name="email" rotulo="E-mail" type="email" />
          <Input name="whatsapp" rotulo="WhatsApp" placeholder="(11) 90000-0000" />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="principal" className="accent-accent" />
            Contato principal
          </label>
          <div className="flex gap-2">
            <Button type="submit" tamanho="sm" carregando={salvando}>Adicionar</Button>
            <Button type="button" tamanho="sm" variante="fantasma" onClick={() => setNovo(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button tamanho="sm" variante="secundario" onClick={() => setNovo(true)} className="w-full">
          Adicionar contato
        </Button>
      )}
    </div>
  )
}
