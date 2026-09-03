import { notFound } from 'next/navigation'
import PainelShell from '@/components/PainelShell'
import { membroAtual } from '@/lib/auth/membro'
import { DONO_DA_CENTRAL } from '@/lib/central-acesso'
import { Central } from './Central'

export const dynamic = 'force-dynamic'

/**
 * Central pessoal — área de um dono só.
 *
 * `notFound()` em vez de "acesso negado": para quem não é o dono, a rota não
 * existe. Uma tela de negativa confirmaria que existe algo ali, e isto é
 * agenda pessoal, não um recurso da empresa.
 *
 * A trava real, porém, é a RLS por `membro_id` — esta checagem só evita que a
 * página carregue. Sem as políticas do banco, bastaria chamar a Server Action
 * direto.
 */
export default async function CentralPage() {
  const membro = await membroAtual()
  if (!membro || membro.email.toLowerCase() !== DONO_DA_CENTRAL) notFound()

  return (
    <PainelShell>
      <Central nome={membro.nome} />
    </PainelShell>
  )
}
