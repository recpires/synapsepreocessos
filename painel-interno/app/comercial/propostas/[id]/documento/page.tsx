import { notFound } from 'next/navigation'
import { Erro } from '@/components/ui'
import { obterProposta } from '@/server/propostas'
import { Documento } from './Documento'

export const dynamic = 'force-dynamic'

export default async function DocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resultado = await obterProposta(id)

  if (!resultado.data) {
    const mensagem = resultado.error ?? 'Proposta não encontrada.'
    if (/não encontrada|not found|PGRST116/i.test(mensagem)) notFound()
    return (
      <div className="min-h-screen bg-ground p-6">
        <Erro mensagem={mensagem} />
      </div>
    )
  }

  return <Documento p={resultado.data} />
}
