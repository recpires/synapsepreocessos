'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import { FRENTES, STATUS, type Frente, type ItemRoadmap, type StatusItem, type Tarefa, type TipoTarefa } from '@/types/central'

/**
 * Central pessoal.
 *
 * Diferente do resto do painel: o dado é de uma pessoa, não da empresa. A RLS
 * (`membro_id = membro_id_atual()`) é quem garante isso — estas funções apenas
 * carimbam o dono na escrita e deixam a leitura ser filtrada pelo banco.
 *
 * Como em `server/projetos.ts`, cada função abre com `assertMembro()`: o
 * middleware não roda dentro de Server Action chamada direto pelo cliente.
 */

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }
type Ok = { ok: true; error?: undefined } | { ok: false; error: string }

function falha(contexto: string, e: unknown): { error: string } {
  return { error: `${contexto}: ${e instanceof Error ? e.message : String(e)}` }
}

const ehFrente = (v: unknown): v is Frente => FRENTES.includes(v as Frente)
const ehStatus = (v: unknown): v is StatusItem => STATUS.includes(v as StatusItem)

/** Recorte da agenda: alguns dias para trás, o resto para a frente. */
const DIAS_PARA_TRAS = 30

export async function listarTarefas(): Promise<Resultado<Tarefa[]>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const desde = new Date()
    desde.setDate(desde.getDate() - DIAS_PARA_TRAS)
    const { data, error } = await sb
      .from('agenda_tarefas')
      .select('id, titulo, frente, tipo, data, hora, feito, nota')
      .gte('data', desde.toISOString().slice(0, 10))
      .order('data')
      .order('hora', { nullsFirst: false })
    if (error) throw error
    // `time` volta como "09:00:00"; a tela trabalha com "09:00".
    return {
      data: (data ?? []).map(t => ({
        ...t,
        hora: t.hora ? String(t.hora).slice(0, 5) : null,
      })) as Tarefa[],
    }
  } catch (e) {
    return falha('Não foi possível carregar a agenda', e)
  }
}

export async function criarTarefa(entrada: {
  titulo: string
  frente: string
  tipo: string
  data: string
  hora?: string | null
  nota?: string
}): Promise<Ok> {
  try {
    const membro = await assertMembro()
    const titulo = entrada.titulo.trim()
    if (!titulo) return { ok: false, error: 'O título não pode ficar vazio.' }
    if (!ehFrente(entrada.frente)) return { ok: false, error: 'Frente inválida.' }
    if (!entrada.data) return { ok: false, error: 'Escolha uma data.' }
    const tipo: TipoTarefa = entrada.tipo === 'reuniao' ? 'reuniao' : 'tarefa'

    const sb = await createClient()
    const { error } = await sb.from('agenda_tarefas').insert({
      membro_id: membro.id,
      titulo,
      frente: entrada.frente,
      tipo,
      data: entrada.data,
      hora: entrada.hora || null,
      nota: (entrada.nota ?? '').trim(),
    })
    if (error) throw error
    revalidatePath('/central')
    return { ok: true }
  } catch (e) {
    return { ok: false, ...falha('Não foi possível criar', e) } as Ok
  }
}

export async function alternarTarefa(id: string, feito: boolean): Promise<Ok> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb.from('agenda_tarefas').update({ feito }).eq('id', id)
    if (error) throw error
    revalidatePath('/central')
    return { ok: true }
  } catch (e) {
    return { ok: false, ...falha('Não foi possível marcar', e) } as Ok
  }
}

/**
 * A anotação do que foi feito.
 *
 * Separada de `criarTarefa` porque o momento é outro: o título se escreve
 * antes, isto se escreve depois. Salvar a nota não mexe em `feito` — anotar
 * o andamento de algo que continua aberto é caso comum.
 */
export async function salvarNota(id: string, nota: string): Promise<Ok> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb.from('agenda_tarefas').update({ nota: nota.trim() }).eq('id', id)
    if (error) throw error
    revalidatePath('/central')
    return { ok: true }
  } catch (e) {
    return { ok: false, ...falha('Não foi possível salvar a anotação', e) } as Ok
  }
}

export async function apagarTarefa(id: string): Promise<Ok> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb.from('agenda_tarefas').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/central')
    return { ok: true }
  } catch (e) {
    return { ok: false, ...falha('Não foi possível apagar', e) } as Ok
  }
}

export async function listarRoadmap(): Promise<Resultado<ItemRoadmap[]>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb
      .from('roadmap_itens')
      .select('id, frente, nome, status, proximo, ordem')
      .order('frente')
      .order('ordem')
      .order('created_at')
    if (error) throw error
    return { data: (data ?? []) as ItemRoadmap[] }
  } catch (e) {
    return falha('Não foi possível carregar o roadmap', e)
  }
}

export async function criarItemRoadmap(entrada: {
  frente: string
  nome: string
  proximo?: string
}): Promise<Ok> {
  try {
    const membro = await assertMembro()
    const nome = entrada.nome.trim()
    if (!nome) return { ok: false, error: 'O nome não pode ficar vazio.' }
    if (!ehFrente(entrada.frente)) return { ok: false, error: 'Frente inválida.' }

    const sb = await createClient()
    // Entra no fim da frente. Ler o maior evita colisão sem precisar de lock:
    // a lista é curta e de um dono só.
    const { data: ultimo } = await sb
      .from('roadmap_itens')
      .select('ordem')
      .eq('frente', entrada.frente)
      .order('ordem', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { error } = await sb.from('roadmap_itens').insert({
      membro_id: membro.id,
      frente: entrada.frente,
      nome,
      proximo: (entrada.proximo ?? '').trim(),
      ordem: ((ultimo?.ordem as number | undefined) ?? 0) + 10,
    })
    if (error) throw error
    revalidatePath('/central')
    return { ok: true }
  } catch (e) {
    return { ok: false, ...falha('Não foi possível criar', e) } as Ok
  }
}

export async function atualizarItemRoadmap(
  id: string,
  campos: { nome?: string; proximo?: string; status?: string }
): Promise<Ok> {
  try {
    await assertMembro()
    const patch: Record<string, string> = {}
    if (campos.nome !== undefined) {
      const nome = campos.nome.trim()
      if (!nome) return { ok: false, error: 'O nome não pode ficar vazio.' }
      patch.nome = nome
    }
    if (campos.proximo !== undefined) patch.proximo = campos.proximo.trim()
    if (campos.status !== undefined) {
      if (!ehStatus(campos.status)) return { ok: false, error: 'Status inválido.' }
      patch.status = campos.status
    }
    if (Object.keys(patch).length === 0) return { ok: true }

    const sb = await createClient()
    const { error } = await sb.from('roadmap_itens').update(patch).eq('id', id)
    if (error) throw error
    revalidatePath('/central')
    return { ok: true }
  } catch (e) {
    return { ok: false, ...falha('Não foi possível salvar', e) } as Ok
  }
}

export async function apagarItemRoadmap(id: string): Promise<Ok> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb.from('roadmap_itens').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/central')
    return { ok: true }
  } catch (e) {
    return { ok: false, ...falha('Não foi possível remover', e) } as Ok
  }
}

/**
 * Carga inicial do roadmap.
 *
 * Só roda quando não existe nenhum item — é semente, não reset. Rodar duas
 * vezes não duplica nada.
 */
export async function semearRoadmap(
  itens: { frente: Frente; nome: string; status: StatusItem; proximo: string }[]
): Promise<Ok> {
  try {
    const membro = await assertMembro()
    const sb = await createClient()
    const { count, error: erroConta } = await sb
      .from('roadmap_itens')
      .select('id', { count: 'exact', head: true })
    if (erroConta) throw erroConta
    if ((count ?? 0) > 0) return { ok: true }

    const { error } = await sb.from('roadmap_itens').insert(
      itens.map((it, i) => ({
        membro_id: membro.id,
        frente: it.frente,
        nome: it.nome,
        status: it.status,
        proximo: it.proximo,
        ordem: (i + 1) * 10,
      }))
    )
    if (error) throw error
    revalidatePath('/central')
    return { ok: true }
  } catch (e) {
    return { ok: false, ...falha('Não foi possível semear o roadmap', e) } as Ok
  }
}
