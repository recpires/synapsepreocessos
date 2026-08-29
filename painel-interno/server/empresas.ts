'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import type {
  EmpresaLinha, EmpresaCompleta, Contato,
  DocumentoEmpresa, ContratoEmpresa, SiteLinha,
} from '@/types/empresas'
import type { Projeto, TipoEmpresa } from '@/types/projetos'

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

function falha(contexto: string, e: unknown): { error: string } {
  return { error: `${contexto}: ${e instanceof Error ? e.message : String(e)}` }
}

// ── Empresas ─────────────────────────────────────────────────────────────────

export async function listarEmpresasCompletas(): Promise<Resultado<EmpresaLinha[]>> {
  try {
    await assertMembro()
    const sb = await createClient()

    // Quatro selects enxutos e a contagem em memória: são dezenas de linhas,
    // não vale montar view nem pagar N+1.
    const [
      { data: empresas, error: e1 },
      { data: contatos },
      { data: projetos },
      { data: documentos },
      { data: contratos },
    ] = await Promise.all([
      sb.from('empresas').select('*').order('tipo').order('razao_social'),
      sb.from('contatos').select('empresa_id'),
      sb.from('projetos').select('empresa_id').eq('arquivado', false),
      sb.from('documentos').select('empresa_id').not('empresa_id', 'is', null),
      sb.from('contratos').select('empresa_id').not('empresa_id', 'is', null),
    ])
    if (e1) return { error: `empresas: ${e1.message}` }

    const contar = (linhas: { empresa_id: string | null }[] | null) => {
      const m = new Map<string, number>()
      for (const l of linhas ?? []) {
        if (!l.empresa_id) continue
        m.set(l.empresa_id, (m.get(l.empresa_id) ?? 0) + 1)
      }
      return m
    }
    const nContatos = contar(contatos)
    const nProjetos = contar(projetos)
    const nDocs = contar(documentos)
    const nContratos = contar(contratos)

    return {
      data: (empresas ?? []).map(e => ({
        ...(e as EmpresaCompleta),
        contatos: nContatos.get(e.id) ?? 0,
        projetos: nProjetos.get(e.id) ?? 0,
        documentos: nDocs.get(e.id) ?? 0,
        contratos: nContratos.get(e.id) ?? 0,
      })),
    }
  } catch (e) {
    return falha('listarEmpresasCompletas', e)
  }
}

export async function obterEmpresa(id: string): Promise<Resultado<{
  empresa: EmpresaCompleta
  contatos: Contato[]
  projetos: Projeto[]
  documentos: DocumentoEmpresa[]
  contratos: ContratoEmpresa[]
  sites: SiteLinha[]
}>> {
  try {
    await assertMembro()
    const sb = await createClient()

    const [
      { data: empresa, error: e1 },
      { data: contatos },
      { data: projetos },
      { data: documentos },
      { data: contratos },
      { data: sites },
    ] = await Promise.all([
      sb.from('empresas').select('*').eq('id', id).single(),
      sb.from('contatos').select('*').eq('empresa_id', id).order('principal', { ascending: false }).order('nome'),
      sb.from('projetos').select('*').eq('empresa_id', id).eq('arquivado', false).order('maturidade_pct', { ascending: false }),
      sb.from('documentos').select('id, nome, descricao, categoria, arquivo_url, arquivo_nome, created_at')
        .eq('empresa_id', id).order('categoria').order('nome'),
      sb.from('contratos').select('id, cliente, tipo, status, valor, data_inicio, data_vencimento, arquivo_url')
        .eq('empresa_id', id).order('data_inicio', { ascending: false }),
      sb.from('sites').select('*').eq('empresa_id', id).order('nome'),
    ])

    if (e1 || !empresa) return { error: `empresa ${id}: ${e1?.message ?? 'não encontrada'}` }

    return {
      data: {
        empresa: empresa as EmpresaCompleta,
        contatos: (contatos ?? []) as Contato[],
        projetos: (projetos ?? []) as Projeto[],
        documentos: (documentos ?? []) as DocumentoEmpresa[],
        contratos: (contratos ?? []) as ContratoEmpresa[],
        sites: (sites ?? []).map(s => ({ ...(s as SiteLinha), empresa_nome: empresa.razao_social })),
      },
    }
  } catch (e) {
    return falha('obterEmpresa', e)
  }
}

export async function criarEmpresa(dados: {
  tipo: TipoEmpresa
  razao_social: string
  nome_fantasia?: string
  cnpj?: string
  segmento?: string
  site?: string
  responsavel?: string
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    const razao = dados.razao_social.trim()
    if (!razao) return { ok: false, error: 'A razão social é obrigatória.' }

    const { data, error } = await sb.from('empresas').insert({
      tipo: dados.tipo,
      razao_social: razao,
      nome_fantasia: dados.nome_fantasia?.trim() || null,
      cnpj: dados.cnpj?.replace(/\D/g, '') || null,
      segmento: dados.segmento?.trim() || null,
      site: dados.site?.trim() || null,
      responsavel: dados.responsavel?.trim() || null,
    }).select('id').single()

    if (error) {
      // O índice único de CNPJ é o guarda contra empresa duplicada.
      if (error.code === '23505') {
        return { ok: false, error: 'Já existe uma empresa com esse CNPJ.' }
      }
      return { ok: false, error: error.message }
    }

    revalidatePath('/empresas')
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function adicionarContato(
  empresaId: string,
  dados: { nome: string; cargo?: string; email?: string; whatsapp?: string; principal?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    const nome = dados.nome.trim()
    if (!nome) return { ok: false, error: 'O nome do contato é obrigatório.' }

    // Só um principal por empresa: o novo principal rebaixa os outros.
    if (dados.principal) {
      await sb.from('contatos').update({ principal: false }).eq('empresa_id', empresaId)
    }

    const { error } = await sb.from('contatos').insert({
      empresa_id: empresaId,
      nome,
      cargo: dados.cargo?.trim() || null,
      email: dados.email?.trim() || null,
      whatsapp: dados.whatsapp?.trim() || null,
      principal: dados.principal ?? false,
    })
    if (error) return { ok: false, error: error.message }

    revalidatePath(`/empresas/${empresaId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ── Sites ────────────────────────────────────────────────────────────────────

export async function listarSites(): Promise<Resultado<SiteLinha[]>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb
      .from('sites')
      .select('*, empresas(razao_social)')
      .order('nome')
    if (error) return { error: `sites: ${error.message}` }

    return {
      data: (data ?? []).map(s => {
        const { empresas, ...site } = s as SiteLinha & { empresas: { razao_social: string } | null }
        return { ...site, empresa_nome: empresas?.razao_social ?? null }
      }),
    }
  } catch (e) {
    return falha('listarSites', e)
  }
}

export async function salvarSite(dados: {
  id?: string
  nome: string
  empresa_id?: string | null
  dominio?: string
  url?: string
  hospedagem?: string
  registrar?: string
  repo?: string
  status?: string
  publicado_em?: string | null
  ssl_expira?: string | null
  dominio_expira?: string | null
  manutencao_mensal?: number | null
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()

    const nome = dados.nome.trim()
    if (!nome) return { ok: false, error: 'O nome do site é obrigatório.' }

    const linha = {
      nome,
      empresa_id: dados.empresa_id || null,
      dominio: dados.dominio?.trim() || null,
      url: dados.url?.trim() || null,
      hospedagem: dados.hospedagem?.trim() || null,
      registrar: dados.registrar?.trim() || null,
      repo: dados.repo?.trim() || null,
      status: dados.status ?? 'no_ar',
      publicado_em: dados.publicado_em || null,
      ssl_expira: dados.ssl_expira || null,
      dominio_expira: dados.dominio_expira || null,
      manutencao_mensal: dados.manutencao_mensal ?? null,
      updated_at: new Date().toISOString(),
    }

    const { error } = dados.id
      ? await sb.from('sites').update(linha).eq('id', dados.id)
      : await sb.from('sites').insert(linha)

    if (error) return { ok: false, error: error.message }

    revalidatePath('/sites')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
