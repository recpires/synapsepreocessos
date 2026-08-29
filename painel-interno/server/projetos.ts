'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import type {
  ProjetoCard, Projeto, ProjetoFase, ProjetoErro,
  FaseProjeto, CamadaMaturidade, NotaMaturidade, Empresa,
} from '@/types/projetos'

/**
 * Camada de dados de Projetos.
 *
 * Toda query do painel morava dentro do JSX. Aqui elas viram funções tipadas,
 * cada uma com `assertMembro()` na primeira linha — o middleware não protege
 * Server Actions chamadas direto pelo cliente.
 */

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

function falha(contexto: string, e: unknown): { error: string } {
  const msg = e instanceof Error ? e.message : String(e)
  return { error: `${contexto}: ${msg}` }
}

// ── Leitura ──────────────────────────────────────────────────────────────────

export async function listarProjetos(): Promise<Resultado<ProjetoCard[]>> {
  try {
    await assertMembro()
    const sb = await createClient()

    const [{ data: projetos, error: e1 }, { data: erros, error: e2 }] = await Promise.all([
      sb.from('projetos')
        .select('*, empresas(razao_social), produtos(status)')
        .eq('arquivado', false)
        .order('maturidade_pct', { ascending: false }),
      sb.from('projeto_erros')
        .select('projeto_id, severidade')
        .in('status', ['aberto', 'investigando']),
    ])
    if (e1) return { error: `projetos: ${e1.message}` }
    if (e2) return { error: `erros: ${e2.message}` }

    // Conta erros por projeto em memória: são poucas linhas e evita N+1.
    const abertos = new Map<string, { total: number; criticos: number }>()
    for (const e of erros ?? []) {
      const atual = abertos.get(e.projeto_id) ?? { total: 0, criticos: 0 }
      atual.total++
      if (e.severidade === 'critica') atual.criticos++
      abertos.set(e.projeto_id, atual)
    }

    const cards: ProjetoCard[] = (projetos ?? []).map(p => {
      const { empresas, produtos, ...projeto } = p as Projeto & {
        empresas: { razao_social: string } | null
        produtos: { status: string } | null
      }
      const c = abertos.get(projeto.id)
      return {
        ...projeto,
        empresa_nome: empresas?.razao_social ?? null,
        produto_pausado: produtos?.status === 'pausado',
        erros_abertos: c?.total ?? 0,
        erros_criticos: c?.criticos ?? 0,
      }
    })
    return { data: cards }
  } catch (e) {
    return falha('listarProjetos', e)
  }
}

export async function obterProjeto(id: string): Promise<Resultado<{
  projeto: ProjetoCard
  fases: ProjetoFase[]
  erros: ProjetoErro[]
  maturidade: NotaMaturidade[]
}>> {
  try {
    await assertMembro()
    const sb = await createClient()

    const [{ data: p, error: e1 }, { data: fases }, { data: erros }, { data: maturidade }] =
      await Promise.all([
        sb.from('projetos').select('*, empresas(razao_social), produtos(status)').eq('id', id).single(),
        sb.from('projeto_fases').select('*').eq('projeto_id', id).order('ordem'),
        sb.from('projeto_erros').select('*').eq('projeto_id', id).order('detectado_em', { ascending: false }),
        sb.from('projeto_maturidade').select('camada, peso, nota, evidencia, avaliado_em')
          .eq('projeto_id', id).order('avaliado_em', { ascending: false }),
      ])

    if (e1 || !p) return { error: `projeto ${id}: ${e1?.message ?? 'não encontrado'}` }

    const { empresas, produtos, ...projeto } = p as Projeto & {
      empresas: { razao_social: string } | null
      produtos: { status: string } | null
    }
    const abertos = (erros ?? []).filter(e => e.status === 'aberto' || e.status === 'investigando')

    return {
      data: {
        projeto: {
          ...projeto,
          empresa_nome: empresas?.razao_social ?? null,
          produto_pausado: produtos?.status === 'pausado',
          erros_abertos: abertos.length,
          erros_criticos: abertos.filter(e => e.severidade === 'critica').length,
        },
        fases: (fases ?? []) as ProjetoFase[],
        erros: (erros ?? []) as ProjetoErro[],
        maturidade: (maturidade ?? []) as NotaMaturidade[],
      },
    }
  } catch (e) {
    return falha('obterProjeto', e)
  }
}

export async function listarCamadasMaturidade(): Promise<Resultado<CamadaMaturidade[]>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb.from('maturidade_camadas').select('*').order('ordem')
    if (error) return { error: `camadas: ${error.message}` }
    return { data: (data ?? []) as CamadaMaturidade[] }
  } catch (e) {
    return falha('listarCamadasMaturidade', e)
  }
}

export async function listarEmpresas(): Promise<Resultado<Empresa[]>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb.from('empresas').select('*').eq('ativa', true).order('razao_social')
    if (error) return { error: `empresas: ${error.message}` }
    return { data: (data ?? []) as Empresa[] }
  } catch (e) {
    return falha('listarEmpresas', e)
  }
}

// ── Escrita ──────────────────────────────────────────────────────────────────

/** Move o card no kanban. Fecha a fase anterior com data real, se houver. */
export async function moverProjetoDeFase(
  projetoId: string,
  novaFase: FaseProjeto
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    const { error } = await sb
      .from('projetos')
      .update({ fase_atual: novaFase, updated_at: new Date().toISOString() })
      .eq('id', projetoId)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/projetos')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

export async function salvarMaturidade(
  projetoId: string,
  notas: { camada: string; peso: number; nota: number; evidencia?: string }[]
): Promise<{ ok: boolean; error?: string; maturidade_pct?: number }> {
  try {
    await assertMembro()
    const sb = await createClient()
    const hoje = new Date().toISOString().slice(0, 10)

    const { error } = await sb.from('projeto_maturidade').upsert(
      notas.map(n => ({
        projeto_id: projetoId,
        camada: n.camada,
        peso: n.peso,
        nota: n.nota,
        evidencia: n.evidencia ?? null,
        avaliado_em: hoje,
      })),
      { onConflict: 'projeto_id,camada,avaliado_em' }
    )
    if (error) return { ok: false, error: error.message }

    // Espelha a média ponderada em projetos.maturidade_pct para o kanban não
    // precisar consultar a view a cada card.
    const somaPesos = notas.reduce((a, n) => a + n.peso, 0)
    const pct = somaPesos > 0
      ? Math.round(notas.reduce((a, n) => a + n.nota * n.peso, 0) / somaPesos)
      : 0

    await sb.from('projetos').update({ maturidade_pct: pct }).eq('id', projetoId)

    revalidatePath('/projetos')
    return { ok: true, maturidade_pct: pct }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

/** Registra um erro. O código é sequencial por projeto: NERO-001, NERO-002… */
export async function registrarErro(
  projetoId: string,
  erro: {
    titulo: string
    descricao?: string
    severidade: ProjetoErro['severidade']
    ambiente: ProjetoErro['ambiente']
    origem?: string
    reproducao?: string
  }
): Promise<{ ok: boolean; error?: string; codigo?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    const { data: proj } = await sb.from('projetos').select('nome').eq('id', projetoId).single()
    if (!proj) return { ok: false, error: 'Projeto não encontrado.' }

    const { count } = await sb
      .from('projeto_erros')
      .select('*', { count: 'exact', head: true })
      .eq('projeto_id', projetoId)

    const prefixo = proj.nome.replace(/[^A-Za-zÀ-ú]/g, '').slice(0, 4).toUpperCase() || 'ERR'
    const codigo = `${prefixo}-${String((count ?? 0) + 1).padStart(3, '0')}`

    const { error } = await sb.from('projeto_erros').insert({
      projeto_id: projetoId,
      codigo,
      titulo: erro.titulo,
      descricao: erro.descricao ?? null,
      severidade: erro.severidade,
      ambiente: erro.ambiente,
      origem: erro.origem ?? null,
      reproducao: erro.reproducao ?? null,
    })
    if (error) return { ok: false, error: error.message }

    revalidatePath('/projetos')
    return { ok: true, codigo }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

export async function resolverErro(
  erroId: string,
  dados: { causa_raiz: string; correcao: string; commit_fix?: string }
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { error } = await sb
      .from('projeto_erros')
      .update({
        status: 'corrigido',
        causa_raiz: dados.causa_raiz,
        correcao: dados.correcao,
        commit_fix: dados.commit_fix ?? null,
        resolvido_em: new Date().toISOString(),
      })
      .eq('id', erroId)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/projetos')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}
