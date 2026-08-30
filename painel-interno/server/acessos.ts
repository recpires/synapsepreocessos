'use server'

import { revalidatePath } from 'next/cache'
import { createClient as criarAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { assertMembro, assertAdmin, type Papel } from '@/lib/auth/membro'

/**
 * Quem entra no painel e o que cada um enxerga.
 *
 * Até a Fase 10 o acesso era binário: estar em `membros` dava tudo. Com dois
 * CNPJs e sócios diferentes em cada um, passou a existir `membro_empresas`.
 *
 * A regra que sustenta o resto: membro sem nenhuma linha lá é irrestrito. Sem
 * isso, criar a tabela trancaria todos para fora no mesmo instante — inclusive
 * quem a criou.
 */

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

function falha(contexto: string, e: unknown): { error: string } {
  return { error: `${contexto}: ${e instanceof Error ? e.message : String(e)}` }
}

/** Cliente com service role. Só a criação de usuário precisa dele. */
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || key.startsWith('PREENCHER')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY ausente — sem ela não dá para criar usuário.'
    )
  }
  return criarAdmin(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export type MembroComAcesso = {
  id: string
  nome: string
  email: string
  papel: Papel
  ativo: boolean
  /** Vazio = irrestrito, vê todas as empresas. */
  empresas: string[]
}

export async function listarAcessos(): Promise<Resultado<{
  membros: MembroComAcesso[]
  empresas: { id: string; nome: string }[]
}>> {
  try {
    await assertMembro()
    const sb = await createClient()

    const [{ data: membros, error }, { data: vinculos }, { data: empresas }] = await Promise.all([
      sb.from('membros').select('id, nome, email, papel, ativo').order('nome'),
      sb.from('membro_empresas').select('membro_id, empresa_id'),
      sb.from('empresas').select('id, razao_social, nome_fantasia')
        .eq('tipo', 'propria').eq('ativa', true).order('razao_social'),
    ])
    if (error) return { error: `membros: ${error.message}` }

    const porMembro = new Map<string, string[]>()
    for (const v of vinculos ?? []) {
      const atual = porMembro.get(v.membro_id as string) ?? []
      atual.push(v.empresa_id as string)
      porMembro.set(v.membro_id as string, atual)
    }

    return {
      data: {
        membros: (membros ?? []).map(m => ({
          ...m, empresas: porMembro.get(m.id as string) ?? [],
        })) as MembroComAcesso[],
        empresas: (empresas ?? []).map(e => ({
          id: e.id as string,
          nome: (e.nome_fantasia as string) || (e.razao_social as string),
        })),
      },
    }
  } catch (e) {
    return falha('listarAcessos', e)
  }
}

/**
 * Cria o usuário e já define o que ele enxerga.
 *
 * Tenta o convite por e-mail primeiro: assim a senha é escolhida pela própria
 * pessoa e nunca passa pelo painel. Se o projeto não tiver SMTP configurado, o
 * convite falha — nesse caso cria com senha temporária e devolve ela uma única
 * vez, para você repassar por um canal seguro.
 */
export async function criarAcesso(dados: {
  nome: string
  email: string
  papel: Papel
  empresas: string[]
}): Promise<{ ok: boolean; error?: string; senhaTemporaria?: string; convidado?: boolean }> {
  try {
    await assertAdmin()

    const nome = dados.nome.trim()
    const email = dados.email.trim().toLowerCase()
    if (!nome) return { ok: false, error: 'Informe o nome.' }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'E-mail inválido.' }

    const sbAdmin = admin()

    let userId: string | null = null
    let convidado = false
    let senhaTemporaria: string | undefined

    const convite = await sbAdmin.auth.admin.inviteUserByEmail(email)
    if (convite.data?.user) {
      userId = convite.data.user.id
      convidado = true
    } else {
      // Sem SMTP o convite não sai. Senha forte gerada aqui, mostrada uma vez.
      senhaTemporaria = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'[b % 60])
        .join('')
      const criado = await sbAdmin.auth.admin.createUser({
        email, password: senhaTemporaria, email_confirm: true,
      })
      if (criado.error || !criado.data.user) {
        return {
          ok: false,
          error: `${criado.error?.message ?? 'não foi possível criar o usuário'}` +
            ` (o convite por e-mail também falhou: ${convite.error?.message ?? 'sem detalhe'})`,
        }
      }
      userId = criado.data.user.id
    }

    // A allowlist é o que de fato dá acesso: usuário no Auth sem linha aqui não
    // entra no painel.
    const sb = await createClient()
    const { data: membro, error: e1 } = await sb.from('membros')
      .insert({ user_id: userId, nome, email, papel: dados.papel, ativo: true })
      .select('id').single()
    if (e1 || !membro) return { ok: false, error: `membros: ${e1?.message ?? 'falhou'}` }

    if (dados.empresas.length > 0) {
      const { error: e2 } = await sb.from('membro_empresas').insert(
        dados.empresas.map(empresa_id => ({ membro_id: membro.id, empresa_id }))
      )
      if (e2) return { ok: false, error: `acesso às empresas: ${e2.message}` }
    }

    revalidatePath('/time')
    return { ok: true, senhaTemporaria, convidado }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Troca as empresas que a pessoa enxerga.
 *
 * Lista vazia devolve o acesso irrestrito, e a tela precisa dizer isso: é o
 * oposto do que "nenhuma empresa marcada" sugere à primeira vista.
 */
export async function definirEmpresas(
  membroId: string, empresas: string[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertAdmin()
    const sb = await createClient()

    const { error: e1 } = await sb.from('membro_empresas').delete().eq('membro_id', membroId)
    if (e1) return { ok: false, error: e1.message }

    if (empresas.length > 0) {
      const { error: e2 } = await sb.from('membro_empresas').insert(
        empresas.map(empresa_id => ({ membro_id: membroId, empresa_id }))
      )
      if (e2) return { ok: false, error: e2.message }
    }

    revalidatePath('/time')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Desliga o acesso sem apagar o histórico de quem fez o quê. */
export async function alterarAtivo(
  membroId: string, ativo: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    const eu = await assertAdmin()
    if (eu.id === membroId && !ativo) {
      return { ok: false, error: 'Você não pode desativar o próprio acesso.' }
    }
    const sb = await createClient()
    const { error } = await sb.from('membros')
      .update({ ativo, updated_at: new Date().toISOString() }).eq('id', membroId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/time')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
