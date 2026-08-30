'use client'

import { useState } from 'react'
import { toast } from '@/components/Feedback'
import { abrirArquivo } from '@/server/arquivos'

/**
 * Abre arquivo do storage por URL assinada.
 *
 * É botão e não `<a href>` de propósito: o link só existe depois que o
 * servidor confirma que quem clicou é membro, e vale dois minutos. Um `href`
 * fixo é exatamente o que deixava o contrato social legível por qualquer um
 * com a URL.
 */
export function ArquivoLink({
  bucket,
  valor,
  children,
  className,
  title,
}: {
  bucket: string
  /** Caminho no bucket, ou a URL pública antiga — o servidor aceita as duas. */
  valor: string
  children: React.ReactNode
  className?: string
  title?: string
}) {
  const [abrindo, setAbrindo] = useState(false)

  async function abrir() {
    setAbrindo(true)
    const r = await abrirArquivo(bucket, valor)
    setAbrindo(false)
    if (r.url) {
      // `noopener` para a aba nova não ganhar referência a esta.
      window.open(r.url, '_blank', 'noopener,noreferrer')
    } else {
      toast.error(r.error ?? 'Não foi possível abrir o arquivo.')
    }
  }

  return (
    <button
      type="button"
      onClick={abrir}
      disabled={abrindo}
      title={title ?? 'Abrir arquivo'}
      className={className}
    >
      {abrindo ? '…' : children}
    </button>
  )
}
