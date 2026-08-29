import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Autorização das Server Actions.
 *
 * O middleware só garante que existe sessão — ele não roda dentro de uma
 * Server Action invocada direto pelo cliente, e não sabe qual é o papel de
 * quem chamou. Toda action que lê ou escreve dado sensível chama
 * `assertMembro()` na primeira linha.
 *
 * Isso vale principalmente para as funções que usam service role em bancos de
 * outros produtos (Nero Barber, Kubic Eng): a service role ignora RLS, então
 * a checagem tem que ser explícita aqui.
 */

export type Papel = 'dono' | 'admin' | 'financeiro' | 'comercial' | 'leitura'

export type Membro = {
  id: string
  user_id: string
  nome: string
  email: string
  papel: Papel
  ativo: boolean
}

export class NaoAutorizado extends Error {
  constructor(mensagem = 'Acesso negado.') {
    super(mensagem)
    this.name = 'NaoAutorizado'
  }
}

/** Papéis que podem escrever em qualquer área. */
const PAPEIS_ADMIN: readonly Papel[] = ['dono', 'admin']

/**
 * Devolve o membro da sessão atual, ou lança se não houver sessão válida ou
 * se o usuário não estiver na allowlist.
 *
 * @param permitidos Se informado, o papel do membro precisa estar na lista.
 */
export async function assertMembro(permitidos?: readonly Papel[]): Promise<Membro> {
  const supabase = await createClient()

  const { data: auth, error: erroAuth } = await supabase.auth.getUser()
  if (erroAuth || !auth.user) {
    throw new NaoAutorizado('Sessão expirada. Entre novamente.')
  }

  const { data: membro, error } = await supabase
    .from('membros')
    .select('id, user_id, nome, email, papel, ativo')
    .eq('user_id', auth.user.id)
    .eq('ativo', true)
    .maybeSingle()

  if (error) {
    throw new NaoAutorizado(`Não foi possível verificar seu acesso: ${error.message}`)
  }
  if (!membro) {
    throw new NaoAutorizado('Sua conta não tem acesso ao painel.')
  }

  const m = membro as Membro
  if (permitidos && !permitidos.includes(m.papel)) {
    throw new NaoAutorizado(
      `Esta ação exige o papel ${permitidos.join(' ou ')}. O seu é ${m.papel}.`
    )
  }

  return m
}

/** Atalho para ações que só admin ou dono podem executar. */
export function assertAdmin(): Promise<Membro> {
  return assertMembro(PAPEIS_ADMIN)
}

/** Versão que não lança — para decidir o que renderizar. */
export async function membroAtual(): Promise<Membro | null> {
  try {
    return await assertMembro()
  } catch {
    return null
  }
}
