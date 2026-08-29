'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import {
  TRANSICOES, type Proposta, type PropostaLinha, type PropostaCompleta,
  type ItemProposta, type StatusProposta,
} from '@/types/propostas'

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }
type Ok = { ok: boolean; error?: string }

function erro(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/** O join do PostgREST vem ora como objeto, ora como array de um. */
function nomeEmpresa(v: unknown): string | null {
  const alvo = Array.isArray(v) ? v[0] : v
  return (alvo as { razao_social?: string } | null)?.razao_social ?? null
}

// ── Leitura ──────────────────────────────────────────────────────────────────

export async function listarPropostas(): Promise<Resultado<PropostaLinha[]>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb
      .from('propostas')
      .select('*, empresas(razao_social)')
      .order('created_at', { ascending: false })
    if (error) return { error: `propostas: ${error.message}` }

    return {
      data: (data ?? []).map(linha => {
        const { empresas, ...p } = linha as Proposta & { empresas: unknown }
        return {
          ...p,
          valor_total: Number(p.valor_total),
          valor_mensal: Number(p.valor_mensal),
          empresa_nome: nomeEmpresa(empresas),
        }
      }),
    }
  } catch (e) {
    return { error: `listarPropostas: ${erro(e)}` }
  }
}

export async function obterProposta(id: string): Promise<Resultado<PropostaCompleta>> {
  try {
    await assertMembro()
    const sb = await createClient()

    const [{ data: p, error: e1 }, { data: itens }] = await Promise.all([
      sb.from('propostas').select('*, empresas(razao_social)').eq('id', id).single(),
      sb.from('proposta_itens').select('*').eq('proposta_id', id).order('ordem'),
    ])
    if (e1 || !p) return { error: `proposta ${id}: ${e1?.message ?? 'não encontrada'}` }

    const { empresas, ...resto } = p as Proposta & { empresas: unknown }
    return {
      data: {
        ...resto,
        valor_total: Number(resto.valor_total),
        valor_mensal: Number(resto.valor_mensal),
        empresa_nome: nomeEmpresa(empresas),
        itens: (itens ?? []).map(i => ({
          ...i,
          quantidade: Number(i.quantidade),
          valor_unit: Number(i.valor_unit),
          horas_est: i.horas_est === null ? null : Number(i.horas_est),
        })) as ItemProposta[],
      },
    }
  } catch (e) {
    return { error: `obterProposta: ${erro(e)}` }
  }
}

// ── Escrita ──────────────────────────────────────────────────────────────────

export async function criarProposta(dados: {
  titulo: string
  empresa_id?: string | null
  validade?: string | null
  contexto?: string
  condicoes?: string
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const membro = await assertMembro()
    const sb = await createClient()

    const titulo = dados.titulo.trim()
    if (!titulo) return { ok: false, error: 'Dê um título à proposta.' }

    const { data: numero, error: eNum } = await sb.rpc('proximo_numero_proposta')
    if (eNum) return { ok: false, error: `numeração: ${eNum.message}` }

    const { data, error } = await sb.from('propostas').insert({
      numero,
      titulo,
      empresa_id: dados.empresa_id || null,
      validade: dados.validade || null,
      contexto: dados.contexto?.trim() || null,
      condicoes: dados.condicoes?.trim() || null,
      created_by: membro.nome,
    }).select('id').single()
    if (error) return { ok: false, error: error.message }

    revalidatePath('/comercial/propostas')
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: erro(e) }
  }
}

export async function atualizarProposta(
  id: string,
  campos: Partial<Pick<Proposta, 'titulo' | 'empresa_id' | 'validade' | 'contexto' | 'escopo' | 'condicoes' | 'observacao'>>
): Promise<Ok> {
  try {
    await assertMembro()
    const sb = await createClient()

    const { data: atual } = await sb.from('propostas').select('status').eq('id', id).single()
    if (atual?.status === 'aceita') {
      return { ok: false, error: 'Proposta aceita não pode ser editada. Crie uma nova.' }
    }

    const { error } = await sb
      .from('propostas')
      .update({ ...campos, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { ok: false, error: error.message }

    revalidatePath(`/comercial/propostas/${id}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: erro(e) }
  }
}

export async function salvarItem(
  propostaId: string,
  item: Omit<ItemProposta, 'id' | 'proposta_id'> & { id?: string }
): Promise<Ok> {
  try {
    await assertMembro()
    const sb = await createClient()

    const descricao = item.descricao.trim()
    if (!descricao) return { ok: false, error: 'Descreva o item.' }

    const linha = {
      proposta_id: propostaId,
      ordem: item.ordem,
      descricao,
      detalhe: item.detalhe?.trim() || null,
      quantidade: item.quantidade,
      valor_unit: item.valor_unit,
      cobranca: item.cobranca,
      horas_est: item.horas_est,
      opcional: item.opcional,
    }

    // O trigger no banco recalcula os totais — aqui não se soma nada à mão.
    const { error } = item.id
      ? await sb.from('proposta_itens').update(linha).eq('id', item.id)
      : await sb.from('proposta_itens').insert(linha)
    if (error) return { ok: false, error: error.message }

    revalidatePath(`/comercial/propostas/${propostaId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: erro(e) }
  }
}

export async function removerItem(propostaId: string, itemId: string): Promise<Ok> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb.from('proposta_itens').delete().eq('id', itemId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/comercial/propostas/${propostaId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: erro(e) }
  }
}

export async function mudarStatus(
  id: string,
  novo: StatusProposta,
  motivo?: string
): Promise<Ok> {
  try {
    await assertMembro()
    const sb = await createClient()

    const { data: atual, error: e1 } = await sb
      .from('propostas').select('status').eq('id', id).single()
    if (e1 || !atual) return { ok: false, error: 'Proposta não encontrada.' }

    // A máquina de estados mora aqui, não na tela: o cliente não decide se
    // uma proposta aceita pode voltar a rascunho.
    const permitidos = TRANSICOES[atual.status as StatusProposta]
    if (!permitidos.includes(novo)) {
      return {
        ok: false,
        error: `Não é possível ir de "${atual.status}" para "${novo}".`,
      }
    }
    if (novo === 'recusada' && !motivo?.trim()) {
      return { ok: false, error: 'Informe o motivo da recusa — é o que ensina na próxima.' }
    }

    const agora = new Date().toISOString()
    const { error } = await sb.from('propostas').update({
      status: novo,
      enviada_em: novo === 'enviada' ? agora : undefined,
      motivo_recusa: novo === 'recusada' ? motivo!.trim() : undefined,
      updated_at: agora,
    }).eq('id', id)
    if (error) return { ok: false, error: error.message }

    revalidatePath(`/comercial/propostas/${id}`)
    revalidatePath('/comercial/propostas')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: erro(e) }
  }
}

/**
 * Aceite: fecha o ciclo comercial criando o projeto com as fases já vindas
 * dos itens de escopo. Sem isso, ganhar a proposta significaria redigitar
 * tudo de novo em Projetos.
 */
export async function aceitarProposta(
  id: string
): Promise<{ ok: boolean; error?: string; projetoId?: string }> {
  try {
    const membro = await assertMembro()
    const sb = await createClient()

    const { data: p, error: e1 } = await sb.from('propostas').select('*').eq('id', id).single()
    if (e1 || !p) return { ok: false, error: 'Proposta não encontrada.' }
    if (p.status === 'aceita') return { ok: false, error: 'Esta proposta já foi aceita.' }
    if (!TRANSICOES[p.status as StatusProposta].includes('aceita')) {
      return { ok: false, error: `Uma proposta em "${p.status}" não pode ser aceita.` }
    }
    if (!p.empresa_id) {
      return { ok: false, error: 'Vincule uma empresa antes de aceitar — o projeto precisa de dono.' }
    }

    const { data: itens } = await sb
      .from('proposta_itens').select('*').eq('proposta_id', id)
      .eq('opcional', false).order('ordem')

    const { data: projeto, error: e2 } = await sb.from('projetos').insert({
      nome: p.titulo,
      empresa_id: p.empresa_id,
      tipo: 'sob_medida',
      fase_atual: 'especificacao',
      saude: 'verde',
      data_inicio: new Date().toISOString().slice(0, 10),
      valor_contratado: Number(p.valor_total),
      responsavel: membro.nome,
      observacao: `Criado a partir da proposta ${p.numero}.`,
    }).select('id').single()
    if (e2) return { ok: false, error: `projeto: ${e2.message}` }

    // Cada item de escopo vira uma fase, na mesma ordem.
    if (itens?.length) {
      const { error: e3 } = await sb.from('projeto_fases').insert(
        itens.map((i, idx) => ({
          projeto_id: projeto.id,
          ordem: idx + 1,
          nome: i.descricao,
          entregaveis: i.detalhe,
          status: 'nao_iniciada',
        }))
      )
      if (e3) return { ok: false, error: `fases: ${e3.message}` }
    }

    const agora = new Date().toISOString()
    const { error: e4 } = await sb.from('propostas').update({
      status: 'aceita',
      aceita_em: agora,
      projeto_id: projeto.id,
      updated_at: agora,
    }).eq('id', id)
    if (e4) return { ok: false, error: e4.message }

    revalidatePath('/comercial/propostas')
    revalidatePath('/projetos')
    return { ok: true, projetoId: projeto.id }
  } catch (e) {
    return { ok: false, error: erro(e) }
  }
}
