'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertMembro } from '@/lib/auth/membro'
import { chavesDoTemplate, type TemplateContrato, type CampoTemplate } from '@/lib/templates'

type Resultado<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

function erro(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

export async function listarTemplates(): Promise<Resultado<TemplateContrato[]>> {
  try {
    await assertMembro()
    const sb = await createClient()
    const { data, error } = await sb
      .from('contrato_templates')
      .select('id, nome, descricao, tipo, conteudo_html, campos, slug, ativo')
      .eq('ativo', true)
      .order('nome')
    if (error) return { error: `templates: ${error.message}` }

    return {
      data: (data ?? []).map(t => ({
        id: t.id,
        nome: t.nome,
        descricao: t.descricao,
        tipo: t.tipo,
        conteudo_html: t.conteudo_html,
        campos: (t.campos ?? []) as CampoTemplate[],
      })),
    }
  } catch (e) {
    return { error: `listarTemplates: ${erro(e)}` }
  }
}

export async function salvarTemplate(dados: {
  id?: string
  nome: string
  descricao?: string
  tipo: string
  conteudo_html: string
  campos: CampoTemplate[]
}): Promise<{ ok: boolean; error?: string; avisos?: string[] }> {
  try {
    const membro = await assertMembro()
    const sb = await createClient()

    const nome = dados.nome.trim()
    if (!nome) return { ok: false, error: 'Dê um nome ao template.' }
    if (!dados.conteudo_html.trim()) return { ok: false, error: 'O conteúdo está vazio.' }

    const chavesUsadas = chavesDoTemplate(dados.conteudo_html).filter(c => c !== '_hoje')
    const declaradas = new Set(dados.campos.map(c => c.key))

    // Chave no HTML sem campo declarado renderiza vazio e ninguém percebe até
    // o contrato sair errado. Bloqueia.
    const orfas = chavesUsadas.filter(c => !declaradas.has(c))
    if (orfas.length) {
      return {
        ok: false,
        error: `O texto usa ${orfas.map(o => `{{${o}}}`).join(', ')} mas esses campos não estão declarados.`,
      }
    }

    // Campo declarado e nunca usado é só ruído no formulário — avisa, não bloqueia.
    const usadas = new Set(chavesUsadas)
    const naoUsados = dados.campos.filter(c => !usadas.has(c.key)).map(c => c.label)

    const linha = {
      nome,
      descricao: dados.descricao?.trim() || null,
      tipo: dados.tipo,
      conteudo_html: dados.conteudo_html,
      campos: dados.campos,
      created_by: membro.nome,
    }

    const { error } = dados.id
      ? await sb.from('contrato_templates').update(linha).eq('id', dados.id)
      : await sb.from('contrato_templates').insert(linha)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/contratos/templates')
    return {
      ok: true,
      avisos: naoUsados.length
        ? [`Campos declarados mas não usados no texto: ${naoUsados.join(', ')}.`]
        : undefined,
    }
  } catch (e) {
    return { ok: false, error: erro(e) }
  }
}

export async function arquivarTemplate(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await assertMembro()
    const sb = await createClient()
    // Arquiva em vez de apagar: contrato já gerado referencia o template_tipo.
    const { error } = await sb.from('contrato_templates').update({ ativo: false }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/contratos/templates')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: erro(e) }
  }
}
